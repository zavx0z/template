import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "../splitter"

describe("scanTagsFromRender / базовые случаи", () => {
  it("простая пара тегов", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<div>", index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 5, name: "div", kind: "close" },
    ])
  })

  it("вложенность и соседние узлы", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <ul>
          <li>a</li>
          <li>b</li>
        </ul>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 24, name: "li", kind: "open" },
      { text: "</li>", index: 29, name: "li", kind: "close" },
      { text: "<li>", index: 45, name: "li", kind: "open" },
      { text: "</li>", index: 50, name: "li", kind: "close" },
      { text: "</ul>", index: 64, name: "ul", kind: "close" },
    ])
  })

  it("void и self", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <div>
          <br />
          <img src="x" />
          <input disabled />
        </div>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<div>", index: 9, name: "div", kind: "open" },
      { text: "<br />", index: 25, name: "br", kind: "self" },
      { text: '<img src="x" />', index: 42, name: "img", kind: "self" },
      { text: "<input disabled />", index: 68, name: "input", kind: "self" },
      { text: "</div>", index: 95, name: "div", kind: "close" },
    ])
  })
})
