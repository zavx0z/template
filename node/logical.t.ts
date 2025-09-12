import type { PartAttrMap } from "./map.t"
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrElement } from "./element.t"
import type { Node } from "./index.t"
import type { PartAttrMeta } from "./meta.t"

/**
 * Узел логического оператора.
 * Представляет логический оператор && с условным отображением.
 *
 * @group Nodes
 * @example Простое логическое условие
 * ```html
 * <div>
 *   ${context.isAdmin && html`<button>Админ-панель</button>`}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/context/isAdmin",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Админ-панель"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Логическое условие с проверкой массива
 * ```html
 * <div>
 *   ${core.notifications.length > 0 && html`
 *     <div class="notifications">
 *       ${core.notifications.map(n => html`<div>${n.message}</div>`)}
 *     </div>
 *   `}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/core/notifications.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "div",
 *           "type": "el",
 *           "string": {
 *             "class": "notifications"
 *           },
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/core/notifications",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/message"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * ### Сложное логическое условие
 *
 * {@includeCode ./logical.spec.ts#parse}
 * {@includeCode ./logical.spec.ts#expect}
 *
 * Структура узла:
 * - `type` - всегда "log" для логических операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - дочерние узлы, которые отображаются только если условие истинно
 */

export interface NodeLogical {
  /** Тип узла - всегда "log" для логических операторов */
  type: "log"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/isAdmin"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/notifications", "/context/count"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.includes('delete')"
   * ```
   */
  expr?: string
  /** Дочерние узлы, которые отображаются только если условие истинно */
  child: Node[]
}
export type TokenLogicalOpen = { kind: "log-open"; expr: string }
export type PartAttrLogical = {
  /** Тип узла */
  type: "log"
  /** Исходный текст логического выражения */
  text: string
  /** Дочерние элементы, которые отображаются только если условие истинно */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical)[]
}
