import { describe, it, expect } from "bun:test"
import { parseHtmlToStringTree } from "./index.ts"

describe("parseHtmlToStringTree", () => {
  it("простая вложенность", () => {
    const tree = parseHtmlToStringTree(
      ({ html }) => html`
        <div>
          <p>Hello</p>
          <p>World</p>
        </div>
      `
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<div>",
          children: [
            { string: "<p>", children: [{ string: "Hello", children: [] }] },
            { string: "<p>", children: [{ string: "World", children: [] }] },
          ],
        },
      ],
    })
  })

  it("самозакрывающиеся и void-теги", () => {
    const tree = parseHtmlToStringTree(
      ({ html }) => html`
        <section>
          <img src="a.jpg" />
          <br />
          <input type="text" />
        </section>
      `
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<section>",
          children: [
            { string: `<img src="a.jpg" />`, children: [] },
            { string: "<br />", children: [] },
            { string: `<input type="text" />`, children: [] },
          ],
        },
      ],
    })
  })

  it("кавычки в атрибутах и символы '>' внутри", () => {
    const tree = parseHtmlToStringTree<{ A: number; B: number }>(
      ({ html, context }) => html`
        <div title="${context.A < context.B ? "yes" : "no"}">
          <span>ok</span>
        </div>
      `
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: '<div title="${context.A < context.B ? "yes" : "no"}">',
          children: [{ string: "<span>", children: [{ string: "ok", children: [] }] }],
        },
      ],
    })
  })

  it("textarea как RAW и пробелы вне тегов не сохраняем", () => {
    const tree = parseHtmlToStringTree(
      ({ html }) => html`
        <div>
          <textarea> A < B & C > D </textarea>
        </div>
      `
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<div>",
          children: [
            {
              string: "<textarea>",
              children: [{ string: " A < B & C > D ", children: [] }],
            },
          ],
        },
      ],
    })
  })

  // 2) ${...} в текстовом узле — сравнение по значениям из контекста
  it("${...} в текстовом узле между тегами (context)", () => {
    const tree = parseHtmlToStringTree<{ A: number; B: number }>(
      ({ html, context }) => html`<p>${context.A < context.B ? "a" : "b"} & more</p>`
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<p>",
          children: [{ string: '${context.A < context.B ? "a" : "b"} & more', children: [] }],
        },
      ],
    })
  })

  // 3) self-closing без пробела
  it("self-closing без пробела", () => {
    const tree = parseHtmlToStringTree(({ html }) => html` <div><img /><br /><input /></div> `)
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<div>",
          children: [
            { string: "<img />", children: [] },
            { string: "<br />", children: [] },
            { string: "<input />", children: [] },
          ],
        },
      ],
    })
  })

  // 4) RAW для <title> — сравнение по контексту внутри тела
  it("RAW для <title> (context)", () => {
    const tree = parseHtmlToStringTree<{ A: number; B: number }>(
      ({ html, context }) => html`<div><title>A < B & ${context.A > context.B}</title></div>`
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<div>",
          children: [{ string: "<title>", children: [{ string: "A < B & ${context.A > context.B}", children: [] }] }],
        },
      ],
    })
  })

  // 7) Смешанные кавычки и ${...} в одинарных — сравнение по контексту
  it("атрибуты: одинарные кавычки и ${...} внутри (context)", () => {
    const tree = parseHtmlToStringTree<{ A: number; B: number }>(
      ({ html, context }) => html`<x data="${context.A > context.B ? "yes" : "no"}" y="ok"></x>`
    )
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: '<x data="${context.A > context.B ? "yes" : "no"}" y="ok">',
          children: [],
        },
      ],
    })
  })

  // 9) Соседние текстовые узлы и теги вплотную
  it("соседние текстовые узлы и теги", () => {
    const tree = parseHtmlToStringTree(({ html }) => html` <p>a<b>c</b>d</p> `)
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<p>",
          children: [
            { string: "a", children: [] },
            { string: "<b>", children: [{ string: "c", children: [] }] },
            { string: "d", children: [] },
          ],
        },
      ],
    })
  })

  // 10) Большой блок без угловых скобок внутри, но с ${...}
  it("<pre> с ${...} и текстом, не содержащим теги", () => {
    const tree = parseHtmlToStringTree(({ html }) => html` <pre>${"{}[]() <> not a tag"}</pre> `)
    expect(tree).toEqual({
      string: "",
      children: [
        {
          string: "<pre>",
          children: [{ string: '${"{}[]() <> not a tag"}', children: [] }],
        },
      ],
    })
  })
})
