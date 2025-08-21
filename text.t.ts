/**
 * Базовый тип для всех текстовых узлов.
 */
export type NodeText = {
  /** Тип узла */
  type: "text"
  /** Исходный текст */
  text: string
}
