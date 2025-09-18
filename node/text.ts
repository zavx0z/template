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
 * Главная функция парсинга текстовых узлов.
 * На вход получает сырой текст из шаблона (включая ${...}) и контекст парсера.
 *
 * Возвращает:
 *  - { type: "text", value } — если нет интерполяций ${...} либо они сводятся к чистой строке;
 *  - { type: "text", data, expr? } — если есть динамика:
 *      data — массив/строка путей к данным (в порядке появления),
 *      expr — унифицированное выражение, где переменные заменены на ${_[i]} (+ возможно хвост вызова метода).
 *
 * ВАЖНО:
 *  • Метод-вызовы (например, user.name.toUpperCase()) раскладываются так:
 *      data: "[item]/name/toUpperCase"
 *      expr: "${_[0]}()"   // скобки и аргументы сохраняются в expr
 *  • Если выражение не содержит методов и является «простым» (только подстановки),
 *    expr опускаем для компактности и предсказуемости.
 */
export const parseText = (text: string, context: ParseContext = { pathStack: [], level: 0 }): NodeText => {
  // Быстрый путь: если нет ${...} — это статический текст
  if (!text.includes("${")) {
    return { type: "text", value: text }
  }

  // Детектируем типы конструкции внутри интерполяций:
  //  - тернарки ?:, логические &&/||, арифметика — оставляем общей функции парсинга,
  //    НО только если нет вызовов методов (иначе обрабатываем сами).
  const hasConditionalOperators = /\?.*:/.test(text)
  const hasLogicalOperators = /[&&||]/.test(text)
  const hasMathematicalOperators = /[+\-*/%]/.test(text)
  const hasMethodCalls = /\.\w+\s*\(/.test(text)

  // Ветвь для чистых условных/логических/мат. выражений (без методов).
  // parseTemplateLiteral вернёт data + expr, где переменные заменены на ${_[i]}.
  if ((hasConditionalOperators || hasLogicalOperators || hasMathematicalOperators) && !hasMethodCalls) {
    const templateResult = parseTemplateLiteral(text, context)
    if (templateResult?.data) {
      return { type: "text", data: templateResult.data, ...(templateResult.expr && { expr: templateResult.expr }) }
    }
  }

  // Рубим текст на статические и динамические куски `${...}`.
  const parts = splitText(text)

  // Извлекаем из динамических частей:
  //  • базовую переменную (например, user.name),
  //  • при наличии — имя метода и скобки вызова (callSuffix), например "()", "(2)".
  // Затем формируем путь data (с суффиксом /method, если есть).
  const dynamicParts = parts
    .filter((part) => part.type === "dynamic")
    .map((part) => {
      const varMatch = part.text.match(/\$\{([^}]+)\}/)
      const variable = varMatch?.[1] || ""

      // Если внутри ${...} сплошной строковый литерал — игнорируем его как динамический источник данных.
      if (variable.startsWith('"') || variable.startsWith("'") || variable.includes('"') || variable.includes("'")) {
        return null
      }

      // Разбираем базу и возможный последний вызов метода
      const { base, methodName, callSuffix } = extractBaseAndCall(variable)

      // Превращаем базу в нормализованный путь (учитывая текущий map-сайд-контекст)
      const basePath = resolveDataPath(base, context)

      // Если был метод — добавим его как сегмент пути (это часть «статической схемы»).
      const path = methodName ? `${basePath}/${methodName}` : basePath

      return { path, text: part.text, callSuffix }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  // Первый динамический путь — «основной» (для удобства одиночных выражений).
  const firstDynamicPart = dynamicParts[0]
  const mainPath = firstDynamicPart ? firstDynamicPart.path : ""

  // Случай: динамические блоки были, но все оказались строковыми литералами — сведём в статический текст.
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

  // Случай: весь текст — одна ${...}
  if (parts.length === 1 && parts[0]!.type === "dynamic") {
    const variable = parts[0]!.text.match(/\$\{([^}]+)\}/)?.[1] || ""
    const callSuffix = dynamicParts[0]!.callSuffix

    // Если есть вызов метода — expr строго "${_[0]}(…аргументы…)"
    if (callSuffix) {
      return {
        type: "text",
        data: dynamicParts[0]!.path,
        expr: createUnifiedExpression(`\${${ARGUMENTS_PREFIX}[0]}${callSuffix}`, []),
      }
    }

    // Если нет метода, но есть "сложность" (скобки, вызовы не-методов и т.п.) — подменим базу на ${_[0]}
    if (variable.includes("(")) {
      const baseVariable = extractBaseVariable(variable)
      // Путь → dotted-форма (context.a.b) — чтобы корректно заменить в исходном выражении.
      const pathDots = resolveDataPath(baseVariable, context).replace(/^\//, "").replace(/\//g, ".")
      const expr = variable.replace(
        new RegExp(`\\b${pathDots.replace(/\./g, "\\.")}\\b`, "g"),
        `\${${ARGUMENTS_PREFIX}[0]}`
      )
      return { type: "text", data: dynamicParts[0]!.path, expr: createUnifiedExpression(expr, []) }
    }

    // Простой случай — чистая переменная, без expr
    return { type: "text", data: mainPath }
  }

  // Случай: несколько динамических частей (или смешанный текст)
  if (dynamicParts.length > 1) {
    // Собираем expr, заменяя каждую ${...} на ${_[i]} и, если был метод, дописываем его скобки прямо сюда.
    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        const index = dynamicParts.findIndex((dp) => dp.text === p.text)
        const call = dynamicParts[index]?.callSuffix ?? ""
        return `\${${ARGUMENTS_PREFIX}[${index}]}${call}`
      })
      .join("")

    // Эвристика «простого» выражения: только переменные (без статических вставок, без операторов) —
    // тогда expr можно опустить и оставить лишь data.
    const isSimpleExpr =
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}\${${ARGUMENTS_PREFIX}[1]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}-\${${ARGUMENTS_PREFIX}[1]}`

    // Но если внутри были вызовы методов — expr всё-таки нужен (иначе не восстановим вызовы).
    const hasAnyCalls = dynamicParts.some((dp) => !!dp.callSuffix)
    if (isSimpleExpr && !hasAnyCalls) {
      return { type: "text", data: dynamicParts.map((p) => p.path) }
    }

    return { type: "text", data: dynamicParts.map((p) => p.path), expr: createUnifiedExpression(exprRaw, []) }
  }

  // Одна динамическая часть + вокруг есть статический текст:
  // expr составляем, подставляя ${_[0]} и (если был метод) — его скобки.
  const hasStaticText = parts.some((p) => p.type === "static" && p.text.trim() !== "")
  if (hasStaticText) {
    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        const call = dynamicParts[0]?.callSuffix ?? ""
        return `\${${ARGUMENTS_PREFIX}[0]}${call}`
      })
      .join("")
    return { type: "text", data: mainPath, expr: createUnifiedExpression(exprRaw, []) }
  }

  // На всякий случай (fallback): «просто переменная»
  return { type: "text", data: mainPath }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Разбивает исходную строку на последовательность частей:
 *  - { type: "static", text } — буквальный текст
 *  - { type: "dynamic", text } — ровно одна интерполяция `${...}`
 *
 * Умеет корректно обрабатывать вложенные `${ ${ } }` за счёт счётчика скобок.
 */
export const splitText = (text: string): ParseTextPart[] => {
  const parts: ParseTextPart[] = []
  let currentIndex = 0
  const varMatches: string[] = []

  // Собираем все `${...}` (с вложенностью)
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
        } else j++
      }
      if (braceCount === 0) {
        const varMatch = text.slice(i, j)
        varMatches.push(varMatch)
        i = j
      } else i++
    } else i++
  }

  // Конструируем чередование static/dynamic частей
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
 * Вырезает «видимую» текстовую часть до следующего `html\``.
 * Нужен, чтобы не «захватить» служебный клей между шаблонами.
 * Возвращает структуру для токена текста, либо undefined.
 */
export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return
  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  // Собираем только полностью закрытые ${...}; незакрытые считаем «клеем» и обрезаем на них.
  let processed = ""
  let i = 0,
    usedEndLocal = 0
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
      } else break
    }
    processed += ch
    i++
    usedEndLocal = i
  }

  // Нормализуем пробелы: сжимаем подряд и убираем «чистый пробел».
  const collapsed = processed.replace(/\s+/g, " ")
  if (collapsed === " ") return

  // Если изначально это был многострочный кусок — обрежем края.
  const final = /^\s*\n[\s\S]*\n\s*$/.test(chunk) ? collapsed.trim() : collapsed
  if (final.length > 0) return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
}

/**
 * Достаёт «базовую» переменную из сложного выражения.
 * Примеры:
 *  - "user.name.toUpperCase()" → "user.name"
 *  - "context.list.map(...)"  → "context.list"
 *
 * Защищает строковые литералы, чтобы точки внутри строк не мешали разбору.
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

  // Если встречаются вызовы — берём левую часть до первого ".method("
  if (protectedVariable.includes("(")) {
    const beforeMethod = protectedVariable
      .split(/\.\w+\(/)
      .shift()
      ?.trim()
    if (beforeMethod && VALID_VARIABLE_PATTERN.test(beforeMethod)) return beforeMethod
  }

  // Иначе ищем первую «точечную» переменную вида a.b.c (строки уже экранированы).
  const variableMatches = protectedVariable.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const variablesWithDots = variableMatches.filter((v) => v.includes(".") && !v.startsWith("__STRING_"))
  if (variablesWithDots.length > 0) return variablesWithDots[0]!
  return variable
}

/**
 * Возвращает базу и последний вызов метода (если есть).
 *  - base: "user.name"
 *  - methodName: "toUpperCase"
 *  - callSuffix: "()", "(2)", "(a, b)", ...
 *
 * Мы сознательно берём только ПОСЛЕДНИЙ вызов:
 *  ${user.name.trim().toUpperCase()} → base="user.name.trim()", method="toUpperCase"
 * Такой кейс можно расширить позже, если потребуется проталкивать цепочки.
 */
const extractBaseAndCall = (variable: string): { base: string; methodName?: string; callSuffix?: string } => {
  // Экранируем строки, чтобы точки/скобки внутри них не мешали парсингу
  const shielded = variable
    .replace(/`[^`]*`/g, "__S__")
    .replace(/"[^"]*"/g, "__S__")
    .replace(/'[^']*'/g, "__S__")

  // Ищем шаблон ".methodName(args)" в КОНЦЕ выражения (без глубокой парсинг-матрицы)
  const m = shielded.match(/\.([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*$/)
  if (m) {
    const methodName = m[1]
    const args = m[2] ?? ""
    const callSuffix = `(${args})`

    // База — это выражение без последнего вызова метода
    const base = extractBaseVariable(variable.replace(m[0], ""))
    return { base, methodName, callSuffix }
  }

  // Вызова нет — просто база
  return { base: extractBaseVariable(variable) }
}

/**
 * Служебная проверка «чистого клея» между шаблонными литералами —
 * такие куски не считаются текстом и отбрасываются.
 */
export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" || trimmed.startsWith("`") || /^`}\)?\s*;?\s*$/.test(trimmed) || /^`\)\}\s*,?\s*$/.test(trimmed))
