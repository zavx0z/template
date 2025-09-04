import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock, type PartsHierarchy } from "../parser"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("events", () => {
  describe("onclick с выражением", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`<button onclick=${() => core.onClick()}>OK</button>`
      )
      elements = extractHtmlElements(mainHtml)
    })

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: "() => core.onClick()",
          },
          child: [
            {
              type: "text",
              text: "OK",
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${[0]}()",
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<button onclick=${core.onClick}>OK</button>`)
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: "core.onClick",
          },
          child: [
            {
              type: "text",
              text: "OK",
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "onclick без кавычек со стрелочной функцией").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<button onclick>OK</button>`)
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: "",
          },
          child: [
            {
              type: "text",
              text: "OK",
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "должен поддерживать onclick без значения").toEqual([
        {
          tag: "button",
          type: "el",
          child: [{ type: "text", value: "OK" }],
        },
      ])
    })
  })

  describe("несколько событий в самозакрывающемся теге", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`<input onclick=${() => core.onClick()} oninput="${(e: Event) => core.onInput(e)}" />`
      )
      elements = extractHtmlElements(mainHtml)
    })

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            onclick: "() => core.onClick()",
            oninput: "(e) => core.onInput(e)",
          },
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "должен поддерживать несколько событий on*").toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${[0]}()",
            },
            oninput: {
              data: "/core/onInput",
              expr: "(e) => ${[0]}(e)",
            },
          },
        },
      ])
    })
  })

  describe("oninput без кавычек со стрелочной функцией (input)", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`<input oninput=${(e: Event) => core.onInput(e)} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            oninput: "(e) => core.onInput(e)",
          },
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "oninput без кавычек со стрелочной функцией").toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            oninput: {
              data: "/core/onInput",
              expr: "(e) => ${[0]}(e)",
            },
          },
        },
      ])
    })
  })

  describe("событие внутри массива", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { items: { name: string; onClick: () => void }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.items.map((item) => html`<li onclick=${() => item.onClick()}>${item.name}</li>`)}
          </ul>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.items.map((item)",
              child: [
                {
                  tag: "li",
                  type: "el",
                  event: {
                    onclick: "() => item.onClick()",
                  },
                  child: [
                    {
                      type: "text",
                      text: "${item.name}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
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
                  event: {
                    onclick: {
                      data: "[item]/onClick",
                      expr: "() => ${[0]}()",
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
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
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.buttons.map((btn)",
              child: [
                {
                  tag: "button",
                  type: "el",
                  event: {
                    onclick: "(e) => btn.handleClick(e, btn.id)",
                  },
                  child: [
                    {
                      type: "text",
                      text: "${btn.text}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
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
                  event: {
                    onclick: {
                      data: ["[item]/handleClick", "[item]/id"],
                      expr: "(e) => ${[0]}(e, ${[1]})",
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
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
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "form",
          type: "el",
          event: {
            onsubmit: "(e) => core.handleSubmit(e)",
          },
          string: {
            class: {
              type: "static",
              value: "form",
            },
            method: {
              type: "static",
              value: "post",
            },
          },
          child: [
            {
              tag: "input",
              type: "el",
              string: {
                type: {
                  type: "static",
                  value: "text",
                },
              },
              event: {
                onchange: "(e) => core.handleChange(e)",
              },
            },
            {
              tag: "button",
              type: "el",
              string: {
                type: {
                  type: "static",
                  value: "submit",
                },
              },
              event: {
                onclick: "() => core.onClick()",
              },
              child: [
                {
                  type: "text",
                  text: "Submit",
                },
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "смешанные события и обычные атрибуты").toEqual([
        {
          tag: "form",
          type: "el",
          event: {
            onsubmit: {
              data: "/core/handleSubmit",
              expr: "(e) => ${[0]}(e)",
            },
          },
          string: {
            class: "form",
            method: "post",
          },
          child: [
            {
              tag: "input",
              type: "el",
              string: {
                type: "text",
              },
              event: {
                onchange: {
                  data: "/core/handleChange",
                  expr: "(e) => ${[0]}(e)",
                },
              },
            },
            {
              tag: "button",
              type: "el",
              string: {
                type: "submit",
              },
              event: {
                onclick: {
                  data: "/core/onClick",
                  expr: "() => ${[0]}()",
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { onClick: () => void; isDisabled: boolean }>(
        ({ html, core }) => html`
          <button onclick=${() => core.onClick()} ${core.isDisabled && "disabled"}>Click me</button>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: "() => core.onClick()",
          },
          boolean: {
            disabled: {
              type: "dynamic",
              value: "core.isDisabled",
            },
          },
          child: [
            {
              type: "text",
              text: "Click me",
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data, "события с условными атрибутами").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              data: "/core/onClick",
              expr: "() => ${[0]}()",
            },
          },
          boolean: {
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
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
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.companies.map((company)",
              child: [
                {
                  tag: "section",
                  type: "el",
                  event: {
                    onclick: "() => company.handleCompanyClick(company.id)",
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          text: "Company: ${company.name}",
                        },
                      ],
                    },
                    {
                      type: "map",
                      text: "company.departments.map((dept)",
                      child: [
                        {
                          tag: "article",
                          type: "el",
                          event: {
                            onclick: "() => dept.handleDeptClick(company.id, dept.id)",
                          },
                          child: [
                            {
                              tag: "h2",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  text: "Dept: ${dept.name}",
                                },
                              ],
                            },
                            {
                              type: "map",
                              text: "dept.teams.map((team)",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  event: {
                                    onclick: "() => team.handleTeamClick(company.id, dept.id, team.id)",
                                  },
                                  child: [
                                    {
                                      tag: "h3",
                                      type: "el",
                                      child: [
                                        {
                                          type: "text",
                                          text: "Team: ${team.name}",
                                        },
                                      ],
                                    },
                                    {
                                      type: "map",
                                      text: "team.members.map((member)",
                                      child: [
                                        {
                                          tag: "p",
                                          type: "el",
                                          event: {
                                            onclick:
                                              "() => member.handleMemberClick(company.id, dept.id, team.id, member.id)",
                                          },
                                          child: [
                                            {
                                              type: "text",
                                              text: "Member: ${member.name}",
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

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
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
                  event: {
                    onclick: {
                      data: ["[item]/handleCompanyClick", "[item]/id"],
                      expr: "() => ${[0]}(${[1]})",
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
                          expr: "Company: ${[0]}",
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
                          event: {
                            onclick: {
                              data: ["[item]/handleDeptClick", "../[item]/id", "[item]/id"],
                              expr: "() => ${[0]}(${[1]}, ${[2]})",
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
                                  expr: "Dept: ${[0]}",
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
                                  event: {
                                    onclick: {
                                      data: ["[item]/handleTeamClick", "../../[item]/id", "../[item]/id", "[item]/id"],
                                      expr: "() => ${[0]}(${[1]}, ${[2]}, ${[3]})",
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
                                          expr: "Team: ${[0]}",
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
                                          event: {
                                            onclick: {
                                              data: [
                                                "[item]/handleMemberClick",
                                                "../../../[item]/id",
                                                "../../[item]/id",
                                                "../[item]/id",
                                                "[item]/id",
                                              ],
                                              expr: "() => ${[0]}(${[1]}, ${[2]}, ${[3]}, ${[4]})",
                                            },
                                          },
                                          child: [
                                            {
                                              type: "text",
                                              data: "[item]/name",
                                              expr: "Member: ${[0]}",
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
