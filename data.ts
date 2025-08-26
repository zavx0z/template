import type { DataParserContext, DataParseResult, MapContext, AttributeParseResult, TextPart } from "./data.t"
import type { NodeText, NodeMap, NodeCondition, NodeElement, NodeMeta, Node } from "./index.t"
import type { NodeHierarchyText } from "./hierarchy.t"
import type { PartAttrCondition, PartAttrElement, PartAttributeMap, PartAttrMeta, PartAttrs } from "./attributes.t"

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
const findVariableInMapStack = (variable: string, context: DataParserContext): string | null => {
  if (!context.mapContextStack || context.mapContextStack.length === 0) {
    return null
  }

  // Проверяем от самого глубокого уровня к самому внешнему
  for (let i = context.mapContextStack.length - 1; i >= 0; i--) {
    const mapContext = context.mapContextStack[i]
    if (!mapContext) continue

    const variableParts = variable.split(".")
    const variableName = variableParts[0]

    if (mapContext.params.includes(variableName || "")) {
      // Переменная найдена на этом уровне map
      const currentLevel = context.mapContextStack.length - 1
      const targetLevel = i
      const levelsUp = currentLevel - targetLevel

      // Создаем префикс с нужным количеством "../"
      const prefix = "../".repeat(levelsUp)

      // Определяем позицию параметра в map
      const paramIndex = mapContext.params.indexOf(variableName || "")

      // Определяем путь в зависимости от позиции параметра
      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (mapContext.params.length === 1) {
          // Простой параметр map
          if (variableParts.length > 1) {
            // Свойство простого параметра (например, user.name)
            const propertyPath = variableParts.slice(1).join("/")
            return `${prefix}[item]/${propertyPath}`
          } else {
            // Сам простой параметр
            return `${prefix}[item]`
          }
        } else {
          // Деструктурированные параметры - первый параметр это элемент
          if (variableParts.length > 1) {
            // Свойство деструктурированного параметра (например, dept.id -> [item]/id)
            const propertyPath = variableParts.slice(1).join("/")
            return `${prefix}[item]/${propertyPath}`
          } else {
            // Само деструктурированное свойство (например, title -> [item]/title)
            return `${prefix}[item]/${variable}`
          }
        }
      } else {
        // Второй и последующие параметры - индекс
        return `${prefix}[index]`
      }
    }
  }

  return null
}

/**
 * Определяет путь к данным с учетом контекста map.
 *
 * Универсальная функция для разрешения путей к данным в различных контекстах.
 * Сначала пытается найти переменную в стеке map контекстов, затем использует
 * логику обратной совместимости для простых случаев.
 *
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
const resolveDataPath = (variable: string, context: DataParserContext): string => {
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
        if (context.mapParams.length === 1) {
          // Простой параметр
          return "[item]"
        } else {
          // Деструктурированное свойство
          return `[item]/${variable.replace(/\./g, "/")}`
        }
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
    if (beforeMethod && /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/.test(beforeMethod)) {
      return beforeMethod
    }
  }
  return variable
}

/**
 * Парсит событийные выражения и извлекает пути к данным.
 *
 * Эта функция специально предназначена для обработки событий типа:
 * - () => core.onClick()
 * - (e) => core.onInput(e)
 * - () => item.handleClick(item.id)
 *
 * @param eventValue - Значение события для парсинга
 * @param context - Контекст парсера с информацией о текущем map контексте
 * @returns Результат парсинга с путями к данным и унифицированным выражением
 */
const parseEventExpression = (
  eventValue: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): AttributeParseResult | null => {
  // Проверяем, является ли это update выражением
  if (eventValue.includes("update(")) {
    // Ищем объект в update({ ... })
    const objectMatch = eventValue.match(/update\(\s*\{([^}]+)\}\s*\)/)
    if (objectMatch) {
      const objectContent = objectMatch[1] || ""

      // Извлекаем ключи из объекта
      const keyMatches = objectContent.match(/([a-zA-Z_$][\w$]*)\s*:/g) || []
      const keys = keyMatches.map((match) => match.replace(/\s*:$/, "").trim())

      if (keys.length > 0) {
        // Ищем переменные в значениях (например, core.name, context.count)
        const variableMatches = objectContent.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []
        const uniqueVariables = [...new Set(variableMatches)].filter((variable) => {
          // Исключаем строковые литералы, короткие идентификаторы и булевые литералы
          return (
            variable.length > 1 &&
            !variable.startsWith('"') &&
            !variable.startsWith("'") &&
            !variable.includes('"') &&
            !variable.includes("'") &&
            variable !== "true" &&
            variable !== "false"
          )
        })

        let result: AttributeParseResult = {
          data: [],
          upd: keys.length === 1 ? keys[0] || "" : keys,
        }

        // Если есть переменные, добавляем пути к данным
        if (uniqueVariables.length > 0) {
          const paths = uniqueVariables
            .map((variable) => resolveDataPath(variable, context))
            .filter(Boolean) as string[]
          result.data = paths.length === 1 ? paths[0] || "" : paths
        }

        // Обрабатываем выражение напрямую
        let expr = eventValue
        if (uniqueVariables.length > 0) {
          uniqueVariables.forEach((variable, index) => {
            expr = expr.replace(new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
          })
        }

        result.expr = expr.replace(/^\$\{/, "").replace(/\}$/, "").replace(/\s+/g, " ").trim()

        return result
      }
    }
  }

  // Извлекаем переменные из события
  // Ищем все переменные в формате identifier.identifier
  const variableMatches = eventValue.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Проверяем, является ли это стрелочной функцией
  const hasArrowFunction = eventValue.includes("=>")

  // Фильтруем уникальные переменные и исключаем строковые литералы
  const uniqueVariables = [...new Set(variableMatches)].filter((variable) => {
    // Исключаем строковые литералы и короткие идентификаторы
    return (
      variable.length > 1 &&
      !variable.startsWith('"') &&
      !variable.startsWith("'") &&
      !variable.includes('"') &&
      !variable.includes("'")
    )
  })

  if (uniqueVariables.length === 0) {
    return null
  }

  // Разрешаем пути к данным с учетом контекста
  const paths = uniqueVariables.map((variable) => resolveDataPath(variable, context))

  // Создаем унифицированное выражение
  let expr = eventValue
  uniqueVariables.forEach((variable, index) => {
    // Заменяем переменные на индексы, учитывая границы слов
    expr = expr.replace(new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
  })

  // Убираем ${} обертку если она есть
  expr = expr.replace(/^\$\{/, "").replace(/\}$/, "")

  // Применяем форматирование
  expr = expr.replace(/\s+/g, " ").trim()

  // Если это простая переменная без стрелочной функции, не возвращаем expr
  if (!hasArrowFunction && uniqueVariables.length === 1 && (expr === "${0}" || expr === "0")) {
    return {
      data: paths[0] || "",
    }
  }

  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr,
  }
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
  variables.forEach((variable, index) => {
    // Заменяем переменные в ${} на индексы
    expr = expr.replace(new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g"), `\${${index}}`)
  })

  // Форматируем выражение: удаляем лишние пробелы и переносы строк, но сохраняем строковые литералы
  // Сначала защищаем строковые литералы
  const stringLiterals: string[] = []
  let protectedExpr = expr
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  // Удаляем лишние пробелы и переносы строк в выражениях
  protectedExpr = protectedExpr.replace(/\s+/g, " ").trim()

  // Восстанавливаем строковые литералы
  stringLiterals.forEach((literal, index) => {
    protectedExpr = protectedExpr.replace(`__STRING_${index}__`, literal)
  })

  return protectedExpr
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
 * parseMapData("core.list.map(({ title }) => ...)")
 * // Возвращает: { path: "/core/list", context: {...}, metadata: { params: ["title"] } }
 *
 * parseMapData("nested.map((item) => ...)", context)
 * // Возвращает: { path: "[item]/nested", context: {...}, metadata: { params: ["item"] } }
 */
export const parseMapData = (
  mapText: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): DataParseResult => {
  // Ищем паттерн: identifier.identifier.map((params) => html`)
  const mapMatch = mapText.match(/(\w+(?:\.\w+)*)\.map\(([^)]*)\)/)

  if (!mapMatch) {
    return { path: "" }
  }

  const dataPath = mapMatch[1] || ""
  const paramsText = mapMatch[2] || ""

  // Парсим параметры map-функции
  const params = parseMapParams(paramsText.replace(/^\(|\)$/g, ""))

  // Определяем тип пути
  if (dataPath.includes(".") && context.mapParams && context.mapParams.length > 0) {
    // Относительный путь в контексте map
    const parts = dataPath.split(".")
    const relativePath = parts[parts.length - 1] || ""

    const newMapContext: MapContext = {
      path: `[item]/${relativePath}`,
      params: params,
      level: context.level + 1,
    }

    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${relativePath}`,
      pathStack: [...context.pathStack, `[item]/${relativePath}`],
      mapParams: params,
      level: context.level + 1,
      mapContextStack: [...(context.mapContextStack || []), newMapContext],
    }

    return {
      path: `[item]/${relativePath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Если это вложенный map в контексте (например, nested.map)
  if (!dataPath.includes(".") && context.currentPath && context.currentPath.includes("[item]")) {
    const newMapContext: MapContext = {
      path: `[item]/${dataPath}`,
      params: params,
      level: context.level + 1,
    }

    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${dataPath}`,
      pathStack: [...context.pathStack, `[item]/${dataPath}`],
      mapParams: params,
      level: context.level + 1,
      mapContextStack: [...(context.mapContextStack || []), newMapContext],
    }

    return {
      path: `[item]/${dataPath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Если это вложенный map в контексте map (например, nested.map в контексте map)
  if (!dataPath.includes(".") && context.mapParams && context.mapParams.length > 0) {
    const newMapContext: MapContext = {
      path: `[item]/${dataPath}`,
      params: params,
      level: context.level + 1,
    }

    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${dataPath}`,
      pathStack: [...context.pathStack, `[item]/${dataPath}`],
      mapParams: params,
      level: context.level + 1,
      mapContextStack: [...(context.mapContextStack || []), newMapContext],
    }

    return {
      path: `[item]/${dataPath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Абсолютный путь
  const absolutePath = `/${dataPath.replace(/\./g, "/")}`

  const newMapContext: MapContext = {
    path: absolutePath,
    params: params,
    level: context.level + 1,
  }

  const newContext: DataParserContext = {
    ...context,
    currentPath: absolutePath,
    pathStack: [...context.pathStack, absolutePath],
    mapParams: params,
    level: context.level + 1,
    mapContextStack: [...(context.mapContextStack || []), newMapContext],
  }

  return {
    path: absolutePath,
    context: newContext,
    metadata: { params },
  }
}

/**
 * Парсит параметры map-функции.
 */
export const parseMapParams = (paramsText: string): string[] => {
  // Убираем пробелы и разбиваем по запятой
  const cleanParams = paramsText.replace(/\s+/g, "").trim()

  if (!cleanParams) return []

  // Разбираем деструктуризацию и простые параметры
  const params: string[] = []

  // Ищем деструктуризацию: { prop1, prop2 }
  const destructureMatch = cleanParams.match(/\{([^}]+)\}/)
  if (destructureMatch && destructureMatch[1]) {
    const props = destructureMatch[1].split(",").map((p) => p.trim())
    params.push(...props)
  } else {
    // Простые параметры: item, index
    const simpleParams = cleanParams.split(",").map((p) => p.trim())
    params.push(...simpleParams)
  }

  return params
}

/**
 * Парсит путь к данным из условного выражения.
 */
export const parseConditionData = (
  condText: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): DataParseResult => {
  // Для тернарных операторов с html тегами, извлекаем только переменные из условия
  // Убираем html`...` части и оставляем только логическое выражение
  let cleanCondText = condText

  // Удаляем html`...` части из тернарного оператора
  cleanCondText = cleanCondText.replace(/html`[^`]*`/g, "")

  // Для условий с индексами, извлекаем все логические выражения
  if (cleanCondText.includes("Index")) {
    const indexMatches = cleanCondText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    if (indexMatches.length > 0) {
      // Собираем все логические выражения с &&
      cleanCondText = indexMatches.join(" && ")
    }
  } else {
    // Для обычных условий, убираем всё после ? для извлечения только условной части
    if (cleanCondText.includes("?")) {
      const beforeQuestion = cleanCondText.split("?")[0]
      if (beforeQuestion) {
        cleanCondText = beforeQuestion.trim()
      }
    }
  }

  // Ищем паттерны: identifier.identifier (включая индексы)
  const pathMatches = cleanCondText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  if (pathMatches.length === 0) {
    return { path: "" }
  }

  // Извлекаем выражение условия из очищенного текста
  const expression = extractConditionExpression(cleanCondText)

  if (pathMatches.length === 1) {
    const variable = pathMatches[0] || ""
    // Используем resolveDataPath для правильного определения пути в контексте map
    const resolvedPath = resolveDataPath(variable, context)

    return {
      path: resolvedPath,
      metadata: { expression },
    }
  }

  // Множественные пути - используем resolveDataPath для каждого
  const paths = pathMatches.map((variable) => resolveDataPath(variable, context))

  return {
    path: paths,
    metadata: { expression },
  }
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

      // Заменяем переменные на индексы ${0}, ${1}, и т.д.
      pathMatches.forEach((path, index) => {
        logicalExpression = logicalExpression.replace(
          new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
          `\${${index}}`
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
    return `\${0}`
  }

  // Заменяем переменные на индексы ${0}, ${1}, и т.д.
  let expression = condText
  pathMatches.forEach((path, index) => {
    expression = expression.replace(new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
  })

  return expression.replace(/\s+/g, " ").trim()
}

/**
 * Форматирует текст по стандартам HTML (схлопывание пробельных символов).
 */
const formatTextByHtmlStandards = (text: string): string => {
  // Схлопываем последовательные пробельные символы в один пробел
  // и удаляем пробелы в начале и конце
  return text.replace(/\s+/g, " ").trim()
}

/**
 * Форматирует статический текст, сохраняя важные пробелы.
 */
const formatStaticText = (text: string): string => {
  // Если текст содержит только пробельные символы - удаляем их полностью
  if (text.trim().length === 0) {
    return ""
  }

  // Если текст содержит не-пробельные символы - форматируем по стандартам HTML
  // НО только если это многострочный текст или содержит много пробелов
  if (text.includes("\n") || text.includes("\t") || /\s{3,}/.test(text)) {
    return formatTextByHtmlStandards(text)
  }

  // Иначе оставляем как есть
  return text
}

/**
 * Парсит текстовые данные с путями.
 */
export const parseTextData = (text: string, context: DataParserContext = { pathStack: [], level: 0 }): NodeText => {
  // Если текст не содержит переменных - возвращаем статический
  if (!text.includes("${")) {
    return {
      type: "text",
      value: formatStaticText(text),
    }
  }

  // Проверяем, является ли это условным выражением или логическим оператором
  const hasConditionalOperators = /\?.*:/.test(text) // тернарный оператор ?:
  const hasLogicalOperators = /[&&||]/.test(text)

  if (hasConditionalOperators || hasLogicalOperators) {
    // Используем общую функцию для условных выражений и логических операторов
    const templateResult = parseTemplateLiteral(text, context)
    if (templateResult) {
      return {
        type: "text",
        data: templateResult.data,
        ...(templateResult.expr && { expr: templateResult.expr }),
      }
    }
  }

  // Разбираем текст на статические и динамические части
  const parts = splitTextIntoParts(text)

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
        value: formatStaticText(staticText),
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
        expr = expr.replace(new RegExp(`\\b${baseVariable.replace(/\./g, "\\.")}\\b`, "g"), "${0}")
      }

      return {
        type: "text",
        data: mainPath,
        expr: createUnifiedExpression(expr, []),
      }
    }

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
        return `\${${index}}`
      })
      .join("")

    return {
      type: "text",
      data: dynamicParts.map((part) => part.path),
      expr: createUnifiedExpression(expr, []),
    }
  }

  // Одна переменная с дополнительным текстом
  const hasStaticText = parts.some((part) => part.type === "static" && part.text.trim() !== "")
  const hasWhitespace = parts.some((part) => part.type === "static" && /\s/.test(part.text))

  // Добавляем expr если есть статический текст или пробельные символы
  if (hasStaticText || hasWhitespace) {
    const expr = parts
      .map((part) => {
        if (part.type === "static") return part.text
        return `\${0}`
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
export const splitTextIntoParts = (text: string): TextPart[] => {
  const parts: TextPart[] = []
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
const parseTemplateLiteral = (
  value: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): AttributeParseResult | null => {
  // Проверяем, содержит ли значение template literal
  if (!value.includes("${")) {
    return null
  }

  // Проверяем, является ли это событийным выражением
  const eventResult = parseEventExpression(value, context)
  if (eventResult) {
    return eventResult
  }

  // Проверяем, является ли это смешанным выражением с условным выражением
  // Regex для поиска строки-${условие}строка
  const conditionalMixedMatch = value.match(/^(.*?)\$\{(.*?\?.*?:.*?)\}(.*)$/)
  if (conditionalMixedMatch && conditionalMixedMatch[2]) {
    const [, prefix, conditionalExpr, suffix] = conditionalMixedMatch

    // Извлекаем переменные из условного выражения, исключая строковые литералы
    const valueWithoutStrings = conditionalExpr.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''")
    const pathMatches = valueWithoutStrings.match(/([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*)*)/g) || []
    const uniquePaths = [...new Set(pathMatches)].filter((path) => {
      return path.length > 1 && path !== "''" && path !== '""'
    })

    if (uniquePaths.length > 0) {
      const paths = uniquePaths.map((path) => resolveDataPath(path, context))

      let expr = conditionalExpr
      uniquePaths.forEach((path, index) => {
        expr = expr.replace(new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
      })

      return {
        data: paths.length === 1 ? paths[0] || "" : paths,
        expr: `${prefix}${expr}${suffix}`,
      }
    }
  }

  // Проверяем, является ли это условным выражением
  const hasConditionalOperators = /[?:]/.test(value)

  if (hasConditionalOperators) {
    // Для условных выражений используем стандартную унификацию
    // Извлекаем переменные из выражения, исключая строковые литералы
    // Сначала удаляем все строковые литералы из выражения, заменяя их на пустые строки
    const valueWithoutStrings = value.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''")
    const pathMatches = valueWithoutStrings.match(/([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*)*)/g) || []
    const uniquePaths = [...new Set(pathMatches)].filter((path) => {
      // Исключаем пустые и короткие строки
      return path.length > 1 && path !== "''" && path !== '""'
    })

    if (uniquePaths.length > 0) {
      // Создаем пути к данным с учетом контекста
      const paths = uniquePaths.map((path) => resolveDataPath(path, context))

      // Создаем выражение с унификацией - убираем ${} и заменяем переменные на индексы
      let expr = value.replace(/^\$\{/, "").replace(/\}$/, "")
      uniquePaths.forEach((path, index) => {
        expr = expr.replace(new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
      })

      // Восстанавливаем оригинальные кавычки для строковых литералов
      expr = expr.replace(/""/g, '"').replace(/''/g, "'")

      // Применяем форматирование к выражению
      expr = createUnifiedExpression(expr, uniquePaths)

      return {
        data: paths.length === 1 ? paths[0] || "" : paths,
        expr,
      }
    }
  }

  // Проверяем, есть ли простые логические операторы без тернарного оператора
  const hasLogicalOperators = /[&&||]/.test(value) && !/[?:]/.test(value)

  if (hasLogicalOperators) {
    // Для простых логических операторов (&&, ||) без тернарного оператора
    // извлекаем переменные и проверяем, есть ли сложные операции
    // Ищем переменные, исключая строковые литералы
    // Сначала удаляем все строковые литералы из выражения
    const valueWithoutStrings = value.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''")
    const pathMatches = valueWithoutStrings.match(/([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*)*)/g) || []
    const uniquePaths = [...new Set(pathMatches)].filter((path) => {
      // Исключаем пустые и короткие строки
      return path.length > 1 && path !== "''" && path !== '""'
    })

    if (uniquePaths.length > 0) {
      // Создаем пути к данным с учетом контекста
      const paths = uniquePaths.map((path) => resolveDataPath(path, context))

      // Проверяем, есть ли сложные операции (сравнения, математические операторы)
      const hasComplexOperations = /[%+\-*/===!===!=<>().]/.test(value)

      if (hasComplexOperations) {
        // Есть сложные операции - нужен expr
        const expr = createUnifiedExpression(value.replace(/^\$\{/, "").replace(/\}$/, ""), uniquePaths)

        return {
          data: paths.length === 1 ? paths[0] || "" : paths,
          expr,
        }
      } else {
        // Только простые логические операторы - expr не нужен
        return {
          data: paths.length === 1 ? paths[0] || "" : paths,
        }
      }
    }
  }

  // Для простых переменных - парсим напрямую
  const varMatches = value.match(/\$\{([^}]+)\}/g)
  if (!varMatches) {
    return null
  }

  const variables = varMatches
    .map((match) => match.slice(2, -1).trim())
    .filter(Boolean)
    .filter((variable) => {
      // Фильтруем строковые литералы
      return (
        !variable.startsWith('"') && !variable.startsWith("'") && !variable.includes('"') && !variable.includes("'")
      )
    })

  // Для сложных выражений с методами извлекаем только базовую переменную
  const baseVariables = variables.map((variable) => extractBaseVariable(variable))

  // Обрабатываем пути с учетом контекста map
  const paths = baseVariables.map((variable) => resolveDataPath(variable, context))

  // Для простых переменных без условий - возвращаем только data
  if (variables.length === 1 && value === `\${${variables[0]}}`) {
    return {
      data: paths[0] || "",
    }
  }

  // Создаем выражение с индексами для сложных случаев
  const expr = createUnifiedExpression(value, baseVariables)

  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr,
  }
}

/**
 * Парсер атрибутов из HTML тега.
 */
const parseAttributesImproved = (
  text: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): Record<string, { value: string } | AttributeParseResult> => {
  const tagContent = text.replace(/^<\/?[A-Za-z][A-Za-z0-9:-]*/, "").replace(/\/?>$/, "")
  const attributes: Record<string, { value: string } | AttributeParseResult> = {}

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
      let braceCount = 0

      // Ищем конец template literal или следующий атрибут
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
      let braceCount = 0

      // Ищем конец template literal или следующий атрибут
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
 * Создает NodeMap из обычного NodeHierarchyMap.
 */
export const createNodeDataMap = (
  node: PartAttributeMap,
  context: DataParserContext = { pathStack: [], level: 0 }
): NodeMap => {
  const mapData = parseMapData(node.text, context)

  return {
    type: "map",
    data: Array.isArray(mapData.path) ? mapData.path[0] || "" : mapData.path,
    child: node.child ? node.child.map((child: any) => createNodeDataElement(child, mapData.context || context)) : [],
  }
}

/**
 * Создает NodeCondition из обычного NodeHierarchyCondition.
 */
export const createNodeDataCondition = (
  node: PartAttrCondition,
  context: DataParserContext = { pathStack: [], level: 0 }
): NodeCondition => {
  const condData = parseConditionData(node.text, context)
  const isSimpleCondition = !Array.isArray(condData.path) || condData.path.length === 1

  // Используем пути, уже правильно разрешенные в parseConditionData
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
    true: createNodeDataElement(node.true, context),
    false: createNodeDataElement(node.false, context),
  }
}

/**
 * Создает NodeMeta из обычного NodeHierarchyMeta.
 */
export const createNodeDataMeta = (
  node: PartAttrMeta,
  context: DataParserContext = { pathStack: [], level: 0 }
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

  // Добавляем дочерние элементы, если они есть
  if (node.child && node.child.length > 0) {
    result.child = node.child.map((child) => createNodeDataElement(child, context))
  }

  return result
}

/**
 * Создает NodeElement из обычного NodeHierarchyElement.
 */
export const createNodeDataElement = (
  node: PartAttrElement | PartAttrMeta | PartAttributeMap | PartAttrCondition | NodeHierarchyText,
  context: DataParserContext = { pathStack: [], level: 0 }
): NodeElement | NodeText | NodeMap | NodeCondition | NodeMeta => {
  if (node.type === "map") {
    return createNodeDataMap(node, context)
  }

  if (node.type === "cond") {
    return createNodeDataCondition(node, context)
  }

  if (node.type === "text") {
    return parseTextData(node.text, context)
  }

  if (node.type === "el") {
    const result: NodeElement = {
      tag: node.tag,
      type: "el",
      child: node.child?.map((child) => createNodeDataElement(child, context)),
    }

    // Обрабатываем уже извлеченные атрибуты
    if (node.string) {
      result.string = {}
      for (const [key, attr] of Object.entries(node.string)) {
        if (attr.type === "static") {
          result.string[key] = attr.value
        } else {
          // Используем существующую функцию parseTemplateLiteral
          const templateResult = parseTemplateLiteral(attr.value, context)
          if (templateResult && templateResult.data) {
            if (templateResult.expr && typeof templateResult.expr === "string") {
              result.string[key] = {
                data: templateResult.data,
                expr: templateResult.expr,
              }
            } else {
              result.string[key] = {
                data: Array.isArray(templateResult.data) ? templateResult.data[0] || "" : templateResult.data,
              }
            }
          } else {
            result.string[key] = attr.value
          }
        }
      }
    }

    if (node.event) {
      result.event = {}
      for (const [key, value] of Object.entries(node.event)) {
        const eventResult = parseEventExpression(value, context)
        if (eventResult && eventResult.data) {
          if (eventResult.expr && typeof eventResult.expr === "string") {
            // Если есть выражение, создаем AttrDynamic (может быть массив или строка)
            result.event[key] = {
              data: eventResult.data,
              expr: eventResult.expr,
            }
          } else {
            // Если нет выражения, создаем AttrVariable (только строка)
            result.event[key] = {
              data: Array.isArray(eventResult.data) ? eventResult.data[0] || "" : eventResult.data,
            }
          }
        } else {
          // Если не удалось распарсить событие и value не пустая строка, создаем объект с data
          if (value && value.trim() !== "") {
            result.event[key] = {
              data: value,
            }
          }
          // Иначе игнорируем пустые события
        }
      }
      // Если секция событий пуста, удаляем её
      if (Object.keys(result.event).length === 0) {
        delete result.event
      }
    }

    if (node.array) {
      result.array = {}
      for (const [key, values] of Object.entries(node.array)) {
        result.array[key] = values.map((item) => ({ value: item.value }))
      }
    }

    if (node.boolean) {
      result.boolean = {}
      for (const [key, attr] of Object.entries(node.boolean)) {
        if (attr.type === "static") {
          result.boolean[key] = Boolean(attr.value)
        } else {
          // Для булевых атрибутов используем специальную обработку
          const booleanValue = String(attr.value)
          const variableMatches = booleanValue.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

          if (variableMatches.length > 0 && variableMatches[0]) {
            const variable = variableMatches[0]
            const dataPath = resolveDataPath(variable, context)
            result.boolean[key] = {
              data: dataPath,
            }
          } else {
            result.boolean[key] = false
          }
        }
      }
    }

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
 * const enriched = enrichHierarchyWithData([
 *   { type: "map", text: "users.map((user) => ...)", child: [...] },
 *   { type: "text", text: "Hello ${name}" }
 * ])
 * // Возвращает обогащенную иерархию с путями к данным и унифицированными выражениями
 */
export const enrichHierarchyWithData = (
  hierarchy: PartAttrs,
  context: DataParserContext = { pathStack: [], level: 0 }
): Node[] => {
  return hierarchy.map((node) => createNodeDataElement(node, context))
}
