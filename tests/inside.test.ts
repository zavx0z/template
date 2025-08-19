import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"

describe("внутри ${...}", () => {
  it("теги внутри тернарника", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html` <div>${context.cond ? html`<p>a</p>` : html`<span>b</span>`}</div> `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<div>", index: 1, name: "div", kind: "open" },
      { text: "<p>", index: 28, name: "p", kind: "open" },
      { text: "a", index: 31, name: "", kind: "text" },
      { text: "</p>", index: 32, name: "p", kind: "close" },
      { text: "<span>", index: 45, name: "span", kind: "open" },
      { text: "b", index: 51, name: "", kind: "text" },
      { text: "</span>", index: 52, name: "span", kind: "close" },
      { text: "</div>", index: 61, name: "div", kind: "close" },
    ])
  })
})
