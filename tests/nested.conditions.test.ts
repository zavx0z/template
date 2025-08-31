import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"

describe("nested.conditions", () => {
  describe("двойное условие", () => {
    const mainHtml = extractMainHtmlBlock<any, { flag1: boolean; flag2: boolean }>(
      ({ html, context }) => html`
        ${context.flag1
          ? html`<div class="flag1"></div>`
          : context.flag2
          ? html`<div class="flag2"></div>`
          : html`<div class="flag3"></div>`}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () => {
      expect(tokens).toEqual([
        { kind: "cond-open", expr: "context.flag1" },
        { kind: "tag-open", name: "div", text: '<div class="flag1">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "cond-else-if", expr: "context.flag2" },
        { kind: "tag-open", name: "div", text: '<div class="flag2">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "cond-else" },
        { kind: "tag-open", name: "div", text: '<div class="flag3">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "cond-close" },
      ])
    })
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          type: "cond",
          text: "context.flag1",
          true: {
            tag: "div",
            type: "el",
            text: '<div class="flag1">',
          },
          false: {
            type: "cond",
            text: "context.flag2",
            true: {
              tag: "div",
              type: "el",
              text: '<div class="flag2">',
            },
            false: {
              tag: "div",
              type: "el",
              text: '<div class="flag3">',
            },
          },
        },
      ]))
  })
  describe("условия с элементами на разных уровнях вложенности с переменными из разных уровней", () => {
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
                  (dept, deptIndex) => html`
                    <article data-dept="${dept.id}">
                      <h2>Dept: ${dept.id} (Index: ${deptIndex})</h2>
                      ${company.active && dept.active
                        ? html`<div class="dept-active">Active Department</div>`
                        : html`<div class="dept-inactive">Inactive Department</div>`}
                      ${dept.teams.map(
                        (team, teamIndex) => html`
                          <div data-team="${team.id}">
                            <h3>Team: ${team.id} (Dept Index: ${deptIndex}, Team Index: ${teamIndex})</h3>
                            ${company.active && dept.active && team.active
                              ? html`<div class="team-active">Active Team</div>`
                              : html`<div class="team-inactive">Inactive Team</div>`}
                            <meta-${team.id} />
                            ${team.members.map(
                              (member, memberIndex) => html`
                                <p data-member="${member.id}">
                                  <span class="member-name">${member.name}</span>
                                  <span class="member-indices">
                                    Indices: Dept=${deptIndex}, Team=${teamIndex}, Member=${memberIndex}
                                  </span>
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
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
                          expr: "Company: ${[0]}",
                        },
                      ],
                    },
                    {
                      type: "cond",
                      data: "[item]/active",
                      true: {
                        tag: "div",
                        type: "el",
                        child: [
                          {
                            tag: "h2",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: "[item]/id",
                                expr: "Active Company: ${[0]}",
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
                                child: [
                                  {
                                    type: "cond",
                                    data: "[item]/active",
                                    true: {
                                      tag: "span",
                                      type: "el",
                                      child: [
                                        {
                                          type: "text",
                                          data: "[item]/id",
                                          expr: "Active Dept: ${[0]}",
                                        },
                                      ],
                                      string: {
                                        class: "dept-active-summary",
                                      },
                                    },
                                    false: {
                                      tag: "span",
                                      type: "el",
                                      child: [
                                        {
                                          type: "text",
                                          data: "[item]/id",
                                          expr: "Inactive Dept: ${[0]}",
                                        },
                                      ],
                                      string: {
                                        class: "dept-inactive-summary",
                                      },
                                    },
                                  },
                                ],
                                string: {
                                  class: "dept-summary",
                                },
                              },
                            ],
                          },
                        ],
                        string: {
                          class: "company-active",
                        },
                      },
                      false: {
                        tag: "div",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            value: "Inactive Company",
                          },
                        ],
                        string: {
                          class: "company-inactive",
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
                                  data: ["[item]/id", "[index]"],
                                  expr: "Dept: ${[0]} (Index: ${[1]})",
                                },
                              ],
                            },
                            {
                              type: "cond",
                              data: ["../[item]/active", "[item]/active"],
                              expr: "${[0]} && ${[1]}",
                              true: {
                                tag: "div",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    value: "Active Department",
                                  },
                                ],
                                string: {
                                  class: "dept-active",
                                },
                              },
                              false: {
                                tag: "div",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    value: "Inactive Department",
                                  },
                                ],
                                string: {
                                  class: "dept-inactive",
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
                                          data: ["[item]/id", "../[index]", "[index]"],
                                          expr: "Team: ${[0]} (Dept Index: ${[1]}, Team Index: ${[2]})",
                                        },
                                      ],
                                    },
                                    {
                                      type: "cond",
                                      data: ["../../[item]/active", "../[item]/active", "[item]/active"],
                                      expr: "${[0]} && ${[1]} && ${[2]}",
                                      true: {
                                        tag: "div",
                                        type: "el",
                                        child: [
                                          {
                                            type: "text",
                                            value: "Active Team",
                                          },
                                        ],
                                        string: {
                                          class: "team-active",
                                        },
                                      },
                                      false: {
                                        tag: "div",
                                        type: "el",
                                        child: [
                                          {
                                            type: "text",
                                            value: "Inactive Team",
                                          },
                                        ],
                                        string: {
                                          class: "team-inactive",
                                        },
                                      },
                                    },
                                    {
                                      tag: {
                                        data: "[item]/id",
                                        expr: "meta-${[0]}",
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
                                              tag: "span",
                                              type: "el",
                                              child: [
                                                {
                                                  type: "text",
                                                  data: "[item]/name",
                                                },
                                              ],
                                              string: {
                                                class: "member-name",
                                              },
                                            },
                                            {
                                              tag: "span",
                                              type: "el",
                                              child: [
                                                {
                                                  type: "text",
                                                  data: ["../../[index]", "../[index]", "[index]"],
                                                  expr: "Indices: Dept=${[0]}, Team=${[1]}, Member=${[2]}",
                                                },
                                              ],
                                              string: {
                                                class: "member-indices",
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
                                              expr: "${[0]} && ${[1]} && ${[2]} && ${[3]}",
                                              true: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Fully Active",
                                                  },
                                                ],
                                                string: {
                                                  class: "member-status-active",
                                                },
                                              },
                                              false: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Not Fully Active",
                                                  },
                                                ],
                                                string: {
                                                  class: "member-status-inactive",
                                                },
                                              },
                                            },
                                            {
                                              type: "cond",
                                              data: "[item]/active",
                                              true: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Online",
                                                  },
                                                ],
                                                string: {
                                                  class: "member-online",
                                                },
                                              },
                                              false: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Offline",
                                                  },
                                                ],
                                                string: {
                                                  class: "member-offline",
                                                },
                                              },
                                            },
                                          ],
                                          string: {
                                            "data-member": {
                                              data: "[item]/id",
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                  string: {
                                    "data-team": {
                                      data: "[item]/id",
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                          string: {
                            "data-dept": {
                              data: "[item]/id",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    "data-company": {
                      data: "[item]/id",
                    },
                  },
                },
              ],
            },
          ],
        },
      ]))
  })
  describe("условия с индексами разных уровней вложенности", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      {
        companies: {
          id: string
          departments: {
            id: string
            teams: {
              id: string
              members: {
                id: string
                name: string
              }[]
            }[]
          }[]
        }[]
      }
    >(
      ({ html, core }) => html`
        <div>
          ${core.companies.map(
            (company, companyIndex) => html`
              <section data-company="${company.id}">
                <h1>Company ${companyIndex}: ${company.id}</h1>
                ${company.departments.map(
                  (dept, deptIndex) => html`
                    <article data-dept="${dept.id}">
                      <h2>Dept ${deptIndex} in Company ${companyIndex}: ${dept.id}</h2>
                      ${deptIndex === 0 && companyIndex === 0
                        ? html`<div class="first-dept-first-company">First Dept in First Company</div>`
                        : html`<div class="other-dept">Other Department</div>`}
                      ${dept.teams.map(
                        (team, teamIndex) => html`
                          <div data-team="${team.id}">
                            <h3>Team ${teamIndex} in Dept ${deptIndex}: ${team.id}</h3>
                            ${teamIndex === 0 && deptIndex === 0
                              ? html`<div class="first-team-first-dept">First Team in First Dept</div>`
                              : html`<div class="other-team">Other Team</div>`}
                            ${team.members.map(
                              (member, memberIndex) => html`
                                <p data-member="${member.id}">
                                  <span class="member-name">${member.name}</span>
                                  ${memberIndex === 0 && teamIndex === 0 && deptIndex === 0
                                    ? html`<span class="first-member-first-team-first-dept"
                                        >First Member in First Team in First Dept</span
                                      >`
                                    : html`<span class="other-member">Other Member</span>`}
                                  ${memberIndex > 0 && teamIndex > 0
                                    ? html`<span class="not-first-member-not-first-team"
                                        >Not First Member and Not First Team</span
                                      >`
                                    : html`<span class="first-member-or-first-team">First Member or First Team</span>`}
                                  ${companyIndex === 0 && deptIndex === 0 && teamIndex === 0 && memberIndex === 0
                                    ? html`<span class="all-first">All First</span>`
                                    : html`<span class="not-all-first">Not All First</span>`}
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
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
                          data: ["[index]", "[item]/id"],
                          expr: "Company ${[0]}: ${[1]}",
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
                          child: [
                            {
                              tag: "h2",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  data: ["[index]", "../[index]", "[item]/id"],
                                  expr: "Dept ${[0]} in Company ${[1]}: ${[2]}",
                                },
                              ],
                            },
                            {
                              type: "cond",
                              data: ["[index]", "../[index]"],
                              expr: "${[0]} === 0 && ${[1]} === 0",
                              true: {
                                tag: "div",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    value: "First Dept in First Company",
                                  },
                                ],
                                string: {
                                  class: "first-dept-first-company",
                                },
                              },
                              false: {
                                tag: "div",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    value: "Other Department",
                                  },
                                ],
                                string: {
                                  class: "other-dept",
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
                                          data: ["[index]", "../[index]", "[item]/id"],
                                          expr: "Team ${[0]} in Dept ${[1]}: ${[2]}",
                                        },
                                      ],
                                    },
                                    {
                                      type: "cond",
                                      data: ["[index]", "../[index]"],
                                      expr: "${[0]} === 0 && ${[1]} === 0",
                                      true: {
                                        tag: "div",
                                        type: "el",
                                        child: [
                                          {
                                            type: "text",
                                            value: "First Team in First Dept",
                                          },
                                        ],
                                        string: {
                                          class: "first-team-first-dept",
                                        },
                                      },
                                      false: {
                                        tag: "div",
                                        type: "el",
                                        child: [
                                          {
                                            type: "text",
                                            value: "Other Team",
                                          },
                                        ],
                                        string: {
                                          class: "other-team",
                                        },
                                      },
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
                                              tag: "span",
                                              type: "el",
                                              child: [
                                                {
                                                  type: "text",
                                                  data: "[item]/name",
                                                },
                                              ],
                                              string: {
                                                class: "member-name",
                                              },
                                            },
                                            {
                                              type: "cond",
                                              data: ["[index]", "../[index]", "../../[index]"],
                                              expr: "${[0]} === 0 && ${[1]} === 0 && ${[2]} === 0",
                                              true: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "First Member in First Team in First Dept",
                                                  },
                                                ],
                                                string: {
                                                  class: "first-member-first-team-first-dept",
                                                },
                                              },
                                              false: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Other Member",
                                                  },
                                                ],
                                                string: {
                                                  class: "other-member",
                                                },
                                              },
                                            },
                                            {
                                              type: "cond",
                                              data: ["[index]", "../[index]"],
                                              expr: "${[0]} > 0 && ${[1]} > 0",
                                              true: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Not First Member and Not First Team",
                                                  },
                                                ],
                                                string: {
                                                  class: "not-first-member-not-first-team",
                                                },
                                              },
                                              false: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "First Member or First Team",
                                                  },
                                                ],
                                                string: {
                                                  class: "first-member-or-first-team",
                                                },
                                              },
                                            },
                                            {
                                              type: "cond",
                                              data: ["../../../[index]", "../../[index]", "../[index]", "[index]"],
                                              expr: "${[0]} === 0 && ${[1]} === 0 && ${[2]} === 0 && ${[3]} === 0",
                                              true: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "All First",
                                                  },
                                                ],
                                                string: {
                                                  class: "all-first",
                                                },
                                              },
                                              false: {
                                                tag: "span",
                                                type: "el",
                                                child: [
                                                  {
                                                    type: "text",
                                                    value: "Not All First",
                                                  },
                                                ],
                                                string: {
                                                  class: "not-all-first",
                                                },
                                              },
                                            },
                                          ],
                                          string: {
                                            "data-member": {
                                              data: "[item]/id",
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                  string: {
                                    "data-team": {
                                      data: "[item]/id",
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                          string: {
                            "data-dept": {
                              data: "[item]/id",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    "data-company": {
                      data: "[item]/id",
                    },
                  },
                },
              ],
            },
          ],
        },
      ]))
  })
})
