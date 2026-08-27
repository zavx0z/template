# `@zavx0z/template`

Компилятор HTML-шаблонов в адресные операции над `@zavx0z/dom`.

Основной runtime-путь создаёт настоящие `Node`, `Element`, `HTMLElement` и
`Text`. Повторное обновление меняет только связанные текст, атрибут или
обработчик и сохраняет идентичность остальных DOM-объектов. Пакет ничего не
знает об Engine, layout, paint, WebGPU или UI-компонентах.

## Установка

```bash
bun add @zavx0z/template
```

## Direct DOM

```typescript
import {createDocument} from "@zavx0z/dom"
import {compile, html} from "@zavx0z/template"

const document = createDocument()
const root = document.createElement("div")
document.appendChild(root)

const counter = compile((state: {count: number; increment: () => void}) => html`
  <button title="Increase counter" onclick=${state.increment}>
    Count: ${state.count}
  </button>
`)

const instance = counter.mount(root, {count: 0, increment: () => {}})
const button = root.children[0]

instance.update({count: 1, increment: () => {}})
// button === root.children[0]
```

`instance.rootNodes` возвращает только authored root nodes. Внутренние
`Comment`-границы остаются приватной частью адресации. `@zavx0z/dom` подключён
как peer dependency и не встраивается в browser bundle, поэтому приложение и
Template работают в одном DOM realm.

`onclick=${handler}` подключается через стандартные
`addEventListener`/`removeEventListener`. `title`, `class`, `disabled`, `style`
и остальные атрибуты записываются через стандартный DOM API. Вложенные
`html`-шаблоны обновляются на месте, а массивы пока сопоставляются по позиции.
Динамические строки не парсятся повторно: в содержимом они становятся `Text`,
а в атрибутах передаются напрямую в `setAttribute`.

Границы первого среза и проверяемые требования находятся в
[`requirements.md`](./requirements.md).

## Статический syntax parser

Отдельный `parse()` API статически читает callback с `html\`...\`` и возвращает
типизированное syntax tree, не выполняя переданную функцию. Этот путь остаётся
для DSL-потребителей и не участвует в DOM runtime.

```typescript
import {parse} from "@zavx0z/template"

const nodes = parse(({html, value}) => html`
  <article>
    <h1>${value.title}</h1>
    ${value.items.map((item) => html`<p>${item.label}</p>`)}
  </article>
`)
```

`parse()` возвращает syntax `Node[]`. Public TSDoc в исходниках описывает точную форму
узлов, paths, expressions и ошибки parser.

## Nested Style

`style` принимает JavaScript-like object literal. Parser рекурсивно сохраняет
CSS-свойства, quoted selectors и at-rules, но не проверяет их словарь и не
придаёт им runtime-семантику:

```typescript
const nodes = parse(({html, fields}) => html`
  <button
    style=${{
      display: "flex",
      width: "100%",
      "&:hover": {
        color: fields.hoverColor,
        "& .icon": {
          transform: `translateX(${fields.offset}px)`,
        },
      },
    }}>
    Save
  </button>
`)
```

Статические leaves остаются строками. Простой dynamic path становится
`{data: path}`, а ternary или template expression — `{data, expr}`. Вложенные
объекты имеют ту же рекурсивную форму. Callback и expressions при этом не
исполняются.

## Граница статического parser

- Parser не создаёт DOM и не рендерит результат.
- Callback и expressions не исполняются.
- Parser не содержит allowlist CSS-свойств, selectors или at-rules.
- Синтаксис остаётся намеренно меньше полного XML/HTML стандарта.
- Доменная семантика и runtime validation не входят в пакет.

Toolchain: Bun `1.4.0`, TypeScript `7.0.2`.

## Лицензия

MIT © zavx0z
