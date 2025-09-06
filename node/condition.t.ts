import type { PartAttrMap } from "./map.t"
import type { PartAttrElement } from "./element.t"
import type { Node } from "./index.t"
import type { PartAttrMeta } from "./meta.t"

/**
 * Узел условного оператора.
 * Представляет тернарный оператор с ветками true и false.
 *
 * @group Nodes
 * @example Простое условие
 * ```html
 * <div>
 *   ${context.isLoggedIn ? html`<span>Добро пожаловать, ${context.name}!</span>` : html`<a href="/login">Войти</a>`}
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
 *       "type": "cond",
 *       "data": "/context/isLoggedIn",
 *       "child": [
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "/context/name",
 *               "expr": "Добро пожаловать, ${[0]}!"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "a",
 *           "type": "el",
 *           "string": {
 *             "href": "/login"
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Войти"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Сложное условие
 * ```html
 * <div>
 *   ${core.role === 'admin' && core.permissions.includes('write') ?
 *     html`<button>Редактировать</button>` :
 *     html`<span>Нет прав</span>`
 *   }
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
 *       "type": "cond",
 *       "data": ["user.role", "user.permissions"],
 *       "expr": "${[0]} === 'admin' && ${[1]}.includes('write')",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Редактировать"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Нет прав"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Условие с проверкой массива
 * ```html
 * <div>
 *   ${core.posts.length > 0 ?
 *     html`<ul>${core.posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
 *     html`<p>Постов пока нет</p>`
 *   }
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
 *       "type": "cond",
 *       "data": "/core/posts.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "ul",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/core/posts",
 *               "child": [
 *                 {
 *                   "tag": "li",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/title"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "p",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Постов пока нет"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "cond" для условных операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - массив из двух элементов: [true-ветка, false-ветка]
 */
export interface NodeCondition {
  /** Тип узла - всегда "cond" для условных операторов */
  type: "cond"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/isLoggedIn"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/isAdmin", "/core/role"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.length > 0"
   * ```
   */
  expr?: string
  /** Узлы для случая когда условие истинно и ложно
   * - true: первый элемент массива (child[0])
   * - false: второй элемент массива (child[1])
   */
  child: Node[]
}
export type TokenCondClose = { kind: "cond-close" }
export type TokenCondElse = { kind: "cond-else" }
export type TokenCondOpen = { kind: "cond-open"; expr: string }
export type PartAttrCondition = {
  /** Тип узла */
  type: "cond"
  /** Исходный текст условия */
  text: string
  /** Элементы, условия
   * - true: первый элемент массива
   * - false: второй элемент массива
   */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap)[]
}
