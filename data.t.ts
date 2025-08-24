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

/**
 * Информация о контексте map.
 */
export type MapContext = {
  /** Путь map */
  path: string
  /** Параметры map */
  params: string[]
  /** Уровень map */
  level: number
}

/**
 * Контекст для парсинга данных.
 */
export type DataParserContext = {
  /** Текущий путь к данным */
  currentPath?: string
  /** Стек путей */
  pathStack: string[]
  /** Параметры текущего map */
  mapParams?: string[]
  /** Уровень вложенности */
  level: number
  /** Стек всех map контекстов */
  mapContextStack?: MapContext[]
}

/**
 * Результат парсинга данных.
 */
export type DataParseResult = {
  /** Извлеченный путь к данным (может быть массивом для условий) */
  path: string | string[]
  /** Контекст для вложенных операций */
  context?: DataParserContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}
