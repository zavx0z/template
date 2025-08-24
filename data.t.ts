// Базовые типы для обогащенных узлов
export interface NodeElement {
  tag: string
  type: "el"
  attr?: Record<string, { value: string } | { data: string | string[]; expr?: string }>
  child?: Node[]
}

export interface NodeText {
  type: "text"
  data?: string | string[] // Путь(и) к данным (если динамический)
  value?: string // Статическое значение (если статический)
  expr?: string // Выражение с индексами (если смешанный)
}

// Типы для обогащенных узлов
export interface NodeMap {
  type: "map"
  data: string // Путь к массиву данных
  child: Node[]
}

export interface NodeCondition {
  type: "cond"
  data: string | string[] // Путь(и) к данным
  expr?: string // Выражение с индексами (если несколько переменных)
  true: Node
  false: Node
}

export type Node = NodeMap | NodeCondition | NodeText | NodeElement

/**
 * Информация о контексте map.
 */
export type MapContext = {
  /** Путь map */
  path: string
  /** Параметры map */
  params: string[]
  /** Уровень map */
  level: number
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
  /** Стек всех map контекстов */
  mapContextStack?: MapContext[]
}

/**
 * Результат парсинга данных.
 */
export type DataParseResult = {
  /** Извлеченный путь к данным (может быть массивом для условий) */
  path: string | string[]
  /** Контекст для вложенных операций */
  context?: DataParserContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}
