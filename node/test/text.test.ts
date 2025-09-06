import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("text", () => {
  describe("смешанный текст - статический + динамический (с одной переменной)", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ name: string }>(
        ({ html, context }) => html`
          <div>
            <p>Hello, ${context.name}!</p>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
                  data: "/context/name",
                  expr: "Hello, ${[0]}!",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("смешанный текст - статический + динамический (с несколькими переменными)", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ firstName: string; lastName: string }>(
        ({ html, context }) => html`
          <div>
            <p>Hello, ${context.firstName} ${context.lastName}!</p>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
                  data: ["/context/firstName", "/context/lastName"],
                  expr: "Hello, ${[0]} ${[1]}!",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
