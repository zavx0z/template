/**
 * Контекст приложения.
 * Содержит простые данные, доступные в шаблоне для рендеринга.
 * Поддерживает только примитивные типы и массивы примитивных типов.
 *
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
 * };
 * ```
 */
export type Context = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>

/**
 * Core объект.
 * Содержит сложные данные, объекты, функции и утилиты, доступные в шаблоне.
 * Может содержать любые типы данных: объекты, массивы, функции, классы.
 *
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
 *     escapeHtml: (str: string) => str.replace(/</g, "&lt;")
 *   }
 * };
 * ```
 */
export type Core = Record<string, any>

/**
 * Состояние приложения.
 * Строковое представление текущего состояния.
 *
 * @example
 * ```typescript
 * const state: State = "loading"; // "loading" | "ready" | "error"
 * ```
 */
export type State = string

/**
 * Параметры для функции рендеринга.
 * Содержит все необходимые данные и функции для рендеринга шаблона.
 *
 * @example
 * ```typescript
 * const renderFunction = ({ html, core, context, state, update }: RenderParams) => {
 *   return html`
 *     <div class="app">
 *       <h1>${context.title}</h1>
 *       <p>Состояние: ${state}</p>
 *       <button onclick="${() => update({ state: 'ready' })}">
 *         Готово
 *       </button>
 *     </div>
 *   `;
 * };
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
  /** Функция для обновления контекста */
  update: (context: Partial<C>) => void
}

/**
 * Результат парсинга атрибута.
 * Содержит информацию о динамических атрибутах, извлеченную из template literals.
 *
 * @example Простой динамический атрибут
 * ```html
 * <div class=${user.theme}>Элемент</div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "user.theme"
 * }
 * ```
 *
 * ---
 *
 * @example Сложное выражение в атрибуте
 * ```html
 * <div class=${user.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["user.role"],
 *   "expr": "${[0]} === 'admin' ? 'admin-panel' : 'user-panel'"
 * }
 * ```
 *
 * ---
 *
 * @example Атрибут с обновлением состояния
 * ```html
 * <input value=${form.email} onchange="updateForm('email', this.value)" />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": "form.email",
 *   "upd": "form.email"
 * }
 * ```
 *
 * ---
 *
 * @example Смешанный атрибут
 * ```html
 * <div class="container ${user.theme} ${isActive ? 'active' : ''}">
 *   Элемент
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "data": ["user.theme", "isActive"],
 *   "expr": "container ${[0]} ${[1] ? 'active' : ''}"
 * }
 * ```
 *
 * Структура:
 * - `data` - путь(и) к данным в контексте
 * - `expr` - выражение с индексами для сложных вычислений
 * - `upd` - ключи для обновления состояния приложения
 */
export type ParseAttributeResult = {
  /**
   * Путь(и) к данным
   *
   * @example Простой путь
   * ```typescript
   * data: "user.name"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["user", "theme"]
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
   * Ключи для обновления состояния
   *
   * @example Простой ключ
   * ```typescript
   * upd: "form.email"
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
   *   { type: "text", data: "user.name" }
   * ]
   * ```
   */
  child?: Node[]
}
/**
 * Текстовый узел.
 * Представляет текст с путями к данным или статическими значениями.
 *
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
 * ---
 *
 * @example Динамический текст
 * ```html
 * <p>Привет, ${user.name}!</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": "user.name",
 *   "expr": "Привет, ${[0]}!"
 * }
 * ```
 *
 * ---
 *
 * @example Смешанный текст
 * ```html
 * <p>Пользователь ${user.name} имеет ${user.posts.length} постов</p>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "type": "text",
 *   "data": ["user.name", "user.posts.length"],
 *   "expr": "Пользователь ${[0]} имеет ${[1]} постов"
 * }
 * ```
 *
 * ---
 *
 * @example Логические операции
 * ```html
 * <div>Пользователь: ${user.isActive && user.name || 'Гость'}</div>
 * <span>Статус: ${user.isAdmin ? 'Администратор' : 'Пользователь'}</span>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["user.isActive", "user.name"],
 *     "expr": "Пользователь: ${[0]} && ${[1]} || 'Гость'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["user.isAdmin"],
 *     "expr": "Статус: ${[0]} ? 'Администратор' : 'Пользователь'"
 *   }
 * ]
 * ```
 *
 * ---
 *
 * @example Тернарные операторы
 * ```html
 * <p>${user.age >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'}</p>
 * <div>${product.inStock ? `В наличии: ${product.quantity}` : 'Нет в наличии'}</div>
 * ```
 *
 * Результат:
 * ```json
 * [
 *   {
 *     "type": "text",
 *     "data": ["user.age"],
 *     "expr": "${[0]} >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний'"
 *   },
 *   {
 *     "type": "text",
 *     "data": ["product.inStock", "product.quantity"],
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
   * data: "user.name"
   * ```
   *
   * @example Массив путей
   * ```typescript
   * data: ["user.name", "user.age"]
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
 * @example Простая итерация
 * ```html
 * <ul>
 *   ${users.map(user => html`<li>${user.name}</li>`)}
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
 *       "data": "users",
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
 *   ${posts.map(({title, content}) => html`
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
 *       "data": "posts",
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
 *   ${items.map((item, index) => html`
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
 *       "data": "items",
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
 *   ${categories.map(category => html`
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
 *       "data": "categories",
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
   * data: "users"
   * ```
   *
   * @example Вложенный путь
   * ```typescript
   * data: "categories.products"
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
 * @example Простое условие
 * ```html
 * <div>
 *   ${user.isLoggedIn ? html`<span>Добро пожаловать, ${user.name}!</span>` : html`<a href="/login">Войти</a>`}
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
 *       "data": "user.isLoggedIn",
 *       "child": [
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "user.name",
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
 *   ${user.role === 'admin' && user.permissions.includes('write') ?
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
 *   ${posts.length > 0 ?
 *     html`<ul>${posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
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
 *       "data": "posts.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "ul",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "posts",
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
   * data: "user.isLoggedIn"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["user", "role"]
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
 * @example Простое логическое условие
 * ```html
 * <div>
 *   ${user.isAdmin && html`<button>Админ-панель</button>`}
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
 *       "data": "user.isAdmin",
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
 *   ${notifications.length > 0 && html`
 *     <div class="notifications">
 *       ${notifications.map(n => html`<div>${n.message}</div>`)}
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
 *       "data": "notifications.length",
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
 *               "data": "notifications",
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
 *   ${user.role === 'admin' && user.permissions.includes('delete') && html`
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
   * data: "user.isAdmin"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["notifications", "length"]
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
 * Представляет мета-тег с динамическим именем тега.
 * Используется для создания компонентов с динамическими именами тегов.
 *
 * @example Статический мета-тег
 * ```html
 * <my-component class="custom">
 *   <p>Содержимое компонента</p>
 * </my-component>
 * ```
 *
 * @example Динамический мета-тег
 * ```html
 * <${componentType} class="dynamic">
 *   <p>Динамический компонент</p>
 * </${componentType}>
 * ```
 *
 * @example Мета-тег с core и context
 * ```html
 * <my-widget core="widgetConfig" context="userData">
 *   <div>Виджет с конфигурацией</div>
 * </my-widget>
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
  tag: string | ParseAttributeResult
  /** Тип узла - всегда "meta" для мета-узлов */
  type: "meta"
  /** Дочерние элементы (опционально) */
  child?: Node[]
}

/**
 * Базовый интерфейс для узлов с атрибутами.
 * Содержит все возможные типы атрибутов для HTML элементов и мета-компонентов.
 *
 * @example HTML элемент с различными атрибутами
 * ```html
 * <div
 *   class="container ${dynamicClass}"
 *   id="main"
 *   data-count=${items.length}
 *   style="color: ${textColor}; background: ${bgColor}"
 *   onclick="handleClick()"
 *   hidden=${!isVisible}
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
 * - `core`/`context` - специальные свойства для передачи объектов в компоненты
 */
interface AttributesNode {
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: AttributeEvent
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: AttributeBoolean
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: AttributeArray
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: AttributeString
  /** Стили (CSS в виде строки или объекта) */
  style?: StyleObject
  /** Core свойство для meta-компонентов (передача core объекта) */
  core?: ParseAttributeResult
  /** Context свойство для meta-компонентов (передача context объекта) */
  context?: ParseAttributeResult
}

/**
 * Переменный атрибут с путем к данным.
 * Используется для простых динамических атрибутов.
 *
 * @example
 * ```html
 * <div class=${user.theme}>Тема пользователя</div>
 * ```
 */
export type AttrVariable = {
  /**
   * Путь к данным в контексте
   *
   * @example
   * ```typescript
   * data: "user.theme"
   * ```
   *
   * ---
   *
   * @example
   * ```typescript
   * data: "settings.color"
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
 * <div class=${user.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель управления
 * </div>
 * ```
 */
export type AttrDynamic = {
  /** Путь(и) к данным для выражения */
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
 * <input value=${form.email} onchange="updateForm('email', this.value)" />
 * ```
 */
type AttrUpdate = {
  /** Путь(и) к данным (опционально) */
  data?: string | string[]
  /** Выражение с индексами (опционально) */
  expr?: string
  /** Ключи для обновления в состоянии */
  upd: string | string[]
}

/**
 * Событийные атрибуты.
 * Содержит обработчики событий (onclick, onchange, onsubmit и т.д.)
 *
 * @example Простая функция без параметров
 * ```html
 * <button onclick=${core.handleClick}>Кнопка</button>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "/core/handleClick"
 *   }
 * }
 * ```
 *
 * ---
 *
 * @example Функция с параметрами
 * ```html
 * <input onchange=${(e) => core.updateValue(e)} />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onchange": {
 *     "data": "/core/updateValue",
 *     "expr": "(e) => ${[0]}(e)"
 *   }
 * }
 * ```
 *
 * ---
 *
 * @example Событие в массиве
 * ```html
 * <li onclick=${() => item.onClick()}>${item.name}</li>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "[item]/onClick",
 *     "expr": "() => ${[0]}()"
 *   }
 * }
 * ```
 *
 * ---
 *
 * @example Булев атрибут события
 * ```html
 * <button onclick>Кнопка</button>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": true
 * }
 * ```
 */
export type AttributeEvent = Record<
  string,
  AttrVariable | AttrDynamic | AttrUpdate | { expr: string; upd?: string | string[] }
>

/**
 * Массивы атрибутов.
 * Используется для атрибутов, которые могут содержать несколько значений (class, rel).
 *
 * @example
 * ```html
 * <div class="container ${user.theme} ${isActive ? 'active' : ''}">
 *   Элемент с несколькими классами
 * </div>
 * ```
 */
export type AttributeArray = Record<string, (AttrStaticArray | AttrVariable | AttrDynamic)[]>

/**
 * Статический элемент массива атрибутов.
 */
type AttrStaticArray = {
  /** Статическое значение */
  value: string
}

/**
 * Строковые атрибуты.
 * Обычные HTML атрибуты со строковыми значениями.
 *
 * @example
 * ```html
 * <img src=${image.url} alt=${image.alt} title=${image.title} />
 * <a href="/user/${user.id}">Профиль пользователя</a>
 * ```
 */
export type AttributeString = Record<string, AttrStaticString | AttrVariable | AttrDynamic>

/**
 * Статическая строка атрибута.
 */
type AttrStaticString = string

/**
 * Булевые атрибуты.
 * HTML атрибуты, которые присутствуют или отсутствуют (hidden, disabled, checked).
 *
 * @example
 * ```html
 * <input type="checkbox" checked=${user.isSubscribed} />
 * <button disabled=${!canSubmit}>Отправить</button>
 * <div hidden=${!isVisible}>Скрытый контент</div>
 * ```
 */
export type AttributeBoolean = Record<string, boolean | AttrVariable | AttrDynamic>

/**
 * Объект стилей.
 * CSS стили в виде JavaScript объекта (styled-components подход).
 *
 * @example Простой объект стилей
 * ```html
 * <div style=${{backgroundColor: "red", color: "white"}}>
 *   Стилизованный элемент
 * </div>
 * ```
 *
 * @example Динамические стили
 * ```html
 * <div style=${{backgroundColor: theme.primary, color: theme.text}}>
 *   Элемент с темой
 * </div>
 * ```
 *
 * @example Условные стили
 * ```html
 * <div style=${{backgroundColor: isActive ? "green" : "red", color: "white"}}>
 *   Условный стиль
 * </div>
 * ```
 */
export type StyleObject = Record<string, string | AttrVariable | AttrDynamic>

/**
 * Объединенный тип всех возможных узлов парсера.
 * Представляет любую структуру, которая может быть получена в результате парсинга HTML-шаблона.
 *
 * @example Структура с различными типами узлов
 * ```html
 * <div class="container">
 *   <h1>${title}</h1>
 *   ${user.isLoggedIn ? html`<span>Добро пожаловать!</span>` : html`<a href="/login">Войти</a>`}
 *   ${notifications.length > 0 && html`
 *     <ul>
 *       ${notifications.map(n => html`<li>${n.message}</li>`)}
 *     </ul>
 *   `}
 *   <my-component core="config" context="userData">
 *     <p>Содержимое компонента</p>
 *   </my-component>
 * </div>
 * ```
 *
 * Результат парсинга будет содержать:
 * - NodeElement для div, h1, span, a, ul, li, p
 * - NodeText для статического текста и динамических значений
 * - NodeCondition для тернарного оператора
 * - NodeLogical для логического оператора &&
 * - NodeMap для итерации по массиву
 * - NodeMeta для my-component
 */
export type Node = NodeMap | NodeCondition | NodeLogical | NodeText | NodeElement | NodeMeta

/**
 * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
 *
 * Функция принимает render-функцию, которая использует template literals для создания HTML,
 * и возвращает массив узлов с полной информацией о структуре и путях к данным.
 *
 * @example Простой HTML элемент
 * ```typescript
 * const nodes = parse(({ html, context, core }) => {
 *   html`<div class="container">Привет, ${context.userName}!</div>`;
 * });
 *
 * // Результат:
 * // [
 * //   {
 * //     type: "el",
 * //     tag: "div",
 * //     string: { class: "container" },
 * //     child: [
 * //       {
 * //         type: "text",
 * //         expr: "Привет, ${[0]}!",
 * //         data: ["userName"]
 * //       }
 * //     ]
 * //   }
 * // ]
 * ```
 *
 * @example Условный рендеринг
 * ```typescript
 * const nodes = parse(({ html, context }) => {
 *   html`<div>
 *     ${context.isLoggedIn ?
 *       html`<span>Добро пожаловать, ${context.userName}!</span>` :
 *       html`<a href="/login">Войти</a>`
 *     }
 *   </div>`;
 * });
 *
 * // Результат содержит NodeCondition с двумя ветками
 * ```
 *
 * @example Итерация по массиву
 * ```typescript
 * const nodes = parse(({ html, context }) => {
 *   html`<ul>
 *     ${context.postTitles.map(title => html`<li>${title}</li>`)}
 *   </ul>`;
 * });
 *
 * // Результат содержит NodeMap для итерации по posts
 * ```
 *
 * @example Логический оператор
 * ```typescript
 * const nodes = parse(({ html, context }) => {
 *   html`<div>
 *     ${context.hasNotifications && html`
 *       <div class="notifications">
 *         ${context.notificationMessages.map(message => html`<div>${message}</div>`)}
 *       </div>
 *     `}
 *   </div>`;
 * });
 *
 * // Результат содержит NodeLogical и вложенный NodeMap
 * ```
 *
 * @example Мета-компонент
 * ```typescript
 * const nodes = parse(({ html, context, core }) => {
 *   html`<my-component
 *     core=${core.widgetConfig}
 *     context=${context.userData}
 *     class="custom"
 *   >
 *     <p>Содержимое компонента</p>
 *   </my-component>`;
 * });
 *
 * // Результат содержит NodeMeta с core и context атрибутами
 * ```
 *
 * @example Динамический тег
 * ```typescript
 * const nodes = parse(({ html, context }) => {
 *   html`<${context.componentType} class="dynamic">
 *     <p>Динамический компонент</p>
 *   </${context.componentType}>`;
 * });
 *
 * // Результат содержит NodeMeta с динамическим именем тега
 * ```
 *
 * @param render - Функция рендеринга, которая принимает параметры { html, context, core, state, update }
 * @returns Массив узлов с полной структурой и метаданными о путях к данным
 */
export declare function parse<C extends Context = Context, I extends Core = Core, S extends State = State>(
  render: (params: RenderParams<C, I, S>) => void
): Node[]
