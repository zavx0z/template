import type { ParseAttributeResult, ParseContext, ParseMapContext, ParseResult, ParseTextPart } from "./data.t"
import type {
  ValueVariable,
  ValueDynamic,
  Node,
  NodeCondition,
  NodeElement,
  NodeLogical,
  NodeMap,
  NodeMeta,
  NodeText,
} from "./index.t"
import type {
  PartAttrCondition,
  PartAttrElement,
  PartAttrMap,
  PartAttrMeta,
  PartAttrLogical,
  PartAttrs,
  PartText,
} from "./attribute/index.t"
import { processEventAttributes } from "./attribute/event"
import { processStyleAttributes } from "./attribute/style"
import { processStringAttributes } from "./attribute/string"
import { processArrayAttributes } from "./attribute/array"
import { processBooleanAttributes } from "./attribute/boolean"

// ============================================================================
// REGEX PATTERNS
// ============================================================================

// Паттерны для парсинга переменных
export const VARIABLE_WITH_DOTS_PATTERN = /([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g
const VALID_VARIABLE_PATTERN = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/

// Паттерны для парсинга map выражений
const MAP_PATTERN = /(\w+(?:\.\w+)*)\.map\(([^)]*)\)/

// Паттерны для парсинга событий
export const UPDATE_OBJECT_PATTERN = /update\(\s*\{([^}]+)\}\s*\)/
export const OBJECT_KEY_PATTERN = /([a-zA-Z_$][\w$]*)\s*:/g
export const CONDITIONAL_OPERATORS_PATTERN = /\?.*:/

// Паттерны для форматирования
export const WHITESPACE_PATTERN = /\s+/g
export const TEMPLATE_WRAPPER_PATTERN = /^\$\{|\}$/g

/**
 * Единый префикс для индексационных плейсхолдеров внутри expr.
 *
 * Формирует вид подстановок в унифицированных выражениях:
 *   \`${${ARGUMENTS_PREFIX}[0]}\`, \`${${ARGUMENTS_PREFIX}[1]}\`, ...
 *
 * Изменяя значение здесь, вы централизованно влияете на весь рендер expr
 * (parseEventExpression, createUnifiedExpression, parseTemplateLiteral, parseText, условия).
 * Допустимые варианты: "arguments" (классический JS) или пустая строка для специфического рантайма.
 */
export const ARGUMENTS_PREFIX = ""

// ============================================================================
// PATH RESOLUTION UTILITIES
// ============================================================================

/**
 * Ищет переменную в стеке map контекстов и возвращает соответствующий путь.
 *
 * Эта функция является ключевой для разрешения переменных в сложных вложенных структурах.
 * Она анализирует стек map контекстов от самого глубокого уровня к самому внешнему,
 * определяя правильные относительные пути для доступа к данным.
 *
 * @param variable - Имя переменной для поиска (может содержать точки для доступа к свойствам)
 * @param context - Контекст парсера с информацией о стеке map контекстов
 * @returns Относительный путь к данным или null, если переменная не найдена
 *
 * @example
 * // В контексте: departments.map((dept) => teams.map((team) => members.map((member) => ...)))
 * findVariableInMapStack("dept.name", context) // Возвращает: "../../[item]/name"
 * findVariableInMapStack("team.id", context)   // Возвращает: "../[item]/id"
 * findVariableInMapStack("member", context)    // Возвращает: "[item]"
 */
const findVariableInMapStack = (variable: string, context: ParseContext): string | null => {
  if (!context.mapContextStack?.length) return null

  const variableParts = variable.split(".")
  const variableName = variableParts[0] || ""

  // Ищем переменную от самого глубокого уровня к внешнему
  for (let i = context.mapContextStack.length - 1; i >= 0; i--) {
    const mapContext = context.mapContextStack[i]
    if (!mapContext?.params.includes(variableName)) continue

    const levelsUp = context.mapContextStack.length - 1 - i
    const prefix = "../".repeat(levelsUp)
    const paramIndex = mapContext.params.indexOf(variableName)

    // Используем информацию о деструктуризации из контекста
    return paramIndex === 0 ? buildItemPath(prefix, variableParts, mapContext.isDestructured) : `${prefix}[index]`
  }

  return null
}

const buildItemPath = (prefix: string, variableParts: string[], isDestructured: boolean): string => {
  const hasProperty = variableParts.length > 1

  if (isDestructured) {
    return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]/${variableParts[0]}`
  }

  return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]`
}

/**
 * Обрабатывает семантические атрибуты (core/context) с подходом "единый литерал + переменные".
 *
 * Извлекает все переменные из строки и создает унифицированное выражение для дальнейшего eval.
 * Подходит для core/context атрибутов, где нужна цельная строка для выполнения.
 *
 * @param str - Строка объекта в формате "{ key: value, key2: value2 }"
 * @param ctx - Контекст парсера
 * @returns Результат с путями к данным и унифицированным выражением
 */
const processSemanticAttributes = (
  str: string,
  ctx: ParseContext = { pathStack: [], level: 0 }
): ValueVariable | ValueDynamic | null => {
  // Извлекаем все переменные из строки объекта
  const variableMatches = str.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Убираем дубликаты переменных
  const uniqueVariables = [...new Set(variableMatches)]

  // Разрешаем пути к данным для каждой уникальной переменной
  const paths = uniqueVariables.map((variable: string) => resolveDataPath(variable, ctx) || variable)

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = str

  // Защищаем строковые литералы от замены
  const { protectedExpr, stringLiterals } = protectStringLiterals(expr)

  uniqueVariables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    const variableRegex = new RegExp(`(?<!\\w)${variable.replace(/\./g, "\\.")}(?!\\w)`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}

/**
 * Поддерживает различные типы параметров map функций:
 * - Простые параметры (один параметр)
 * - Деструктурированные свойства (несколько параметров)
 * - Параметры с индексами
 * - Доступ к свойствам через точку
 *
 * @param variable - Имя переменной для разрешения
 * @param context - Контекст парсера с информацией о текущем map контексте
 * @returns Путь к данным в формате относительного или абсолютного пути
 *
 * @example
 * // В контексте map с деструктуризацией: map(({ title, id }) => ...)
 * resolveDataPath("title", context) // Возвращает: "[item]/title"
 * resolveDataPath("id", context)    // Возвращает: "[item]/id"
 *
 * // В контексте map с простым параметром: map((item) => ...)
 * resolveDataPath("item.name", context) // Возвращает: "[item]/name"
 * resolveDataPath("item", context)      // Возвращает: "[item]"
 */
export const resolveDataPath = (variable: string, context: ParseContext): string => {
  // Сначала пытаемся найти переменную в стеке map контекстов
  const mapStackPath = findVariableInMapStack(variable, context)
  if (mapStackPath !== null) {
    return mapStackPath
  }

  // Если не найдена в стеке map, используем старую логику для обратной совместимости
  if (context.mapParams && context.mapParams.length > 0) {
    // В контексте map - различаем простые параметры и деструктурированные свойства
    const variableParts = variable.split(".")
    const mapParamVariable = variableParts[0] || ""

    // Проверяем, является ли первая часть переменной параметром map
    if (context.mapParams.includes(mapParamVariable)) {
      const paramIndex = context.mapParams.indexOf(mapParamVariable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id -> [item]/id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept -> [item])
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else if (variableParts[0] && context.mapParams.includes(variableParts[0])) {
      // Переменная начинается с имени параметра, но не содержит точку (например, dept в map((dept) => ...))
      const paramIndex = context.mapParams.indexOf(variableParts[0])
      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept)
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else if (context.mapParams.includes(variable)) {
      // Переменная точно совпадает с параметром текущего map
      const paramIndex = context.mapParams.indexOf(variable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        // Для деструктуризации всегда возвращаем [item]/property
        return `[item]/${variable}`
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else {
      // Переменная не найдена в текущих mapParams
      // Если переменная начинается с core., то это абсолютный путь
      if (variable.startsWith("core.")) {
        return `/${variable.replace(/\./g, "/")}`
      }

      // Проверяем, есть ли вложенный map
      if (context.currentPath && context.currentPath.includes("[item]")) {
        // Вложенный map - переменная может быть из внешнего контекста
        // Проверяем, есть ли в pathStack другие map контексты
        if (context.pathStack && context.pathStack.length > 1) {
          // Есть внешний map - вычисляем количество уровней подъема
          // Считаем количество map контекстов в pathStack (каждый map добавляет уровень)
          const mapLevels = context.pathStack.filter((path) => path.includes("[item]")).length
          const levelsUp = mapLevels - 1 // текущий уровень не считаем

          // Создаем префикс с нужным количеством "../"
          const prefix = "../".repeat(levelsUp)

          // Извлекаем только свойство из переменной (например, из g.id берем только id)
          const propertyPath = variableParts.length > 1 ? variableParts.slice(1).join("/") : variable
          return `${prefix}[item]/${propertyPath}`
        } else {
          // Нет внешнего map - обычный путь
          return `[item]/${variable.replace(/\./g, "/")}`
        }
      } else {
        // Обычный путь
        return `[item]/${variable.replace(/\./g, "/")}`
      }
    }
  } else if (context.currentPath && !context.currentPath.includes("[item]")) {
    // В контексте, но не map - добавляем к текущему пути
    return `${context.currentPath}/${variable.replace(/\./g, "/")}`
  } else {
    // Абсолютный путь
    return `/${variable.replace(/\./g, "/")}`
  }
}

/**
 * Извлекает базовую переменную из сложного выражения с методами.
 * Переиспользуемая функция для обработки выражений типа "context.list.map(...)".
 */
const extractBaseVariable = (variable: string): string => {
  if (variable.includes("(")) {
    // Для выражений с методами, ищем переменную до первого вызова метода
    // Например, для "context.list.map((item) => ...)" нужно получить "context.list"
    const beforeMethod = variable
      .split(/\.\w+\(/)
      .shift()
      ?.trim()
    if (beforeMethod && VALID_VARIABLE_PATTERN.test(beforeMethod)) {
      return beforeMethod
    }
  }
  return variable
}

/**
 * Создает унифицированное выражение с заменой переменных на индексы.
 *
 * Эта функция выполняет две ключевые задачи:
 * 1. Заменяет все переменные в выражении на индексы для унификации
 * 2. Форматирует выражение, удаляя избыточные пробелы и переносы строк
 *
 * Форматирование применяется с учетом строковых литералов:
 * - Строковые литералы защищаются от форматирования
 * - Пробелы и переносы строк удаляются только в логических частях выражения
 * - Строковые литералы восстанавливаются без изменений
 *
 * @param value - Исходное выражение с переменными в формате ${variable}
 * @param variables - Массив переменных для замены на индексы
 * @returns Унифицированное и отформатированное выражение
 *
 * @example
 * createUnifiedExpression("${user.name} is ${user.age} years old", ["user.name", "user.age"])
 * // Возвращает: "${0} is ${1} years old"
 *
 * createUnifiedExpression("${active ? 'Enabled' : 'Disabled'}", ["active"])
 * // Возвращает: "${0} ? 'Enabled' : 'Disabled'"
 */
const createUnifiedExpression = (value: string, variables: string[]): string => {
  let expr = value

  // Сначала защищаем строковые литералы от замены
  const { protectedExpr, stringLiterals } = protectStringLiterals(expr)

  // Заменяем переменные в ${} на индексы
  variables.forEach((variable, index) => {
    // Сначала заменяем точные совпадения ${variable}
    const exactRegex = new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g")
    expr = expr.replace(exactRegex, `\${${ARGUMENTS_PREFIX}[${index}]}`)

    // Затем заменяем переменные внутри ${} выражений (для условных выражений)
    // Но только если это не точное совпадение
    const insideRegex = new RegExp(`\\$\\{([^}]*?)\\b${variable.replace(/\./g, "\\.")}\\b([^}]*?)\\}`, "g")
    expr = expr.replace(insideRegex, (match, before, after) => {
      // Проверяем, что это не точное совпадение
      if (before.trim() === "" && after.trim() === "") {
        return match // Не заменяем точные совпадения
      }
      return `\${${before}${ARGUMENTS_PREFIX}[${index}]${after}}`
    })
  })

  // Удаляем лишние пробелы и переносы строк в выражениях
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  return expr
}

/**
 * Парсит путь к данным из map-выражения и создает новый контекст.
 *
 * Эта функция анализирует map-выражения и определяет:
 * - Путь к массиву данных
 * - Параметры map-функции
 * - Тип пути (абсолютный или относительный)
 * - Новый контекст для вложенных операций
 *
 * Поддерживает различные сценарии:
 * - Абсолютные пути к данным (например, core.list.map)
 * - Относительные пути в контексте map (например, nested.map)
 * - Вложенные map в контексте существующих map
 *
 * @param mapText - Текст map-выражения для парсинга
 * @param context - Текущий контекст парсера (опционально)
 * @returns Результат парсинга с путем, новым контекстом и метаданными
 *
 * @example
 * parseMap("core.list.map(({ title }) => ...)")
 * // Возвращает: { path: "/core/list", context: {...}, metadata: { params: ["title"] } }
 *
 * parseMap("nested.map((item) => ...)", context)
 * // Возвращает: { path: "[item]/nested", context: {...}, metadata: { params: ["item"] } }
 */
// ============================================================================
// NODE CREATION UTILITIES
// ============================================================================

/**
 * Общая функция для обработки атрибутов с template literals.
 * Устраняет дублирование кода между различными типами атрибутов.
 */
export const processTemplateLiteralAttribute = (
  value: string,
  context: ParseContext
): { data: string | string[]; expr?: string } | null => {
  const templateResult = parseTemplateLiteral(value, context)
  if (templateResult && templateResult.data) {
    // Проверяем, является ли это простой переменной (только одна переменная без дополнительного текста)
    const isSimpleVariable = templateResult.expr === "${[0]}" && !Array.isArray(templateResult.data)

    return {
      data: templateResult.data,
      ...(templateResult.expr && !isSimpleVariable && { expr: templateResult.expr }),
    }
  }
  return null
}

/**
 * Общая функция для обработки базовых атрибутов элемента.
 * Устраняет дублирование кода между createNodeDataElement и createNodeDataMeta.
 */
const processBasicAttributes = (
  node: PartAttrElement | PartAttrMeta,
  context: ParseContext
): Partial<NodeElement | NodeMeta> => {
  const result: Partial<NodeElement | NodeMeta> = {}

  // Обрабатываем базовые атрибуты
  if (node.string) {
    result.string = processStringAttributes(node.string, context)
  }

  if (node.event) {
    const eventAttrs = processEventAttributes(node.event, context)
    if (Object.keys(eventAttrs).length > 0) {
      result.event = eventAttrs
    }
  }

  if (node.array) {
    result.array = processArrayAttributes(node.array, context)
  }

  if (node.boolean) {
    result.boolean = processBooleanAttributes(node.boolean, context)
  }

  if (node.style) {
    const styleResult = processStyleAttributes(node.style, context)
    if (styleResult) {
      result.style = styleResult
    }
  }

  return result
}

/**
 * Общая функция для поиска конца template literal.
 * Устраняет дублирование кода в parseAttributesImproved.
 */
const findTemplateLiteralEnd = (tagContent: string, startIndex: number): number => {
  let i = startIndex
  let braceCount = 0

  // Ищем конец template literal
  while (i < tagContent.length) {
    if (tagContent[i] === "$" && i + 1 < tagContent.length && tagContent[i + 1] === "{") {
      // Начинается template literal
      i += 2
      braceCount = 1
      while (i < tagContent.length && braceCount > 0) {
        if (tagContent[i] === "{") braceCount++
        else if (tagContent[i] === "}") braceCount--
        i++
      }
    } else if (/\s/.test(tagContent[i]!)) {
      // Пробел - конец значения
      break
    } else {
      i++
    }
  }

  return i
}

/**
 * Общая функция для поиска конца template literal внутри кавычек.
 * Устраняет дублирование кода в parseAttributesImproved.
 */
const findTemplateLiteralEndInQuotes = (tagContent: string, startIndex: number, quote: string): number => {
  let i = startIndex

  // Ищем закрывающую кавычку, учитывая template literals
  while (i < tagContent.length) {
    if (tagContent[i] === quote) break
    if (tagContent[i] === "$" && i + 1 < tagContent.length && tagContent[i + 1] === "{") {
      // Пропускаем template literal
      i += 2
      let braceCount = 1
      while (i < tagContent.length && braceCount > 0) {
        if (tagContent[i] === "{") braceCount++
        else if (tagContent[i] === "}") braceCount--
        i++
      }
    } else {
      i++
    }
  }

  return i
}

// ============================================================================
// EXPRESSION PARSERS
// ============================================================================

export const parseMap = (mapText: string, context: ParseContext = { pathStack: [], level: 0 }): ParseResult => {
  // Ищем паттерн: identifier.identifier.map((params) => html`)
  const mapMatch = mapText.match(MAP_PATTERN)

  if (!mapMatch) {
    return { path: "" }
  }

  const dataPath = mapMatch[1] || ""
  const paramsText = mapMatch[2] || ""

  // Парсим параметры map-функции
  const { params, isDestructured } = extractMapParams(paramsText.replace(/^\(|\)$/g, ""))

  // Определяем тип пути и создаем соответствующий контекст
  let targetPath: string

  if (dataPath.includes(".") && context.mapParams && context.mapParams.length > 0) {
    // Относительный путь в контексте map
    const parts = dataPath.split(".")
    const relativePath = parts[parts.length - 1] || ""
    targetPath = `[item]/${relativePath}`
  } else if (
    !dataPath.includes(".") &&
    (context.currentPath?.includes("[item]") || (context.mapParams && context.mapParams.length > 0))
  ) {
    // Вложенный map в контексте map
    targetPath = `[item]/${dataPath}`
  } else {
    // Абсолютный путь
    targetPath = `/${dataPath.replace(/\./g, "/")}`
  }

  const newContext = createNewParseContext(targetPath, params, isDestructured, context)

  return {
    path: targetPath,
    context: newContext,
    metadata: { params },
  }
}

/**
 * Парсит параметры map-функции.
 */
export const extractMapParams = (paramsText: string): { params: string[]; isDestructured: boolean } => {
  const cleanParams = paramsText.replace(/\s+/g, "").trim()
  if (!cleanParams) return { params: [], isDestructured: false }

  const destructureMatch = cleanParams.match(/\{([^}]+)\}/)
  const isDestructured = !!destructureMatch
  const params = destructureMatch?.[1]
    ? destructureMatch[1].split(",").map((p) => p.trim())
    : cleanParams.split(",").map((p) => p.trim())

  return { params, isDestructured }
}

/**
 * Парсит путь к данным из условного выражения.
 */
export const parseCondition = (condText: string, context: ParseContext = { pathStack: [], level: 0 }): ParseResult => {
  const cleanCondText = cleanConditionText(condText)
  const pathMatches = cleanCondText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  if (pathMatches.length === 0) return { path: "" }

  const expression = extractConditionExpression(cleanCondText)
  const paths =
    pathMatches.length === 1
      ? resolveDataPath(pathMatches[0] || "", context)
      : pathMatches.map((variable) => resolveDataPath(variable, context))

  return { path: paths, metadata: { expression } }
}

const cleanConditionText = (condText: string): string => {
  let cleanText = condText.replace(/html`[^`]*`/g, "")

  if (cleanText.includes("Index")) {
    const indexMatches = cleanText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    return indexMatches.length > 0 ? indexMatches.join(" && ") : cleanText
  }

  return cleanText.includes("?") ? cleanText.split("?")[0]?.trim() || cleanText : cleanText
}

/**
 * Извлекает выражение условия.
 */
export const extractConditionExpression = (condText: string): string => {
  // Для условий с индексами, извлекаем только логическое выражение
  if (condText.includes("Index")) {
    // Ищем все логические выражения с индексами
    const indexMatches = condText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    if (indexMatches.length > 0) {
      // Собираем все логические выражения
      let logicalExpression = indexMatches.join(" && ")

      // Ищем переменные в логическом выражении
      const pathMatches = logicalExpression.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      // Заменяем переменные на индексы ${${ARGUMENTS_PREFIX}[0]}, ${${ARGUMENTS_PREFIX}[1]}, и т.д.
      pathMatches.forEach((path, index) => {
        logicalExpression = logicalExpression.replace(
          new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
          `\${${ARGUMENTS_PREFIX}[${index}]}`
        )
      })

      return logicalExpression.replace(/\s+/g, " ").trim()
    }
  }

  // Ищем все переменные в условии (но не числа)
  const pathMatches = condText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  // Проверяем, есть ли математические операции или другие сложные операции
  const hasComplexOperations = /[%+\-*/===!===!=<>().]/.test(condText)
  const hasLogicalOperators = /[&&||]/.test(condText)

  // Если найдена только одна переменная и нет сложных операций, возвращаем простое выражение
  if (pathMatches.length === 1 && !hasComplexOperations && !hasLogicalOperators) {
    return `\${${ARGUMENTS_PREFIX}[0]}`
  }

  // Если найдена только одна переменная, но есть простые математические операции (например, i % 2)
  if (pathMatches.length === 1 && hasComplexOperations && !hasLogicalOperators) {
    // Заменяем переменную на индекс и оборачиваем в ${}
    let expression = condText
    expression = expression.replace(
      new RegExp(`\\b${pathMatches[0].replace(/\./g, "\\.")}\\b`, "g"),
      `${ARGUMENTS_PREFIX}[0]`
    )
    return `\${${expression}}`
  }

  // Заменяем переменные на индексы ${${ARGUMENTS_PREFIX}[0]}, ${${ARGUMENTS_PREFIX}[1]}, и т.д.
  let expression = condText
  pathMatches.forEach((path, index) => {
    expression = expression.replace(
      new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
      `\${${ARGUMENTS_PREFIX}[${index}]}`
    )
  })

  return expression.replace(/\s+/g, " ").trim()
}

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

  // Проверяем, является ли это условным выражением или логическим оператором
  const hasConditionalOperators = /\?.*:/.test(text) // тернарный оператор ?:
  const hasLogicalOperators = /[&&||]/.test(text)

  if (hasConditionalOperators || hasLogicalOperators) {
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

  // Ищем все переменные
  const varMatches = text.match(/\$\{[^}]+\}/g) || []

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

/**
 * Общая функция для обработки template literals.
 * Используется как для text узлов, так и для атрибутов.
 */
export const parseTemplateLiteral = (
  value: string,
  context: ParseContext = { pathStack: [], level: 0 }
): ParseAttributeResult | null => {
  // Если значение не содержит ${}, возвращаем null (статическое значение)
  if (!value.includes("${")) {
    return null
  }

  // Извлекаем все переменные из выражения, включая вложенные ${...}
  const variables: string[] = []

  // Функция для извлечения переменных из строки с учетом вложенных ${...}
  const extractVariables = (str: string) => {
    // Защищаем строковые литералы
    const stringLiterals: string[] = []
    let protectedStr = str
      .replace(/"[^"]*"/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })
      .replace(/'[^']*'/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })

    // Рекурсивно извлекаем переменные из всех ${...} выражений
    const extractFromTemplate = (content: string) => {
      // Находим переменные в текущем содержимом
      const variableMatches = content.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      variableMatches.forEach((variable) => {
        if (
          variable.length > 1 &&
          !variable.startsWith("__STRING_") &&
          !variable.startsWith("STRING") &&
          variable !== "true" &&
          variable !== "false" &&
          variable !== "null" &&
          variable !== "undefined" &&
          !variables.includes(variable)
        ) {
          variables.push(variable)
        }
      })

      // Рекурсивно обрабатываем вложенные ${...}
      const nestedMatches = content.match(/\$\{([^}]+)\}/g) || []
      nestedMatches.forEach((nestedMatch) => {
        const nestedContent = nestedMatch.slice(2, -1)
        extractFromTemplate(nestedContent)
      })
    }

    // Если строка содержит ${...}, извлекаем переменные из всего содержимого
    if (protectedStr.includes("${")) {
      // Находим все ${...} выражения
      const templateMatches = protectedStr.match(/\$\{([^}]+)\}/g) || []

      templateMatches.forEach((match) => {
        // Извлекаем содержимое ${...}
        const content = match.slice(2, -1) // убираем ${ и }
        extractFromTemplate(content)
      })
    }
  }

  // Извлекаем переменные из всего выражения
  extractVariables(value)

  // Всегда извлекаем переменные из всего выражения, независимо от наличия ${...}

  // Защищаем строковые литералы
  const additionalStringLiterals: string[] = []
  let protectedValue = value
    .replace(/"[^"]*"/g, (match) => {
      additionalStringLiterals.push(match)
      return `__STRING_${additionalStringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      additionalStringLiterals.push(match)
      return `__STRING_${additionalStringLiterals.length - 1}__`
    })
    // Защищаем строки внутри template literals (например, "active" в `${context.item}-active-${context.status}`)
    .replace(/\$\{([^}]*)\}/g, (match, content) => {
      const protectedContent = content.replace(/([a-zA-Z_$][\w$]*)/g, (word: string) => {
        // Если это не переменная с точками, считаем строкой
        if (!word.includes(".") && word !== "true" && word !== "false" && word !== "null" && word !== "undefined") {
          additionalStringLiterals.push(word)
          return `__STRING_${additionalStringLiterals.length - 1}__`
        }
        return word
      })
      return `\${${protectedContent}}`
    })

  // Извлекаем переменные только из ${} выражений или если они содержат точки
  const allMatches = protectedValue.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  allMatches.forEach((variable) => {
    // Переменная должна содержать точки (например, context.flag) или быть внутри ${} выражения
    const hasDots = variable.includes(".")

    // Проверяем, находится ли переменная внутри ${} выражения
    // Переменная может быть только внутри ${}, а не в статическом тексте
    const isInsideTemplateLiteral =
      value.includes(`\${${variable}}`) ||
      value.includes(`\${${variable} `) ||
      value.includes(` ${variable}}`) ||
      // Более точная проверка для variable. - должна быть отдельным паттерном
      new RegExp(`\${${variable.replace(/\./g, "\\.")}\\.`).test(value)

    // Проверяем, является ли это простой переменной в выражении (например, i в i % 2)
    // Переменная должна быть внутри ${} выражения, а не просто в строке
    const isSimpleVariableInExpression = !hasDots && value.includes(`\${${variable} `) && /[+\-*/%<>=!&|]/.test(value)

    // Переменная должна быть ТОЛЬКО внутри ${} выражения
    const isPartOfTemplateExpression = isInsideTemplateLiteral || isSimpleVariableInExpression

    if (
      variable.length > 1 &&
      !variable.startsWith("__STRING_") &&
      variable !== "true" &&
      variable !== "false" &&
      variable !== "null" &&
      variable !== "undefined" &&
      variable !== "active" &&
      variable !== "inactive" &&
      (hasDots || isPartOfTemplateExpression) &&
      !variables.includes(variable)
    ) {
      variables.push(variable)
    }
  })

  if (variables.length === 0) {
    return null
  }

  // Разрешаем пути к данным для каждой переменной
  const paths = variables.map((variable: string) => resolveDataPath(variable, context))

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = value

  // Защищаем строковые литералы от замены
  const { protectedExpr, stringLiterals } = protectStringLiterals(expr)

  variables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    // Используем более точное регулярное выражение для замены переменных
    const variableRegex = new RegExp(`(?<!\\w)${variable.replace(/\./g, "\\.")}(?!\\w)`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}

/**
 * Парсер атрибутов из HTML тега.
 */
const parseAttributesImproved = (
  text: string,
  context: ParseContext = { pathStack: [], level: 0 }
): Record<string, { value: string } | ParseAttributeResult> => {
  const tagContent = text.replace(/^<\/?[A-Za-z][A-Za-z0-9:-]*/, "").replace(/\/?>$/, "")
  const attributes: Record<string, { value: string } | ParseAttributeResult> = {}

  // Парсим атрибуты вручную
  let i = 0
  while (i < tagContent.length) {
    // Пропускаем пробелы
    while (i < tagContent.length && /\s/.test(tagContent[i]!)) i++
    if (i >= tagContent.length) break

    // Ищем имя атрибута (включая namespace)
    const nameStart = i
    while (i < tagContent.length && /[A-Za-z0-9-:]/.test(tagContent[i]!)) i++
    const name = tagContent.slice(nameStart, i)
    if (!name || name.length === 0) {
      // Проверяем, есть ли template literal без имени атрибута (булевые атрибуты)
      const valueStart = i
      i = findTemplateLiteralEnd(tagContent, i)

      const value = tagContent.slice(valueStart, i)

      // Проверяем, является ли значение template literal для булевого атрибута
      if (value.includes("&&")) {
        const match = value.match(/\$\{([^}]+)\s*&&\s*"([^"]+)"\}/)
        if (match && match[1] && match[2]) {
          const [, condition, attrName] = match
          const trimmedCondition = condition.trim()
          // Для булевых атрибутов с && не нужен expr, так как это просто проверка на истинность
          attributes[attrName] = {
            data: `/${trimmedCondition.replace(/\./g, "/")}`,
          }
        }
      }
      break
    }

    // Пропускаем пробелы и знак равенства
    while (i < tagContent.length && /\s/.test(tagContent[i]!)) i++
    if (i < tagContent.length && tagContent[i] === "=") i++
    while (i < tagContent.length && /\s/.test(tagContent[i]!)) i++

    if (i >= tagContent.length) {
      // Булевый атрибут
      attributes[name] = { value: "" }
      break
    }

    // Ищем значение в кавычках
    if (tagContent[i] === '"' || tagContent[i] === "'") {
      const quote = tagContent[i]
      i++
      const valueStart = i

      // Ищем закрывающую кавычку, учитывая template literals
      i = findTemplateLiteralEndInQuotes(tagContent, i, quote!)

      const value = tagContent.slice(valueStart, i)
      if (i < tagContent.length) i++ // пропускаем закрывающую кавычку

      // Проверяем, является ли значение template literal
      const templateResult = parseTemplateLiteral(value, context)
      if (templateResult) {
        attributes[name] = templateResult
      } else {
        attributes[name] = { value: value || "" }
      }
    } else {
      // Проверяем, есть ли template literal без кавычек
      const valueStart = i
      i = findTemplateLiteralEnd(tagContent, i)

      const value = tagContent.slice(valueStart, i)

      // Проверяем, является ли значение template literal
      const templateResult = parseTemplateLiteral(value, context)
      if (templateResult) {
        // Для булевых атрибутов типа ${context.flag && "disabled"}
        // Если это условное выражение с логическим И, извлекаем имя атрибута
        if (value.includes("&&")) {
          const match = value.match(/\$\{([^}]+)\s*&&\s*"([^"]+)"\}/)
          if (match && match[1] && match[2]) {
            const [, condition, attrName] = match
            const trimmedCondition = condition.trim()
            // Для булевых атрибутов с && не нужен expr, так как это просто проверка на истинность
            attributes[attrName] = {
              data: `/${trimmedCondition.replace(/\./g, "/")}`,
            }
          } else {
            attributes[name] = templateResult
          }
        } else {
          attributes[name] = templateResult
        }
      } else {
        // Булевый атрибут или обычное значение
        attributes[name] = { value: value || "" }
      }
    }
  }

  return attributes
}

/**
 * Создает NodeMap из обычного PartMap.
 */
// ============================================================================
// NODE CREATION FACTORIES
// ============================================================================

export const createNodeDataMap = (node: PartAttrMap, context: ParseContext = { pathStack: [], level: 0 }): NodeMap => {
  const mapData = parseMap(node.text, context)

  return {
    type: "map",
    data: Array.isArray(mapData.path) ? mapData.path[0] || "" : mapData.path,
    child: node.child ? node.child.map((child: any) => createNodeDataElement(child, mapData.context || context)) : [],
  }
}

/**
 * Создает NodeCondition из обычного PartCondition.
 */
export const createNodeDataCondition = (
  node: PartAttrCondition,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeCondition => {
  const condData = parseCondition(node.text, context)
  const isSimpleCondition = !Array.isArray(condData.path) || condData.path.length === 1

  // Используем пути, уже правильно разрешенные в parseCondition
  const processedData = condData.path

  // Проверяем наличие операторов/методов
  const hasOperatorsOrMethods =
    condData.metadata?.expression && /[%+\-*/&&||===!===!=<>().]/.test(condData.metadata.expression)

  const needsExpression = !isSimpleCondition || hasOperatorsOrMethods

  return {
    type: "cond",
    data: isSimpleCondition
      ? Array.isArray(processedData)
        ? processedData[0] || ""
        : processedData || ""
      : processedData || [],
    ...(needsExpression && condData.metadata?.expression ? { expr: condData.metadata.expression } : {}),
    child: [createNodeDataElement(node.child[0]!, context), createNodeDataElement(node.child[1]!, context)],
  }
}

/**
 * Создает NodeLogical из обычного PartLogical.
 */
export const createNodeDataLogical = (
  node: PartAttrLogical,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeLogical => {
  const condData = parseCondition(node.text, context)
  const isSimpleCondition = !Array.isArray(condData.path) || condData.path.length === 1

  // Используем пути, уже правильно разрешенные в parseCondition
  const processedData = condData.path

  // Проверяем наличие операторов/методов
  const hasOperatorsOrMethods =
    condData.metadata?.expression && /[%+\-*/&&||===!===!=<>().]/.test(condData.metadata.expression)

  const needsExpression = !isSimpleCondition || hasOperatorsOrMethods

  return {
    type: "log",
    data: isSimpleCondition
      ? Array.isArray(processedData)
        ? processedData[0] || ""
        : processedData || ""
      : processedData || [],
    ...(needsExpression && condData.metadata?.expression ? { expr: condData.metadata.expression } : {}),
    child: node.child ? node.child.map((child: any) => createNodeDataElement(child, context)) : [],
  }
}

/**
 * Создает NodeMeta из обычного PartMeta.
 */
export const createNodeDataMeta = (
  node: PartAttrMeta,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeMeta => {
  let result: NodeMeta

  // Проверяем, является ли тег динамическим (содержит ${...})
  if (node.tag.includes("${")) {
    // Парсим динамический тег
    const tagMatch = node.tag.match(/meta-(\${[^}]+})/)
    if (tagMatch && tagMatch[1]) {
      const dynamicTag = tagMatch[1]
      // Извлекаем переменную из ${...}
      const variableMatch = dynamicTag.match(/\${([^}]+)}/)
      if (variableMatch && variableMatch[1]) {
        const variable = variableMatch[1]
        const dataPath = resolveDataPath(variable, context)
        if (dataPath) {
          result = {
            tag: {
              data: dataPath,
              expr: createUnifiedExpression(`meta-${dynamicTag}`, [variable]),
            },
            type: "meta",
          }
        } else {
          result = {
            tag: node.tag,
            type: "meta",
          }
        }
      } else {
        result = {
          tag: node.tag,
          type: "meta",
        }
      }
    } else {
      result = {
        tag: node.tag,
        type: "meta",
      }
    }
  } else {
    // Статический тег
    result = {
      tag: node.tag,
      type: "meta",
    }
  }

  // Обрабатываем базовые атрибуты
  const processedAttrs = processBasicAttributes(node, context)
  Object.assign(result, processedAttrs)

  // Обрабатываем семантические атрибуты
  if ("core" in node && node.core) {
    result.core = processSemanticAttributes(node.core, context) || node.core
  }
  if ("context" in node && node.context) {
    result.context = processSemanticAttributes(node.context, context) || node.context
  }

  // Добавляем дочерние элементы, если они есть
  if (node.child && node.child.length > 0) {
    result.child = node.child.map((child) => createNodeDataElement(child, context))
  }

  return result
}

/**
 * Создает NodeElement из обычного PartAttrElement.
 */
export const createNodeDataElement = (
  node: PartAttrElement | PartAttrMeta | PartAttrMap | PartAttrCondition | PartAttrLogical | PartText,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeElement | NodeText | NodeMap | NodeCondition | NodeLogical | NodeMeta => {
  if (node.type === "map") {
    return createNodeDataMap(node, context)
  }

  if (node.type === "cond") {
    return createNodeDataCondition(node, context)
  }

  if (node.type === "log") {
    return createNodeDataLogical(node, context)
  }

  if (node.type === "text") {
    return parseText(node.text, context)
  }

  if (node.type === "el") {
    const result: NodeElement = {
      tag: node.tag,
      type: "el",
    }

    if (node.child) {
      result.child = node.child.map((child) => createNodeDataElement(child, context))
    }

    // Обрабатываем атрибуты с помощью общей функции
    const processedAttrs = processBasicAttributes(node, context)
    Object.assign(result, processedAttrs)

    return result
  }

  if (node.type === "meta") {
    return createNodeDataMeta(node, context)
  }

  return node
}

/**
 * Обогащает HTML иерархию метаданными о путях к данным, выражениях и статических значениях.
 *
 * Это основная функция системы обогащения данных. Она принимает базовую HTML иерархию
 * и обогащает каждый узел дополнительной информацией для эффективного рендеринга.
 *
 * Функция обрабатывает все типы узлов:
 * - Map узлы: определяет пути к массивам данных и параметры итерации
 * - Condition узлы: унифицирует условные выражения и определяет пути к данным
 * - Text узлы: разделяет статический и динамический контент
 * - Element узлы: обогащает атрибуты и дочерние элементы
 *
 * Система автоматически:
 * - Определяет контексты вложенности
 * - Разрешает относительные пути к данным
 * - Унифицирует выражения для кэширования
 * - Применяет HTML стандарты форматирования
 *
 * @param hierarchy - Базовая HTML иерархия для обогащения
 * @param context - Контекст парсера с информацией о текущем состоянии (опционально)
 * @returns Обогащенная иерархия с метаданными о путях к данным
 *
 * @example
 * const enriched = enrichWithData([
 *   { type: "map", text: "users.map((user) => ...)", child: [...] },
 *   { type: "text", text: "Hello ${name}" }
 * ])
 * // Возвращает обогащенную иерархию с путями к данным и унифицированными выражениями
 */
// ============================================================================
// MAIN API
// ============================================================================

export const enrichWithData = (hierarchy: PartAttrs, context: ParseContext = { pathStack: [], level: 0 }): Node[] => {
  return hierarchy.map((node) => createNodeDataElement(node, context))
}

// ============================================================================
// HELPER FUNCTIONS FOR CODE REUSE
// ============================================================================

/**
 * Создает новый map контекст для устранения дублирования кода.
 */
const createMapContext = (
  path: string,
  params: string[],
  isDestructured: boolean,
  context: ParseContext
): ParseMapContext => ({
  path,
  params,
  isDestructured,
  level: context.level + 1,
})

/**
 * Создает новый контекст парсера для map операций.
 */
const createNewParseContext = (
  path: string,
  params: string[],
  isDestructured: boolean,
  context: ParseContext
): ParseContext => {
  const newParseMapContext = createMapContext(path, params, isDestructured, context)

  return {
    ...context,
    currentPath: path,
    pathStack: [...context.pathStack, path],
    mapParams: params,
    level: context.level + 1,
    mapContextStack: [...(context.mapContextStack || []), newParseMapContext],
  }
}

/**
 * Защищает строковые литералы от замены переменных.
 * Переиспользуемая функция для устранения дублирования.
 */
const protectStringLiterals = (expr: string): { protectedExpr: string; stringLiterals: string[] } => {
  const stringLiterals: string[] = []
  const protectedExpr = expr
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  return { protectedExpr, stringLiterals }
}

/**
 * Восстанавливает строковые литералы после обработки.
 */
const restoreStringLiterals = (expr: string, stringLiterals: string[]): string => {
  let result = expr
  stringLiterals.forEach((literal, index) => {
    result = result.replace(`__STRING_${index}__`, literal)
  })
  return result
}
