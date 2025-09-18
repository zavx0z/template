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

/**
 * Статическое строковое значение.
 * @group Варианты значений
 */
export type ValueStatic = string

/**
 * Переменный атрибут с путем к данным.
 * Используется для простых динамических атрибутов.
 *
 * @group Варианты значений
 * @example
 * ```html
 * <div class=${context.theme}>Тема пользователя</div>
 * ```
 */
export type ValueVariable = {
  /**
   * Путь к данным в контексте
   * @example
   * ```typescript
   * data: "/context/theme"
   * ```
   *
   * Путь к данным в ядре
   * @example
   * ```typescript
   * data: "/core/theme"
   * ```
   *
   * Путь к данным инстанса map
   * @example
   * ```typescript
   * data: "[item]/theme"
   * ```
   *
   * Путь к данным родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[item]/theme"
   * ```
   *
   * Путь к индексу map
   * @example
   * ```typescript
   * data: "[index]"
   * ```
   *
   * Путь к индексу родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[index]"
   * ```
   */
  data: string
}

/**
 * Динамический атрибут с выражением и путем к данным.
 * Используется для сложных вычислений в атрибутах.
 *
 * @group Варианты значений
 * @example
 * ```html
 * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель управления
 * </div>
 * ```
 */
export type ValueDynamic = {
  /**
   * Путь к данным в контексте
   * @example
   * ```typescript
   * data: "/context/theme"
   * ```
   * 
   * Путь к данным в ядре
   * @example
   * ```typescript
   * data: "/core/theme"
   * ```
   *
   * Путь к данным инстанса map
   * @example
   * ```typescript
   * data: "[item]/theme"
   * ```
   *
   * Путь к данным родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[item]/theme"
   * ```
   *
   * Путь к индексу map
   * @example
   * ```typescript
   * data: "[index]"
   * ```
   *
   * Путь к индексу родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[index]"
   * ```
   *
   * Пути к данным
   * @example
   * ```typescript
   * data: ["/context/theme", "[item]/theme", "../[item]/theme", "[index]/theme", "../[index]/theme"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с переменными в data (по индексу массива)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr: string
}
