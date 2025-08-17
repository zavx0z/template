# HTML String Tree Parser

Инструмент для извлечения сырого HTML из шаблонных литералов и построения иерархического дерева строк, без выполнения выражений.

## Основная идея

- Принимаем функцию `render`, которая возвращает шаблонный литерал `html` с HTML-разметкой.
- Извлекаем оригинальную строку с сохранением всех `${...}` выражений.
- Парсим строку в древовидную структуру (`StringTreeNode`), где каждый узел содержит исходный текст и список дочерних узлов.

## Поддержка

- Обычные теги: `<div>`, `<p>` и т. д.
- Самозакрывающиеся и void-теги: `<br/>`, `<img />`, `<input>`.
- RAW-теги (не обрабатываются вложенные угловые скобки): `<textarea>`, `<title>`.
- Вложенные выражения `${...}` внутри атрибутов и текста сохраняются как строки.
- Игнорируются пробелы вне тегов.

## Упрощения

- Нет поддержки `<!DOCTYPE>`, `<?xml ...?>`, `<!-- комментариев -->`, `<template>` и `<![CDATA[...]]>`. Считается, что они не встречаются на входе.

## API

### Типы

```ts
export type StringTreeNode = { string: string; children: StringTreeNode[] }

export type Content = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>

export type Render<C extends Content> = ({
  html,
  core,
  context,
  state,
}: {
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  core: { [key: string]: any }
  context: C
  state: string
}) => void
```

### Функции

- `extractHtmlFromRender(render)` — извлекает исходный HTML-шаблон как строку.
- `parseHtmlToStringTree(render)` — строит дерево `StringTreeNode` из HTML-строки.

## Пример

```ts
const tree = parseHtmlToStringTree<{ A: number; B: number }>(
  ({ html, context }) => html`
    <div title="${context.A < context.B ? "yes" : "no"}">
      <span>ok</span>
    </div>
  `
)

console.log(JSON.stringify(tree, null, 2))
```

Результат:

```json
{
  "string": "",
  "children": [
    {
      "string": "<div title=\"${context.A < context.B ? \"yes\" : \"no\"}\">",
      "children": [{ "string": "<span>", "children": [{ "string": "ok", "children": [] }] }]
    }
  ]
}
```

## Тесты

Тесты реализованы на `bun:test`. Покрывают:

1. Простую вложенность.
2. Самозакрывающиеся теги.
3. Кавычки и символы внутри атрибутов.
4. RAW-теги (`<textarea>`, `<title>`).
5. Вставки `${...}` внутри текста и атрибутов.
6. Смешанные кавычки и вложенные выражения.
7. Соседние текстовые узлы и теги.
8. Блоки без тегов внутри (`<pre>`).

Запуск:

```bash
bun test
```
