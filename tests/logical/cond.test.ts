import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("логические операторы с условиями", () => {
  describe("логический оператор с сложным условием", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isAdmin: boolean }, { user: { role: string } }>(
        ({ html, core, context }) => html`
          <div>${core.user && context.isAdmin && html`<div class="admin">Admin Panel</div>`}</div>
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
              type: "log",
              data: "/core/user",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "admin",
                  },
                  child: [
                    {
                      type: "text",
                      value: "Admin Panel",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
