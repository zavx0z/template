import type { PartAttrs } from "../attributes.t"
import { enrichWithData } from "../data"
import type { Node } from "../index.t"
import { extractHtmlElements, extractMainHtmlBlock } from "../parser"
import { describe, it, expect, beforeAll } from "bun:test"

describe("условные выражения в атрибутах", () => {
  describe("тернарный оператор с числом в качестве условия", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ count: number }>(
        ({ html, context }) => html`
          <div class="${10 > context.count && context.count < 3 ? "active" : "inactive"}">Content</div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })

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
  })
  describe("тернарный оператор сравнения через === с динамическими результатами", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ isActive: boolean; status: "waiting" | "running"; item: string }>(
        ({ html, context, core }) => html`
          <div class="${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}">
            Content
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements, "тернарный оператор сравнения с динамическими результатами").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              type: "dynamic",
              value: '${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              text: "Content",
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data, "тернарный оператор сравнения с динамическими результатами").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: ["/core/isActive", "/context/isActive", "/context/item", "/context/status"],
              expr: '${[0] === [1] ? `${[2]}-active-${[3]}` : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
})
