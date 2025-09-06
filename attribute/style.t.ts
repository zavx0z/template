import type { ValueStatic, ValueVariable, ValueDynamic } from "./index.t"

/**
 * Объект стилей.
 * CSS стили в виде JavaScript объекта (styled-components подход).
 *
 * @group Атрибуты элементов
 * @example Простой объект стилей
 * ```html
 * <div style=${{backgroundColor: "red", color: "white"}}>
 *   Стилизованный элемент
 * </div>
 * ```
 *
 * @example Динамические стили
 * ```html
 * <div style=${{backgroundColor: core.theme.primary, color: core.theme.text}}>
 *   Элемент с темой
 * </div>
 * ```
 *
 * @example Условные стили
 * ```html
 * <div style=${{backgroundColor: context.isActive ? "green" : "red", color: "white"}}>
 *   Условный стиль
 * </div>
 * ```
 */

export type ValueStyle = ValueStatic | ValueVariable | ValueDynamic
