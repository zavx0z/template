import type { Node } from "./node/index.t"
export type { Node }
export type { NodeMeta } from "./node/meta.t"
export type { NodeCondition } from "./node/condition.t"
export type { NodeLogical } from "./node/logical.t"
export type { NodeMap } from "./node/map.t"
export type { NodeText } from "./node/text.t"
export type { NodeElement } from "./node/element.t"

export type { ValueArray } from "./attribute/array.t"
export type { ValueBoolean } from "./attribute/boolean.t"
export type { ValueString } from "./attribute/string.t"
export type { ValueEvent } from "./attribute/event.t"
export type { ValueStyle } from "./attribute/style.t"
export type { ValueStatic, ValueVariable, ValueDynamic } from "./parser.t"

/**
 * Контекст приложения.
 * Содержит простые данные, доступные в шаблоне для рендеринга.
 * Поддерживает только примитивные типы и массивы примитивных типов.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const context: Context = {
 *   framework: "MetaFor",
 *   isActive: true,
 *   tags: ["tag1", "tag2", "tag3"]
 *   count: 4444,
 * }
 * ```
 */
export type Context = Record<string, string | number | boolean | null | Array<string | number | boolean>>

/**
 * Core объект.
 * Содержит сложные данные, объекты, функции и утилиты, доступные в шаблоне.
 * Может содержать любые типы данных: объекты, массивы, функции, классы.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const core: Core = {
 *   user: {
 *     name: "Иван",
 *     profile: {
 *       avatar: "avatar.jpg",
 *       settings: { theme: "dark", language: "ru" }
 *     }
 *   },
 *   posts: [
 *     { id: 1, title: "Заголовок", content: "Содержимое" },
 *     { id: 2, title: "Другой пост", content: "Еще содержимое" }
 *   ],
 *   api: {
 *     baseUrl: "https://api.example.com",
 *     endpoints: { users: "/users", posts: "/posts" }
 *   },
 *   utils: {
 *     formatDate: (date: Date) => date.toLocaleDateString(),
 *     escapeHtml: (str: string) => str.replace(/</g, "&lt")
 *   }
 * }
 * ```
 */
export type Core = Record<string, any>

/**
 * Состояние приложения.
 * Строковое представление текущего состояния.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const state: State = "loading" // "loading" | "ready" | "error"
 * ```
 */
export type State = string

/**
 * Параметры для функции шаблонизатора.
 * Содержит все необходимые данные и функции для шаблонизации.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const template = ({ html, core, context, state, update }: TemplateParams<C, I, S>) => html`
 *   <div class="app">
 *     <h1>${context.title}</h1>
 *     <p>Состояние: ${state}</p>
 *     <button onclick=${() => update({ state: 'ready' })}>
 *       Готово
 *     </button>
 *   </div>
 * `
 * ```
 */
export type Params<C extends Context, I extends Core = Core, S extends State = State> = {
  /** Функция для создания HTML из template literals */
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  /** Core объект с системными данными */
  core: I
  /** {@link https://zavx0z.github.io/context/types/Values | Контекстные значение} */
  context: C
  /** Текущее состояние приложения */
  state: S
  /**
   * Функция для обновления контекста {@link https://zavx0z.github.io/context/types/Update | Update}.
   * Используется в обработчиках событий для изменения состояния.
   *
   * @example
   * ```typescript
   * // Обновление одного поля
   * update({ count: 5 })
   *
   * // Обновление нескольких полей
   * update({ name: "John", age: 25 })
   *
   * // В обработчике события
   * html`<button onclick=${() => update({ active: !context.active })}>Toggle</button>`
   * ```
   */
  update: (context: Partial<C>) => void
}

/**
 * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
 *
 * @param template - Функция шаблонизатора, которая принимает параметры { html, context, core, state, update }
 * @returns Массив узлов с полной структурой и метаданными о путях к данным
 */
export declare function parse<C extends Context = Context, I extends Core = Core, S extends State = State>(
  template: (params: Params<C, I, S>) => void
): Node[]
