import type { Node } from "./node/index.t"

/**
 * Контекст приложения.
 * Содержит простые данные, доступные в шаблоне для рендеринга.
 * Поддерживает только примитивные типы и массивы примитивных типов.
 *
 * @group Входные данные
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
export type Context = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>

/**
 * Core объект.
 * Содержит сложные данные, объекты, функции и утилиты, доступные в шаблоне.
 * Может содержать любые типы данных: объекты, массивы, функции, классы.
 *
 * @group Входные данные
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
 * @group Входные данные
 * @example
 * ```typescript
 * const state: State = "loading" // "loading" | "ready" | "error"
 * ```
 */
export type State = string

/**
 * Параметры для функции рендеринга.
 * Содержит все необходимые данные и функции для рендеринга шаблона.
 *
 * @group Входные данные
 * @example
 * ```typescript
 * const renderFunction = ({ html, core, context, state, update }: RenderParams) => {
 *   return html`
 *     <div class="app">
 *       <h1>${context.title}</h1>
 *       <p>Состояние: ${state}</p>
 *       <button onclick=${() => update({ state: 'ready' })}>
 *         Готово
 *       </button>
 *     </div>
 *   `
 * }
 * ```
 */
export type RenderParams<C extends Context, I extends Core = Core, S extends State = State> = {
  /** Функция для создания HTML из template literals */
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  /** Core объект с системными данными */
  core: I
  /** Контекст приложения с данными */
  context: C
  /** Текущее состояние приложения */
  state: State
  /**
   * Функция для обновления контекста приложения.
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
 * Функция принимает render-функцию, которая использует template literals для создания HTML,
 * и возвращает массив узлов с полной информацией о структуре и путях к данным.
 *
 * @example Простой HTML элемент
 * ```typescript
 * const nodes = parse(({ html, context }) => html`
 *   <div class="container">Привет, ${context.userName}!</div>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     type: "el",
 *     tag: "div",
 *     string: { class: "container" },
 *     child: [
 *       {
 *         type: "text",
 *         data: "/context/userName",
 *         expr: "Привет, ${[0]}!"
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Условный рендеринг
 * ```typescript
 * const nodes = parse(({ html, context }) => html`
 *   <div>
 *     ${context.isLoggedIn ?
 *       html`<span>Добро пожаловать, ${context.userName}!</span>` :
 *       html`<a href="/login">Войти</a>`
 *     }
 *   </div>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: "div",
 *     type: "el",
 *     child: [
 *       {
 *         type: "cond",
 *         data: "/context/isLoggedIn",
 *         child: [
 *           {
 *             tag: "span",
 *             type: "el",
 *             child: [
 *               {
 *                 type: "text",
 *                 data: "/context/userName",
 *                 expr: "Добро пожаловать, ${[0]}!"
 *               }
 *             ]
 *           },
 *           {
 *             tag: "a",
 *             type: "el",
 *             string: { href: "/login" },
 *             child: [
 *               {
 *                 type: "text",
 *                 value: "Войти"
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Итерация по массиву
 * ```typescript
 * const nodes = parse(({ html, context, core }) => html`
 *   <ul>
 *     ${core.postTitles.map(title => html`<li>${title}</li>`)}
 *   </ul>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: "ul",
 *     type: "el",
 *     child: [
 *       {
 *         type: "map",
 *         data: "/core/postTitles",
 *         child: [
 *           {
 *             tag: "li",
 *             type: "el",
 *             child: [
 *               {
 *                 type: "text",
 *                 data: "[item]"
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Логический оператор
 * ```typescript
 * const nodes = parse(({ html, context, core }) => html`
 *   <div>
 *     ${context.hasNotifications && html`
 *       <div class="notifications">
 *         ${core.notificationMessages.map(message => html`<div>${message}</div>`)}
 *       </div>
 *     `}
 *   </div>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: "div",
 *     type: "el",
 *     child: [
 *       {
 *         type: "log",
 *         data: "/context/hasNotifications",
 *         child: [
 *           {
 *             tag: "div",
 *             type: "el",
 *             string: { class: "notifications" },
 *             child: [
 *               {
 *                 type: "map",
 *                 data: "/core/notificationMessages",
 *                 child: [
 *                   {
 *                     tag: "div",
 *                     type: "el",
 *                     child: [
 *                       {
 *                         type: "text",
 *                         data: "[item]"
 *                       }
 *                     ]
 *                   }
 *                 ]
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Мета-компонент
 * ```typescript
 * const nodes = parse(({ html, context, core }) => html`
 *   <my-component
 *     core=${core.widgetConfig}
 *     context=${core.userData}
 *     class="custom"
 *   >
 *     <p>Содержимое компонента</p>
 *   </my-component>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: "my-component",
 *     type: "meta",
 *     core: {
 *       data: "/core/widgetConfig"
 *     },
 *     context: {
 *       data: "/core/userData"
 *     },
 *     string: { class: "custom" },
 *     child: [
 *       {
 *         tag: "p",
 *         type: "el",
 *         child: [
 *           {
 *             type: "text",
 *             value: "Содержимое компонента"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Динамический тег
 * ```typescript
 * const nodes = parse(({ html, context, core }) => html`
 *   <meta-${core.componentType} class="dynamic">
 *     <p>Динамический компонент</p>
 *   </meta-${core.componentType}>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: {
 *       data: "/core/componentType",
 *       expr: "meta-${[0]}"
 *     },
 *     type: "meta",
 *     string: { class: "dynamic" },
 *     child: [
 *       {
 *         tag: "p",
 *         type: "el",
 *         child: [
 *           {
 *             type: "text",
 *             value: "Динамический компонент"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Обработка событий с функцией update
 * ```typescript
 * const nodes = parse(({ html, context, update }) => html`
 *   <div>
 *     <button onclick=${() => update({ count: context.count + 1 })}>
 *       Счетчик: ${context.count}
 *     </button>
 *     <input onchange=${(e) => update({ name: e.target.value })}
 *            value=${context.name} />
 *   </div>
 * `)
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     tag: "div",
 *     type: "el",
 *     child: [
 *       {
 *         tag: "button",
 *         type: "el",
 *         event: {
 *           onclick: {
 *             upd: "count",
 *             data: "/context/count",
 *             expr: "() => update({ count: ${[0]} + 1 })"
 *           }
 *         },
 *         child: [
 *           {
 *             type: "text",
 *             data: "/context/count",
 *             expr: "Счетчик: ${[0]}"
 *           }
 *         ]
 *       },
 *       {
 *         tag: "input",
 *         type: "el",
 *         event: {
 *           onchange: {
 *             upd: "name",
 *             expr: "(e) => update({ name: e.target.value })"
 *           }
 *         },
 *         string: {
 *           value: {
 *             data: "/context/name"
 *           }
 *         }
 *       }
 *     ]
 *   }
 * ]
 * ```
 *
 * @param render - Функция рендеринга, которая принимает параметры { html, context, core, state, update }
 * @returns Массив узлов с полной структурой и метаданными о путях к данным
 */
export declare function parse<C extends Context = Context, I extends Core = Core, S extends State = State>(
  render: (params: RenderParams<C, I, S>) => void
): Node[]
