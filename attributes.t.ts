import type { NodeHierarchyCondition, NodeHierarchyMap, NodeHierarchyText } from "./hierarchy.t"

export type Attribute = "boolean" | "array" | "event" | "string"

export type AttributeValue = {
  name: string
  type: Attribute
  value: string
}

export type ValueType = "dynamic" | "static" | "mixed"

export type AttributeEvent = Record<string, string>

export type AttributeArray = Record<string, { value: string; type: ValueType }[]>

export type AttributeString = Record<string, { type: ValueType; value: string }>

export type AttributeBoolean = Record<string, string>

export type NodeAttributeElement = {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "el"
  /** События */
  event?: AttributeEvent
  /** Булевые аттрибуты */
  boolean?: AttributeBoolean
  /** Массивы аттрибутов */
  array?: AttributeArray
  /** Строковые аттрибуты */
  string?: AttributeString
  /** Дочерние элементы (опционально) */
  child?: (NodeAttributeElement | NodeAttributeMeta | NodeHierarchyCondition | NodeHierarchyMap | NodeHierarchyText)[]
}

export type NodeAttributeMeta = {
  /** Имя мета-тега */
  tag: string
  /** Тип узла */
  type: "meta"
  /** Аттрибуты */
  attr: AttributeValue[]
  /** Дочерние элементы (опционально) */
  child?: (NodeAttributeElement | NodeAttributeMeta | NodeHierarchyCondition | NodeHierarchyMap | NodeHierarchyText)[]
}

export type NodeAttributes = (
  | NodeAttributeElement
  | NodeAttributeMeta
  | NodeHierarchyCondition
  | NodeHierarchyMap
  | NodeHierarchyText
)[]
