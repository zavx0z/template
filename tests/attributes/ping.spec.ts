import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["element", "<a"],
  ["area", "<area"],
])("ping для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' ping="https://a.example">')
      expect(attrs).toEqual({
        string: { ping: "https://a.example" },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' ping="https://a.example https://b.example">')
      expect(attrs).toEqual({
        array: {
          ping: {
            splitter: " ",
            values: [
              { type: "static", value: "https://a.example" },
              { type: "static", value: "https://b.example" },
            ],
          },
        },
      })
    })
  })

  describe("динамические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' ping="${core.url}">')
      expect(attrs).toEqual({
        string: { ping: "${core.url}" },
      })
    })
  })

  describe("смешанные значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' ping="https://a.example ${core.url}">')
      expect(attrs).toEqual({
        array: {
          ping: {
            splitter: " ",
            values: [
              { type: "static", value: "https://a.example" },
              { type: "dynamic", value: "core.url" },
            ],
          },
        },
      })
    })
  })
})
