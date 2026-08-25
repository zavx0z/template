# `@zavx0z/template`

Browser-safe parser ограниченного HTML-like template syntax.

Пакет статически читает callback с `html\`...\`` и возвращает типизированное
дерево, не выполняя переданную функцию. Он сохраняет авторский порядок и
поддерживает элементы, атрибуты, текст, интерполяции, тернарные и логические
ветви, `map()` и custom elements.

Смысл тегов, допустимые expressions и преобразование дерева принадлежат
потребителю. Например, MetaFor отдельно проверяет Matter и превращает syntax
nodes в `MatterSchema`.

## Установка

```bash
bun add @zavx0z/template
```

## Использование

```typescript
import {parse} from "@zavx0z/template"

const nodes = parse(({html, value}) => html`
  <article>
    <h1>${value.title}</h1>
    ${value.items.map((item) => html`<p>${item.label}</p>`)}
  </article>
`)
```

`parse()` возвращает `Node[]`. Public TSDoc в исходниках описывает точную форму
узлов, paths, expressions и ошибки parser.

## Граница

- Parser не создаёт DOM и не рендерит результат.
- Callback и expressions не исполняются.
- Синтаксис остаётся намеренно меньше полного XML/HTML стандарта.
- Доменная семантика и runtime validation не входят в пакет.

Toolchain: Bun `1.4.0`, TypeScript `7.0.2`.

## Лицензия

MIT © zavx0z
