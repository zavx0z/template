import type { ValueArray } from "./attribute/array.t"
import type { ValueBoolean } from "./attribute/boolean.t"
import type { ValueEvent } from "./attribute/event.t"
import type { ValueString } from "./attribute/string.t"
import type { ValueStyle } from "./attribute/style.t"

/**
 * Контекст приложения.
 * Содержит простые данные, доступные в шаблоне для рендеринга.
 * Поддерживает только примитивные типы и массивы примитивных типов.
 *
 * @group Входные данные
 * @example
 * ```typescript
 * const context: Context = {
 *   userName: "Иван",
 *   userAge: 25,
 *   isActive: true,
 *   theme: "dark",
 *   roles: ["user", "editor"],
 *   notifications: ["Новое сообщение", "Обновление системы"],
 *   count: 42,
 *   isVisible: false,
 *   tags: ["tag1", "tag2", "tag3"]
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
 * Результат парсинга атрибута.
 * Содержит информацию о динамических атрибутах, извлеченную из template literals.
 *
 * @example Простой динамический атрибут
 * ```html
 * <div class=${context.theme}>Элемент</div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "/context/theme"
 * }
 * ```
 *
 * @example Сложное выражение в атрибуте
 * ```html
 * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["/core/role"],
 *   "expr": "${[0]} === 'admin' ? 'admin-panel' : 'user-panel'"
 * }
 * ```
 *
 * @example Атрибут с обновлением состояния
 * ```html
 * <input value=${context.email} onchange=${(e) => update({ email: e.target.value })} />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "/context/email",
 *   "upd": "email",
 *   "expr": "(e) => update({ email: e.target.value })"
 * }
 * ```
 *
 * @example Смешанный атрибут
 * ```html
 * <div class="container ${context.theme} ${context.isActive ? 'active' : ''}">
 *   Элемент
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["/context/theme", "/context/isActive"],
 *   "expr": "container ${[0]} ${[1] ? 'active' : ''}"
 * }
 * ```
 *
 * Структура:
 * - `data` - путь(и) к данным в контексте
 * - `expr` - выражение с индексами для сложных вычислений
 * - `upd` - ключи обновления контекста
 */
export type ParseAttributeResult = {
  /**
   * Путь(и) к данным
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/name"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/theme", "/core/role"]
   * ```
   */
  data?: string | string[]
  /**
   * Унифицированное выражение с индексами
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr?: string
  /**
   * Ключи обновления контекста
   *
   * @example Простой ключ
   * ```typescript
   * upd: "email"
   * ```
   *
   * ---
   *
   * @example Массив ключей
   * ```typescript
   * upd: ["user", "settings"]
   * ```
   */
  upd?: string | string[]
}

// Выходные данные
/**
 * Узел HTML элемента.
 * Представляет HTML тег с атрибутами и дочерними элементами.
 *
 * @group Nodes
 * @example
 * ```html
 * <div class="container" id="main">
 *   <h1>Заголовок</h1>
 *   <p>Текст</p>
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "string": {
 *     "class": "container",
 *     "id": "main"
 *   },
 *   "child": [
 *     {
 *       "tag": "h1",
 *       "type": "el",
 *       "child": [
 *         {
 *           "type": "text",
 *           "value": "Заголовок"
 *         }
 *       ]
 *     },
 *     {
 *       "tag": "p",
 *       "type": "el",
 *       "child": [
 *         {
 *           "type": "text",
 *           "value": "Текст"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `tag` - имя HTML тега
 * - `type` - всегда "el" для элементов
 * - `child` - массив дочерних узлов
 * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
 */
export interface NodeElement extends AttributesNode {
  /**
   * Имя HTML тега
   *
   * @example
   * ```typescript
   * tag: "div"
   * ```
   *
   * @example
   * ```typescript
   * tag: "button"
   * ```
   */
  tag: string
  /**
   * Тип узла - всегда "el" для элементов
   *
   * @example
   * ```typescript
   * type: "el"
   * ```
   */
  type: "el"
  /**
   * Дочерние узлы элемента (могут быть любого типа Node)
   *
   * @example
   * ```typescript
   * child: [
   *   { type: "text", value: "Привет" },
   *   { type: "text", data: "/context/user/name" }
   * ]
   * ```
   */
  child?: Node[]
}
/**
 * Текстовый узел.
 * Представляет текст с путями к данным или статическими значениями.
 *
 * @group Nodes
 * @example Статический текст
 * ```html
 * <p>Это статический текст</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "value": "Это статический текст"
 * }
 * ```
 *
 * @example Динамический текст
 * ```html
 * <p>Привет, ${context.name}!</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": "/context/name",
 *   "expr": "Привет, ${[0]}!"
 * }
 * ```
 *
 * @example Смешанный текст
 * ```html
 * <p>Пользователь ${context.name} имеет ${core.postCount} постов</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": ["/context/name", "/core/postCount"],
 *   "expr": "Пользователь ${[0]} имеет ${[1]} постов"
 * }
 * ```
 *
 * @example Логические операции
 * ```html
 * <div>Пользователь: ${context.isActive && context.name || 'Гость'}</div>
 * <span>Статус: ${context.isAdmin ? 'Администратор' : 'Пользователь'}</span>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["/context/isActive", "/context/name"],
 *     "expr": "Пользователь: ${[0]} && ${[1]} || 'Гость'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["/context/isAdmin"],
 *     "expr": "Статус: ${[0]} ? 'Администратор' : 'Пользователь'"
 *   }
 * ]
 * ```
 *
 * @example Тернарные операторы
 * ```html
 * <p>${context.age >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'}</p>
 * <div>${context.inStock ? `В наличии: ${core.quantity}` : 'Нет в наличии'}</div>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["/context/age"],
 *     "expr": "${[0]} >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["/context/inStock", "/core/quantity"],
 *     "expr": "${[0]} ? `В наличии: ${[1]}` : 'Нет в наличии'"
 *   }
 * ]
 * ```
 *
 * Структура узла:
 * - `type` - всегда "text" для текстовых узлов
 * - `value` - статическое значение (если текст статический)
 * - `data` - путь(и) к данным (если текст динамический)
 * - `expr` - выражение с индексами (если текст смешанный)
 */
export interface NodeText {
  /** Тип узла - всегда "text" для текстовых узлов */
  type: "text"
  /**
   * Путь(и) к данным (если текст динамический)
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/name"
   * ```
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/name", "/context/age"]
   * ```
   */
  data?: string | string[]
  /**
   * Статическое значение (если текст статический)
   *
   * @example
   * ```typescript
   * value: "Привет, мир!"
   * ```
   */
  value?: string
  /**
   * Выражение с индексами (если текст смешанный)
   *
   * @example
   * ```typescript
   * expr: "Привет ${[0]}, у тебя ${[1]} сообщений"
   * ```
   */
  expr?: string
}
/**
 * Узел map операции.
 * Представляет итерацию по массиву данных с дочерними элементами.
 *
 * @group Nodes
 * @example Простая итерация
 * ```html
 * <ul>
 *   ${core.users.map(user => html`<li>${user}</li>`)}
 * </ul>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "ul",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/users",
 *       "child": [
 *         {
 *           "tag": "li",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "[item]/name"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Итерация с деструктуризацией
 * ```html
 * <div>
 *   ${core.posts.map(({title, content}) => html`
 *     <article>
 *       <h2>${title}</h2>
 *       <p>${content}</p>
 *     </article>
 *   `)}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/posts",
 *       "child": [
 *         {
 *           "tag": "article",
 *           "type": "el",
 *           "child": [
 *             {
 *               "tag": "h2",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/title"
 *                 }
 *               ]
 *             },
 *             {
 *               "tag": "p",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/content"
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Итерация с индексом
 * ```html
 * <ul>
 *   ${core.items.map((item, index) => html`
 *     <li class=${index % 2 === 0 ? 'even' : 'odd'}>
 *       ${index + 1}. ${item.name}
 *     </li>
 *   `)}
 * </ul>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "ul",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/items",
 *       "child": [
 *         {
 *           "tag": "li",
 *           "type": "el",
 *           "string": {
 *             "class": {
 *               "data": ["index", "item.name"],
 *               "expr": "${[0]} % 2 === 0 ? 'even' : 'odd'"
 *             }
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": ["index", "item.name"],
 *               "expr": "${[0] + 1}. ${[1]}"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Вложенная итерация
 * ```html
 * <div>
 *   ${core.categories.map(category => html`
 *     <section>
 *       <h1>${category.name}</h1>
 *       ${category.products.map(product => html`
 *         <div>${product.name}</div>
 *       `)}
 *     </section>
 *   `)}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/core/categories",
 *       "child": [
 *         {
 *           "tag": "section",
 *           "type": "el",
 *           "child": [
 *             {
 *               "tag": "h1",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/name"
 *                 }
 *               ]
 *             },
 *             {
 *               "type": "map",
 *               "data": "[item]/products",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/name"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "map" для map операций
 * - `data` - путь к массиву данных для итерации
 * - `child` - дочерние узлы, которые будут повторены для каждого элемента массива
 */
export interface NodeMap {
  /**
   * Тип узла - всегда "map" для map операций
   *
   * @example
   * ```typescript
   * type: "map"
   * ```
   */
  type: "map"
  /**
   * Путь к массиву данных для итерации
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/users"
   * ```
   *
   * @example Вложенный путь
   * ```typescript
   * data: "/core/products"
   * ```
   */
  data: string
  /**
   * Дочерние узлы, которые будут повторены для каждого элемента массива
   *
   * @example
   * ```typescript
   * child: [
   *   {
   *     tag: "li",
   *     type: "el",
   *     child: [
   *       { type: "text", data: "[item]/name" }
   *     ]
   *   }
   * ]
   * ```
   */
  child: Node[]
}
/**
 * Узел условного оператора.
 * Представляет тернарный оператор с ветками true и false.
 *
 * @group Nodes
 * @example Простое условие
 * ```html
 * <div>
 *   ${context.isLoggedIn ? html`<span>Добро пожаловать, ${context.name}!</span>` : html`<a href="/login">Войти</a>`}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": "/context/isLoggedIn",
 *       "child": [
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "/context/name",
 *               "expr": "Добро пожаловать, ${[0]}!"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "a",
 *           "type": "el",
 *           "string": {
 *             "href": "/login"
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Войти"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Сложное условие
 * ```html
 * <div>
 *   ${core.role === 'admin' && core.permissions.includes('write') ?
 *     html`<button>Редактировать</button>` :
 *     html`<span>Нет прав</span>`
 *   }
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": ["user.role", "user.permissions"],
 *       "expr": "${[0]} === 'admin' && ${[1]}.includes('write')",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Редактировать"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Нет прав"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Условие с проверкой массива
 * ```html
 * <div>
 *   ${core.posts.length > 0 ?
 *     html`<ul>${core.posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
 *     html`<p>Постов пока нет</p>`
 *   }
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": "/core/posts.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "ul",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/core/posts",
 *               "child": [
 *                 {
 *                   "tag": "li",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/title"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "p",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Постов пока нет"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "cond" для условных операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - массив из двух элементов: [true-ветка, false-ветка]
 */
export interface NodeCondition {
  /** Тип узла - всегда "cond" для условных операторов */
  type: "cond"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/isLoggedIn"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/isAdmin", "/core/role"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.length > 0"
   * ```
   */
  expr?: string
  /** Узлы для случая когда условие истинно и ложно
   * - true: первый элемент массива (child[0])
   * - false: второй элемент массива (child[1])
   */
  child: Node[]
}

/**
 * Узел логического оператора.
 * Представляет логический оператор && с условным отображением.
 *
 * @group Nodes
 * @example Простое логическое условие
 * ```html
 * <div>
 *   ${context.isAdmin && html`<button>Админ-панель</button>`}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/context/isAdmin",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Админ-панель"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Логическое условие с проверкой массива
 * ```html
 * <div>
 *   ${core.notifications.length > 0 && html`
 *     <div class="notifications">
 *       ${core.notifications.map(n => html`<div>${n.message}</div>`)}
 *     </div>
 *   `}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/core/notifications.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "div",
 *           "type": "el",
 *           "string": {
 *             "class": "notifications"
 *           },
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/core/notifications",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/message"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Сложное логическое условие
 * ```html
 * <div>
 *   ${core.role === 'admin' && core.permissions.includes('delete') && html`
 *     <button onclick="deleteItem()">Удалить</button>
 *   `}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": ["user.role", "user.permissions"],
 *       "expr": "${[0]} === 'admin' && ${[1]}.includes('delete')",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "string": {
 *             "onclick": "deleteItem()"
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Удалить"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "log" для логических операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - дочерние узлы, которые отображаются только если условие истинно
 */
export interface NodeLogical {
  /** Тип узла - всегда "log" для логических операторов */
  type: "log"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/context/isAdmin"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/context/notifications", "/context/count"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.includes('delete')"
   * ```
   */
  expr?: string
  /** Дочерние узлы, которые отображаются только если условие истинно */
  child: Node[]
}

/**
 * Мета-узел.
 *
 * Представляет meta-элемент.
 * Поддерживает создание компонентов с динамическими именами тегов.
 *
 * @group Nodes
 * @example Статический мета-тег
 * ```html
 * <meta-component class="custom">
 *   <p>Содержимое компонента</p>
 * </meta-component>
 * ```
 *
 * @example Динамический мета-тег
 * ```html
 * <meta-${core.actorHash} class="dynamic">
 *   <p>Динамический компонент</p>
 * </meta-${core.actorHash}>
 * ```
 *
 * @example Мета-элемент с core и context
 * ```html
 * <meta-widget core=${core.widgetConfig} context=${core.userData}>
 *   <div>Виджет с конфигурацией</div>
 * </meta-widget>
 * ```
 *
 * Структура узла:
 * - `type` - всегда "meta" для мета-узлов
 * - `tag` - имя мета-тега (статическое или динамическое)
 * - `child` - дочерние элементы (опционально)
 * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
 * - Свойства: `core`, `context`
 */
export interface NodeMeta extends AttributesNode {
  /** Имя мета-тега (может быть статическим строкой или динамическим ParseAttributeResult) */
  tag: ValueStatic | ValueDynamic | ValueVariable
  /** Тип узла - всегда "meta" для мета-узлов */
  type: "meta"
  /** Дочерние элементы (опционально) */
  child?: Node[]
  /** Core свойство для meta-компонентов (передача core объекта) */
  core?: ValueStatic | ValueDynamic | ValueVariable
  /** Context свойство для meta-компонентов (передача context объекта) */
  context?: ValueStatic | ValueDynamic | ValueVariable
}

/**
 * Объединенный тип всех возможных узлов парсера.
 * Представляет любую структуру, которая может быть получена в результате парсинга HTML-шаблона.
 *
 * @group Nodes
 * @example Структура с различными типами узлов
 * ```html
 * <div class="container">
 *   <h1>${context.title}</h1>
 *   ${context.isLoggedIn ?
 *     html`<span>Добро пожаловать!</span>` :
 *     html`<a href="/login">Войти</a>`
 *   }
 *   ${core.notifications.length > 0 && html`
 *     <ul>
 *       ${core.notifications.map(n => html`<li>${n.message}</li>`)}
 *     </ul>
 *   `}
 *   <meta-component core="config" context="userData">
 *     <p>Содержимое компонента</p>
 *   </meta-component>
 * </div>
 * ```
 *
 * Результат парсинга будет содержать:
 * - NodeElement для div, h1, span, a, ul, li, p
 * - NodeText для статического текста и динамических значений
 * - NodeCondition для тернарного оператора
 * - NodeLogical для логического оператора &&
 * - NodeMap для итерации по массиву
 * - NodeMeta для meta-component
 */
export type Node = NodeMap | NodeCondition | NodeLogical | NodeText | NodeElement | NodeMeta

/**
 * Базовый интерфейс для узлов с атрибутами.
 * Содержит все возможные типы атрибутов для HTML элементов и мета-компонентов.
 *
 * @group Атрибуты элементов
 * @hidden
 * @example HTML элемент с различными атрибутами
 * ```html
 * <div
 *   class="container ${core.dynamicClass}"
 *   id="main"
 *   data-count=${core.items.length}
 *   style=${{
 *      color: core.text.color,
 *      backgroundColor: core.background.color,
 *   }}
 *   onclick=${(e) => core.handler(e)}
 *   hidden=${!context.isVisible}
 * >
 *   Содержимое
 * </div>
 * ```
 *
 * Типы атрибутов:
 * - `event` - события (onclick, onchange и т.д.)
 * - `boolean` - булевые атрибуты (hidden, disabled, checked)
 * - `array` - массивы атрибутов (class, rel)
 * - `string` - строковые атрибуты (id, title, alt)
 * - `style` - CSS стили
 */
export interface AttributesNode {
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: Record<string, ValueEvent>
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: Record<string, ValueBoolean>
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: Record<string, ValueArray[]>
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: Record<string, ValueString>
  /** Стили (CSS в виде строки или объекта) */
  style?: Record<string, ValueStyle>
}

/**
 * Статический элемент массива атрибутов.
 */
export type ValueStaticArray = {
  /** Статическое значение */
  value: string
}

/**
 * Статическое значение.
 */
export type ValueStatic = string

/**
 * Переменный атрибут с путем к данным.
 * Используется для простых динамических атрибутов.
 *
 * @example
 * ```html
 * <div class=${context.theme}>Тема пользователя</div>
 * ```
 */
export type ValueVariable = {
  /**
   * Путь к данным в контексте
   * @example
   * ```typescript
   * data: "/context/theme"
   * ```
   *
   * ---
   *
   * @example
   * ```typescript
   * data: "/core/settings/color"
   * ```
   */
  data: string
}

/**
 * Динамический атрибут с выражением.
 * Используется для сложных вычислений в атрибутах.
 *
 * @example
 * ```html
 * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель управления
 * </div>
 * ```
 */
export type ValueDynamic = {
  /**
   * Путь(и) к данным для выражения
   *
   * @example
   * ```typescript
   * data: "/context/value"
   * data: ["/context/value", "[item]/nested/variable"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr: string
}

/**
 * Атрибут с обновлением состояния.
 * Используется для атрибутов, которые могут изменять состояние приложения.
 *
 * @example
 * ```html
 * <input value=${context.email} onchange=${(e) => update({ email: e.target.value })} />
 * ```
 */
export type ValueUpdate = {
  /** Путь(и) к данным (опционально) */
  data?: string | string[]
  /** Выражение с индексами (опционально) */
  expr?: string
  /** Ключи для обновления в состоянии */
  upd: string | string[]
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
