import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("object атрибуты (стили) с переменными из разных уровней map", () => {
  describe("стили с переменными из разных уровней вложенности", () => {
    let elements: Node[]
    type Core = {
      companies: {
        id: string
        theme: string
        departments: {
          id: string
          color: string
        }[]
      }[]
    }
    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, core }) => html`
          <div>
            ${core.companies.map(
              (company) => html`
                <section style="${{ backgroundColor: company.theme }}">
                  ${company.departments.map(
                    (dept) => html`
                      <article
                        style="${{
                          color: company.theme,
                          borderColor: dept.color,
                        }}">
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
                          style: {
                            color: {
                              data: "../[item]/theme",
                            },
                            borderColor: {
                              data: "[item]/color",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  style: {
                    backgroundColor: {
                      data: "[item]/theme",
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

  describe("стили со смешанными статическими и динамическими значениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<
        any,
        {
          users: {
            id: string
            theme: string
          }[]
        }
      >(
        ({ html, core }) => html`
          <div>
            ${core.users.map(
              (user) => html`
                <div
                  style="${{
                    color: "red",
                    backgroundColor: user.theme,
                    border: "1px solid black",
                    fontSize: "14px",
                  }}">
                  User: ${user.id}
                </div>
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
              data: "/core/users",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/id",
                      expr: "User: ${[0]}",
                    },
                  ],
                  style: {
                    color: "red",
                    backgroundColor: {
                      data: "[item]/theme",
                    },
                    border: "1px solid black",
                    fontSize: "14px",
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
