import { createNode } from "./node"
import type { Node } from "./node/index.t"
import type { Params, Context, Core, State } from "./index.t"
import { extractHtmlElements } from "./parser"

export type { Node }

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
 * @param template - Template-функция вида ({ html, context, core, state }) => html`...`
 * @returns Обогащенная иерархия с метаданными о путях к данным
 */
export const parse = <C extends Context = Context, I extends Core = Core, S extends State = State>(
  template: (params: Params<C, I, S>) => void
): Node[] => {
  const mainHtml = extractMainHtmlBlock(template)
  const hierarchy = extractHtmlElements(mainHtml)
  const context = { pathStack: [], level: 0 }
  return hierarchy.map((node) => createNode(node, context))
}

const extractMainHtmlBlock = (template: (params: Params<any, any, any>) => void): string => {
  const src = Function.prototype.toString.call(template)
  const firstIndex = src.indexOf("html`")
  if (firstIndex === -1) throw new Error("функция template не содержит html`")
  const lastBacktick = src.lastIndexOf("`")
  if (lastBacktick === -1 || lastBacktick <= firstIndex) throw new Error("template function does not contain html`")
  const htmlContent = src.slice(firstIndex + 5, lastBacktick)
  return htmlContent.replace(/!0/g, "true").replace(/!1/g, "false")
}
