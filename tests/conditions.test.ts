import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"

describe("scanTagsFromRender / conditions", () => {
  it("тернарник с внутренними тегами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`<div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<div>", index: 0, name: "div", kind: "open" },
      { text: "<em>", index: 27, name: "em", kind: "open" },
      { text: "A", index: 31, name: "", kind: "text" },
      { text: "</em>", index: 32, name: "em", kind: "close" },
      { text: "<span>", index: 46, name: "span", kind: "open" },
      { text: "b", index: 52, name: "", kind: "text" },
      { text: "</span>", index: 53, name: "span", kind: "close" },
      { text: "</div>", index: 62, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "cond",
            data: "/context/cond",
            true: {
              tag: "em",
              type: "el",
              child: [{ type: "text", value: "A" }],
            },
            false: {
              tag: "span",
              type: "el",
              child: [{ type: "text", value: "b" }],
            },
          },
        ],
      },
    ])
  })
  it("сравнение нескольких переменных", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`<div>${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "cond",
            data: ["/context/cond", "/context/cond2"],
            expr: "${0} && ${1}",
            true: {
              tag: "em",
              type: "el",
              child: [{ type: "text", value: "A" }],
            },
            false: {
              tag: "span",
              type: "el",
              child: [{ type: "text", value: "b" }],
            },
          },
        ],
      },
    ])
  })
  it("сравнение переменных на равенство", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`
        <div>${context.cond === context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "cond",
            data: ["/context/cond", "/context/cond2"],
            expr: "${0} === ${1}",
            true: {
              tag: "em",
              type: "el",
              child: [{ type: "text", value: "A" }],
            },
            false: {
              tag: "span",
              type: "el",
              child: [{ type: "text", value: "b" }],
            },
          },
        ],
      },
    ])
  })

  it("логические операторы без тегов — ничего не находится", () => {
    const html = `a < b && c > d ? "1" : "0"`
    const elements = extractHtmlElements(html)
    expect(elements).toEqual([{ text: 'a < b && c > d ? "1" : "0"', index: 0, name: "", kind: "text" }])
  })

  it("условие вокруг self/void", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }: any) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<div>", index: 0, name: "div", kind: "open" },
      { text: "<br />", index: 27, name: "br", kind: "self" },
      { text: '<img src="x" />', index: 42, name: "img", kind: "self" },
      { text: "</div>", index: 59, name: "div", kind: "close" },
    ])
  })
})
