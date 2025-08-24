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
