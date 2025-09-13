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
 * ## Структура узла
 * - `type` - всегда "text" для текстовых узлов
 * - `value` - статическое значение (если текст статический)
 * - `data` - путь(и) к данным (если текст динамический)
 * - `expr` - выражение с индексами (если текст смешанный)
 *
 * ## Примеры
 *
 * ### Статический
 * {@includeCode ./text.spec.ts#static}
 * {@includeCode ./text.spec.ts#expectStatic}
 *
 * ### Динамический
 * {@includeCode ./text.spec.ts#dynamic}
 * {@includeCode ./text.spec.ts#expectDynamic}
 *
 * ### Смешанный
 * {@includeCode ./text.spec.ts#mixed}
 * {@includeCode ./text.spec.ts#expectMixed}
 *
 * ### Логический
 * {@includeCode ./text.spec.ts#logical}
 * {@includeCode ./text.spec.ts#expectLogical}
 *
 * ### Логический литерал
 * {@includeCode ./text.spec.ts#logicalLiteral}
 * {@includeCode ./text.spec.ts#expectLogicalLiteral}
 *
 * ### Тернарный
 * {@includeCode ./text.spec.ts#ternary}
 * {@includeCode ./text.spec.ts#expectTernary}
 *
 * ### Тернарный литерал
 * {@includeCode ./text.spec.ts#ternaryLiteral}
 * {@includeCode ./text.spec.ts#expectTernaryLiteral}
 *
 * @group Nodes
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
