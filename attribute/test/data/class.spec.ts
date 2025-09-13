import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("class атрибуты в data.ts", () => {
  describe("простые случаи", () => {
    describe("class в элементе с одним статическим значением", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: "div-active",
            },
          },
        ])
      })
    })

    describe("class в элементе с одним статическим значением без кавычек", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: "div-active",
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими статическими значениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active div-inactive"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: ["div-active", "div-inactive"],
            },
          },
        ])
      })
    })
  })

  describe("динамические значения", () => {
    describe("class в элементе с одним динамическим значением", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"}"></div>`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним динамическим значением без кавычек", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class=${core.active ? "active" : "inactive"}></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими динамическими значениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`
            <div class="${core.active ? "active" : "inactive"} ${core.active ? "active" : "inactive"}"></div>
          `
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами сравнения", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ count: number }>(
          ({ html, core }) => html`<div class="${core.count > 5 ? "large" : "small"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/count",
                expr: '${_[0] > 5 ? "large" : "small"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами равенства", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ status: string }>(
          ({ html, core }) => html`<div class="${core.status === "loading" ? "loading" : "ready"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/status",
                expr: '${_[0] === "loading" ? "loading" : "ready"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с логическими операторами", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; visible: boolean }>(
          ({ html, core }) => html`<div class="${core.active && core.visible ? "show" : "hide"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/active", "/core/visible"],
                expr: '${_[0] && _[1] ? "show" : "hide"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором ИЛИ", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ error: boolean; warning: boolean }>(
          ({ html, core }) => html`<div class="${core.error || core.warning ? "alert" : "normal"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/error", "/core/warning"],
                expr: '${_[0] || _[1] ? "alert" : "normal"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором НЕ", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ disabled: boolean }>(
          ({ html, core }) => html`<div class="${!core.disabled ? "enabled" : "disabled"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/disabled",
                expr: '${!_[0] ? "enabled" : "disabled"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором И &&", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(({ html, core }) => html`<div class="${core.active && "active"}"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${_[0] && "active"}',
              },
            },
          },
        ])
      })
    })
  })

  describe("смешанные значения", () => {
    describe("class в элементе с одним смешанным значением", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'div-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним смешанным значением без кавычек", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'div-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) =>
            html`<div
              class="div-${core.active ? "active" : "inactive"} div-${core.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
              ],
            },
          },
        ])
      })
    })
  })

  describe("различные варианты", () => {
    describe("class в элементе с смешанным и статическим значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"} visible"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
                "visible",
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с динамическим и статическим значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"} visible"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                "visible",
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с тремя различными типами значений", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; type: string }>(
          ({ html, core }) =>
            html`<div class="static-value ${core.active ? "active" : "inactive"} mixed-${core.type}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "static-value",
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/type",
                  expr: "mixed-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ variant: string; size: string; theme: string }>(
          ({ html, core }) => html`<div class="btn-${core.variant} text-${core.size} bg-${core.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/variant",
                  expr: "btn-${_[0]}",
                },
                {
                  data: "/core/size",
                  expr: "text-${_[0]}",
                },
                {
                  data: "/core/theme",
                  expr: "bg-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с условными классами", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; disabled: boolean }>(
          ({ html, core }) =>
            html`<div
              class="base-class ${core.active ? "active" : "inactive"} ${core.disabled ? "disabled" : ""}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base-class",
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/disabled",
                  expr: '${_[0] ? "disabled" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с вложенными выражениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ nested: boolean }>(
          ({ html, core }) => html`<div class="container ${core.nested ? "nested" : "default"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "container",
                {
                  data: "/core/nested",
                  expr: '${_[0] ? "nested" : "default"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с пустыми значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ hidden: boolean; active: boolean }>(
          ({ html, core }) =>
            html`<div class="visible ${core.hidden ? "" : "show"} ${core.active ? "active" : ""}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "visible",
                {
                  data: "/core/hidden",
                  expr: '${_[0] ? "" : "show"}',
                },
                {
                  data: "/core/active",
                  expr: '${_[0] ? "active" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с атрибутом без кавычек", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, core }) => html`<div class="static-value-${core.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'static-value-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с несколькими переменными", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, core }) => html`<div class="user-${core.user.id}-${core.user.role}-${core.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/user/id", "/core/user/role", "/core/theme"],
                expr: "user-${_[0]}-${_[1]}-${_[2]}",
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с условными выражениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<
          any,
          {
            user: { id: string; role: string }
            theme: string
            isActive: boolean
          }
        >(
          ({ html, core }) =>
            html`<div
              class="user-${core.user.id}-${core.user.role}-${core.theme}-${core.isActive
                ? "active"
                : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/user/id", "/core/user/role", "/core/theme", "/core/isActive"],
                expr: 'user-${_[0]}-${_[1]}-${_[2]}-${_[3] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов со сложной строкой", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, core }) => html`<div class="base user-${core.user.id}-${core.user.role} theme-${core.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base",
                {
                  data: ["/core/user/id", "/core/user/role"],
                  expr: "user-${_[0]}-${_[1]}",
                },
                {
                  data: "/core/theme",
                  expr: "theme-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов и сложными условными выражениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<
          any,
          {
            user: { id: string; role: string }
            theme: string
            isActive: boolean
            isAdmin: boolean
          }
        >(
          ({ html, core }) =>
            html`
              <div
                class="
              base 
              user-${core.user.id} 
              ${core.isActive ? "active" : "inactive"} 
              ${core.isAdmin ? "admin" : "user"} 
              theme-${core.theme}
              "></div>
            `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base",
                {
                  data: "/core/user/id",
                  expr: "user-${_[0]}",
                },
                {
                  data: "/core/isActive",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/isAdmin",
                  expr: '${_[0] ? "admin" : "user"}',
                },
                {
                  data: "/core/theme",
                  expr: "theme-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })
  })
  describe("постфикс с условием и статическими значениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ status: boolean }>(
        ({ html, context }) => html`<div class="${context.status ? "active" : "inactive"}-status">Status</div>`
      )
    })
    it("data", () => {
      expect(elements, "суффикс с условием").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: "/context/status",
              expr: '${_[0] ? "active" : "inactive"}-status',
            },
          },
          child: [
            {
              type: "text",
              value: "Status",
            },
          ],
        },
      ])
    })
  })
})
