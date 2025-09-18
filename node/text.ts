import {
  parseTemplateLiteral,
  resolveDataPath,
  ARGUMENTS_PREFIX,
  createUnifiedExpression,
  VALID_VARIABLE_PATTERN,
} from "../parser"
import { cutBeforeNextHtml } from "../parser"
import type { ParseContext } from "../parser.t"
import type { NodeText, ParseTextPart } from "./text.t"

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Парсит текстовый узел с поддержкой методов (e.g. .toUpperCase()).
 * Методы попадают в data как суффикс пути (/toUpperCase),
 * а в expr скобки добавляются ВНУТРЬ плейсхолдеров: ${_[i]()}.
 */
export const parseText = (text: string, context: ParseContext = { pathStack: [], level: 0 }): NodeText => {
  if (!text.includes("${")) {
    return { type: "text", value: text }
  }

  const hasConditionalOperators = /\?.*:/.test(text)
  const hasLogicalOperators = /[&&||]/.test(text)
  const hasMathematicalOperators = /[+\-*/%]/.test(text)
  const hasMethodCalls = /\.\w+\s*\(/.test(text)

  if ((hasConditionalOperators || hasLogicalOperators || hasMathematicalOperators) && !hasMethodCalls) {
    const templateResult = parseTemplateLiteral(text, context)
    if (templateResult?.data) {
      return { type: "text", data: templateResult.data, ...(templateResult.expr && { expr: templateResult.expr }) }
    }
  }

  const parts = splitText(text)

  const dynamicParts = parts
    .filter((part) => part.type === "dynamic")
    .map((part) => {
      const varMatch = part.text.match(/\$\{([^}]+)\}/)
      const variable = varMatch?.[1] || ""

      // строковые литералы внутри ${...} не считаем динамикой
      if (variable.startsWith('"') || variable.startsWith("'") || variable.includes('"') || variable.includes("'")) {
        return null
      }

      const { base, methodName, callSuffix } = extractBaseAndCall(variable)
      const basePath = resolveDataPath(base, context)
      const path = methodName ? `${basePath}/${methodName}` : basePath

      return { path, text: part.text, callSuffix }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const firstDynamicPart = dynamicParts[0]
  const mainPath = firstDynamicPart ? firstDynamicPart.path : ""

  // все динамические оказались строками → статический текст
  if (dynamicParts.length === 0 && parts.some((p) => p.type === "dynamic")) {
    const staticText = parts
      .filter((p) => p.type === "dynamic")
      .map((p) => {
        const v = p.text.match(/\$\{([^}]+)\}/)?.[1] || ""
        if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
        return ""
      })
      .join("")
    if (staticText) return { type: "text", value: staticText }
  }

  // одна единственная ${...}
  if (parts.length === 1 && parts[0]!.type === "dynamic") {
    const variable = parts[0]!.text.match(/\$\{([^}]+)\}/)?.[1] || ""
    const callSuffix = dynamicParts[0]!.callSuffix

    if (callSuffix) {
      // ВАЖНО: скобки внутри плейсхолдера
      return {
        type: "text",
        data: dynamicParts[0]!.path,
        expr: createUnifiedExpression(`\${${ARGUMENTS_PREFIX}[0]${callSuffix}}`, []),
      }
    }

    if (variable.includes("(")) {
      const baseVariable = extractBaseVariable(variable)
      const pathDots = resolveDataPath(baseVariable, context).replace(/^\//, "").replace(/\//g, ".")
      const expr = variable.replace(
        new RegExp(`\\b${pathDots.replace(/\./g, "\\.")}\\b`, "g"),
        `\${${ARGUMENTS_PREFIX}[0]}`
      )
      return { type: "text", data: dynamicParts[0]!.path, expr: createUnifiedExpression(expr, []) }
    }

    return { type: "text", data: mainPath }
  }

  // несколько динамических / смешанный текст
  if (dynamicParts.length > 1) {
    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        const index = dynamicParts.findIndex((dp) => dp.text === p.text)
        const call = dynamicParts[index]?.callSuffix ?? ""
        // ВАЖНО: если есть вызов — помещаем его внутрь плейсхолдера
        return call ? `\${${ARGUMENTS_PREFIX}[${index}]${call}}` : `\${${ARGUMENTS_PREFIX}[${index}]}`
      })
      .join("")

    const isSimpleExpr =
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}\${${ARGUMENTS_PREFIX}[1]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}-\${${ARGUMENTS_PREFIX}[1]}`

    const hasAnyCalls = dynamicParts.some((dp) => !!dp.callSuffix)
    if (isSimpleExpr && !hasAnyCalls) {
      return { type: "text", data: dynamicParts.map((p) => p.path) }
    }

    return { type: "text", data: dynamicParts.map((p) => p.path), expr: createUnifiedExpression(exprRaw, []) }
  }

  // одна динамическая + статический текст вокруг
  const hasStaticText = parts.some((p) => p.type === "static" && p.text.trim() !== "")
  if (hasStaticText) {
    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        const call = dynamicParts[0]?.callSuffix ?? ""
        // ВАЖНО: если есть вызов — внутрь плейсхолдера
        return call ? `\${${ARGUMENTS_PREFIX}[0]${call}}` : `\${${ARGUMENTS_PREFIX}[0]}`
      })
      .join("")
    return { type: "text", data: mainPath, expr: createUnifiedExpression(exprRaw, []) }
  }

  return { type: "text", data: mainPath }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Разбивка строки на последовательность статических и динамических частей.
 * Учитывает вложенные `${...}` по счётчику фигурных скобок.
 */
export const splitText = (text: string): ParseTextPart[] => {
  const parts: ParseTextPart[] = []
  let currentIndex = 0
  const varMatches: string[] = []

  let i = 0
  while (i < text.length) {
    if (text[i] === "$" && text[i + 1] === "{") {
      let braceCount = 1
      let j = i + 2
      while (j < text.length && braceCount > 0) {
        if (text[j] === "$" && text[j + 1] === "{") {
          braceCount++
          j += 2
        } else if (text[j] === "}") {
          braceCount--
          j++
        } else {
          j++
        }
      }
      if (braceCount === 0) {
        const varMatch = text.slice(i, j)
        varMatches.push(varMatch)
        i = j
      } else {
        i++
      }
    } else {
      i++
    }
  }

  for (const varMatch of varMatches) {
    const varIndex = text.indexOf(varMatch, currentIndex)
    if (varIndex > currentIndex) parts.push({ type: "static", text: text.slice(currentIndex, varIndex) })
    parts.push({ type: "dynamic", text: varMatch })
    currentIndex = varIndex + varMatch.length
  }
  if (currentIndex < text.length) parts.push({ type: "static", text: text.slice(currentIndex) })
  return parts
}

/**
 * Возвращает текстовый токен, обрезая «клей» до следующего html`...`.
 */
export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return

  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  let processed = ""
  let i = 0
  let usedEndLocal = 0

  while (i < visible.length) {
    const ch = visible[i]
    if (ch === "$" && visible[i + 1] === "{") {
      const exprStart = i
      i += 2
      let b = 1
      while (i < visible.length && b > 0) {
        if (visible[i] === "{") b++
        else if (visible[i] === "}") b--
        i++
      }
      if (b === 0) {
        processed += visible.slice(exprStart, i)
        usedEndLocal = i
        continue
      } else {
        break
      }
    }
    processed += ch
    i++
    usedEndLocal = i
  }

  const collapsed = processed.replace(/\s+/g, " ")
  if (collapsed === " ") return

  const final = /^\s*\n[\s\S]*\n\s*$/.test(chunk) ? collapsed.trim() : collapsed
  if (final.length > 0) return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
}

/**
 * Извлекает базовую переменную из выражения (без финального вызова метода).
 * Примеры:
 *   "user.name.toUpperCase()" → "user.name"
 *   "context.list.map(...)"   → "context.list"
 */
const extractBaseVariable = (variable: string): string => {
  const stringLiterals: string[] = []
  let protectedVariable = variable
    .replace(/`[^`]*`/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/"[^"]*"/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  if (protectedVariable.includes("(")) {
    const beforeMethod = protectedVariable
      .split(/\.\w+\(/)
      .shift()
      ?.trim()
    if (beforeMethod && VALID_VARIABLE_PATTERN.test(beforeMethod)) return beforeMethod
  }

  const variableMatches = protectedVariable.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const variablesWithDots = variableMatches.filter((v) => v.includes(".") && !v.startsWith("__STRING_"))
  if (variablesWithDots.length > 0) return variablesWithDots[0]!
  return variable
}

/**
 * Возвращает базу и последний вызов метода (если есть).
 * base: "user.name"
 * methodName: "toUpperCase"
 * callSuffix: "()", "(2)", ...
 */
const extractBaseAndCall = (variable: string): { base: string; methodName?: string; callSuffix?: string } => {
  const shielded = variable
    .replace(/`[^`]*`/g, "__S__")
    .replace(/"[^"]*"/g, "__S__")
    .replace(/'[^']*'/g, "__S__")

  const m = shielded.match(/\.([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*$/)
  if (m) {
    const methodName = m[1]
    const args = m[2] ?? ""
    const callSuffix = `(${args})`
    const base = extractBaseVariable(variable.replace(m[0], ""))
    return { base, methodName, callSuffix }
  }
  return { base: extractBaseVariable(variable) }
}

/** «Клей» между шаблонами (служебные куски), которые не считаем текстом. */
export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" || trimmed.startsWith("`") || /^`}\)?\s*;?\s*$/.test(trimmed) || /^`\)\}\s*,?\s*$/.test(trimmed))
