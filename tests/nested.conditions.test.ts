import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("nested.conditions", () => {
  it("условия с элементами на разных уровнях вложенности с переменными из разных уровней", () => {
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
              <section data-company="${company.id}">
                <h1>Company: ${company.id}</h1>
                ${company.active
                  ? html`
                      <div class="company-active">
                        <h2>Active Company: ${company.id}</h2>
                        ${company.departments.map(
                          (dept) => html`
                            <div class="dept-summary">
                              ${dept.active
                                ? html`<span class="dept-active-summary">Active Dept: ${dept.id}</span>`
                                : html`<span class="dept-inactive-summary">Inactive Dept: ${dept.id}</span>`}
                            </div>
                          `
                        )}
                      </div>
                    `
                  : html`<div class="company-inactive">Inactive Company</div>`}
                ${company.departments.map(
                  (dept) => html`
                    <article data-dept="${dept.id}">
                      <h2>Dept: ${dept.id}</h2>
                      ${company.active && dept.active
                        ? html`<div class="dept-active">Active Department</div>`
                        : html`<div class="dept-inactive">Inactive Department</div>`}
                      ${dept.teams.map(
                        (team) => html`
                          <div data-team="${team.id}">
                            <h3>Team: ${team.id}</h3>
                            ${company.active && dept.active && team.active
                              ? html`<div class="team-active">Active Team</div>`
                              : html`<div class="team-inactive">Inactive Team</div>`}
                            ${team.members.map(
                              (member) => html`
                                <p data-member="${member.id}">
                                  <span class="member-name">${member.name}</span>
                                  ${company.active && dept.active && team.active && member.active
                                    ? html`<span class="member-status-active">Fully Active</span>`
                                    : html`<span class="member-status-inactive">Not Fully Active</span>`}
                                  ${member.active
                                    ? html`<span class="member-online">Online</span>`
                                    : html`<span class="member-offline">Offline</span>`}
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
                    type: "cond",
                    data: "[item]/active",
                    true: {
                      tag: "div",
                      type: "el",
                      attr: {
                        class: {
                          value: "company-active",
                        },
                      },
                      child: [
                        {
                          tag: "h2",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/id",
                              expr: "Active Company: ${0}",
                            },
                          ],
                        },
                        {
                          type: "map",
                          data: "[item]/departments",
                          child: [
                            {
                              tag: "div",
                              type: "el",
                              attr: {
                                class: {
                                  value: "dept-summary",
                                },
                              },
                              child: [
                                {
                                  type: "cond",
                                  data: "[item]/active",
                                  true: {
                                    tag: "span",
                                    type: "el",
                                    attr: {
                                      class: {
                                        value: "dept-active-summary",
                                      },
                                    },
                                    child: [
                                      {
                                        type: "text",
                                        data: "[item]/id",
                                        expr: "Active Dept: ${0}",
                                      },
                                    ],
                                  },
                                  false: {
                                    tag: "span",
                                    type: "el",
                                    attr: {
                                      class: {
                                        value: "dept-inactive-summary",
                                      },
                                    },
                                    child: [
                                      {
                                        type: "text",
                                        data: "[item]/id",
                                        expr: "Inactive Dept: ${0}",
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    false: {
                      tag: "div",
                      type: "el",
                      attr: {
                        class: {
                          value: "company-inactive",
                        },
                      },
                      child: [
                        {
                          type: "text",
                          value: "Inactive Company",
                        },
                      ],
                    },
                  },
                  {
                    type: "map",
                    data: "[item]/departments",
                    child: [
                      {
                        tag: "article",
                        type: "el",
                        attr: {
                          "data-dept": {
                            data: "[item]/id",
                          },
                        },
                        child: [
                          {
                            tag: "h2",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: "[item]/id",
                                expr: "Dept: ${0}",
                              },
                            ],
                          },
                          {
                            type: "cond",
                            data: ["../[item]/active", "[item]/active"],
                            expr: "${0} && ${1}",
                            true: {
                              tag: "div",
                              type: "el",
                              attr: {
                                class: {
                                  value: "dept-active",
                                },
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "Active Department",
                                },
                              ],
                            },
                            false: {
                              tag: "div",
                              type: "el",
                              attr: {
                                class: {
                                  value: "dept-inactive",
                                },
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "Inactive Department",
                                },
                              ],
                            },
                          },
                          {
                            type: "map",
                            data: "[item]/teams",
                            child: [
                              {
                                tag: "div",
                                type: "el",
                                attr: {
                                  "data-team": {
                                    data: "[item]/id",
                                  },
                                },
                                child: [
                                  {
                                    tag: "h3",
                                    type: "el",
                                    child: [
                                      {
                                        type: "text",
                                        data: "[item]/id",
                                        expr: "Team: ${0}",
                                      },
                                    ],
                                  },
                                  {
                                    type: "cond",
                                    data: ["../../[item]/active", "../[item]/active", "[item]/active"],
                                    expr: "${0} && ${1} && ${2}",
                                    true: {
                                      tag: "div",
                                      type: "el",
                                      attr: {
                                        class: {
                                          value: "team-active",
                                        },
                                      },
                                      child: [
                                        {
                                          type: "text",
                                          value: "Active Team",
                                        },
                                      ],
                                    },
                                    false: {
                                      tag: "div",
                                      type: "el",
                                      attr: {
                                        class: {
                                          value: "team-inactive",
                                        },
                                      },
                                      child: [
                                        {
                                          type: "text",
                                          value: "Inactive Team",
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    type: "map",
                                    data: "[item]/members",
                                    child: [
                                      {
                                        tag: "p",
                                        type: "el",
                                        attr: {
                                          "data-member": {
                                            data: "[item]/id",
                                          },
                                        },
                                        child: [
                                          {
                                            tag: "span",
                                            type: "el",
                                            attr: {
                                              class: {
                                                value: "member-name",
                                              },
                                            },
                                            child: [
                                              {
                                                type: "text",
                                                data: "[item]/name",
                                              },
                                            ],
                                          },
                                          {
                                            type: "cond",
                                            data: "[item]/active",
                                            true: {
                                              tag: "span",
                                              type: "el",
                                              attr: {
                                                class: {
                                                  value: "member-status-active",
                                                },
                                              },
                                              child: [
                                                {
                                                  type: "text",
                                                  value: "Fully Active",
                                                },
                                              ],
                                            },
                                            false: {
                                              tag: "span",
                                              type: "el",
                                              attr: {
                                                class: {
                                                  value: "member-status-inactive",
                                                },
                                              },
                                              child: [
                                                {
                                                  type: "text",
                                                  value: "Not Fully Active",
                                                },
                                              ],
                                            },
                                          },
                                          {
                                            type: "cond",
                                            data: [
                                              "../../../[item]/active",
                                              "../../[item]/active",
                                              "../[item]/active",
                                              "[item]/active",
                                            ],
                                            expr: "${0} && ${1} && ${2} && ${3}",
                                            true: {
                                              tag: "span",
                                              type: "el",
                                              attr: {
                                                class: {
                                                  value: "member-online",
                                                },
                                              },
                                              child: [
                                                {
                                                  type: "text",
                                                  value: "Online",
                                                },
                                              ],
                                            },
                                            false: {
                                              tag: "span",
                                              type: "el",
                                              attr: {
                                                class: {
                                                  value: "member-offline",
                                                },
                                              },
                                              child: [
                                                {
                                                  type: "text",
                                                  value: "Offline",
                                                },
                                              ],
                                            },
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
