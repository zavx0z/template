/**
 * Часть текста (статическая или динамическая).
 */

export type ParseTextPart = {
  /** Тип части: "static" для статического текста, "dynamic" для динамического */
  type: "static" | "dynamic"
  /** Содержимое части */
  text: string
}
export type TokenText = { kind: "text"; text: string }

/**
 * Текстовый узел.
 * Представляет текст с путями к данным или статическими значениями.
 *
 * @group Nodes
 * @example Статический текст
 * ```html
 * <p>Это статический текст</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "value": "Это статический текст"
 * }
 * ```
 *
 * @example Динамический текст
 * ```html
 * <p>Привет, ${context.name}!</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": "/context/name",
 *   "expr": "Привет, ${[0]}!"
 * }
 * ```
 *
 * @example Смешанный текст
 * ```html
 * <p>Пользователь ${context.name} имеет ${core.postCount} постов</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": ["/context/name", "/core/postCount"],
 *   "expr": "Пользователь ${[0]} имеет ${[1]} постов"
 * }
 * ```
 *
 * @example Логические операции
 * ```html
 * <div>Пользователь: ${context.isActive && context.name || 'Гость'}</div>
 * <span>Статус: ${context.isAdmin ? 'Администратор' : 'Пользователь'}</span>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["/context/isActive", "/context/name"],
 *     "expr": "Пользователь: ${[0]} && ${[1]} || 'Гость'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["/context/isAdmin"],
 *     "expr": "Статус: ${[0]} ? 'Администратор' : 'Пользователь'"
 *   }
 * ]
 * ```
 *
 * @example Тернарные операторы
 * ```html
 * <p>${context.age >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'}</p>
 * <div>${context.inStock ? `В наличии: ${core.quantity}` : 'Нет в наличии'}</div>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["/context/age"],
 *     "expr": "${[0]} >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["/context/inStock", "/core/quantity"],
 *     "expr": "${[0]} ? `В наличии: ${[1]}` : 'Нет в наличии'"
 *   }
 * ]
 * ```
 *
 * Структура узла:
 * - `type` - всегда "text" для текстовых узлов
 * - `value` - статическое значение (если текст статический)
 * - `data` - путь(и) к данным (если текст динамический)
 * - `expr` - выражение с индексами (если текст смешанный)
 */

export interface NodeText {
  /** Тип узла - всегда "text" для текстовых узлов */
  type: "text"
  /**
   * Путь(и) к данным (если текст динамический)
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/name"
   * ```
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/name", "/context/age"]
   * ```
   */
  data?: string | string[]
  /**
   * Статическое значение (если текст статический)
   *
   * @example
   * ```typescript
   * value: "Привет, мир!"
   * ```
   */
  value?: string
  /**
   * Выражение с индексами (если текст смешанный)
   *
   * @example
   * ```typescript
   * expr: "Привет ${[0]}, у тебя ${[1]} сообщений"
   * ```
   */
  expr?: string
}
export type PartText = {
  /** Тип узла */
  type: "text"
  /** Исходный текст */
  text: string
}
