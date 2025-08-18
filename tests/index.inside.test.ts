import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, scanHtmlTags } from "../index"

describe("scanTagsFromRender / внутри ${...}", () => {
  it("тернарник с внутренними тегами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html` <div>${context.cond ? html`<p>a</p>` : html`<span>b</span>`}</div> `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<div>", index: 1, name: "div", kind: "open" },
      { text: "<p>", index: 28, name: "p", kind: "open" },
      { text: "</p>", index: 32, name: "p", kind: "close" },
      { text: "<span>", index: 45, name: "span", kind: "open" },
      { text: "</span>", index: 52, name: "span", kind: "close" },
      { text: "</div>", index: 61, name: "div", kind: "close" },
    ])
  })
})
