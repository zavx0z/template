import type { PartAttrCondition } from "./condition.t"
import type { PartAttrElement } from "./element.t"
import type { Node } from "./index.t"
import type { PartAttrLogical } from "./logical.t"
import type { PartAttrMeta } from "./meta.t"
import type { PartText } from "./text.t"

/**
 * Узел map операции.
 * Представляет итерацию по массиву данных с дочерними элементами.
 *
 * @group Nodes
 * @example Простая итерация
 * ```html
 * <ul>
 *   ${core.users.map(user => html`<li>${user}</li>`)}
 * </ul>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "ul",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/users",
 *       "child": [
 *         {
 *           "tag": "li",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "[item]/name"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Итерация с деструктуризацией
 * ```html
 * <div>
 *   ${core.posts.map(({title, content}) => html`
 *     <article>
 *       <h2>${title}</h2>
 *       <p>${content}</p>
 *     </article>
 *   `)}
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
 *       "type": "map",
 *       "data": "/core/posts",
 *       "child": [
 *         {
 *           "tag": "article",
 *           "type": "el",
 *           "child": [
 *             {
 *               "tag": "h2",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/title"
 *                 }
 *               ]
 *             },
 *             {
 *               "tag": "p",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/content"
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
 * @example Итерация с индексом
 * ```html
 * <ul>
 *   ${core.items.map((item, index) => html`
 *     <li class=${index % 2 === 0 ? 'even' : 'odd'}>
 *       ${index + 1}. ${item.name}
 *     </li>
 *   `)}
 * </ul>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "ul",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/items",
 *       "child": [
 *         {
 *           "tag": "li",
 *           "type": "el",
 *           "string": {
 *             "class": {
 *               "data": ["index", "item.name"],
 *               "expr": "${[0]} % 2 === 0 ? 'even' : 'odd'"
 *             }
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": ["index", "item.name"],
 *               "expr": "${[0] + 1}. ${[1]}"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Вложенная итерация
 * ```html
 * <div>
 *   ${core.categories.map(category => html`
 *     <section>
 *       <h1>${category.name}</h1>
 *       ${category.products.map(product => html`
 *         <div>${product.name}</div>
 *       `)}
 *     </section>
 *   `)}
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
 *       "type": "map",
 *       "data": "/core/categories",
 *       "child": [
 *         {
 *           "tag": "section",
 *           "type": "el",
 *           "child": [
 *             {
 *               "tag": "h1",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/name"
 *                 }
 *               ]
 *             },
 *             {
 *               "type": "map",
 *               "data": "[item]/products",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/name"
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
 * Структура узла:
 * - `type` - всегда "map" для map операций
 * - `data` - путь к массиву данных для итерации
 * - `child` - дочерние узлы, которые будут повторены для каждого элемента массива
 */

export interface NodeMap {
  /**
   * Тип узла - всегда "map" для map операций
   *
   * @example
   * ```typescript
   * type: "map"
   * ```
   */
  type: "map"
  /**
   * Путь к массиву данных для итерации
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/users"
   * ```
   *
   * @example Вложенный путь
   * ```typescript
   * data: "/core/products"
   * ```
   */
  data: string
  /**
   * Дочерние узлы, которые будут повторены для каждого элемента массива
   *
   * @example
   * ```typescript
   * child: [
   *   {
   *     tag: "li",
   *     type: "el",
   *     child: [
   *       { type: "text", data: "[item]/name" }
   *     ]
   *   }
   * ]
   * ```
   */
  child: Node[]
}
/**
 * Информация о контексте map.
 */
export type ParseMapContext = {
  /** Путь map */
  path: string
  /** Параметры map */
  params: string[]
  /** Является ли это деструктуризацией */
  isDestructured: boolean
  /** Уровень map */
  level: number
}
export type TokenMapClose = { kind: "map-close" }
export type TokenMapOpen = { kind: "map-open"; sig: string }
export type PartAttrMap = {
  /** Тип узла */
  type: "map"
  /** Исходный текст map-выражения */
  text: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: (PartAttrElement | PartText | PartAttrMap | PartAttrMeta | PartAttrCondition | PartAttrLogical)[]
}
