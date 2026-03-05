# @zavx0z/template

[![npm](https://img.shields.io/npm/v/@zavx0z/renderer)](https://www.npmjs.com/package/@zavx0z/renderer)
[![bun](https://img.shields.io/badge/bun-1.0+-black)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![MDN](https://img.shields.io/badge/MDN-HTML-red)](https://developer.mozilla.org/en-US/docs/Web/HTML)

## Шаблонизатор для **MetaFor**. Извлекает структуру, пути к данным и выражения из tagged template literals **без их выполнения**

`@zavx0z/template` статически парсит исходный код render-функции, достаёт блок `html\`...\`\` и строит нормализованное дерево элементов, текстов, атрибутов, условий, итераций и **meta‑элементов акторов** (в рамках MetaFor).

- Работает в **Node**, **Bun**, браузерах и воркерах
- Поддерживает **условия**, **циклы**, **логические выражения**, **meta‑теги акторов**
- Формирует **пути к данным** и **унифицированные выражения**
- Ничего не исполняет, только анализирует

## Установка

```bash
bun i @zavx0z/template
```

🛠 Пример

```typescript
import { parse } from "@zavx0z/template"
import { Fields } from "@zavx0z/fields"

const { fields, update, onUpdate } = new Fields((t) => ({
  cups: t.number.required(0)({ title: "orders" }),
  last: t.string.optional()({ title: "last ordered drink" }),
}))

const mass = {
  menu: [
    { label: "Espresso", size: "30ml" },
    { label: "Cappuccino", size: "200ml" },
    { label: "Latte", size: "250ml" },
  ],
}

let state = "open"

const nodes = parse<typeof fields, typeof mass, "open" | "closed">(
  ({ html, fields, update, mass, state }) => html`
    <h1>☕ Quick Coffee Order</h1>

    <p>
      Status: ${state === "open" ? "🟢 Open" : "🔴 Closed"} · Orders: ${fields.cups}${fields.last &&
      ` · last: ${fields.last}`}
    </p>

    ${state === "open" &&
    html`
      <ul>
        ${mass.menu.map(
          (product) =>
            html`<li>
              ${product.label} (${product.size})
              <button onclick=${() => update({ cups: fields.cups + 1, last: product.label })}>Add</button>
            </li>`
        )}
      </ul>
    `} ${state === "closed" && html`<p>Come back later — we’ll brew something tasty ☺️</p>`}
  `
)
```

## Документация

Полная документация с описанием и примерами доступна здесь: [https://zavx0z.github.io/template/](https://zavx0z.github.io/template/)

## Лицензия

MIT © zavx0z
