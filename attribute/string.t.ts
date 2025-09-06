import type { ValueType } from "./index.t"
import type { ValueStatic, ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Строковые атрибуты.
 * Обычные HTML атрибуты со строковыми значениями.
 *
 * @group Значения атрибутов
 * @example
 * ```html
 * <img src=${context.url} alt=${context.alt} title=${context.title} />
 * <a href="/user/${core.user.id}">Профиль пользователя</a>
 * ```
 */

export type ValueString = ValueStatic | ValueVariable | ValueDynamic
export type RawAttrString = Record<string, { type: ValueType; value: string }>
