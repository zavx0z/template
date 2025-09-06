import type { SplitterFn } from "."

export type ValueType = "dynamic" | "static" | "mixed"

export type SplitterResolved = { fn: SplitterFn; delim: string }

/**
 * Статический элемент массива атрибутов.
 */
export type ValueStaticArray = {
  /** Статическое значение */
  value: string
}

/**
 * Статическое значение.
 */
export type ValueStatic = string

/**
 * Переменный атрибут с путем к данным.
 * Используется для простых динамических атрибутов.
 *
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
   * ---
   *
   * @example
   * ```typescript
   * data: "/core/settings/color"
   * ```
   */
  data: string
}

/**
 * Динамический атрибут с выражением.
 * Используется для сложных вычислений в атрибутах.
 *
 * @example
 * ```html
 * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель управления
 * </div>
 * ```
 */
export type ValueDynamic = {
  /**
   * Путь(и) к данным для выражения
   *
   * @example
   * ```typescript
   * data: "/context/value"
   * data: ["/context/value", "[item]/nested/variable"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr: string
}

/**
 * Атрибут с обновлением состояния.
 * Используется для атрибутов, которые могут изменять состояние приложения.
 *
 * @example
 * ```html
 * <input value=${context.email} onchange=${(e) => update({ email: e.target.value })} />
 * ```
 */
export type ValueUpdate = {
  /** Путь(и) к данным (опционально) */
  data?: string | string[]
  /** Выражение с индексами (опционально) */
  expr?: string
  /** Ключи для обновления в состоянии */
  upd: string | string[]
}

/**
 * Результат парсинга атрибута.
 * Содержит информацию о динамических атрибутах, извлеченную из template literals.
 *
 * @example Простой динамический атрибут
 * ```html
 * <div class=${context.theme}>Элемент</div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "/context/theme"
 * }
 * ```
 *
 * @example Сложное выражение в атрибуте
 * ```html
 * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["/core/role"],
 *   "expr": "${[0]} === 'admin' ? 'admin-panel' : 'user-panel'"
 * }
 * ```
 *
 * @example Атрибут с обновлением состояния
 * ```html
 * <input value=${context.email} onchange=${(e) => update({ email: e.target.value })} />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "/context/email",
 *   "upd": "email",
 *   "expr": "(e) => update({ email: e.target.value })"
 * }
 * ```
 *
 * @example Смешанный атрибут
 * ```html
 * <div class="container ${context.theme} ${context.isActive ? 'active' : ''}">
 *   Элемент
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["/context/theme", "/context/isActive"],
 *   "expr": "container ${[0]} ${[1] ? 'active' : ''}"
 * }
 * ```
 *
 * Структура:
 * - `data` - путь(и) к данным в контексте
 * - `expr` - выражение с индексами для сложных вычислений
 * - `upd` - ключи обновления контекста
 */
export type ParseAttributeResult = {
  /**
   * Путь(и) к данным
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/name"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/theme", "/core/role"]
   * ```
   */
  data?: string | string[]
  /**
   * Унифицированное выражение с индексами
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr?: string
  /**
   * Ключи обновления контекста
   *
   * @example Простой ключ
   * ```typescript
   * upd: "email"
   * ```
   *
   * ---
   *
   * @example Массив ключей
   * ```typescript
   * upd: ["user", "settings"]
   * ```
   */
  upd?: string | string[]
}
