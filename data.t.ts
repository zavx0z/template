// Базовые типы для обогащенных узлов
export interface NodeDataElement {
  tag: string
  type: "el"
  child?: NodeData[]
}

export interface NodeDataText {
  type: "text"
  data?: string | string[] // Путь(и) к данным (если динамический)
  value?: string // Статическое значение (если статический)
  expr?: string // Выражение с индексами (если смешанный)
}

// Типы для обогащенных узлов
export interface NodeDataMap {
  type: "map"
  data: string // Путь к массиву данных
  child: NodeData[]
}

export interface NodeDataCondition {
  type: "cond"
  data: string[] // Массив путей к данным
  expr: string // Выражение с индексами
  true: NodeData
  false: NodeData
}

export type NodeData = NodeDataMap | NodeDataCondition | NodeDataText | NodeDataElement

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
  /** Контекст для вложенных операций */
  context?: DataParserContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}
