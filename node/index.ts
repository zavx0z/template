import type { PartAttrMap } from "./map.t"
import type { PartAttrLogical } from "./logical.t"
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrMeta } from "./meta.t"
import type { PartText } from "./text.t"
import type { PartAttrElement } from "./element.t"
import { processBasicAttributes } from "../parser"
import type { ParseContext } from "../parser.t"
import { createNodeDataCondition } from "./condition"
import type { NodeCondition } from "./condition.t"
import type { NodeElement } from "./element.t"
import { createNodeDataLogical } from "./logical"
import type { NodeLogical } from "./logical.t"
import { createNodeDataMap } from "./map"
import type { NodeMap } from "./map.t"
import { createNodeDataMeta } from "./meta"
import type { NodeMeta } from "./meta.t"
import { parseText } from "./text"
import type { NodeText } from "./text.t"
import { createNodeDataElement } from "./element"

/**
 * Создает NodeElement из PartAttrElement.
 */
export const createNodeData = (
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
    return createNodeDataElement(node, context)
  }

  if (node.type === "meta") {
    return createNodeDataMeta(node, context)
  }

  return node
}
