import type { ValueStatic, ValueDynamic, ValueVariable } from "../parser.t"
import type { AttrNodeElement } from "./index.t"
import type { Attributes } from "../attribute/index.t"
import type { Node } from "./index.t"

/**
 * Мета-узел в AST.
 *
 * Представляет meta-элемент.
 * Поддерживает создание компонентов с динамическими именами тегов.
 *
 * @group Nodes
 * @example Статический мета-тег
 * ```html
 * <meta-component class="custom">
 *   <p>Содержимое компонента</p>
 * </meta-component>
 * ```
 *
 * @example Динамический мета-тег
 * ```html
 * <meta-${core.actorHash} class="dynamic">
 *   <p>Динамический компонент</p>
 * </meta-${core.actorHash}>
 * ```
 *
 * @example Мета-элемент с core и context
 * ```html
 * <meta-widget core=${core.widgetConfig} context=${core.userData}>
 *   <div>Виджет с конфигурацией</div>
 * </meta-widget>
 * ```
 *
 * Структура узла:
 * - `type` - всегда "meta" для мета-узлов
 * - `tag` - имя мета-тега (статическое или динамическое)
 * - `child` - дочерние элементы (опционально)
 * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
 * - Свойства: `core`, `context`
 */

export interface NodeMeta extends Attributes {
  /** Имя мета-тега (может быть статическим или динамическим) */
  tag: ValueStatic | ValueDynamic | ValueVariable
  /** Тип узла - всегда "meta" для мета-узлов */
  type: "meta"
  /** Дочерние элементы (опционально) */
  child?: Node[]
  /** Core свойство для meta-компонентов (передача core объекта) */
  core?: ValueStatic | ValueDynamic | ValueVariable
  /** Context свойство для meta-компонентов (передача context объекта) */
  context?: ValueStatic | ValueDynamic | ValueVariable
}
export interface PartAttrMeta extends AttrNodeElement {
  /** Тип узла */
  type: "meta"
  /** Core объекты */
  core?: string
  /** Context объекты */
  context?: string
}
