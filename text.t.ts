/** Статический текст */
type TextStatic = {
  type: "text"
  value: string
}

/** Динамический текст */
type TextDynamic = {
  type: "text"
  data: string | string[]
  expr?: string // Шаблон с подстановкой
}

/** Условие в тексте */
type TextCondition = {
  type: "text"
  cond: {
    data: string | string[]
    expr?: string
    true: string
    false: string
  }
}

/** Сложное выражение в тексте */
type TextComplex = {
  type: "text"
  data: string
  expr: string
}

export type NodeText = TextStatic | TextDynamic | TextCondition | TextComplex
