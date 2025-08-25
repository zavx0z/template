import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["element", "<input"],
  ["component", "<x-el"],
])("accept для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' accept="image/png">')
      expect(attrs).toEqual({
        string: { accept: "image/png" },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' accept="image/png, image/jpeg, .pdf">')
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/png" },
              { type: "static", value: "image/jpeg" },
              { type: "static", value: ".pdf" },
            ],
          },
        },
      })
    })
  })

  describe("динамические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' accept="${core.mime}">')
      expect(attrs).toEqual({
        string: { accept: "${core.mime}" },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' accept="${core.mime}, ${core.mime}">')
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "dynamic", value: "core.mime" },
              { type: "dynamic", value: "core.mime" },
            ],
          },
        },
      })
    })
  })

  describe("смешанные значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' accept="image/*, ${core.mime}">')
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/*" },
              { type: "dynamic", value: "core.mime" },
            ],
          },
        },
      })
    })
  })
})
