import type { ValueVariable, ValueDynamic, ValueUpdate } from "./index.t"

/**
 * Событийные атрибуты.
 * Содержит обработчики событий (onclick, onchange, onsubmit и т.д.)
 *
 * @group Значения атрибутов
 * @example Простая функция без параметров
 * ```html
 * <button onclick=${core.handleClick}>Кнопка</button>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "/core/handleClick"
 *   }
 * }
 * ```
 *
 * @example Функция с параметрами
 * ```html
 * <input onchange=${(e) => update({ value: e.target.value })} />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onchange": {
 *     "upd": "value",
 *     "expr": "(e) => update({ value: e.target.value })"
 *   }
 * }
 * ```
 *
 * @example Событие в массиве
 * ```html
 * <li onclick=${() => core.item.onClick()}>${core.item.name}</li>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "/core/item/onClick",
 *     "expr": "() => ${[0]}()"
 *   }
 * }
 * ```
 */
export type ValueEvent = ValueVariable | ValueDynamic | ValueUpdate
export type RawAttrEvent = Record<string, string>
