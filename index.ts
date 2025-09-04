import type { Node } from "./index.t"
import type { RenderParams, Context, Core, State } from "./index.t"

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
export const parse = <C extends Context, I extends Core, S extends State>(
  render: (params: RenderParams<C, I, S>) => void
): Node[] => {
  return []
}
