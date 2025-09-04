import { describe, expect, it, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("meta", () => {
  describe("теги", () => {
    describe("актор web-component", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash></meta-hash>`)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("актор web-component с самозакрывающимся тегом", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash />`)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("хеш-тег из core в самозакрывающемся теге", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, core }) => html`<meta-${core.actors.child} />`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, core }) => html`<meta-${core.actors.child}></meta-${core.actors.child}>`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, core }) => html`<div><meta-${core.tag} /></div>`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, core }) => html`<meta-hash><meta-${core.tag} /></meta-hash>`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, { items: { tag: string }[] }>(
          ({ html, core }) => html`${core.items.map((item) => html`<meta-${item.tag} />`)}`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, core }) => html`${core.items.length > 0 ? html`<meta-${core.tag} />` : html`<meta-${core.tag} />`}`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            type: "cond",
            data: "/core/items/length",
            expr: "${[0] > 0}",
            child: [
              {
                tag: {
                  data: "/core/tag",
                  expr: "meta-${[0]}",
                },
                type: "meta",
              },
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
  })

  describe("атрибуты", () => {
    describe("статические атрибуты", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash data-type="component" class="meta-element" />`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, core }) => html`<meta-${core.tag} data-id="${core.id}" class="meta-${core.type}" />`)
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, core }) => html`
            <meta-${core.tag} ${core.active && "data-active"} class="${core.active ? "active" : "inactive"}" />
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, core }) => html`
            <meta-${core.tag}
              onclick=${() => core.handleClick(core.id)}
              onchange=${(e: Event) => core.handleChange(e, core.value)} />
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, core, update }) => html`<meta-${core.tag} onclick=${() => update({ selected: core.id })} />`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
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
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, Core>(
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
      })
      it("data", () => {
        expect(elements).toEqual([
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
