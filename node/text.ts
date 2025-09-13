import {
  parseTemplateLiteral,
  extractBaseVariable,
  resolveDataPath,
  ARGUMENTS_PREFIX,
  createUnifiedExpression,
} from "../parser"
import { cutBeforeNextHtml } from "../parser"
import type { ParseContext } from "../parser.t"
import type { NodeText, ParseTextPart } from "./text.t"

/**
 * Парсит текстовые данные с путями.
 */
// ============================================================================
// TEXT PROCESSING
// ============================================================================

export const parseText = (text: string, context: ParseContext = { pathStack: [], level: 0 }): NodeText => {
  // Если текст не содержит переменных - возвращаем статический
  if (!text.includes("${")) {
    return {
      type: "text",
      value: text,
    }
  }

  // Проверяем, является ли это условным выражением, логическим оператором или математическим выражением
  const hasConditionalOperators = /\?.*:/.test(text) // тернарный оператор ?:
  const hasLogicalOperators = /[&&||]/.test(text)
  const hasMathematicalOperators = /[+\-*/%]/.test(text) // математические операторы
  const hasMethodCalls = /\.\w+\s*\(/.test(text) // вызовы методов

  if ((hasConditionalOperators || hasLogicalOperators || hasMathematicalOperators) && !hasMethodCalls) {
    // Используем общую функцию для условных выражений и логических операторов
    const templateResult = parseTemplateLiteral(text, context)
    if (templateResult && templateResult.data) {
      return {
        type: "text",
        data: templateResult.data,
        ...(templateResult.expr && { expr: templateResult.expr }),
      }
    }
  }

  // Разбираем текст на статические и динамические части
  const parts = splitText(text)

  // Парсим динамические части
  const dynamicParts = parts
    .filter((part) => part.type === "dynamic")
    .map((part) => {
      const varMatch = part.text.match(/\$\{([^}]+)\}/)
      const variable = varMatch?.[1] || ""

      // Фильтруем строковые литералы
      if (variable.startsWith('"') || variable.startsWith("'") || variable.includes('"') || variable.includes("'")) {
        return null
      }

      // Для сложных выражений с методами извлекаем только базовую переменную
      const baseVariable = extractBaseVariable(variable)

      // Определяем путь к данным с использованием переиспользуемой функции
      const path = resolveDataPath(baseVariable, context)

      return {
        path,
        text: part.text,
      }
    })
    .filter((part): part is NonNullable<typeof part> => part !== null)

  // Определяем основной путь (берем первый динамический)
  const firstDynamicPart = dynamicParts[0]
  const mainPath = firstDynamicPart ? firstDynamicPart.path : ""

  // Если все динамические части отфильтрованы (например, остались только строковые литералы),
  // то это статический текст
  if (dynamicParts.length === 0 && parts.some((part) => part.type === "dynamic")) {
    // Извлекаем статический текст из динамических частей
    const staticText = parts
      .filter((part) => part.type === "dynamic")
      .map((part) => {
        const varMatch = part.text.match(/\$\{([^}]+)\}/)
        const variable = varMatch?.[1] || ""
        // Возвращаем содержимое строковых литералов
        if (variable.startsWith('"') && variable.endsWith('"')) {
          return variable.slice(1, -1)
        }
        if (variable.startsWith("'") && variable.endsWith("'")) {
          return variable.slice(1, -1)
        }
        return ""
      })
      .join("")

    if (staticText) {
      return {
        type: "text",
        value: staticText,
      }
    }
  }

  // Если только одна переменная без дополнительного текста
  if (parts.length === 1 && parts[0] && parts[0].type === "dynamic") {
    // Проверяем, содержит ли выражение методы или сложные операции
    const dynamicText = parts[0].text
    const variable = dynamicText.match(/\$\{([^}]+)\}/)?.[1] || ""
    const hasComplexExpression = variable.includes("(")

    if (hasComplexExpression) {
      // Для сложных выражений добавляем expr с замещенной базовой переменной
      const baseVariable = dynamicParts[0]?.path.replace(/^\//, "").replace(/\//g, ".") || ""
      let expr = variable
      if (baseVariable) {
        expr = expr.replace(
          new RegExp(`\\b${baseVariable.replace(/\./g, "\\.")}\\b`, "g"),
          `\${${ARGUMENTS_PREFIX}[0]}`
        )
      }

      return {
        type: "text",
        data: mainPath,
        expr: createUnifiedExpression(expr, []),
      }
    }

    // Для простых переменных не добавляем expr
    return {
      type: "text",
      data: mainPath,
    }
  }

  // Если несколько переменных или смешанный текст
  if (dynamicParts.length > 1) {
    const expr = parts
      .map((part) => {
        if (part.type === "static") return part.text
        const index = dynamicParts.findIndex((dp) => dp.text === part.text)
        return `\${${ARGUMENTS_PREFIX}[${index}]}`
      })
      .join("")

    // Проверяем, является ли это простым выражением (только переменные без статического текста)
    const isSimpleExpr =
      expr === `\${${ARGUMENTS_PREFIX}[0]}` ||
      expr === `\${${ARGUMENTS_PREFIX}[0]}\${${ARGUMENTS_PREFIX}[1]}` ||
      expr === `\${${ARGUMENTS_PREFIX}[0]}-\${${ARGUMENTS_PREFIX}[1]}`

    if (isSimpleExpr) {
      return {
        type: "text",
        data: dynamicParts.map((part) => part.path),
      }
    }

    return {
      type: "text",
      data: dynamicParts.map((part) => part.path),
      expr: createUnifiedExpression(expr, []),
    }
  }

  // Одна переменная с дополнительным текстом
  const hasStaticText = parts.some((part) => part.type === "static" && part.text.trim() !== "")
  // Добавляем expr только если есть статический текст (не пробельные символы)
  if (hasStaticText) {
    const expr = parts
      .map((part) => {
        if (part.type === "static") return part.text
        return `\${${ARGUMENTS_PREFIX}[0]}`
      })
      .join("")

    return {
      type: "text",
      data: mainPath,
      expr: createUnifiedExpression(expr, []),
    }
  }

  // Только переменная без дополнительного текста
  return {
    type: "text",
    data: mainPath,
  }
}
/**
 * Разбивает текст на статические и динамические части.
 */

export const splitText = (text: string): ParseTextPart[] => {
  const parts: ParseTextPart[] = []
  let currentIndex = 0

  // Ищем все переменные с учетом вложенности
  const varMatches: string[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === "$" && i + 1 < text.length && text[i + 1] === "{") {
      // Находим конец template literal с учетом вложенности
      let braceCount = 1
      let j = i + 2
      while (j < text.length && braceCount > 0) {
        if (text[j] === "$" && j + 1 < text.length && text[j + 1] === "{") {
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

    // Добавляем статическую часть перед переменной
    if (varIndex > currentIndex) {
      const staticPart = text.slice(currentIndex, varIndex)
      parts.push({ type: "static", text: staticPart })
    }

    // Добавляем динамическую часть
    parts.push({ type: "dynamic", text: varMatch })

    currentIndex = varIndex + varMatch.length
  }

  // Добавляем оставшуюся статическую часть
  if (currentIndex < text.length) {
    const staticPart = text.slice(currentIndex)
    parts.push({ type: "static", text: staticPart })
  }

  return parts
}

export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return

  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  // Сохраняем левую «видимую» часть до html`
  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  // Собираем, оставляя только полностью закрытые ${...}
  let processed = ""
  let i = 0
  let usedEndLocal = 0 // сколько символов исходного куска реально «поглощено»

  while (i < visible.length) {
    const ch = visible[i]
    if (ch === "$" && i + 1 < visible.length && visible[i + 1] === "{") {
      const exprStart = i
      i += 2
      let b = 1
      while (i < visible.length && b > 0) {
        if (visible[i] === "{") b++
        else if (visible[i] === "}") b--
        i++
      }
      if (b === 0) {
        // закрытая интерполяция — целиком сохраняем
        processed += visible.slice(exprStart, i)
        usedEndLocal = i
        continue
      } else {
        // незакрытая — это «клей», остаток отбрасываем начиная с exprStart
        // индексы конца должны соответствовать реально использованной части
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

  if (final.length > 0) {
    return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
  }
} // ============================================================================
// УТИЛИТЫ ДЛЯ ТЕКСТА
// ============================================================================
// Чистый «клей» между шаблонами (целиком служебный кусок)

export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" ||
    trimmed.startsWith("`") || // закрытие предыдущего html`
    /^`}\)?\s*;?\s*$/.test(trimmed) || // `} или `}) (+ ;)
    /^`\)\}\s*,?\s*$/.test(trimmed)) // `)} (иногда с запятой)
