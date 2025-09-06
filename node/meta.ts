import type { PartAttrMeta } from "./meta.t"
import { resolveDataPath, createUnifiedExpression, processBasicAttributes, processSemanticAttributes } from "../parser"
import { createNodeData } from "."
import type { ParseContext } from "../parser.t"
import type { NodeMeta } from "./meta.t"

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
    result.child = node.child.map((child) => createNodeData(child, context))
  }

  return result
}
