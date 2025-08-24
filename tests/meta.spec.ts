import { describe, expect, it } from "bun:test"
import { parse } from ".."

describe("meta", () => {
  describe("теги", () => {
    describe("актор web-component", () => {
      const data = parse(({ html }) => html`<meta-hash></meta-hash>`)
      it("парсинг", () => {
        expect(data, "актор web-component").toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })
    describe("актор web-component с самозакрывающимся тегом", () => {
      const data = parse(({ html }) => html`<meta-hash />`)
      it("парсинг", () => {
        expect(data, "актор web-component с самозакрывающимся тегом").toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })
    describe("хеш-тег из core в самозакрывающемся теге", () => {
      const data = parse(({ html, core }) => html`<meta-${core.actors.child} />`)
      it("парсинг", () => {
        expect(data, "хеш-тег из core").toEqual([
          {
            tag: {
              data: "/core/actors/child",
              expr: "meta-${0}",
            },
            type: "meta",
          },
        ])
      })
    })
    describe("хеш-тег из core", () => {
      const data = parse(({ html, core }) => html`<meta-${core.actors.child}></meta-${core.actors.child}>`)
      it("парсинг", () => {
        expect(data, "хеш-тег из core").toEqual([
          {
            tag: {
              data: "/core/actors/child",
              expr: "meta-${0}",
            },
            type: "meta",
          },
        ])
      })
    })
    describe("meta-тег в простом элементе", () => {
      const data = parse(({ html, core }) => html`<div><meta-${core.tag} /></div>`)
      it("парсинг", () => {
        expect(data, "meta-тег в meta-теге").toEqual([
          {
            tag: "div",
            type: "el",
            child: [
              {
                tag: {
                  data: "/core/tag",
                  expr: "meta-${0}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })
    describe("meta-тег в meta-теге", () => {
      const data = parse(({ html, core }) => html`<meta-hash><meta-${core.tag} /></meta-hash>`)
      it("парсинг", () => {
        expect(data, "meta-тег в meta-теге").toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            child: [
              {
                tag: {
                  data: "/core/tag",
                  expr: "meta-${0}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })
    describe("meta-тег в map", () => {
      const data = parse<any, { items: { tag: string }[] }>(
        ({ html, core }) => html`${core.items.map((item) => html`<meta-${item.tag} />`)}`
      )
      it("парсинг", () => {
        expect(data, "meta-тег в map").toEqual([
          {
            type: "map",
            data: "/core/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${0}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })
    describe("meta-тег в тренарном операторе", () => {
      const data = parse(
        ({ html, core }) => html`${core.items.length > 0 ? html`<meta-${core.tag} />` : html`<meta-${core.tag} />`}`
      )
      it("парсинг", () => {
        expect(data, "meta-тег в тренарном операторе").toEqual([
          {
            type: "cond",
            data: "/core/items/length",
            expr: "${0} > 0",
            true: {
              tag: {
                data: "/core/tag",
                expr: "meta-${0}",
              },
              type: "meta",
            },
            false: {
              tag: {
                data: "/core/tag",
                expr: "meta-${0}",
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
      const data = parse(({ html }) => html`<meta-hash data-type="component" class="meta-element" />`)
      it("парсинг", () => {
        expect(data, "статические атрибуты").toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            attr: {
              "data-type": {
                value: "component",
              },
              class: {
                value: "meta-element",
              },
            },
          },
        ])
      })
    })

    describe("динамические атрибуты", () => {
      const data = parse(({ html, core }) => html`<meta-${core.tag} data-id="${core.id}" class="meta-${core.type}" />`)
      it("парсинг", () => {
        expect(data, "динамические атрибуты").toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${0}",
            },
            type: "meta",
            attr: {
              "data-id": {
                data: "/core/id",
              },
              class: {
                data: "/core/type",
                expr: "meta-${0}",
              },
            },
          },
        ])
      })
    })

    describe("условные атрибуты", () => {
      const data = parse(
        ({ html, core }) =>
          html`<meta-${core.tag} ${core.active && "data-active"} class="${core.active ? "active" : "inactive"}" />`
      )
      it("парсинг", () => {
        expect(data, "условные атрибуты").toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${0}",
            },
            type: "meta",
            attr: {
              "data-active": {
                data: "/core/active",
              },
            },
          },
        ])
      })
    })

    describe("события", () => {
      const data = parse(
        ({ html, core }) =>
          html`<meta-${core.tag}
            onclick=${() => core.handleClick(core.id)}
            onchange=${(e: any) => core.handleChange(e, core.value)} />`
      )
      it("парсинг", () => {
        expect(data, "события").toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${0}",
            },
            type: "meta",
            attr: {
              onclick: {
                data: ["/core/handleClick", "/core/id"],
                expr: "() => ${0}(${1})",
              },
              onchange: {
                data: ["/core/handleChange", "/core/value"],
                expr: "(e) => ${0}(e, ${1})",
              },
            },
          },
        ])
      })
    })

    describe("функция update", () => {
      const data = parse(
        ({ html, core, update }) => html`<meta-${core.tag} onclick=${() => update({ selected: core.id })} />`
      )
      it("парсинг", () => {
        expect(data, "функция update").toEqual([
          {
            tag: {
              data: "/core/tag",
              expr: "meta-${0}",
            },
            type: "meta",
            attr: {
              onclick: {
                data: "/core/id",
                expr: "() => update({ selected: ${0} })",
                upd: "selected",
              },
            },
          },
        ])
      })
    })

    describe("смешанные атрибуты", () => {
      const data = parse<
        any,
        { items: { tag: string; id: string; active: boolean; handleClick: (id: string) => void }[] }
      >(
        ({ html, core }) =>
          html`${core.items.map(
            (item) =>
              html`<meta-${item.tag}
                data-id="${item.id}"
                ${item.active && "data-active"}
                class="meta-${item.active ? "active" : "inactive"}"
                onclick=${() => item.handleClick(item.id)} />`
          )}`
      )
      it("парсинг", () => {
        expect(data, "смешанные атрибуты").toEqual([
          {
            type: "map",
            data: "/core/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${0}",
                },
                type: "meta",
                attr: {
                  "data-id": {
                    data: "[item]/id",
                  },
                  "data-active": {
                    data: "/item/active",
                  },
                  onclick: {
                    data: ["[item]/handleClick", "[item]/id"],
                    expr: "() => ${0}(${1})",
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
