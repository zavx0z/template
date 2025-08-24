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
  })
})
