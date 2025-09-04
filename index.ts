import { createNodeDataElement } from "./data"
import type { Node } from "./index.t"
import type { RenderParams, Context, Core, State } from "./index.t"
import { extractHtmlElements, extractMainHtmlBlock } from "./parser"

/**
 * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
 * Поддерживает все возможности парсера:
 * - HTML элементы с атрибутами
 * - Template literals с переменными ${...}
 * - Map операции для итерации по коллекциям
 * - Условные операторы (тернарные)
 * - Вложенные структуры любой сложности
 * - События и динамические атрибуты
 * - Web Components
 *
 * @param render - Render-функция вида ({ html, context, core, state }) => html`...`
 * @returns Обогащенная иерархия с метаданными о путях к данным
 */
export const parse = <C extends Context = Context, I extends Core = Core, S extends State = State>(
  render: (params: RenderParams<C, I, S>) => void
): Node[] => {
  const mainHtml = extractMainHtmlBlock(render)
  const hierarchy = extractHtmlElements(mainHtml)
  const context = { pathStack: [], level: 0 }
  return hierarchy.map((node) => createNodeDataElement(node, context))
}
export type { Node }
