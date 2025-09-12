import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../index"

describe("логические операторы с условиями", () => {
  describe("&& &&", () => {
    type Context = { isAdmin: boolean }
    type Core = { user: { role: string } }
    let elements: Node[]

    beforeAll(() => {
      // prettier-ignore
      // #region parse
      elements = parse<Context, Core>(({ html, context, core }) => html`
          <div>
            ${core.user && context.isAdmin && html`
              <div class="admin">Admin Panel</div>
            `}
          </div>
      `)
      // #endregion parse
    })

    it("data", () => {
      expect(elements).toEqual(
        // #region expect
        [
          {
            tag: "div",
            type: "el",
            child: [
              {
                type: "log",
                data: ["/core/user", "/context/isAdmin"],
                expr: "${[0]} && ${[1]}",
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
        ]
        // #endregion expect
      )
    })
  })
})
