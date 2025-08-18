import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "../index"

describe("scanTagsFromRender / conditions", () => {
  it("тернарник с внутренними тегами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }: any) => html`<div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div>`
    )
    const tokens = scanHtmlTags(mainHtml).map((t) => ({ name: t.name, kind: t.kind }))
    expect(tokens).toEqual([
      { name: "div", kind: "open" },
      { name: "em", kind: "open" },
      { name: "em", kind: "close" },
      { name: "span", kind: "open" },
      { name: "span", kind: "close" },
      { name: "div", kind: "close" },
    ])
  })

  it("логические операторы без тегов — ничего не находится", () => {
    const html = `a < b && c > d ? "1" : "0"`
    const tags = scanHtmlTags(html)
    expect(tags).toEqual([])
  })

  it("условие вокруг self/void", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }: any) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`
    )
    const tokens = scanHtmlTags(mainHtml).map((t) => ({ name: t.name, kind: t.kind }))
    expect(tokens).toEqual([
      { name: "div", kind: "open" },
      { name: "br", kind: "self" },
      { name: "img", kind: "self" },
      { name: "div", kind: "close" },
    ])
  })
  it("условие в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(({ title, nested }) => html` <li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li> `)}
        </ul>
      `
    )
    const tokens = scanHtmlTags(mainHtml)
    expect(tokens).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 69, name: "li", kind: "open" },
      { text: "<em>", index: 107, name: "em", kind: "open" },
      { text: "</em>", index: 115, name: "em", kind: "close" },
      { text: "</li>", index: 123, name: "li", kind: "close" },
      { text: "</ul>", index: 141, name: "ul", kind: "close" },
    ])
  })
})
