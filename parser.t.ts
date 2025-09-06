import type { TokenCondClose, TokenCondElse, TokenCondOpen } from "./node/condition.t"
import type { TokenLogicalOpen } from "./node/logical.t"
import type { TokenMapOpen, TokenMapClose, ParseMapContext } from "./node/map.t"
import type { TokenText } from "./node/text.t"

export type StreamToken =
  | TokenText
  | TokenCondOpen
  | TokenCondElse
  | TokenCondClose
  | TokenMapOpen
  | TokenMapClose
  | TokenLogicalOpen
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
