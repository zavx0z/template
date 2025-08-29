import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../../splitter"
import { makeHierarchy } from "../../hierarchy"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"

describe("object атрибуты (стили) с переменными из разных уровней map", () => {
  it("стили с переменными из разных уровней вложенности", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      {
        companies: {
          id: string
          theme: string
          departments: {
            id: string
            color: string
          }[]
        }[]
      }
    >(
      ({ html, core }) => html`
        <div>
          ${core.companies.map(
            (company) => html`
              <section style="${{ backgroundColor: company.theme }}">
                ${company.departments.map(
                  (dept) => html`
                    <article style="${{ color: company.theme, borderColor: dept.color }}">
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
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    expect(data).toEqual([
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
                          color: { data: "../[item]/theme" },
                          borderColor: { data: "[item]/color" },
                        },
                      },
                    ],
                  },
                ],
                style: {
                  backgroundColor: { data: "[item]/theme" },
                },
              },
            ],
          },
        ],
      },
    ])
  })

  it("стили со смешанными статическими и динамическими значениями", () => {
    const mainHtml = extractMainHtmlBlock<
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
              <div style="${{ 
                color: "red", 
                backgroundColor: user.theme,
                border: "1px solid black",
                fontSize: "14px"
              }}">
                User: ${user.id}
              </div>
            `
          )}
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    expect(data).toEqual([
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
                  backgroundColor: { data: "[item]/theme" },
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
