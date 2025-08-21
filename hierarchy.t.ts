import type { NodeText } from "./text.t"

/**
 * Узел map-операции с шаблоном элемента.
 *
 * @description
 * Представляет цикл по коллекции данных. Содержит информацию о источнике данных
 * (context или core), ключе коллекции и дочерних элементах, которые будут
 * повторены для каждого элемента коллекции.
 *
 * @property {string} type - Тип узла, всегда "map"
 * @property {"context" | "core" | ["core", ...string[]]} src - Источник данных для итерации
 * @property {string} key - Ключ коллекции в источнике данных
 * @property {string} [index] - Переменная индекса (если используется)
 * @property {(NodeElement | NodeText)[]} child - Дочерние элементы, повторяемые для каждого элемента коллекции
 *
 * @example
 * ```typescript
 * const mapNode: NodeMap = {
 *   type: "map",
 *   src: "context",
 *   key: "users",
 *   child: [
 *     { tag: "div", type: "el", child: [...] }
 *   ]
 * }
 *
 * const mapWithIndexNode: NodeMap = {
 *   type: "map",
 *   src: "context",
 *   key: "users",
 *   index: "i",
 *   child: [
 *     { tag: "div", type: "el", child: [...] }
 *   ]
 * }
 *
 * const nestedMapNode: NodeMap = {
 *   type: "map",
 *   src: ["core", "users"],
 *   key: "posts",
 *   child: [
 *     { tag: "div", type: "el", child: [...] }
 *   ]
 * }
 * ```
 */
export type NodeMap = {
  /** Тип узла */
  type: "map"
  /** Путь к коллекции данных */
  data: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: (NodeElement | NodeText)[]
}

/**
 * Узел условия (тернарный оператор) с ветками true/false.
 *
 * @description
 * Представляет условный рендеринг на основе значения из context или core.
 * Содержит две ветки: для случая когда условие истинно и когда ложно.
 *
 * @property {string} type - Тип узла, всегда "cond"
 * @property {"context" | "core"} src - Источник данных для проверки условия
 * @property {string} key - Ключ значения в источнике данных
 * @property {NodeElement} true - Элемент, рендерящийся когда условие истинно
 * @property {NodeElement} false - Элемент, рендерящийся когда условие ложно
 *
 * @example
 * ```typescript
 * const conditionNode: NodeCondition = {
 *   type: "cond",
 *   src: "context",
 *   key: "isVisible",
 *   true: { tag: "div", type: "el", child: [...] },
 *   false: { tag: "span", type: "el", child: [...] }
 * }
 * ```
 */
export type NodeCondition = {
  /** Тип узла */
  type: "cond"
  /** Путь(и) к данным для проверки */
  data: string | string[]
  /** Выражение для вычисления (опционально) */
  expr?: string
  /** Элемент, рендерящийся когда условие истинно */
  true: NodeElement
  /** Элемент, рендерящийся когда условие ложно */
  false: NodeElement
}

/**
 * Узел иерархии элементов, соответствующий открытому тегу.
 *
 * @description
 * Представляет HTML элемент в иерархии. Может содержать дочерние элементы,
 * включая другие элементы, условия, map-операции и текстовые узлы.
 *
 * @property {string} tag - Имя HTML тега (например, "div", "span", "p")
 * @property {string} type - Тип узла, всегда "el"
 * @property {(NodeElement | NodeCondition | NodeMap | NodeText)[]} [child] - Дочерние элементы (опционально)
 *
 * @example
 * ```typescript
 * const elementNode: NodeElement = {
 *   tag: "div",
 *   type: "el",
 *   child: [
 *     { type: "text", value: "Hello", index: 10, length: 5 },
 *     { tag: "span", type: "el", child: [...] }
 *   ]
 * }
 * ```
 */
export type NodeElement = {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "el"
  /** Дочерние элементы (опционально) */
  child?: (NodeElement | NodeCondition | NodeMap | NodeText)[]
}

/**
 * Корневая иерархия элементов для переданного HTML.
 *
 * @description
 * Массив узлов верхнего уровня, представляющий полную структуру HTML документа.
 * Может содержать элементы, условия, map-операции и текстовые узлы.
 *
 * @example
 * ```typescript
 * const hierarchy: ElementsHierarchy = [
 *   { tag: "div", type: "el", child: [...] },
 *   { type: "cond", src: "context", key: "showHeader", true: {...}, false: {...} },
 *   { type: "map", src: "core", key: "items", child: [...] }
 * ]
 * ```
 */
export type NodeHierarchy = (NodeElement | NodeCondition | NodeMap | NodeText)[]

/**
 * Информация о найденном map-паттерне.
 *
 * @description
 * Результат поиска map-операции в тексте между HTML тегами.
 *
 * @property {"context" | "core" | ["core", ...string[]]} src - Источник данных
 * @property {string} key - Ключ коллекции
 * @property {string} [index] - Переменная индекса (если используется)
 *
 * @example
 * ```typescript
 * const mapInfo: MapPatternInfo = {
 *   src: "context",
 *   key: "users"
 * }
 *
 * const mapWithIndexInfo: MapPatternInfo = {
 *   src: "context",
 *   key: "users",
 *   index: "i"
 * }
 *
 * const nestedMapInfo: MapPatternInfo = {
 *   src: ["core", "users"],
 *   key: "posts"
 * }
 * ```
 */
export type MapPatternInfo = {
  /** Путь к коллекции данных */
  data: string
}

/**
 * Информация о найденном условном паттерне.
 *
 * @description
 * Результат поиска тернарного оператора в тексте между HTML тегами.
 *
 * @property {"context" | "core"} src - Источник данных
 * @property {string} key - Ключ значения
 *
 * @example
 * ```typescript
 * const condInfo: ConditionPatternInfo = {
 *   src: "context",
 *   key: "isVisible"
 * }
 * ```
 */
export type ConditionPatternInfo = {
  /** Путь(и) к данным */
  data: string | string[]
  /** Выражение для вычисления (опционально) */
  expr?: string
}

/**
 * Элемент стека для отслеживания открытых тегов.
 *
 * @description
 * Используется внутренне для построения иерархии элементов.
 *
 * @property {ElementToken} tag - Токен открывающего тега
 * @property {NodeElement} element - Соответствующий элемент иерархии
 */
export type StackItem = {
  /** Токен открывающего тега */
  tag: import("./splitter").ElementToken
  /** Соответствующий элемент иерархии */
  element: NodeElement
}

/**
 * Информация о map-операции в стеке.
 *
 * @description
 * Используется для отслеживания map-операций во время построения иерархии.
 *
 * @property {number} startIndex - Индекс начала map-операции
 * @property {MapPatternInfo} mapInfo - Информация о map-паттерне
 */
export type MapStackItem = {
  /** Индекс начала map-операции */
  startIndex: number
  /** Информация о map-паттерне */
  mapInfo: MapPatternInfo
}

/**
 * Информация об условии в стеке.
 *
 * @description
 * Используется для отслеживания условных операторов во время построения иерархии.
 *
 * @property {number} startIndex - Индекс начала условия
 * @property {ConditionPatternInfo} conditionInfo - Информация об условном паттерне
 */
export type ConditionStackItem = {
  /** Индекс начала условия */
  startIndex: number
  /** Информация об условном паттерне */
  conditionInfo: ConditionPatternInfo
}
