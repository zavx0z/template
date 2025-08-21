import type {
  DataParserContext,
  DataParseResult,
  NodeDataAttribute,
  NodeDataText,
  NodeDataMap,
  NodeDataCondition,
  NodeDataElement,
} from "./data-parser.t"

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
    return { path: "", type: "absolute" }
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
      type: "relative",
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
      type: "relative",
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
      type: "relative",
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
    type: "absolute",
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
  // Ищем паттерны: identifier.identifier
  const pathMatches = condText.match(/(\w+(?:\.\w+)*)/g) || []

  if (pathMatches.length === 0) {
    return { path: "", type: "absolute" }
  }

  // Извлекаем выражение условия
  const expression = extractConditionExpression(condText)

  if (pathMatches.length === 1) {
    const dataPath = pathMatches[0] || ""
    const absolutePath = `/${dataPath.replace(/\./g, "/")}`

    return {
      path: absolutePath,
      type: "absolute",
      metadata: { expression },
    }
  }

  // Множественные пути
  const paths = pathMatches.map((path) => `/${path.replace(/\./g, "/")}`)

  return {
    path: paths,
    type: "absolute",
    metadata: { expression },
  }
}

/**
 * Извлекает выражение условия.
 */
export const extractConditionExpression = (condText: string): string => {
  // Убираем лишние пробелы и символы
  return condText.replace(/\s+/g, " ").trim()
}

/**
 * Парсит текстовый модуль с путями к данным.
 */
export const parseTextData = (text: string, context: DataParserContext = { pathStack: [], level: 0 }): NodeDataText => {
  // Ищем все переменные в тексте: ${variable}
  const varMatches = text.match(/\$\{([^}]+)\}/g) || []

  if (varMatches.length === 0) {
    // Статический текст
    return {
      type: "text",
      data: "",
      pathType: "absolute",
      text,
      staticParts: [text],
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
      let type: "absolute" | "relative" | "item" = "absolute"

      if (context.mapParams && context.mapParams.length > 0) {
        // В контексте map - используем [item]
        path = "[item]"
        type = "item"
      } else if (context.currentPath && !context.currentPath.includes("[item]")) {
        // В контексте, но не map - добавляем к текущему пути
        path = `${context.currentPath}/${variable}`
        type = "relative"
      } else {
        // Абсолютный путь
        path = `/${variable}`
        type = "absolute"
      }

      return {
        path,
        type,
        text: part.text,
      }
    })

  // Определяем основной путь (берем первый динамический)
  const mainPath = dynamicParts.length > 0 ? dynamicParts[0]?.path || "" : ""
  const mainType = dynamicParts.length > 0 ? dynamicParts[0]?.type || "absolute" : "absolute"

  return {
    type: "text",
    data: mainPath,
    pathType: mainType,
    text,
    staticParts: parts.filter((part) => part.type === "static").map((part) => part.text),
    dynamicParts,
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
 * Парсит атрибуты элемента с путями к данным.
 */
export const parseElementAttributes = (
  elementText: string,
  context: DataParserContext = { pathStack: [], level: 0 }
): NodeDataAttribute[] => {
  const attributes: NodeDataAttribute[] = []

  // Ищем атрибуты в теге: name="value" или name=${variable}
  const attrMatches = elementText.match(/(\w+)=(?:["']([^"']*?)["']|([^"'\s>]+))/g) || []

  for (const attrMatch of attrMatches) {
    const nameMatch = attrMatch.match(/(\w+)=/)
    const valueMatch = attrMatch.match(/=(?:["']([^"']*?)["']|([^"'\s>]+))/)

    if (nameMatch && valueMatch) {
      const name = nameMatch[1] || ""
      const value = valueMatch[1] || valueMatch[2] || ""

      // Проверяем, содержит ли значение переменную
      if (value.includes("${")) {
        const varMatch = value.match(/\$\{([^}]+)\}/)
        const variable = varMatch?.[1] || ""

        // Определяем путь к данным
        let path: string
        let type: "absolute" | "relative" | "item" = "absolute"

        if (context.mapParams && context.mapParams.length > 0) {
          path = "[item]"
          type = "item"
        } else if (context.currentPath && !context.currentPath.includes("[item]")) {
          path = `${context.currentPath}/${variable}`
          type = "relative"
        } else {
          path = `/${variable}`
          type = "absolute"
        }

        attributes.push({
          name,
          data: path,
          type,
          text: attrMatch,
        })
      } else {
        // Статический атрибут
        attributes.push({
          name,
          data: "",
          type: "absolute",
          text: attrMatch,
        })
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
    ...node,
    data: mapData.path,
    pathType: mapData.type,
    params: mapData.metadata?.params,
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

  return {
    ...node,
    data: condData.path,
    pathType: condData.type,
    expression: condData.metadata?.expression,
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
      ...node,
      attributes: parseElementAttributes(node.text, context),
      child: node.child ? node.child.map((child: any) => createNodeDataElement(child, context)) : undefined,
    }
  }

  return node
}

/**
 * Обогащает иерархию узлов полными данными о путях.
 */
export const enrichHierarchyWithFullData = (
  hierarchy: any[],
  context: DataParserContext = { pathStack: [], level: 0 }
): (NodeDataElement | NodeDataText | NodeDataMap | NodeDataCondition)[] => {
  return hierarchy.map((node) => createNodeDataElement(node, context))
}
