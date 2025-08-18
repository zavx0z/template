import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "../index"

describe("scanTagsFromRender / атрибуты", () => {
  it("namespace", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: '<svg:use xlink:href="#id">', index: 0, name: "svg:use", kind: "open" },
      { text: "</svg:use>", index: 26, name: "svg:use", kind: "close" },
    ])
  })

  it("двойные/одинарные кавычки", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: '<a href="https://e.co" target="_blank">', index: 0, name: "a", kind: "open" },
      { text: "</a>", index: 40, name: "a", kind: "close" },
    ])
  })

  it("угловые скобки внутри значения", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<div title="a > b, c < d"></div>`)
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: '<div title="a > b, c < d">', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 26, name: "div", kind: "close" },
    ])
  })
  it("условие в атрибуте", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
    )
    const tags = scanHtmlTags(mainHtml)
    console.log(tags)
    expect(tags).toEqual([
      { text: '<div title="a > b">', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 49, name: "div", kind: "close" },
    ])
  })
})
