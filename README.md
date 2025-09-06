# @zavx0z/html-parser

> HTML template parser для **MetaFor**. Извлекает структуру, пути к данным и выражения из tagged template literals **без их выполнения**.

`@zavx0z/html-parser` читает **исходник** вашей render‑функции (через `toString`), забирает блок `html`\`...\` и **статически** парсит его. Результат — нормализованное дерево с:

- **Элементами и текстовыми узлами** (включая Web Components)
- **Интерполяциями** `${...}` в тексте и атрибутах
- **`array.map(...)`** с корректным скоупом **\[item]**
- **Условиями** (`?:`, `&&` / `||`), в т.ч. `${cond && "disabled"}`
- **Типами атрибутов:** строковые, списковые (`class` и др.), булевы, **style/объект**, **события** (`on*`)
- **Мета‑компонентами**: теги `meta-*` (в т.ч. динамические `meta-${...}`)

Парсер вычисляет **пути к данным** (`/context/name`, `/core/list`, `[item]/id`, `../[item]/id`) и формирует **унифицированные выражения** (например, `"Hello ${[0]}!"`), где индексы ссылаются на переменные из `data`.

> Ничего не исполняется. Работает в Node, Bun, браузерах и воркерах.

## Установка

```bash
bun i @zavx0z/html-parser
# или
npm i @zavx0z/html-parser
# или
pnpm add @zavx0z/html-parser
# или
yarn add @zavx0z/html-parser
```

> Требуется: `typescript@^5`. ESM пакет.

## Быстрый старт

```ts
import { parse, type Node } from "@zavx0z/html-parser"

const tree: Node[] = parse(
  ({ html, context, core }) => html`
    <div class=${context.userStatus}>
      <h1>Привет ${context.userName}!</h1>

      ${core.items.map(
        (g) => html`
          <div class="card ${g.active && "active"}">
            ${g.title ? html`<h2>${g.title}</h2>` : html`<span>Без названия</span>`}
          </div>
        `
      )}

      <meta-list
        onClick=${core.onClick}
        style=${{ color: context.color, opacity: core.opacity }}
        context=${context.userData}
        core=${core.widgetConfig} />
    </div>
  `
)
```

## Что возвращается

```ts
// Node — это discriminated union:
// - Element: { type: "el", tag, child?, string?, array?, boolean?, style?, event?, core?, context? }
// - Text:    { type: "text", value? | data?: string | string[], expr?: string }
// - Map:     { type: "map",  data: string, child: Node[] }
// - Cond:    { type: "cond", data: string | string[], expr?: string, child: [Node, Node] }
// - Logical: { type: "log",  data: string | string[], expr?: string, child: Node[] }
// - Meta:    { type: "meta", tag: string | { data, expr }, child?, ...attrs }
```

**Атрибуты** группируются по смыслу:

- `string` — обычные атрибуты; значение строка или `{ data, expr }`
- `array` — списковые (`class`, `rel` и т.п.); элементы — `{ value }` или `{ data, expr }`
- `boolean` — булевые флаги: `true/false` или `{ data, expr }`
- `style` — объектный вид из `style=${{ ... }}`: `{ ключ: строка | { data, expr } }`
- `event` — `on*`‑обработчики с разобранными `{ data, expr, upd? }`
- `core` / `context` — объектные meta‑атрибуты; в значениях `{ data?, expr?, upd? }`

**Пути в `data`:**

- `/context/...`, `/core/...` — абсолютные привязки
- `[item]` — текущий элемент `map`; `../` для выхода из вложенных `map`

**Выражения** унифицируются через плейсхолдеры `${[i]}` по порядку переменных.

## API

```ts
// Парсит render-функцию в нормализованное дерево
function parse<C extends Context, I extends Core, S extends State>(
  render: (params: {
    html(strings: TemplateStringsArray, ...values: any[]): string
    core: I
    context: C
    state: S
    update(context: Partial<C>): void
  }) => void
): Node[]
```

## Примеры

### Простой HTML элемент

```typescript
const nodes = parse(({ html, context }) => html` <div class="container">Привет, ${context.userName}!</div> `)
```

Результат:

```json
[
  {
    "type": "el",
    "tag": "div",
    "string": { "class": "container" },
    "child": [
      {
        "type": "text",
        "data": "/context/userName",
        "expr": "Привет, ${[0]}!"
      }
    ]
  }
]
```

---

### Условный рендеринг

```javascript
const nodes = parse(
  ({ html, context }) => html`
    <div>
      ${context.isLoggedIn
        ? html`<span>Добро пожаловать, ${context.userName}!</span>`
        : html`<a href="/login">Войти</a>`}
    </div>
  `
)
```

Результат:

```json
[
  {
    "tag": "div",
    "type": "el",
    "child": [
      {
        "type": "cond",
        "data": "/context/isLoggedIn",
        "child": [
          {
            "tag": "span",
            "type": "el",
            "child": [
              {
                "type": "text",
                "data": "/context/userName",
                "expr": "Добро пожаловать, ${[0]}!"
              }
            ]
          },
          {
            "tag": "a",
            "type": "el",
            "string": { "href": "/login" },
            "child": [
              {
                "type": "text",
                "value": "Войти"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

### Итерация по массиву

```typescript
const nodes = parse(
  ({ html, context, core }) => html`
    <ul>
      ${core.postTitles.map((title) => html`<li>${title}</li>`)}
    </ul>
  `
)
```

Результат:

```json
[
  {
    "tag": "ul",
    "type": "el",
    "child": [
      {
        "type": "map",
        "data": "/core/postTitles",
        "child": [
          {
            "tag": "li",
            "type": "el",
            "child": [
              {
                "type": "text",
                "data": "[item]"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

### Логический оператор

```typescript
const nodes = parse(
  ({ html, context, core }) => html`
    <div>
      ${context.hasNotifications &&
      html`
        <div class="notifications">${core.notificationMessages.map((message) => html`<div>${message}</div>`)}</div>
      `}
    </div>
  `
)
```

Результат:

```json
[
  {
    "tag": "div",
    "type": "el",
    "child": [
      {
        "type": "log",
        "data": "/context/hasNotifications",
        "child": [
          {
            "tag": "div",
            "type": "el",
            "string": { "class": "notifications" },
            "child": [
              {
                "type": "map",
                "data": "/core/notificationMessages",
                "child": [
                  {
                    "tag": "div",
                    "type": "el",
                    "child": [
                      {
                        "type": "text",
                        "data": "[item]"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

### Мета-компонент

```typescript
const nodes = parse(
  ({ html, context, core }) => html`
    <my-component core=${core.widgetConfig} context=${core.userData} class="custom">
      <p>Содержимое компонента</p>
    </my-component>
  `
)
```

Результат:

```json
[
  {
    "tag": "my-component",
    "type": "meta",
    "core": {
      "data": "/core/widgetConfig"
    },
    "context": {
      "data": "/core/userData"
    },
    "string": { "class": "custom" },
    "child": [
      {
        "tag": "p",
        "type": "el",
        "child": [
          {
            "type": "text",
            "value": "Содержимое компонента"
          }
        ]
      }
    ]
  }
]
```

---

### Динамический тег

```typescript
const nodes = parse(
  ({ html, context, core }) => html`
  <meta-${core.componentType} class="dynamic">
    <p>Динамический компонент</p>
  </meta-${core.componentType}>
`
)
```

Результат:

```json
[
  {
    "tag": {
      "data": "/core/componentType",
      "expr": "meta-${[0]}"
    },
    "type": "meta",
    "string": { "class": "dynamic" },
    "child": [
      {
        "tag": "p",
        "type": "el",
        "child": [
          {
            "type": "text",
            "value": "Динамический компонент"
          }
        ]
      }
    ]
  }
]
```

---

### Обработка событий с функцией update

```typescript
const nodes = parse(
  ({ html, context, update }) => html`
    <div>
      <button onclick=${() => update({ count: context.count + 1 })}>Счетчик: ${context.count}</button>
      <input onchange=${(e) => update({ name: e.target.value })} value=${context.name} />
    </div>
  `
)
```

Результат:

```json
[
  {
    "tag": "div",
    "type": "el",
    "child": [
      {
        "tag": "button",
        "type": "el",
        "event": {
          "onclick": {
            "upd": "count",
            "data": "/context/count",
            "expr": "() => update({ count: ${[0]} + 1 })"
          }
        },
        "child": [
          {
            "type": "text",
            "data": "/context/count",
            "expr": "Счетчик: ${[0]}"
          }
        ]
      },
      {
        "tag": "input",
        "type": "el",
        "event": {
          "onchange": {
            "upd": "name",
            "expr": "(e) => update({ name: e.target.value })"
          }
        },
        "string": {
          "value": {
            "data": "/context/name"
          }
        }
      }
    ]
  }
]
```

## Документация

Полная документация с примерами доступна на [GitHub Pages](https://zavx0z.github.io/html-parser/).

## Заметки

- Парсится **первый** `html\`...\`\` в исходнике render‑функции — держите шаблон рядом.
- Данные не нужны на этапе парсинга; условия/циклы сохраняются структурно.
- `meta-${...}` превращается в `{ tag: { data, expr } }`.

## Разработка

```bash
# сборка
bun run build

# тесты
bun test

# документация
bun run docs
```

---

## Лицензия

MIT © zavx0z
