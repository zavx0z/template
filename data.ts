import type {
  DataParserContext,
  DataParseResult,
  NodeDataText,
  NodeDataMap,
  NodeDataCondition,
  NodeDataElement,
} from "./data.t"

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

    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${relativePath}`,
      pathStack: [...context.pathStack, `[item]/${relativePath}`],
      mapParams: params,
      level: context.level + 1,
    }

    return {
      path: `[item]/${relativePath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Если это вложенный map в контексте (например, nested.map)
  if (!dataPath.includes(".") && context.currentPath && context.currentPath.includes("[item]")) {
    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${dataPath}`,
      pathStack: [...context.pathStack, `[item]/${dataPath}`],
      mapParams: params,
      level: context.level + 1,
    }

    return {
      path: `[item]/${dataPath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Если это вложенный map в контексте map (например, nested.map в контексте map)
  if (!dataPath.includes(".") && context.mapParams && context.mapParams.length > 0) {
    const newContext: DataParserContext = {
      ...context,
      currentPath: `[item]/${dataPath}`,
      pathStack: [...context.pathStack, `[item]/${dataPath}`],
      mapParams: params,
      level: context.level + 1,
    }

    return {
      path: `[item]/${dataPath}`,
      context: newContext,
      metadata: { params },
    }
  }

  // Абсолютный путь
  const absolutePath = `/${dataPath.replace(/\./g, "/")}`

  const newContext: DataParserContext = {
    ...context,
    currentPath: absolutePath,
    pathStack: [...context.pathStack, absolutePath],
    mapParams: params,
    level: context.level + 1,
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

  // Разбираем текст на статические и динамические части
  const parts = splitTextIntoParts(text)

  // Парсим динамические части
  const dynamicParts = parts
    .filter((part) => part.type === "dynamic")
    .map((part) => {
      const varMatch = part.text.match(/\$\{([^}]+)\}/)
      const variable = varMatch?.[1] || ""

      // Определяем путь к данным
      let path: string

      if (context.mapParams && context.mapParams.length > 0) {
        // В контексте map - различаем простые параметры и деструктурированные свойства
        if (context.mapParams.includes(variable)) {
          // Проверяем, является ли это деструктуризацией
          // Если mapParams содержит переменную и их больше одного, то это деструктуризация
          if (context.mapParams.length > 1) {
            // Это деструктурированное свойство (например, title в map(({ title, nested }) => ...))
            // Представляет свойство объекта в массиве
            path = `[item]/${variable}`
          } else {
            // Это простой параметр map (например, name в context.list.map((name) => ...))
            // Представляет сам элемент массива
            path = "[item]"
          }
        } else {
          // Переменная не найдена в mapParams - используем обычный путь
          path = `[item]/${variable}`
        }
      } else if (context.currentPath && !context.currentPath.includes("[item]")) {
        // В контексте, но не map - добавляем к текущему пути
        path = `${context.currentPath}/${variable}`
      } else {
        // Абсолютный путь
        path = `/${variable}`
      }

      return {
        path,
        text: part.text,
      }
    })

  // Определяем основной путь (берем первый динамический)
  const firstDynamicPart = dynamicParts[0]
  const mainPath = firstDynamicPart ? firstDynamicPart.path : ""

  // Если только одна переменная без дополнительного текста
  if (parts.length === 1 && parts[0] && parts[0].type === "dynamic") {
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

  // Добавляем expr только если есть статический текст или пробельные символы
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
        if (context.mapParams.includes(variable)) {
          // Определяем позицию параметра в map
          const paramIndex = context.mapParams.indexOf(variable)
          if (paramIndex === 0) {
            // Первый параметр - элемент массива
            return context.mapParams.length > 1 ? `[item]/${variable}` : "[item]"
          } else {
            // Второй и последующие параметры - индекс
            return "[index]"
          }
        }
        return path
      })
    } else {
      const variable = condData.path.replace(/^\//, "")
      if (context.mapParams.includes(variable)) {
        // Определяем позицию параметра в map
        const paramIndex = context.mapParams.indexOf(variable)
        if (paramIndex === 0) {
          // Первый параметр - элемент массива
          processedData = context.mapParams.length > 1 ? `[item]/${variable}` : "[item]"
        } else {
          // Второй и последующие параметры - индекс
          processedData = "[index]"
        }
      }
    }
  }

  // Добавляем expr только для сложных условий или если выражение содержит операторы/методы
  const hasOperatorsOrMethods =
    condData.metadata?.expression &&
    (condData.metadata.expression.includes("%") ||
      condData.metadata.expression.includes("+") ||
      condData.metadata.expression.includes("-") ||
      condData.metadata.expression.includes("*") ||
      condData.metadata.expression.includes("/") ||
      condData.metadata.expression.includes("&&") ||
      condData.metadata.expression.includes("||") ||
      condData.metadata.expression.includes("===") ||
      condData.metadata.expression.includes("!==") ||
      condData.metadata.expression.includes("==") ||
      condData.metadata.expression.includes("!=") ||
      condData.metadata.expression.includes("<") ||
      condData.metadata.expression.includes(">") ||
      condData.metadata.expression.includes("(") ||
      condData.metadata.expression.includes("."))

  const needsExpression = !isSimpleCondition || hasOperatorsOrMethods

  return {
    type: "cond",
    data: isSimpleCondition ? (Array.isArray(processedData) ? processedData[0] : processedData) : processedData,
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
    return {
      tag: node.tag,
      type: "el",
      child: node.child ? node.child.map((child: any) => createNodeDataElement(child, context)) : undefined,
    }
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
