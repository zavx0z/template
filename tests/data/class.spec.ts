import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"
import type { PartsHierarchy } from "../../hierarchy.t"

describe("class атрибуты в data.ts", () => {
  describe("простые случаи", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    describe("class в элементе с одним статическим значением", () => {
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html }) => html`<div class="div-active"></div>`)
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
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
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html }) => html`<div class="div-active"></div>`)
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
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
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html }) => html`<div class="div-active div-inactive"></div>`)
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [{ value: "div-active" }, { value: "div-inactive" }],
            },
          },
        ])
      })
    })
  })

  describe("динамические значения", () => {
    describe("class в элементе с одним динамическим значением", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним динамическим значением без кавычек", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class=${core.active ? "active" : "inactive"}></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими динамическими значениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) =>
            html`<div class="${core.active ? "active" : "inactive"} ${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : "inactive"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами сравнения", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ count: number }>(
          ({ html, core }) => html`<div class="${core.count > 5 ? "large" : "small"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/count",
                expr: '${[0] > 5 ? "large" : "small"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами равенства", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ status: string }>(
          ({ html, core }) => html`<div class="${core.status === "loading" ? "loading" : "ready"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/status",
                expr: '${[0] === "loading" ? "loading" : "ready"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с логическими операторами", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean; visible: boolean }>(
          ({ html, core }) => html`<div class="${core.active && core.visible ? "show" : "hide"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/active", "/core/visible"],
                expr: '${[0] && [1] ? "show" : "hide"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором ИЛИ", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ error: boolean; warning: boolean }>(
          ({ html, core }) => html`<div class="${core.error || core.warning ? "alert" : "normal"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/error", "/core/warning"],
                expr: '${[0] || [1] ? "alert" : "normal"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором НЕ", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ disabled: boolean }>(
          ({ html, core }) => html`<div class="${!core.disabled ? "enabled" : "disabled"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/disabled",
                expr: '${![0] ? "enabled" : "disabled"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором И &&", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="${core.active && "active"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: '${[0] && "active"}',
              },
            },
          },
        ])
      })
    })
  })

  describe("смешанные значения", () => {
    describe("class в элементе с одним смешанным значением", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'div-${[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним смешанным значением без кавычек", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'div-${[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) =>
            html`<div
              class="div-${core.active ? "active" : "inactive"} div-${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: 'div-${[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/active",
                  expr: 'div-${[0] ? "active" : "inactive"}',
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
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"} visible"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: 'div-${[0] ? "active" : "inactive"}',
                },
                { value: "visible" },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с динамическим и статическим значениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"} visible"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : "inactive"}',
                },
                { value: "visible" },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с тремя различными типами значений", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean; type: string }>(
          ({ html, core }) =>
            html`<div class="static-value ${core.active ? "active" : "inactive"} mixed-${core.type}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "static-value" },
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/type",
                  expr: "mixed-${[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ variant: string; size: string; theme: string }>(
          ({ html, core }) => html`<div class="btn-${core.variant} text-${core.size} bg-${core.theme}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/core/variant",
                  expr: "btn-${[0]}",
                },
                {
                  data: "/core/size",
                  expr: "text-${[0]}",
                },
                {
                  data: "/core/theme",
                  expr: "bg-${[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с условными классами", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean; disabled: boolean }>(
          ({ html, core }) =>
            html`<div
              class="base-class ${core.active ? "active" : "inactive"} ${core.disabled ? "disabled" : ""}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "base-class" },
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/disabled",
                  expr: '${[0] ? "disabled" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с вложенными выражениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ nested: boolean }>(
          ({ html, core }) => html`<div class="container ${core.nested ? "nested" : "default"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "container" },
                {
                  data: "/core/nested",
                  expr: '${[0] ? "nested" : "default"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с пустыми значениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ hidden: boolean; active: boolean }>(
          ({ html, core }) =>
            html`<div class="visible ${core.hidden ? "" : "show"} ${core.active ? "active" : ""}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "visible" },
                {
                  data: "/core/hidden",
                  expr: '${[0] ? "" : "show"}',
                },
                {
                  data: "/core/active",
                  expr: '${[0] ? "active" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с атрибутом без кавычек", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
          ({ html, core }) => html`<div class="static-value-${core.active ? "active" : "inactive"}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/core/active",
                expr: 'static-value-${[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с несколькими переменными", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, core }) => html`<div class="user-${core.user.id}-${core.user.role}-${core.theme}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/user/id", "/core/user/role", "/core/theme"],
                expr: "user-${[0]}-${[1]}-${[2]}",
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с условными выражениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<
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
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/core/user/id", "/core/user/role", "/core/theme", "/core/isActive"],
                expr: 'user-${[0]}-${[1]}-${[2]}-${[3] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов со сложной строкой", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, core }) => html`<div class="base user-${core.user.id}-${core.user.role} theme-${core.theme}"></div>`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "base" },
                {
                  data: ["/core/user/id", "/core/user/role"],
                  expr: "user-${[0]}-${[1]}",
                },
                {
                  data: "/core/theme",
                  expr: "theme-${[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов и сложными условными выражениями", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<
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
        elements = extractHtmlElements(mainHtml)
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })

        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                { value: "base" },
                {
                  data: "/core/user/id",
                  expr: "user-${[0]}",
                },
                {
                  data: "/core/isActive",
                  expr: '${[0] ? "active" : "inactive"}',
                },
                {
                  data: "/core/isAdmin",
                  expr: '${[0] ? "admin" : "user"}',
                },
                {
                  data: "/core/theme",
                  expr: "theme-${[0]}",
                },
              ],
            },
          },
        ])
      })
    })
  })
  describe("постфикс с условием и статическими значениями", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ status: boolean }>(
        ({ html, context }) => html`<div class="${context.status ? "active" : "inactive"}-status">Status</div>`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
      expect(data, "суффикс с условием").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: "/context/status",
              expr: '${[0] ? "active" : "inactive"}-status',
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
