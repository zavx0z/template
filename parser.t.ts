import type { ParseMapContext } from "./node/map.t"

/**
 * Контекст для парсинга данных.
 */

export type ParseContext = {
  /** Текущий путь к данным */
  currentPath?: string
  /** Стек путей */
  pathStack: string[]
  /** Параметры текущего map */
  mapParams?: string[]
  /** Уровень вложенности */
  level: number
  /** Стек всех map контекстов */
  mapContextStack?: ParseMapContext[]
}
/**
 * Результат парсинга данных.
 */

export type ParseResult = {
  /** Извлеченный путь к данным (может быть массивом для условий) */
  path: string | string[]
  /** Контекст для вложенных операций */
  context?: ParseContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}
