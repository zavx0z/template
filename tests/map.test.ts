import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock, elementsHierarchy } from "../index"

describe("map", () => {
  it("простой map", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map((name) => html`<li>${name}</li>`)}
        </ul>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 58, name: "li", kind: "open" },
      { text: "</li>", index: 69, name: "li", kind: "close" },
      { text: "</ul>", index: 86, name: "ul", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, tags)
    expect(hierarchy).toEqual([
      {
        tag: "ul",
        type: "el",
        child: [
          {
            type: "map",
            src: "context",
            key: "list",
            child: [
              {
                tag: "li",
                type: "el",
              },
            ],
          },
        ],
      },
    ])
  })
  it("map в элементе вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(
            ({ title, nested }) => html`
              <li>
                <p>${title}</p>
                ${nested.map((n) => html`<em>${n}</em>`)}
              </li>
            `
          )}
        </ul>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 83, name: "li", kind: "open" },
      { text: "<p>", index: 104, name: "p", kind: "open" },
      { text: "</p>", index: 115, name: "p", kind: "close" },
      { text: "<em>", index: 161, name: "em", kind: "open" },
      { text: "</em>", index: 169, name: "em", kind: "close" },
      { text: "</li>", index: 192, name: "li", kind: "close" },
      { text: "</ul>", index: 222, name: "ul", kind: "close" },
    ])
  })
  it("map рендерит вложенные шаблоны (последовательность name/kind)", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
        </ul>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 58, name: "li", kind: "open" },
      { text: "<em>", index: 77, name: "em", kind: "open" },
      { text: "</em>", index: 82, name: "em", kind: "close" },
      { text: "<strong>", index: 96, name: "strong", kind: "open" },
      { text: "</strong>", index: 105, name: "strong", kind: "close" },
      { text: "</li>", index: 116, name: "li", kind: "close" },
      { text: "</ul>", index: 133, name: "ul", kind: "close" },
    ])
  })

  it("map в text вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
        </ul>
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 68, name: "li", kind: "open" },
      { text: "<em>", index: 106, name: "em", kind: "open" },
      { text: "</em>", index: 114, name: "em", kind: "close" },
      { text: "</li>", index: 122, name: "li", kind: "close" },
      { text: "</ul>", index: 139, name: "ul", kind: "close" },
    ])
  })
  it("map в условии", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
      ({ html, core, context }) => html`
        ${context.flag
          ? html`<ul>
              ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
            </ul>`
          : html`<div>x</div>`}
      `
    )
    const tags = scanHtmlTags(mainHtml)
    expect(tags).toEqual([
      { text: "<ul>", index: 31, name: "ul", kind: "open" },
      { text: "<li>", index: 94, name: "li", kind: "open" },
      { text: "<em>", index: 132, name: "em", kind: "open" },
      { text: "</em>", index: 140, name: "em", kind: "close" },
      { text: "</li>", index: 148, name: "li", kind: "close" },
      { text: "</ul>", index: 169, name: "ul", kind: "close" },
      { text: "<div>", index: 183, name: "div", kind: "open" },
      { text: "</div>", index: 189, name: "div", kind: "close" },
    ])
  })
})
