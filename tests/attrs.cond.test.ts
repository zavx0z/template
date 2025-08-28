import { extractAttributes } from "../attributes"
import { enrichWithData } from "../data"
import { makeHierarchy } from "../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { describe, it, expect } from "bun:test"

describe("тернарный оператор в атрибуте с числом в качестве условия", () => {
  const mainHtml = extractMainHtmlBlock<{ count: number }>(
    ({ html, context }) => html`
      <div class="${10 > context.count && context.count < 3 ? "active" : "inactive"}">Content</div>
    `
  )
  const elements = extractHtmlElements(mainHtml)
  const hierarchy = makeHierarchy(mainHtml, elements)
  const attributes = extractAttributes(hierarchy)
  const data = enrichWithData(attributes)

  it("data", () =>
    expect(data, "одна переменная в нескольких местах").toEqual([
      {
        tag: "div",
        type: "el",
        string: {
          class: {
            data: "/context/count",
            expr: '${10 > [0] && [0] < 3 ? "active" : "inactive"}',
          },
        },
        child: [
          {
            type: "text",
            value: "Content",
          },
        ],
      },
    ]))
})
