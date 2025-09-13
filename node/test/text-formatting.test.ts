import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("text-formatting", () => {
  describe("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ name: string; title: string }, { items: { title: string }[] }>(
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
                  expr: "${_[0]} - ${_[1]}",
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
                  expr: "${_[0]} - ${_[0]}",
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
                  expr: "${_[0]} is ${_[1]}",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
