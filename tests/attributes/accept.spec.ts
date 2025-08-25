import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["element", "<input"],
  ["component", "<x-el"],
  ["meta-hash", "<meta-hash"],
  ["meta-${...}", "<meta-${core.meta}>"],
])("accept для %s", (_, tag) => {
  describe("статические значения", () => {
    it("одно", () => {
      const attrs = parseAttributes(tag + ' accept="image/png">')
      expect(attrs).toEqual({
        string: { accept: "image/png" },
      })
    })
    it("одно без кавычек", () => {
      const attrs = parseAttributes(tag + " accept=image/png>")
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
    it("одно без кавычек", () => {
      const attrs = parseAttributes(tag + " accept=${core.mime}>")
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

    it("с операторами сравнения", () => {
      const attrs = parseAttributes(tag + ' accept="${core.type === "image" ? "image/*" : "text/*"}">')
      expect(attrs).toEqual({
        string: { accept: '${core.type === "image" ? "image/*" : "text/*"}' },
      })
    })

    it("с логическими операторами", () => {
      const attrs = parseAttributes(
        tag + ' accept="${core.allowImages && core.allowDocs ? "image/*,.pdf" : "text/*"}">'
      )
      expect(attrs).toEqual({
        string: { accept: '${core.allowImages && core.allowDocs ? "image/*,.pdf" : "text/*"}' },
      })
    })

    it("с оператором ИЛИ", () => {
      const attrs = parseAttributes(
        tag + ' accept="${core.allowImages || core.allowVideos ? "image/*,video/*" : "text/*"}">'
      )
      expect(attrs).toEqual({
        string: { accept: '${core.allowImages || core.allowVideos ? "image/*,video/*" : "text/*"}' },
      })
    })

    it("с оператором НЕ", () => {
      const attrs = parseAttributes(tag + ' accept="${!core.restricted ? "image/*,video/*" : "text/*"}">')
      expect(attrs).toEqual({
        string: { accept: '${!core.restricted ? "image/*,video/*" : "text/*"}' },
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

    it("несколько", () => {
      const attrs = parseAttributes(tag + ' accept="image/*, ${core.mime}, .pdf">')
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/*" },
              { type: "dynamic", value: "core.mime" },
              { type: "static", value: ".pdf" },
            ],
          },
        },
      })
    })

    it("с операторами сравнения в смешанном значении", () => {
      const attrs = parseAttributes(tag + ' accept="image-${core.type === "png" ? "png" : "jpeg"}">')
      expect(attrs).toEqual({
        string: { accept: 'image-${core.type === "png" ? "png" : "jpeg"}' },
      })
    })

    it("с логическими операторами в смешанном значении", () => {
      const attrs = parseAttributes(tag + ' accept="file-${core.allowImages && core.allowVideos ? "media" : "doc"}">')
      expect(attrs).toEqual({
        string: { accept: 'file-${core.allowImages && core.allowVideos ? "media" : "doc"}' },
      })
    })
  })

  describe("различные варианты", () => {
    it("с условными типами файлов", () => {
      const attrs = parseAttributes(
        tag + ' accept="image/*, ${core.allowPdf ? ".pdf" : ""}, ${core.allowDoc ? ".doc" : ""}">'
      )
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/*" },
              { type: "dynamic", value: 'core.allowPdf ? ".pdf" : ""' },
              { type: "dynamic", value: 'core.allowDoc ? ".doc" : ""' },
            ],
          },
        },
      })
    })

    it("с вложенными выражениями", () => {
      const attrs = parseAttributes(tag + ' accept="media/${core.nested ? "nested" : "default"}">')
      expect(attrs).toEqual({
        string: { accept: 'media/${core.nested ? "nested" : "default"}' },
      })
    })

    it("с пустыми значениями", () => {
      const attrs = parseAttributes(tag + ' accept="image/*, ${core.allowPdf ? ".pdf" : ""}">')
      expect(attrs).toEqual({
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/*" },
              { type: "dynamic", value: 'core.allowPdf ? ".pdf" : ""' },
            ],
          },
        },
      })
    })
  })
})
