# @zavx0z/html-parser

> HTML template parser for **MetaFor**. Extracts structure, data paths and expressions from tagged template literals **without executing them**.

**RU / EN в одном файле. Russian follows English, both sections are equivalent.**

---

## 🇬🇧 Overview

`@zavx0z/html-parser` reads your render function’s **source** (via `toString`) to pull out the `html`\`...\` block and statically parse it. You get a normalized tree with:

- **Elements & text nodes** (including Web Components)
- **Interpolations** `${...}` in text and attributes
- **`array.map(...)` blocks** with proper **\[item]** scoping
- **Conditions** (ternary `?:`, logical `&&` / `||`), including conditional attributes like `${cond && "disabled"}`
- **Attribute kinds:** string, array-like (e.g. `class`), boolean, **style/object**, and **events** (`on*`)
- **Meta components**: tags that start with `meta-` (including dynamic `meta-${...}`)

The parser produces **data paths** (e.g. `/context/name`, `/core/list`, `[item]/id`, `../[item]/id`) and a **unified expression** form (e.g. `"Hello ${[0]}!"`) that references extracted variables by index.

> No runtime evaluation. Works in Node, Bun, browsers and workers.

### Install

```bash
# npm
npm i @zavx0z/html-parser
# pnpm
dpnm add @zavx0z/html-parser
# yarn
yarn add @zavx0z/html-parser
# bun
bun add @zavx0z/html-parser
```

> Peer: `typescript@^5`. ESM package.

### Quick start

```ts
import { parse, type Node } from "@zavx0z/html-parser"

const tree: Node[] = parse(
  ({ html, context, core }) => html`
    <div class="${context.userStatus}">
      <h1>Hello ${context.userName}!</h1>

      ${core.items.map(
        (g) => html`
          <div class="card ${g.active && "active"}">
            ${g.title ? html`<h2>${g.title}</h2>` : html`<span>No title</span>`}
          </div>
        `
      )}

      <meta-list
        onClick="${core.onClick}"
        style="${{ color: context.color, opacity: core.opacity }}"
        context="${{ filter: context.filter }}"
        core="${{ source: core.source }}" />
    </div>
  `
)
```

### What you get (shape, condensed)

```ts
// Node is a discriminated union
// - Element: { type: "el", tag, child?, string?, array?, boolean?, style?, event?, core?, context? }
// - Text:    { type: "text", value? | data?: string | string[], expr?: string }
// - Map:     { type: "map",  data: string, child: Node[] }
// - Cond:    { type: "cond", data: string | string[], expr?: string, child: [Node, Node] }
// - Meta:    { type: "meta", tag: string | { data: string, expr: string }, child?, ...attrs }
```

**Attributes** are grouped by semantics:

- `string` — scalar attributes. Value is either a static string or `{ data, expr }` if dynamic.
- `array` — list-like attributes (e.g. `class`, `rel`). Each item is `{ value }` or `{ data, expr }`.
- `boolean` — boolean flags. Static `true/false` or `{ data, expr }` for dynamic cases.
- `style` — object-like style mapping `{ key: string | { data, expr } }` from `style="${{ ... }}"`.
- `event` — `on*` handlers carry parsed `{ data, expr, upd? }` (when applicable).
- `core` / `context` — meta attributes accept objects; values become `{ data?, expr?, upd? }`.

**Paths** that may appear in `data`:

- `/context/...`, `/core/...` — absolute bindings
- `[item]` — current `map` item; `../` climbs out of nested maps

**Unified expressions** use `${[i]}` placeholders to reference the `data` variables by index.

### Notes

- The parser extracts the first `html\`...\`\` block from your render function **source**. Keep the template inline.
- No evaluation: conditions and loops are parsed structurally; your data isn’t required at parse time.
- Web Components and `meta-` tags are supported; dynamic `meta-${...}` becomes `{ tag: { data, expr } }`.

### API

```ts
// Parse a render function into a normalized tree
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

### Scripts

```bash
# build distributable
bun run build

# run tests (Bun)
bun test
```

---

## 🇷🇺 Обзор

`@zavx0z/html-parser` читает **исходник** вашей render‑функции (через `toString`), забирает блок `html`\`...\` и **статически** парсит его. Результат — нормализованное дерево с:

- **Элементами и текстовыми узлами** (включая Web Components)
- **Интерполяциями** `${...}` в тексте и атрибутах
- **`array.map(...)`** с корректным скоупом **\[item]**
- **Условиями** (`?:`, `&&` / `||`), в т.ч. `${cond && "disabled"}`
- **Типами атрибутов:** строковые, списковые (`class` и др.), булевы, **style/объект**, **события** (`on*`)
- **Мета‑компонентами**: теги `meta-*` (в т.ч. динамические `meta-${...}`)

Парсер вычисляет **пути к данным** (`/context/name`, `/core/list`, `[item]/id`, `../[item]/id`) и формирует **унифицированные выражения** (например, `"Hello ${[0]}!"`), где индексы ссылаются на переменные из `data`.

> Ничего не исполняется. Работает в Node, Bun, браузерах и воркерах.

### Установка

```bash
npm i @zavx0z/html-parser
# или pnpm / yarn / bun
```

### Быстрый старт

```ts
import { parse } from "@zavx0z/html-parser"

const tree = parse(
  ({ html, context, core }) => html`
    <div class="${context.userStatus}">
      <h1>Привет ${context.userName}!</h1>

      ${core.items.map(
        (g) => html`
          <div class="card ${g.active && "active"}">
            ${g.title ? html`<h2>${g.title}</h2>` : html`<span>Без названия</span>`}
          </div>
        `
      )}

      <meta-list
        onClick="${core.onClick}"
        style="${{ color: context.color, opacity: core.opacity }}"
        context="${{ filter: context.filter }}"
        core="${{ source: core.source }}" />
    </div>
  `
)
```

### Что возвращается (схема, кратко)

```ts
// Element: { type: "el", tag, child?, string?, array?, boolean?, style?, event?, core?, context? }
// Text:    { type: "text", value? | data?: string | string[], expr?: string }
// Map:     { type: "map",  data: string, child: Node[] }
// Cond:    { type: "cond", data: string | string[], expr?: string, child: [Node, Node] }
// Meta:    { type: "meta", tag: string | { data, expr }, child?, ...attrs }
```

**Атрибуты** группируются по смыслу:

- `string` — обычные атрибуты; значение строка или `{ data, expr }`
- `array` — списковые (`class`, `rel` и т.п.); элементы — `{ value }` или `{ data, expr }`
- `boolean` — булевые флаги: `true/false` или `{ data, expr }`
- `style` — объектный вид из `style="${{ ... }}"`: `{ ключ: строка | { data, expr } }`
- `event` — `on*`‑обработчики с разобранными `{ data, expr, upd? }`
- `core` / `context` — объектные meta‑атрибуты; в значениях `{ data?, expr?, upd? }`

**Пути в `data`:** `/context/...`, `/core/...`, `[item]`, `../` для выхода из вложенных `map`.

**Выражения** унифицируются через плейсхолдеры `${[i]}` по порядку переменных.

### Заметки

- Парсится **первый** `html\`...\`\` в исходнике render‑функции — держите шаблон рядом.
- Данные не нужны на этапе парсинга; условия/циклы сохраняются структурно.
- `meta-${...}` превращается в `{ tag: { data, expr } }`.

### Скрипты

```bash
bun run build
bun test
```

---

## License

MIT © zavx0z
