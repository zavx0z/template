import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([["img","<img"],["source","<source"]])("srcset для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' srcset="a.jpg 1x">')
      expect(attrs).toEqual({
        array: { srcset: { splitter: ",", values: [{ type: "static", value: "a.jpg 1x" }] } },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' srcset="a.jpg 1x, b.jpg 2x">')
      expect(attrs).toEqual({
        array: { srcset: { splitter: ",", values: [
          { type: "static", value: "a.jpg 1x" },
          { type: "static", value: "b.jpg 2x" },
        ] } },
      })
    })
  })

  describe("динамические значения", () => {
    it("одно (чисто динамический токен)", () => {
      const attrs = parseAttributes(tag + ' srcset="${core.src}">')
      expect(attrs).toEqual({
        array: { srcset: { splitter: ",", values: [{ type: "dynamic", value: "core.src" }] } },
      })
    })
  })

  describe("смешанные значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' srcset="${core.src} 2x">')
      expect(attrs).toEqual({
        array: { srcset: { splitter: ",", values: [{ type: "mixed", value: "${core.src} 2x" }] } },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' srcset="a.jpg 1x, ${core.src} 2x">')
      expect(attrs).toEqual({
        array: { srcset: { splitter: ",", values: [
          { type: "static", value: "a.jpg 1x" },
          { type: "mixed", value: "${core.src} 2x" },
        ] } },
      })
    })
  })
})
