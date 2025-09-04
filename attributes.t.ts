import type {SplitterFn} from "./attributes"

export type ValueType = "dynamic" | "static" | "mixed"

export type AttributeEvent = Record<string, string>

export type AttributeArray = Record<string, { value: string; type: ValueType }[]>

export type AttributeString = Record<string, { type: ValueType; value: string }>

export type AttributeBoolean = Record<string, { type: "dynamic" | "static"; value: boolean | string }>

export type PartText = {
  /** Тип узла */
  type: "text"
  /** Исходный текст */
  text: string
}

export type PartAttrElement = {
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
  /** Стили */
  style?: string
  /** Дочерние элементы (опционально) */
  child?: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartText)[]
}

export type PartAttrMeta = {
  /** Имя мета-тега */
  tag: string
  /** Тип узла */
  type: "meta"
  /** События */
  event?: AttributeEvent
  /** Булевые аттрибуты */
  boolean?: AttributeBoolean
  /** Массивы аттрибутов */
  array?: AttributeArray
  /** Строковые аттрибуты */
  string?: AttributeString
  /** Стили */
  style?: string
  /** Core объекты */
  core?: string
  /** Context объекты */
  context?: string
  /** Дочерние элементы (опционально) */
  child?: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartText)[]
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
export type PartAttrMap = {
  /** Тип узла */
  type: "map"
  /** Исходный текст map-выражения */
  text: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: (PartAttrElement | PartText | PartAttrMap | PartAttrMeta | PartAttrCondition)[]
}
export type PartAttrs = (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartText)[]
export type SplitterResolved = { fn: SplitterFn; delim: string }

