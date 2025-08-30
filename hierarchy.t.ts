import type { ElementToken } from "./splitter"

export type PartHierarchy = PartElement | PartMeta | PartText | PartCondition | PartMap
export type PartsHierarchy = PartHierarchy[]

/**
 * Элемент.
 *
 * @description
 * Представляет HTML элемент в иерархии. div, span, p, etc.
 */
export type PartElement = {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "el"
  /** Исходный текст тега */
  text: string
  /** Дочерние элементы */
  child?: PartsHierarchy
}

/**
 * Meta-элемент.
 *
 * @description
 * Представляет web-component с тегом начинающимся с meta-* в иерархии элементов.
 */
export type PartMeta = {
  /** Тег web-component. Всегда начинается с meta-* */
  tag: string
  /** Тип узла */
  type: "meta"
  /** Исходный текст тега */
  text: string
  /** Дочерние элементы */
  child?: PartsHierarchy
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
  true: PartHierarchy
  /** Элемент, рендерящийся когда условие ложно */
  false: PartHierarchy
}

// ---------------- STACK ----------------
/**
 * Элемент стека для отслеживания открытых тегов.
 *
 * @description
 * Используется внутренне для построения иерархии элементов.
 *
 * @property tag - Токен открывающего тега
 * @property element - Соответствующий элемент иерархии
 */
export type StackItem = {
  /** Токен открывающего тега */
  tag: ElementToken
  /** Соответствующий элемент иерархии */
  element: PartElement | PartMeta
}

/**
 * Информация о map-операции в стеке.
 *
 * @description
 * Используется для отслеживания map-операций во время построения иерархии.
 *
 * @property startElement - Элемент начала map-операции
 * @property endElement - Элемент конца map-операции
 * @property text - Исходный текст map-выражения
 */
export type MapStackItem = {
  /** Элемент начала map-операции */
  startElement: ElementToken
  /** Элемент конца map-операции */
  endElement: ElementToken
  /** Исходный текст map-выражения */
  text: string
}

/**
 * Информация об условии в стеке.
 *
 * @description
 * Используется для отслеживания условных операторов во время построения иерархии.
 *
 * @property startElement - Элемент начала условия
 * @property endElement - Элемент конца условия
 * @property text - Исходный текст условия
 */
export type ConditionStackItem = {
  /** Элемент начала условия */
  startElement: ElementToken
  /** Элемент конца условия */
  endElement: ElementToken
  /** Исходный текст условия */
  text: string
}
