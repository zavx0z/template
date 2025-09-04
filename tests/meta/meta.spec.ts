import { describe, expect, it, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { PartsHierarchy } from "../../hierarchy.t"
import type { Node } from "../../index.t"
import type { PartAttrs } from "../../attributes.t"

describe("meta", () => {
  describe("теги", () => {
    describe("актор web-component", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html }) => html`<meta-hash></meta-hash>`)
        elements = extractHtmlElements(mainHtml)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            text: "<meta-hash>",
          },
        ])
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("актор web-component с самозакрывающимся тегом", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html }) => html`<meta-hash />`)
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            text: "<meta-hash />",
          },
        ])
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("хеш-тег из core в самозакрывающемся теге", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<meta-${core.actors.child} />`)
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.actors.child}",
            type: "meta",
            text: "<meta-${core.actors.child} />",
          },
        ])
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/actors/child",
              expr: "meta-${[0]}",
            },
            type: "meta",
          },
        ])
      })
    })

    describe("хеш-тег из core", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core }) => html`<meta-${core.actors.child}></meta-${core.actors.child}>`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.actors.child}",
            type: "meta",
            text: "<meta-${core.actors.child}>",
          },
        ])
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/actors/child",
              expr: "meta-${[0]}",
            },
            type: "meta",
          },
        ])
      })
    })

    describe("meta-тег в простом элементе", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<div><meta-${core.tag} /></div>`)
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            text: "<div>",
            child: [
              {
                tag: "meta-${core.tag}",
                type: "meta",
                text: "<meta-${core.tag} />",
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
        expect(data).toEqual([
          {
            tag: "div",
            type: "el",
            child: [
              {
                tag: {
                  data: "/core/tag",
                  expr: "meta-${[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в meta-теге", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<meta-hash><meta-${core.tag} /></meta-hash>`)
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            text: "<meta-hash>",
            child: [
              {
                tag: "meta-${core.tag}",
                type: "meta",
                text: "<meta-${core.tag} />",
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
        expect(data).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            child: [
              {
                tag: {
                  data: "/core/tag",
                  expr: "meta-${[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в map", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<any, { items: { tag: string }[] }>(
          ({ html, core }) => html`${core.items.map((item) => html`<meta-${item.tag} />`)}`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            type: "map",
            text: "core.items.map((item)",
            child: [
              {
                tag: "meta-${item.tag}",
                type: "meta",
                text: "<meta-${item.tag} />",
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
        expect(data).toEqual([
          {
            type: "map",
            data: "/core/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в тренарном операторе", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core }) => html`${core.items.length > 0 ? html`<meta-${core.tag} />` : html`<meta-${core.tag} />`}`
        )
        elements = extractHtmlElements(mainHtml)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            type: "cond",
            text: "core.items.length > 0",
            child: [
              {
                tag: "meta-${core.tag}",
                type: "meta",
                text: "<meta-${core.tag} />",
              },
              {
                tag: "meta-${core.tag}",
                type: "meta",
                text: "<meta-${core.tag} />",
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
        expect(data).toEqual([
          {
            type: "cond",
            data: "/core/items/length",
            expr: "${[0] > 0}",
            true: {
              tag: {
                data: "/core/tag",
                expr: "meta-${[0]}",
              },
              type: "meta",
            },
            false: {
              tag: {
                data: "/core/tag",
                expr: "meta-${[0]}",
              },
              type: "meta",
            },
          },
        ])
      })
    })
  })

  describe("атрибуты", () => {
    describe("статические атрибуты", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html }) => html`<meta-hash data-type="component" class="meta-element" />`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            text: '<meta-hash data-type="component" class="meta-element" />',
          },
        ])
      })
      it.skip("attributes", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
        })
        expect(attributes).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            string: {
              "data-type": {
                type: "static",
                value: "component",
              },
              class: {
                type: "static",
                value: "meta-element",
              },
            },
          },
        ])
      })

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            string: {
              "data-type": "component",
              class: "meta-element",
            },
          },
        ])
      })
    })

    describe("динамические атрибуты", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core }) => html`<meta-${core.tag} data-id="${core.id}" class="meta-${core.type}" />`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.tag}",
            type: "meta",
            text: '<meta-${core.tag} data-id="${core.id}" class="meta-${core.type}" />',
          },
        ])
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${[0]}",
            },
            type: "meta",
            string: {
              "data-id": {
                data: "/core/id",
              },
              class: {
                data: "/core/type",
                expr: "meta-${[0]}",
              },
            },
          },
        ])
      })
    })

    describe("условные атрибуты", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core }) =>
            html`<meta-${core.tag} ${core.active && "data-active"} class="${core.active ? "active" : "inactive"}" />`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.tag}",
            type: "meta",
            text: '<meta-${core.tag} ${core.active && "data-active"} class="${core.active ? "active" : "inactive"}" />',
          },
        ])
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${[0]}",
            },
            type: "meta",
            boolean: {
              "data-active": {
                data: "/core/active",
              },
            },
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

    describe("события", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core }) =>
            html`<meta-${core.tag}
              onclick=${() => core.handleClick(core.id)}
              onchange=${(e: any) => core.handleChange(e, core.value)} />`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.tag}",
            type: "meta",
            text: "<meta-${core.tag} onclick=${() => core.handleClick(core.id)} onchange=${(e) => core.handleChange(e, core.value)} />",
          },
        ])
      })
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${[0]}",
            },
            type: "meta",
            event: {
              onclick: {
                data: ["/core/handleClick", "/core/id"],
                expr: "() => ${[0]}(${[1]})",
              },
              onchange: {
                data: ["/core/handleChange", "/core/value"],
                expr: "(e) => ${[0]}(e, ${[1]})",
              },
            },
          },
        ])
      })
    })

    describe("функция update", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock(
          ({ html, core, update }) => html`<meta-${core.tag} onclick=${() => update({ selected: core.id })} />`
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-${core.tag}",
            type: "meta",
            text: "<meta-${core.tag} onclick=${() => update({ selected: core.id })} />",
          },
        ])
      })
      it.skip("attributes", () =>
        expect(attributes).toEqual([
          {
            tag: "meta-${core.tag}",
            type: "meta",
            event: {
              onclick: "() => update({ selected: core.id })",
            },
          },
        ]))

      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${[0]}",
            },
            type: "meta",
            event: {
              onclick: {
                data: "/core/id",
                expr: "() => update({ selected: ${[0]} })",
                upd: "selected",
              },
            },
          },
        ])
      })
    })

    describe("смешанные атрибуты", () => {
      type Core = {
        items: { tag: string; id: string; active: boolean; handleClick: (id: string) => void }[]
      }
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]

      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<any, Core>(
          ({ html, core }) => html`
            ${core.items.map(
              (item) => html`
                <meta-${item.tag}
                  data-id="${item.id}"
                  ${item.active && "data-active"}
                  class="meta-${item.active ? "active" : "inactive"}"
                  onclick=${() => item.handleClick(item.id)} />
              `
            )}
          `
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            type: "map",
            text: "core.items.map((item)",
            child: [
              {
                tag: "meta-${item.tag}",
                type: "meta",
                text: '<meta-${item.tag} data-id="${item.id}" ${item.active && "data-active"} class="meta-${item.active ? "active" : "inactive"}" onclick=${() => item.handleClick(item.id)} />',
              },
            ],
          },
        ])
      })
      it.skip("attributes", () => {
        expect(attributes).toEqual([
          {
            type: "map",
            text: "core.items.map((item)",
            child: [
              {
                tag: "meta-${item.tag}",
                type: "meta",
                string: {
                  "data-id": {
                    type: "dynamic",
                    value: "${item.id}",
                  },
                  class: {
                    type: "mixed",
                    value: 'meta-${item.active ? "active" : "inactive"}',
                  },
                },
                boolean: {
                  "data-active": {
                    type: "dynamic",
                    value: "item.active",
                  },
                },
                event: {
                  onclick: "() => item.handleClick(item.id)",
                },
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
        expect(data).toEqual([
          {
            type: "map",
            data: "/core/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${[0]}",
                },
                type: "meta",
                event: {
                  onclick: {
                    data: ["[item]/handleClick", "[item]/id"],
                    expr: "() => ${[0]}(${[1]})",
                  },
                },
                string: {
                  "data-id": {
                    data: "[item]/id",
                  },
                  class: {
                    data: "[item]/active",
                    expr: 'meta-${[0] ? "active" : "inactive"}',
                  },
                },
                boolean: {
                  "data-active": {
                    data: "[item]/active",
                  },
                },
              },
            ],
          },
        ])
      })
    })
  })
})
