import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("boolean атрибуты", () => {
  it("булевые атрибуты с переменными из разных уровней вложенности", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        any,
        {
          companies: {
            id: string
            active: boolean
            departments: {
              id: string
              active: boolean
            }[]
          }[]
        }
      >(
        ({ html, core }) => html`
          <div>
            ${core.companies.map(
              (company) => html`
                <section ${company.active && "data-active"}>
                  ${company.departments.map(
                    (dept) => html`
                      <article ${company.active && dept.active && "data-active"}>
                        Dept: ${company.id}-${dept.id}
                      </article>
                    `
                  )}
                </section>
              `
            )}
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
              type: "map",
              data: "/core/companies",
              child: [
                {
                  tag: "section",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "[item]/departments",
                      child: [
                        {
                          tag: "article",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: ["../[item]/id", "[item]/id"],
                              expr: "Dept: ${[0]}-${[1]}",
                            },
                          ],
                          boolean: {
                            "data-active": {
                              data: ["../[item]/active", "[item]/active"],
                              expr: "${[0]} && ${[1]}",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  boolean: {
                    "data-active": {
                      data: "[item]/active",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("boolean атрибуты с переменными из разных уровней map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { visible: boolean }>(
        ({ html, context }) => html`<img src="https://example.com" ${context.visible ? "visible" : "hidden"} />`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "img",
          type: "el",
          string: {
            src: "https://example.com",
          },
          boolean: {
            visible: {
              data: "/context/visible",
            },
            hidden: {
              data: "/context/visible",
              expr: "!${[0]}",
            },
          },
        },
      ])
    })
  })
})
