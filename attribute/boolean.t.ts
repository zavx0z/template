import type { ValueVariable, ValueDynamic } from "./index.t"

/**
 * Булевые атрибуты.
 * HTML атрибуты, которые присутствуют или отсутствуют (hidden, disabled, checked).
 *
 * @group Значения атрибутов
 * @example
 * ```html
 * <input type="checkbox" ${core.user.isSubscribed && "checked"} />
 * <button ${!context.canSubmit && "disabled"}>Отправить</button>
 * <div ${!context.isVisible && "hidden"}>Скрытый контент</div>
 * ```
 */

export type ValueBoolean = boolean | ValueVariable | ValueDynamic
export type RawAttrBoolean = Record<string, { type: "dynamic" | "static"; value: boolean | string }>
