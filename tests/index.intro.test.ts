import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "../index"

describe("scanTagsFromRender / базовые случаи", () => {
  it("простая пара тегов", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      {
        text: "<div>",
        index: 0,
        name: "div",
        kind: "open",
      },
      {
        text: "</div>",
        index: 5,
        name: "div",
        kind: "close",
      },
    ])
  })
})
