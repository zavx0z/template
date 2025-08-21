import type { NodeMap, NodeCondition } from "./hierarchy.t"
import type { NodeText } from "./text.t"

/**
 * Атрибут элемента с путем к данным.
 */
export type NodeDataAttribute = {
  /** Имя атрибута */
  name: string
  /** Путь к данным атрибута */
  data: string
  /** Тип пути */
  type: "absolute" | "relative" | "item"
  /** Исходный текст атрибута */
  text: string
}

/**
 * Текстовый модуль с путями к данным.
 */
export type NodeDataText = {
  /** Тип узла */
  type: "text"
  /** Путь к данным */
  data: string
  /** Тип пути */
  pathType: "absolute" | "relative" | "item"
  /** Исходный текст */
  text: string
  /** Статические части текста */
  staticParts?: string[]
  /** Динамические части с путями */
  dynamicParts?: Array<{
    path: string
    type: "absolute" | "relative" | "item"
    text: string
  }>
}

/**
 * Map-узел с расширенными данными.
 */
export type NodeDataMap = NodeMap & {
  /** Путь к коллекции данных */
  data: string | string[]
  /** Тип пути */
  pathType: "absolute" | "relative"
  /** Параметры map-функции */
  params?: string[]
  /** Дочерние элементы с путями к данным */
  child: (NodeDataElement | NodeDataText | NodeDataMap | NodeDataCondition)[]
}

/**
 * Condition-узел с расширенными данными.
 */
export type NodeDataCondition = NodeCondition & {
  /** Путь(и) к данным условия */
  data: string | string[]
  /** Тип пути */
  pathType: "absolute" | "relative"
  /** Выражение условия */
  expression?: string
  /** Дочерние элементы с путями к данным */
  true: NodeDataElement | NodeDataCondition
  false: NodeDataElement | NodeDataCondition
}

/**
 * Element-узел с расширенными данными.
 */
export type NodeDataElement = {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "el"
  /** Исходный текст тега */
  text: string
  /** Атрибуты с путями к данным */
  attributes?: NodeDataAttribute[]
  /** Дочерние элементы с путями к данным */
  child?: (NodeDataElement | NodeDataText | NodeDataMap | NodeDataCondition)[]
}

/**
 * Контекст для парсинга данных.
 */
export type DataParserContext = {
  /** Текущий путь к данным */
  currentPath?: string
  /** Стек путей */
  pathStack: string[]
  /** Параметры текущего map */
  mapParams?: string[]
  /** Уровень вложенности */
  level: number
}

/**
 * Результат парсинга данных.
 */
export type DataParseResult = {
  /** Извлеченный путь к данным (может быть массивом для условий) */
  path: string | string[]
  /** Тип пути */
  type: "absolute" | "relative" | "item"
  /** Контекст для вложенных операций */
  context?: DataParserContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}
