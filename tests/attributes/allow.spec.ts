import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["iframe", "<iframe"],
  ["component", "<x-iframe"],
])("allow для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' allow="camera">')
      expect(attrs).toEqual({
        string: { allow: "camera" },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' allow="camera; microphone; geolocation">')
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "static", value: "microphone" },
              { type: "static", value: "geolocation" },
            ],
          },
        },
      })
    })
  })

  describe("динамические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' allow="${core.permission}">')
      expect(attrs).toEqual({
        string: { allow: "${core.permission}" },
      })
    })
  })

  describe("смешанные значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' allow="camera; ${core.permission}">')
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "dynamic", value: "core.permission" },
            ],
          },
        },
      })
    })
  })
})
