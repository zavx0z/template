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
  })
})
