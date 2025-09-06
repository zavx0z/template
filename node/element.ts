import { createNodeData } from "."
import { processBasicAttributes } from "../parser"
import type { ParseContext } from "../parser.t"
import type { NodeElement, PartAttrElement } from "./element.t"

export const createNodeDataElement = (node: PartAttrElement, context: ParseContext = { pathStack: [], level: 0 }) => {
  const result: NodeElement = {
    tag: node.tag,
    type: "el",
  }

  if (node.child) {
    result.child = node.child.map((child) => createNodeData(child, context))
  }

  // Обрабатываем атрибуты с помощью общей функции
  const processedAttrs = processBasicAttributes(node, context)
  Object.assign(result, processedAttrs)

  return result
}
