import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "../index"

describe("scanTagsFromRender / map", () => {
  it("map рендерит вложенные шаблоны (последовательность name/kind)", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) =>
        html`<ul>
          ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
        </ul>`
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 0, name: "ul", kind: "open" },
      { text: "<li>", index: 49, name: "li", kind: "open" },
      { text: "<em>", index: 68, name: "em", kind: "open" },
      { text: "</em>", index: 73, name: "em", kind: "close" },
      { text: "<strong>", index: 87, name: "strong", kind: "open" },
      { text: "</strong>", index: 96, name: "strong", kind: "close" },
      { text: "</li>", index: 107, name: "li", kind: "close" },
      { text: "</ul>", index: 124, name: "ul", kind: "close" },
    ])
  })

  it("map вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) =>
        html`<ul>
          ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
        </ul>`
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 0, name: "ul", kind: "open" },
      { text: "<li>", index: 59, name: "li", kind: "open" },
      { text: "<em>", index: 97, name: "em", kind: "open" },
      { text: "</em>", index: 105, name: "em", kind: "close" },
      { text: "</li>", index: 113, name: "li", kind: "close" },
      { text: "</ul>", index: 130, name: "ul", kind: "close" },
    ])
  })
  it("map в условии", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
      ({ html, core, context }) =>
        html`${context.flag
          ? html`<ul>
              ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
            </ul>`
          : html`<div>x</div>`}`
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 22, name: "ul", kind: "open" },
      { text: "<li>", index: 85, name: "li", kind: "open" },
      { text: "<em>", index: 123, name: "em", kind: "open" },
      { text: "</em>", index: 131, name: "em", kind: "close" },
      { text: "</li>", index: 139, name: "li", kind: "close" },
      { text: "</ul>", index: 160, name: "ul", kind: "close" },
      { text: "<div>", index: 174, name: "div", kind: "open" },
      { text: "</div>", index: 180, name: "div", kind: "close" },
    ])
  })
})
