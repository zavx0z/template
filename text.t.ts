/** Статический текст */
type TextStatic = {
  type: "text"
  value: string
}

/** Динамический текст с одной переменной */
type TextDynamicSingle = {
  type: "text"
  src: "context" | "core" | "state"
  key?: string
  template?: string // Опциональный шаблон для смешанного текста
}

/** Текст значения контекста, вложенный в массив */
type TextNestedMapContextSingle = {
  type: "text"
  src: ["context", string]
}

/** Текст значения ядра, вложенный в массив */
type TextNestedMapCoreSingle = {
  type: "text"
  src: ["core", ...string[]]
  key?: string
}

/** Смешанный текст с шаблоном и несколькими переменными */
type TextMixedMulti = {
  type: "text"
  template: string
  items: Array<{ src: "context" | "core" | "state"; key?: string }>
}

export type NodeText =
  | TextStatic
  | TextDynamicSingle
  | TextNestedMapContextSingle
  | TextNestedMapCoreSingle
  | TextMixedMulti
