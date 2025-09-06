import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("условные выражения в атрибутах", () => {
  describe("тернарный оператор с числом в качестве условия", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ count: number }>(
        ({ html, context }) => html`
          <div class="${10 > context.count && context.count < 3 ? "active" : "inactive"}">Content</div>
        `
      )
    })
    it("data", () => {
      expect(elements, "одна переменная в нескольких местах").toEqual([
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
      ])
    })
  })
  describe("тернарный оператор сравнения через === с динамическими результатами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ isActive: boolean; status: "waiting" | "running"; item: string }>(
        ({ html, context, core }) => html`
          <div class="${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}">
            Content
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements, "тернарный оператор сравнения с динамическими результатами").toEqual([
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
