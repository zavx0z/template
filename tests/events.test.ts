import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("стандартные события on*", () => {
  describe("onclick с выражением", () => {
    const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<button onclick=${() => core.onClick()}>OK</button>`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${0}()",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("onclick без кавычек со стрелочной функцией", () => {
    const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<button onclick=${core.onClick}>OK</button>`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "onclick без кавычек со стрелочной функцией").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              data: "/core/onClick",
            },
          },
          child: [{ type: "text", value: "OK" }],
        },
      ])
    })
  })

  describe("onclick без значения (булев)", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<button onclick>OK</button>`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "должен поддерживать onclick без значения").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              value: "",
            },
          },
          child: [{ type: "text", value: "OK" }],
        },
      ])
    })
  })

  describe("несколько событий в самозакрывающемся теге", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core }) => html`<input onclick=${() => core.onClick()} oninput="${(e: Event) => core.onInput(e)}" />`
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "должен поддерживать несколько событий on*").toEqual([
        {
          tag: "input",
          type: "el",
          attr: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${0}()",
            },
            oninput: {
              data: "/core/onInput",
              expr: "(e) => ${0}(e)",
            },
          },
        },
      ])
    })
  })

  describe("oninput без кавычек со стрелочной функцией (input)", () => {
    const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<input oninput=${(e: Event) => core.onInput(e)} />`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "oninput без кавычек со стрелочной функцией").toEqual([
        {
          tag: "input",
          type: "el",
          attr: {
            oninput: {
              data: "/core/onInput",
              expr: "(e) => ${0}(e)",
            },
          },
        },
      ])
    })
  })

  describe("событие внутри массива", () => {
    const mainHtml = extractMainHtmlBlock<any, { items: { name: string; onClick: () => void }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.items.map((item) => html`<li onclick=${() => item.onClick()}>${item.name}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "событие внутри массива").toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: "li",
                  type: "el",
                  attr: {
                    onclick: {
                      data: "[item]/onClick",
                      expr: "() => ${0}()",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
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

  describe("событие с параметрами в массиве", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      { buttons: { id: string; text: string; handleClick: (e: Event, id: string) => void }[] }
    >(
      ({ html, core }) => html`
        <div>
          ${core.buttons.map(
            (btn) => html` <button onclick=${(e: Event) => btn.handleClick(e, btn.id)}>${btn.text}</button> `
          )}
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "событие с параметрами в массиве").toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/buttons",
              child: [
                {
                  tag: "button",
                  type: "el",
                  attr: {
                    onclick: {
                      data: ["[item]/handleClick", "[item]/id"],
                      expr: "(e) => ${0}(e, ${1})",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]/text",
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

  describe("смешанные события и обычные атрибуты", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      { handleSubmit: (e: Event) => void; handleChange: (e: Event) => void; onClick: () => void }
    >(
      ({ html, core }) => html`
        <form onsubmit=${(e: Event) => core.handleSubmit(e)} class="form" method="post">
          <input type="text" onchange=${(e: Event) => core.handleChange(e)} />
          <button type="submit" onclick=${() => core.onClick()}>Submit</button>
        </form>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "смешанные события и обычные атрибуты").toEqual([
        {
          tag: "form",
          type: "el",
          attr: {
            onsubmit: {
              data: "/core/handleSubmit",
              expr: "(e) => ${0}(e)",
            },
            class: {
              value: "form",
            },
            method: {
              value: "post",
            },
          },
          child: [
            {
              tag: "input",
              type: "el",
              attr: {
                type: {
                  value: "text",
                },
                onchange: {
                  data: "/core/handleChange",
                  expr: "(e) => ${0}(e)",
                },
              },
            },
            {
              tag: "button",
              type: "el",
              attr: {
                type: {
                  value: "submit",
                },
                onclick: {
                  data: "/core/onClick",
                  expr: "() => ${0}()",
                },
              },
              child: [
                {
                  type: "text",
                  value: "Submit",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("события с условными атрибутами", () => {
    const mainHtml = extractMainHtmlBlock<any, { onClick: () => void; isDisabled: boolean }>(
      ({ html, core }) => html`
        <button onclick=${() => core.onClick()} ${core.isDisabled && "disabled"}>Click me</button>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)
    it("парсинг", () => {
      expect(data, "события с условными атрибутами").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${0}()",
            },
            disabled: {
              data: "/core/isDisabled",
            },
          },
          child: [
            {
              type: "text",
              value: "Click me",
            },
          ],
        },
      ])
    })
  })

  describe("вложенные события с несколькими уровнями map", () => {
    const mainHtml = extractMainHtmlBlock<
      any,
      {
        companies: {
          id: string
          name: string
          handleCompanyClick: (id: string) => void
          departments: {
            id: string
            name: string
            handleDeptClick: (companyId: string, deptId: string) => void
            teams: {
              id: string
              name: string
              handleTeamClick: (companyId: string, deptId: string, teamId: string) => void
              members: {
                id: string
                name: string
                handleMemberClick: (companyId: string, deptId: string, teamId: string, memberId: string) => void
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
              <section onclick=${() => company.handleCompanyClick(company.id)}>
                <h1>Company: ${company.name}</h1>
                ${company.departments.map(
                  (dept) => html`
                    <article onclick=${() => dept.handleDeptClick(company.id, dept.id)}>
                      <h2>Dept: ${dept.name}</h2>
                      ${dept.teams.map(
                        (team) => html`
                          <div onclick=${() => team.handleTeamClick(company.id, dept.id, team.id)}>
                            <h3>Team: ${team.name}</h3>
                            ${team.members.map(
                              (member) => html`
                                <p onclick=${() => member.handleMemberClick(company.id, dept.id, team.id, member.id)}>
                                  Member: ${member.name}
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
    it("парсинг вложенных событий", () => {
      expect(data, "вложенные события с правильными путями").toEqual([
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
                    onclick: {
                      data: ["[item]/handleCompanyClick", "[item]/id"],
                      expr: "() => ${0}(${1})",
                    },
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
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
                            onclick: {
                              data: ["[item]/handleDeptClick", "../[item]/id", "[item]/id"],
                              expr: "() => ${0}(${1}, ${2})",
                            },
                          },
                          child: [
                            {
                              tag: "h2",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  data: "[item]/name",
                                  expr: "Dept: ${0}",
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
                                    onclick: {
                                      data: ["[item]/handleTeamClick", "../../[item]/id", "../[item]/id", "[item]/id"],
                                      expr: "() => ${0}(${1}, ${2}, ${3})",
                                    },
                                  },
                                  child: [
                                    {
                                      tag: "h3",
                                      type: "el",
                                      child: [
                                        {
                                          type: "text",
                                          data: "[item]/name",
                                          expr: "Team: ${0}",
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
                                            onclick: {
                                              data: [
                                                "[item]/handleMemberClick",
                                                "../../../[item]/id",
                                                "../../[item]/id",
                                                "../[item]/id",
                                                "[item]/id",
                                              ],
                                              expr: "() => ${0}(${1}, ${2}, ${3}, ${4})",
                                            },
                                          },
                                          child: [
                                            {
                                              type: "text",
                                              data: "[item]/name",
                                              expr: "Member: ${0}",
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
})
