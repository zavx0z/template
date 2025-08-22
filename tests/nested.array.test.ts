import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("nested.array", () => {
  it("4 уровня вложенности map с переменными из предыдущих уровней (полный тест)", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      {
        companies: {
          id: string
          active: boolean
          departments: {
            id: string
            active: boolean
            teams: {
              id: string
              active: boolean
              members: {
                id: string
                active: boolean
                name: string
                role: string
              }[]
            }[]
          }[]
        }[]
      }
    >(
      ({ html, core }) => html`
        <div>
          ${core.companies.map(
            (company) => html`
              <section data-company="${company.id}" ${company.active && "data-active"}>
                <h1>Company: ${company.id}</h1>
                ${company.departments.map(
                  (dept) => html`
                    <article
                      data-company="${company.id}"
                      data-dept="${dept.id}"
                      ${company.active && dept.active && "data-active"}>
                      <h2>Dept: ${company.id}-${dept.id}</h2>
                      ${dept.teams.map(
                        (team) => html`
                          <div
                            data-company="${company.id}"
                            data-dept="${dept.id}"
                            data-team="${team.id}"
                            ${company.active && dept.active && team.active && "data-active"}>
                            <h3>Team: ${company.id}-${dept.id}-${team.id}</h3>
                            ${team.members.map(
                              (member) => html`
                                <p
                                  data-company="${company.id}"
                                  data-dept="${dept.id}"
                                  data-team="${team.id}"
                                  data-member="${member.id}"
                                  class="member-${company.id}-${dept.id}-${team.id}-${member.id}"
                                  title="${member.name} (${member.role})"
                                  ${company.active && dept.active && team.active && member.active && "data-active"}>
                                  Member: ${company.id}-${dept.id}-${team.id}-${member.id} (${member.name})
                                </p>
                              `
                            )}
                          </div>
                        `
                      )}
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
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
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
                attr: {
                  "data-company": {
                    data: "[item]/id",
                  },
                  "data-active": {
                    data: "/company/active",
                  },
                },
                child: [
                  {
                    tag: "h1",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: "[item]/id",
                        expr: "Company: ${0}",
                      },
                    ],
                  },
                  {
                    type: "map",
                    data: "[item]/departments",
                    child: [
                      {
                        tag: "article",
                        type: "el",
                        attr: {
                          "data-company": {
                            data: "../[item]/id",
                          },
                          "data-dept": {
                            data: "[item]/id",
                          },
                          "data-active": {
                            data: "/company/active && dept/active",
                          },
                        },
                        child: [
                          {
                            tag: "h2",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: ["../[item]/id", "[item]/id"],
                                expr: "Dept: ${0}-${1}",
                              },
                            ],
                          },
                          {
                            type: "map",
                            data: "[item]/teams",
                            child: [
                              {
                                tag: "div",
                                type: "el",
                                attr: {
                                  "data-company": {
                                    data: "../../[item]/id",
                                  },
                                  "data-dept": {
                                    data: "../[item]/id",
                                  },
                                  "data-team": {
                                    data: "[item]/id",
                                  },
                                  "data-active": {
                                    data: "/company/active && dept/active && team/active",
                                  },
                                },
                                child: [
                                  {
                                    tag: "h3",
                                    type: "el",
                                    child: [
                                      {
                                        type: "text",
                                        data: ["../../[item]/id", "../[item]/id", "[item]/id"],
                                        expr: "Team: ${0}-${1}-${2}",
                                      },
                                    ],
                                  },
                                  {
                                    type: "map",
                                    data: "[item]/members",
                                    child: [
                                      {
                                        tag: "p",
                                        type: "el",
                                        attr: {
                                          "data-company": {
                                            data: "../../../[item]/id",
                                          },
                                          "data-dept": {
                                            data: "../../[item]/id",
                                          },
                                          "data-team": {
                                            data: "../[item]/id",
                                          },
                                          "data-member": {
                                            data: "[item]/id",
                                          },
                                          class: {
                                            data: [
                                              "../../../[item]/id",
                                              "../../[item]/id",
                                              "../[item]/id",
                                              "[item]/id",
                                            ],
                                            expr: "member-${0}-${1}-${2}-${3}",
                                          },
                                          title: {
                                            data: ["[item]/name", "[item]/role"],
                                            expr: "${0} (${1})",
                                          },
                                          "data-active": {
                                            data: "/company/active && dept/active && team/active && member/active",
                                          },
                                        },
                                        child: [
                                          {
                                            type: "text",
                                            data: [
                                              "../../../[item]/id",
                                              "../../[item]/id",
                                              "../[item]/id",
                                              "[item]/id",
                                              "[item]/name",
                                            ],
                                            expr: "Member: ${0}-${1}-${2}-${3} (${4})",
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
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
