import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([["element","<a"],["component","<x-el"]])("rel для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно значение", () => {
      const attrs = parseAttributes(tag + ' rel="nofollow">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [{ type: "static", value: "nofollow" }] } },
      })
    })
    it("одно значение без кавычек", () => {
      const attrs = parseAttributes(tag + " rel=nofollow>")
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [{ type: "static", value: "nofollow" }] } },
      })
    })
    it("несколько значений", () => {
      const attrs = parseAttributes(tag + ' rel="nofollow noopener noreferrer">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [
          { type: "static", value: "nofollow" },
          { type: "static", value: "noopener" },
          { type: "static", value: "noreferrer" },
        ] } },
      })
    })
  })

  describe("динамические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' rel="${core.rel}">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [{ type: "dynamic", value: "core.rel" }] } },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' rel="${core.rel} ${core.rel}">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [
          { type: "dynamic", value: "core.rel" },
          { type: "dynamic", value: "core.rel" },
        ] } },
      })
    })
  })

  describe("смешанные значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' rel="pre-${core.rel}">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [{ type: "mixed", value: "pre-${core.rel}" }] } },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' rel="pre-${core.rel} pre-${core.rel}">')
      expect(attrs).toEqual({
        array: { rel: { splitter: " ", values: [
          { type: "mixed", value: "pre-${core.rel}" },
          { type: "mixed", value: "pre-${core.rel}" },
        ] } },
      })
    })
  })
})
