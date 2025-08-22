import type {
  DataParserContext,
  DataParseResult,
  NodeDataText,
  NodeDataMap,
  NodeDataCondition,
  NodeDataElement,
  MapContext,
} from "./data.t"

/**
 * Ищет переменную в стеке map контекстов и возвращает соответствующий путь.
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

      // Определяем путь в зависимости от типа параметра
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
        // Деструктурированные параметры
        if (variableParts.length > 1) {
          // Свойство деструктурированного параметра
          return `${prefix}[item]/${variable.replace(/\./g, "/")}`
        } else {
          // Само деструктурированное свойство
          return `${prefix}[item]/${variable}`
        }
      }
    }
  }

  return null
}

/**
 * Определяет путь к данным с учетом контекста map.
 * Переиспользуемая функция для обработки переменных в контексте map.
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

    if (context.mapParams.includes(mapParamVariable)) {
      // Переменная является параметром текущего map или его свойством
      if (context.mapParams.length > 1) {
        // Деструктурированные параметры - переменная представляет свойство объекта
        return `[item]/${variable.replace(/\./g, "/")}`
      } else {
        // Простой параметр map
        if (variableParts.length > 1) {
          // Свойство простого параметра (например, user.name в map((user) => ...))
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам простой параметр (например, name в context.list.map((name) => ...))
          return "[item]"
        }
      }
    } else if (context.mapParams.includes(variable)) {
      // Переменная точно совпадает с параметром текущего map
      if (context.mapParams.length > 1) {
        // Деструктурированное свойство
        return `[item]/${variable.replace(/\./g, "/")}`
      } else {
        // Простой параметр
        return "[item]"
      }
    } else {
      // Переменная не найдена в текущих mapParams - проверяем, есть ли вложенный map
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
 * Создает выражение с унификацией переменных на индексы.
 * Переиспользуемая функция для создания expr.
 */
const createUnifiedExpression = (value: string, variables: string[]): string => {
  let expr = value
  variables.forEach((variable, index) => {
    // Заменяем переменные в ${} на индексы
    expr = expr.replace(new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g"), `\${${index}}`)
  })
  return expr
}

/**
 * Парсит путь к данным из map-выражения.
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
  // Ищем паттерны: identifier.identifier (но не числа)
  const pathMatches = condText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  if (pathMatches.length === 0) {
    return { path: "" }
  }

  // Извлекаем выражение условия
  const expression = extractConditionExpression(condText)

  if (pathMatches.length === 1) {
    const dataPath = pathMatches[0] || ""
    const absolutePath = `/${dataPath.replace(/\./g, "/")}`

    return {
      path: absolutePath,
      metadata: { expression },
    }
  }

  // Множественные пути
  const paths = pathMatches.map((path) => `/${path.replace(/\./g, "/")}`)

  return {
    path: paths,
    metadata: { expression },
  }
}

/**
 * Извлекает выражение условия.
 */
export const extractConditionExpression = (condText: string): string => {
  // Ищем все переменные в условии (но не числа)
  const pathMatches = condText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  // Заменяем переменные на индексы ${0}, ${1}, и т.д.
  let expression = condText
  pathMatches.forEach((path, index) => {
    expression = expression.replace(new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"), `\${${index}}`)
  })

  return expression.replace(/\s+/g, " ").trim()
}

/**
 * Парсит текстовые данные с путями.
 */
export const parseTextData = (text: string, context: DataParserContext = { pathStack: [], level: 0 }): NodeDataText => {
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
        expr = expr.replace(new RegExp(`\\b${baseVariable.replace(/\./g, "\\.")}\\b`, "g"), "${0}")
      }

      return {
        type: "text",
        data: mainPath,
        expr,
      }
    }

    return {
      type: "text",
      data: mainPath,
    }
  }

  // Если несколько переменных или смешанный текст
  if (dynamicParts.length > 1) {
    return {
      type: "text",
      data: dynamicParts.map((part) => part.path),
      expr: parts
        .map((part) => {
          if (part.type === "static") return part.text
          const index = dynamicParts.findIndex((dp) => dp.text === part.text)
          return `\${${index}}`
        })
        .join(""),
    }
  }

  // Одна переменная с дополнительным текстом
  const hasStaticText = parts.some((part) => part.type === "static" && part.text.trim() !== "")
  const hasWhitespace = parts.some((part) => part.type === "static" && /\s/.test(part.text))

  // Добавляем expr если есть статический текст или пробельные символы
  if (hasStaticText || hasWhitespace) {
    return {
      type: "text",
      data: mainPath,
      expr: parts
        .map((part) => {
          if (part.type === "static") return part.text
          return `\${0}`
        })
        .join(""),
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
export const splitTextIntoParts = (text: string): Array<{ type: "static" | "dynamic"; text: string }> => {
  const parts: Array<{ type: "static" | "dynamic"; text: string }> = []
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
): { data: string | string[]; expr?: string } | null => {
  // Проверяем, содержит ли значение template literal
  if (!value.includes("${")) {
    return null
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
): Record<string, { value: string } | { data: string | string[]; expr?: string }> => {
  const tagContent = text.replace(/^<\/?[A-Za-z][A-Za-z0-9:-]*/, "").replace(/\/?>$/, "")
  const attributes: Record<string, { value: string } | { data: string | string[]; expr?: string }> = {}

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
 * Создает NodeDataMap из обычного NodeMap.
 */
export const createNodeDataMap = (node: any, context: DataParserContext = { pathStack: [], level: 0 }): NodeDataMap => {
  const mapData = parseMapData(node.text, context)

  return {
    type: "map",
    data: Array.isArray(mapData.path) ? mapData.path[0] || "" : mapData.path,
    child: node.child ? node.child.map((child: any) => createNodeDataElement(child, mapData.context || context)) : [],
  }
}

/**
 * Создает NodeDataCondition из обычного NodeCondition.
 */
export const createNodeDataCondition = (
  node: any,
  context: DataParserContext = { pathStack: [], level: 0 }
): NodeDataCondition => {
  const condData = parseConditionData(node.text, context)
  const isSimpleCondition = !Array.isArray(condData.path) || condData.path.length === 1

  // Обрабатываем пути в контексте map
  let processedData = condData.path
  if (context.mapParams && context.mapParams.length > 0) {
    if (Array.isArray(condData.path)) {
      processedData = condData.path.map((path) => {
        const variable = path.replace(/^\//, "")
        if (context.mapParams!.includes(variable)) {
          // Определяем позицию параметра в map
          const paramIndex = context.mapParams!.indexOf(variable)
          if (paramIndex === 0) {
            // Первый параметр - элемент массива
            return context.mapParams!.length > 1 ? `[item]/${variable}` : "[item]"
          } else {
            // Второй и последующие параметры - индекс
            return "[index]"
          }
        }
        return path
      })
    } else {
      const variable = condData.path.replace(/^\//, "")
      if (context.mapParams!.includes(variable)) {
        // Определяем позицию параметра в map
        const paramIndex = context.mapParams!.indexOf(variable)
        if (paramIndex === 0) {
          // Первый параметр - элемент массива
          processedData = context.mapParams!.length > 1 ? `[item]/${variable}` : "[item]"
        } else {
          // Второй и последующие параметры - индекс
          processedData = "[index]"
        }
      }
    }
  }

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
 * Создает NodeDataElement из обычного NodeElement.
 */
export const createNodeDataElement = (node: any, context: DataParserContext = { pathStack: [], level: 0 }): any => {
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
    const result: any = {
      tag: node.tag,
      type: "el",
      child: node.child?.map((child: any) => createNodeDataElement(child, context)),
    }

    // Добавляем атрибуты если есть
    if (node.text) {
      const attributes = parseAttributesImproved(node.text, context)
      if (Object.keys(attributes).length > 0) result.attr = attributes
    }

    return result
  }

  return node
}

/**
 * Обогащает иерархию узлов полными данными о путях.
 */
export const enrichHierarchyWithData = (
  hierarchy: any[],
  context: DataParserContext = { pathStack: [], level: 0 }
): (NodeDataElement | NodeDataText | NodeDataMap | NodeDataCondition)[] => {
  return hierarchy.map((node) => createNodeDataElement(node, context))
}
