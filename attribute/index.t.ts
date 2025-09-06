import type { SplitterFn } from "."
import type { ValueArray } from "./array.t"
import type { ValueBoolean } from "./boolean.t"
import type { ValueEvent } from "./event.t"
import type { ValueString } from "./string.t"
import type { ValueStyle } from "./style.t"

export type ValueType = "dynamic" | "static" | "mixed"

export type SplitterResolved = { fn: SplitterFn; delim: string }

/**
 * Статическое строковое значение.
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

export interface Attributes {
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: Record<string, ValueEvent>
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: Record<string, ValueBoolean>
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: Record<string, ValueArray[]>
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: Record<string, ValueString>
  /** Стили (CSS в виде строки или объекта) */
  style?: Record<string, ValueStyle>
}
