import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["element", "<div"],
  ["component", "<x-el"],
])("aria-labelledby/aria-describedby для %s", (_, tag) => {
  describe("статические значения", () => {
    it("aria-labelledby одно и несколько", () => {
      const attrs = parseAttributes(tag + ' aria-labelledby="title subtitle">')
      expect(attrs).toEqual({
        array: {
          "aria-labelledby": {
            splitter: " ",
            values: [
              { type: "static", value: "title" },
              { type: "static", value: "subtitle" },
            ],
          },
        },
      })
    })
  })

  describe("динамические и смешанные", () => {
    it("aria-describedby динамика+статик", () => {
      const attrs = parseAttributes(tag + ' aria-describedby="${core.id} note">')
      expect(attrs).toEqual({
        array: {
          "aria-describedby": {
            splitter: " ",
            values: [
              { type: "dynamic", value: "core.id" },
              { type: "static", value: "note" },
            ],
          },
        },
      })
    })
  })
})
