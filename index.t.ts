// Входные данные
export type Content = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>
export type Core = Record<string, any>
export type State = string

export type Render<C extends Content = Content, I extends Core = Core, S extends State = State> = (args: {
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  core: I
  context: C
  state: State
  update: (context: Partial<C>) => void
}) => void

// Выходные данные
/**
 * Узел HTML элемента.
 * Представляет HTML тег с атрибутами и дочерними элементами.
 */
export interface NodeElement {
  /** Имя HTML тега */
  tag: string
  /** Тип узла - всегда "el" для элементов */
  type: "el"
  /** Атрибуты элемента с путями к данным или статическими значениями */
  attr?: Record<string, { value: string } | { data: string | string[]; expr?: string }>
  /** Дочерние узлы элемента */
  child?: Node[]
}
/**
 * Текстовый узел.
 * Представляет текст с путями к данным или статическими значениями.
 */

export interface NodeText {
  /** Тип узла - всегда "text" для текстовых узлов */
  type: "text"
  /** Путь(и) к данным (если текст динамический) */
  data?: string | string[]
  /** Статическое значение (если текст статический) */
  value?: string
  /** Выражение с индексами (если текст смешанный) */
  expr?: string
}
/**
 * Узел map операции.
 * Представляет итерацию по массиву данных с дочерними элементами.
 */

export interface NodeMap {
  /** Тип узла - всегда "map" для map операций */
  type: "map"
  /** Путь к массиву данных для итерации */
  data: string
  /** Дочерние узлы, которые будут повторены для каждого элемента массива */
  child: Node[]
}
/**
 * Узел условного оператора.
 * Представляет тернарный оператор с ветками true и false.
 */

export interface NodeCondition {
  /** Тип узла - всегда "cond" для условных операторов */
  type: "cond"
  /** Путь(и) к данным для условия */
  data: string | string[]
  /** Выражение с индексами (если условие сложное) */
  expr?: string
  /** Узел для случая когда условие истинно */
  true: Node
  /** Узел для случая когда условие ложно */
  false: Node
}

export type Node = NodeMap | NodeCondition | NodeText | NodeElement
