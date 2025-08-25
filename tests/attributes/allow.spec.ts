import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["iframe", "<iframe"],
  ["component", "<x-iframe"],
  ["meta-hash", "<meta-hash"],
  ["meta-${...}", "<meta-${core.meta}>"],
])("allow для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' allow="camera">')
      expect(attrs).toEqual({
        string: { allow: "camera" },
      })
    })
    it("одно без кавычек", () => {
      const attrs = parseAttributes(tag + " allow=camera>")
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
    it("одно без кавычек", () => {
      const attrs = parseAttributes(tag + " allow=${core.permission}>")
      expect(attrs).toEqual({
        string: { allow: "${core.permission}" },
      })
    })
    it("несколько", () => {
      const attrs = parseAttributes(tag + ' allow="${core.permission}; ${core.permission}">')
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "dynamic", value: "core.permission" },
              { type: "dynamic", value: "core.permission" },
            ],
          },
        },
      })
    })

    it("с операторами сравнения", () => {
      const attrs = parseAttributes(tag + ' allow="${core.type === "media" ? "camera;microphone" : "geolocation"}">')
      expect(attrs).toEqual({
        string: { allow: '${core.type === "media" ? "camera;microphone" : "geolocation"}' },
      })
    })

    it("с логическими операторами", () => {
      const attrs = parseAttributes(
        tag + ' allow="${core.allowCamera && core.allowMic ? "camera;microphone" : "geolocation"}">'
      )
      expect(attrs).toEqual({
        string: { allow: '${core.allowCamera && core.allowMic ? "camera;microphone" : "geolocation"}' },
      })
    })

    it("с оператором ИЛИ", () => {
      const attrs = parseAttributes(
        tag + ' allow="${core.allowCamera || core.allowMic ? "camera;microphone" : "geolocation"}">'
      )
      expect(attrs).toEqual({
        string: { allow: '${core.allowCamera || core.allowMic ? "camera;microphone" : "geolocation"}' },
      })
    })

    it("с оператором НЕ", () => {
      const attrs = parseAttributes(tag + ' allow="${!core.restricted ? "camera;microphone" : "geolocation"}">')
      expect(attrs).toEqual({
        string: { allow: '${!core.restricted ? "camera;microphone" : "geolocation"}' },
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

    it("несколько", () => {
      const attrs = parseAttributes(tag + ' allow="camera; ${core.permission}; geolocation">')
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "dynamic", value: "core.permission" },
              { type: "static", value: "geolocation" },
            ],
          },
        },
      })
    })

    it("с операторами сравнения в смешанном значении", () => {
      const attrs = parseAttributes(tag + ' allow="permission-${core.type === "admin" ? "all" : "basic"}">')
      expect(attrs).toEqual({
        string: { allow: 'permission-${core.type === "admin" ? "all" : "basic"}' },
      })
    })

    it("с логическими операторами в смешанном значении", () => {
      const attrs = parseAttributes(tag + ' allow="access-${core.allowCamera && core.allowMic ? "media" : "basic"}">')
      expect(attrs).toEqual({
        string: { allow: 'access-${core.allowCamera && core.allowMic ? "media" : "basic"}' },
      })
    })
  })

  describe("различные варианты", () => {
    it("с условными разрешениями", () => {
      const attrs = parseAttributes(
        tag + ' allow="camera; ${core.allowMic ? "microphone" : ""}; ${core.allowGeo ? "geolocation" : ""}">'
      )
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "dynamic", value: 'core.allowMic ? "microphone" : ""' },
              { type: "dynamic", value: 'core.allowGeo ? "geolocation" : ""' },
            ],
          },
        },
      })
    })

    it("с вложенными выражениями", () => {
      const attrs = parseAttributes(tag + ' allow="permission/${core.nested ? "nested" : "default"}">')
      expect(attrs).toEqual({
        string: { allow: 'permission/${core.nested ? "nested" : "default"}' },
      })
    })

    it("с пустыми значениями", () => {
      const attrs = parseAttributes(tag + ' allow="camera; ${core.allowMic ? "microphone" : ""}">')
      expect(attrs).toEqual({
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "dynamic", value: 'core.allowMic ? "microphone" : ""' },
            ],
          },
        },
      })
    })
  })
})
