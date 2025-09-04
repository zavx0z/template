import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import type { PartsHierarchy } from "../hierarchy.t"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("text-formatting", () => {
  describe("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
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

      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
      ])
    })
  })
})
