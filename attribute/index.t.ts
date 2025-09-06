import type { SplitterFn } from "."

export type ValueType = "dynamic" | "static" | "mixed"

export type PartText = {
  /** Тип узла */
  type: "text"
  /** Исходный текст */
  text: string
}
interface AttrNodeElement {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "meta" | "el"
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: Record<string, string>
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: Record<string, { type: "dynamic" | "static"; value: boolean | string }>
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: Record<string, { value: string; type: ValueType }[]>
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: Record<string, { type: ValueType; value: string }>
  /** Стили (CSS в виде строки или объекта) */
  style?: string
  /** Дочерние элементы (опционально) */
  child?: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical | PartText)[]
}

export interface PartAttrElement extends AttrNodeElement {
  /** Тип узла */
  type: "el"
}

export interface PartAttrMeta extends AttrNodeElement {
  /** Тип узла */
  type: "meta"
  /** Core объекты */
  core?: string
  /** Context объекты */
  context?: string
}

export type PartAttrCondition = {
  /** Тип узла */
  type: "cond"
  /** Исходный текст условия */
  text: string
  /** Элементы, условия
   * - true: первый элемент массива
   * - false: второй элемент массива
   */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap)[]
}

export type PartAttrLogical = {
  /** Тип узла */
  type: "log"
  /** Исходный текст логического выражения */
  text: string
  /** Дочерние элементы, которые отображаются только если условие истинно */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical)[]
}
export type PartAttrMap = {
  /** Тип узла */
  type: "map"
  /** Исходный текст map-выражения */
  text: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: (PartAttrElement | PartText | PartAttrMap | PartAttrMeta | PartAttrCondition | PartAttrLogical)[]
}
export type PartAttrs = (
  | PartAttrElement
  | PartAttrMeta
  | PartAttrCondition
  | PartAttrMap
  | PartAttrLogical
  | PartText
)[]
export type SplitterResolved = { fn: SplitterFn; delim: string }
