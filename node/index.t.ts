import type { NodeMap } from "./map.t"
import type { NodeText } from "./text.t"
import type { NodeElement } from "./element.t"
import type { NodeCondition } from "./condition.t"
import type { NodeLogical } from "./logical.t"
import type { NodeMeta } from "./meta.t"
import type { ValueType } from "../attribute/index.t"
import type { PartAttrMap } from "./map.t"
import type { PartAttrLogical } from "./logical.t"
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrMeta } from "./meta.t"
import type { PartText } from "./text.t"
import type { PartAttrElement } from "./element.t"
import type { ValueArray } from "../attribute/array.t"
import type { ValueBoolean } from "../attribute/boolean.t"
import type { ValueEvent } from "../attribute/event.t"
import type { ValueString } from "../attribute/string.t"
import type { ValueStyle } from "../attribute/style.t"

/**
 * Объединенный тип всех возможных узлов парсера.
 * Представляет любую структуру, которая может быть получена в результате парсинга HTML-шаблона.
 *
 * @group Nodes
 * @example Структура с различными типами узлов
 * ```html
 * <div class="container">
 *   <h1>${context.title}</h1>
 *   ${context.isLoggedIn ?
 *     html`<span>Добро пожаловать!</span>` :
 *     html`<a href="/login">Войти</a>`
 *   }
 *   ${core.notifications.length > 0 && html`
 *     <ul>
 *       ${core.notifications.map(n => html`<li>${n.message}</li>`)}
 *     </ul>
 *   `}
 *   <meta-component core="config" context="userData">
 *     <p>Содержимое компонента</p>
 *   </meta-component>
 * </div>
 * ```
 *
 * Результат парсинга будет содержать:
 * - NodeElement для div, h1, span, a, ul, li, p
 * - NodeText для статического текста и динамических значений
 * - NodeCondition для тернарного оператора
 * - NodeLogical для логического оператора &&
 * - NodeMap для итерации по массиву
 * - NodeMeta для meta-component
 */

export type Node = NodeMap | NodeCondition | NodeLogical | NodeText | NodeElement | NodeMeta

export interface AttrNodeElement {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "meta" | "el"
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: Record<string, string>
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: Record<string, { type: "dynamic" | "static"; value: boolean | string }>
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: Record<string, { value: string; type: ValueType }[]>
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: Record<string, { type: ValueType; value: string }>
  /** Стили (CSS в виде строки или объекта) */
  style?: string
  /** Дочерние элементы (опционально) */
  child?: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical | PartText)[]
}
/**
 * Базовый интерфейс для узлов с атрибутами.
 * Содержит все возможные типы атрибутов для HTML элементов и мета-компонентов.
 *
 * @group Атрибуты элементов
 * @hidden
 * @example HTML элемент с различными атрибутами
 * ```html
 * <div
 *   class="container ${core.dynamicClass}"
 *   id="main"
 *   data-count=${core.items.length}
 *   style=${{
 *      color: core.text.color,
 *      backgroundColor: core.background.color,
 *   }}
 *   onclick=${(e) => core.handler(e)}
 *   hidden=${!context.isVisible}
 * >
 *   Содержимое
 * </div>
 * ```
 *
 * Типы атрибутов:
 * - `event` - события (onclick, onchange и т.д.)
 * - `boolean` - булевые атрибуты (hidden, disabled, checked)
 * - `array` - массивы атрибутов (class, rel)
 * - `string` - строковые атрибуты (id, title, alt)
 * - `style` - CSS стили
 */
export interface AttributesNode {
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
export type PartAttrs = (
  | PartAttrElement
  | PartAttrMeta
  | PartAttrCondition
  | PartAttrMap
  | PartAttrLogical
  | PartText
)[]
