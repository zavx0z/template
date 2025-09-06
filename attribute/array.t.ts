import type { ValueType } from "./index.t"
import type { ValueStaticArray, ValueVariable, ValueDynamic } from "./index.t"

/**
 * Массивы атрибутов.
 * Используется для атрибутов, которые могут содержать несколько значений (class, rel).
 *
 * @group Атрибуты элементов
 * @example
 * ```html
 * <div class="container ${context.theme} ${context.isActive ? 'active' : ''}">
 *   Элемент с несколькими классами
 * </div>
 * ```
 */

export type ValueArray = ValueStaticArray | ValueVariable | ValueDynamic
export type RawAttrArray = Record<string, { type: ValueType; value: string }[]>
