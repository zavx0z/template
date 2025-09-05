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
