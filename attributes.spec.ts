import { describe, it, expect } from "bun:test"
import { parseAttributes } from "./attributes.ts"

describe("разделение аттрибутов", () => {
  describe("статические значения", () => {
    it("class в элементе с одним статическим значением", () => {
      const attrs = parseAttributes('<div class="div-active">')
      expect(attrs).toEqual({
        array: {
          class: [{ type: "static", value: "div-active" }],
        },
      })
    })

    it("class в элементе с одним статическим значением без кавычек", () => {
      const attrs = parseAttributes("<div class=div-active>")
      expect(attrs).toEqual({
        array: {
          class: [{ type: "static", value: "div-active" }],
        },
      })
    })
    it("class в элементе с несколькими статическими значениями", () => {
      const attrs = parseAttributes('<div class="div-active div-inactive">')
      expect(attrs).toEqual({
        array: {
          class: [
            { type: "static", value: "div-active" },
            { type: "static", value: "div-inactive" },
          ],
        },
      })
    })
  })

  describe("динамические значения", () => {
    it("class в элементе с одним динамическим значением", () => {
      const attrs = parseAttributes('<div class="${core.active ? "active" : "inactive"}">')
      expect(attrs).toEqual({
        array: {
          class: [{ type: "dynamic", value: 'core.active ? "active" : "inactive"' }],
        },
      })
    })

    it("class в элементе с одним динамическим значением без кавычек", () => {
      const attrs = parseAttributes('<div class=${core.active ? "active" : "inactive"}>')
      expect(attrs).toEqual({
        array: {
          class: [{ type: "dynamic", value: 'core.active ? "active" : "inactive"' }],
        },
      })
    })
    it("class в элементе с несколькими динамическими значениями", () => {
      const attrs = parseAttributes(
        '<div class="${core.active ? "active" : "inactive"} ${core.active ? "active" : "inactive"}">'
      )
      expect(attrs).toEqual({
        array: {
          class: [
            { type: "dynamic", value: 'core.active ? "active" : "inactive"' },
            { type: "dynamic", value: 'core.active ? "active" : "inactive"' },
          ],
        },
      })
    })
  })

  describe("смешанные значения", () => {
    it("class в элементе с одним смешанным значением", () => {
      const attrs = parseAttributes('<div class="div-${core.active ? "active" : "inactive"}">')
      expect(attrs).toEqual({
        array: {
          class: [
            {
              type: "mixed",
              value: 'div-${core.active ? "active" : "inactive"}',
            },
          ],
        },
      })
    })

    it("class в элементе с одним смешанным значением без кавычек", () => {
      const attrs = parseAttributes('<div class=div-${core.active ? "active" : "inactive"}>')
      expect(attrs).toEqual({
        array: {
          class: [{ type: "mixed", value: 'div-${core.active ? "active" : "inactive"}' }],
        },
      })
    })

    it("class в элементе с несколькими смешанными значениями", () => {
      const attrs = parseAttributes(
        '<div class="div-${core.active ? "active" : "inactive"} div-${core.active ? "active" : "inactive"}">'
      )
      expect(attrs).toEqual({
        array: {
          class: [
            { type: "mixed", value: 'div-${core.active ? "active" : "inactive"}' },
            { type: "mixed", value: 'div-${core.active ? "active" : "inactive"}' },
          ],
        },
      })
    })
  })

  describe("различные варианты", () => {
    it("class в элементе с смешанным и статическим значениями", () => {
      const attrs = parseAttributes('<div class="div-${core.active ? "active" : "inactive"} visible">')
      expect(attrs).toEqual({
        array: {
          class: [
            {
              type: "mixed",
              value: 'div-${core.active ? "active" : "inactive"}',
            },
            {
              type: "static",
              value: "visible",
            },
          ],
        },
      })
    })
  })
})
