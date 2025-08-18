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
})
