import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractTokens } from "../token"
import { extractAttributes } from "../attributes"

describe("text-formatting", () => {
  describe("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    const mainHtml = extractMainHtmlBlock<{ name: string; title: string }, { items: { title: string }[] }>(
      ({ html, context, core }) => html`
        <div>
          <p>Hello World</p>
          <span>${context.name} - ${context.title}</span>
          <span>${context.name} - ${core.items.map((item) => item.title).join(", ")}</span>
          <div>Welcome to our site!</div>
          <p>${context.name} is ${context.title}</p>
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Hello World",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/context/name", "/context/title"],
                  expr: "${[0]} - ${[1]}",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/name",
                  expr: "${[0]} - ${[0]}",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Welcome to our site!",
                },
              ],
            },
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/context/name", "/context/title"],
                  expr: "${[0]} is ${[1]}",
                },
              ],
            },
          ],
        },
      ]))
  })
})
