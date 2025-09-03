export type PartHierarchy = PartElement | PartMeta | PartText | PartCondition | PartMap
export type PartsHierarchy = PartHierarchy[]

interface BaseElement {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "el" | "meta"
  /** Исходный текст тега */
  text: string
  /** Дочерние элементы */
  child?: PartsHierarchy
}
/**
 * Элемент.
 *
 * @description
 * Представляет HTML элемент в иерархии. div, span, p, etc.
 */
export interface PartElement extends BaseElement {
  type: "el"
}

/**
 * Meta-элемент.
 *
 * @description
 * Представляет web-component с тегом начинающимся с meta-* в иерархии элементов.
 */
export interface PartMeta extends BaseElement {
  type: "meta"
}

/**
 * Текстовый узел.
 *
 * @description
 * Представляет текстовое содержимое в иерархии элементов.
 */
export type PartText = {
  /** Тип узла */
  type: "text"
  /** Исходный текст */
  text: string
}

/**
 * Узел map-операции.
 *
 * @description
 * Представляет цикл по коллекции данных. Содержит исходный текст map-выражения
 * и дочерние элементы, которые будут повторены для каждого элемента коллекции.
 *
 * @example
 * ```typescript
 * const mapNode: PartMap = {
 *   type: "map",
 *   text: "core.list.map(({ title, nested }) => html`",
 *   child: [
 *     { tag: "div", type: "el", text: "<div>", child: [...] }
 *   ]
 * }
 * ```
 */
export type PartMap = {
  /** Тип узла */
  type: "map"
  /** Исходный текст map-выражения */
  text: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: PartsHierarchy
}

/**
 * Узел условия (тернарный оператор).
 *
 * @description
 * Содержит исходный текст условия и две ветки: для случая когда условие истинно и когда ложно.
 *
 * @example
 * ```typescript
 * const conditionNode: PartCondition = {
 *   type: "cond",
 *   text: "context.flag ?",
 *   true: { tag: "div", type: "el", text: "<div>", child: [...] },
 *   false: { tag: "span", type: "el", text: "<span>", child: [...] }
 * }
 * ```
 */
export type PartCondition = {
  /** Тип узла */
  type: "cond"
  /** Исходный текст условия */
  text: string
  /** Элемент, рендерящийся когда условие истинно */
  // true: PartHierarchy
  /** Элемент, рендерящийся когда условие ложно */
  // false: PartHierarchy
  /** Дочерние элементы */
  child: PartsHierarchy
}
