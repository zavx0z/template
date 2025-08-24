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
                <div class="${company.active ? "active-company" : "inactive-company"}">
                  Status: ${company.active ? "Active" : "Inactive"}
                </div>
                ${company.departments.map(
                  (dept) => html`
                    <article
                      data-company="${company.id}"
                      data-dept="${dept.id}"
                      ${company.active && dept.active && "data-active"}>
                      <h2>Dept: ${company.id}-${dept.id}</h2>
                      <div class="${company.active && dept.active ? "active-dept" : "inactive-dept"}">
                        Status: ${company.active && dept.active ? "Active" : "Inactive"}
                      </div>
                      ${dept.teams.map(
                        (team) => html`
                          <div
                            data-company="${company.id}"
                            data-dept="${dept.id}"
                            data-team="${team.id}"
                            ${company.active && dept.active && team.active && "data-active"}>
                            <h3>Team: ${company.id}-${dept.id}-${team.id}</h3>
                            <div
                              class="${company.active && dept.active && team.active ? "active-team" : "inactive-team"}">
                              Status: ${company.active && dept.active && team.active ? "Active" : "Inactive"}
                            </div>
                            <meta-${team.id} />
                            ${team.members.map(
                              (member) => html`
                                <p
                                  data-company="${company.id}"
                                  data-dept="${dept.id}"
                                  data-team="${team.id}"
                                  data-member="${member.id}"
                                  class="member-${company.id}-${dept.id}-${team.id}-${member.id} ${company.active &&
                                  dept.active &&
                                  team.active &&
                                  member.active
                                    ? "active-member"
                                    : "inactive-member"}"
                                  title="${member.name} (${member.role})"
                                  ${company.active && dept.active && team.active && member.active && "data-active"}>
                                  Member: ${company.id}-${dept.id}-${team.id}-${member.id} (${member.name})
                                  <span class="${member.active ? "online" : "offline"}">
                                    ${member.active ? "Online" : "Offline"}
                                  </span>
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
                    tag: "div",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: ["[item]/Status", "[item]/active"],
                        expr: '${0}: ${${1} ? "Active" : "Inactive"}',
                      },
                    ],
                    attr: {
                      class: {
                        data: "[item]/active",
                        expr: '${0} ? "active-company" : "inactive-company"',
                      },
                    },
                  },
                  {
                    type: "map",
                    data: "[item]/departments",
                    child: [
                      {
                        tag: "article",
                        type: "el",
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
                            tag: "div",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: ["[item]/Status", "../[item]/active", "[item]/active"],
                                expr: '${0}: ${${1} && ${2} ? "Active" : "Inactive"}',
                              },
                            ],
                            attr: {
                              class: {
                                data: ["../[item]/active", "[item]/active"],
                                expr: '${0} && ${1} ? "active-dept" : "inactive-dept"',
                              },
                            },
                          },
                          {
                            type: "map",
                            data: "[item]/teams",
                            child: [
                              {
                                tag: "div",
                                type: "el",
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
                                    tag: "div",
                                    type: "el",
                                    child: [
                                      {
                                        type: "text",
                                        data: [
                                          "../[item]/Status",
                                          "../../[item]/active",
                                          "../[item]/active",
                                          "[item]/active",
                                        ],
                                        expr: '${0}: ${${1} && ${2} && ${3} ? "Active" : "Inactive"}',
                                      },
                                    ],
                                    attr: {
                                      class: {
                                        data: ["../../[item]/active", "../[item]/active", "[item]/active"],
                                        expr: '${0} && ${1} && ${2} ? "active-team" : "inactive-team"',
                                      },
                                    },
                                  },
                                  {
                                    tag: {
                                      data: "[item]/id",
                                      expr: "meta-${0}",
                                    },
                                    type: "meta",
                                  },
                                  {
                                    type: "map",
                                    data: "[item]/members",
                                    child: [
                                      {
                                        tag: "p",
                                        type: "el",
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
                                            expr: "\n                                  Member: ${0}-${1}-${2}-${3} (${4})\n                                  ",
                                          },
                                          {
                                            tag: "span",
                                            type: "el",
                                            child: [
                                              {
                                                type: "text",
                                                data: "[item]/active",
                                                expr: '${${0} ? "Online" : "Offline"}',
                                              },
                                            ],
                                            attr: {
                                              class: {
                                                data: "[item]/active",
                                                expr: '${0} ? "online" : "offline"',
                                              },
                                            },
                                          },
                                        ],
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
                                              "[item]",
                                              "../../../[item]/id",
                                              "../../[item]/id",
                                              "../[item]/id",
                                              "[item]/id",
                                              "../../../[item]/active",
                                              "../../[item]/active",
                                              "../[item]/active",
                                              "[item]/active",
                                            ],
                                            expr: '${0}-${${1}}-${${2}}-${${3}}-${${0}.id} ${${5} && ${6} && ${7} && ${0}.active ? "active-${0}" : "inactive-${0}"',
                                          },
                                          title: {
                                            data: ["[item]/name", "[item]/role"],
                                            expr: "${0} (${1})",
                                          },
                                          "data-active": {
                                            data: "/company/active && dept/active && team/active && member/active",
                                          },
                                        },
                                      },
                                    ],
                                  },
                                ],
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
                              },
                            ],
                          },
                        ],
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
                      },
                    ],
                  },
                ],
                attr: {
                  "data-company": {
                    data: "[item]/id",
                  },
                  "data-active": {
                    data: "/company/active",
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
