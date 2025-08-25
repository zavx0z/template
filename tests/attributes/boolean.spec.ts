import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["element", "<div"],
  ["web-component", "<my-component"],
  ["meta-hash", "<meta-hash"],
  ["meta-${...}", "<meta-${core.meta}>"],
])("булевые атрибуты для %s", (_, tag) => {
  describe("простые булевые атрибуты", () => {
    it("атрибут без значения", () => {
      const attrs = parseAttributes(tag + " disabled>")
      expect(attrs).toEqual({
        boolean: {
          disabled: "true",
        },
      })
    })

    it("атрибут со значением true", () => {
      const attrs = parseAttributes(tag + ' disabled="true">')
      expect(attrs).toEqual({
        boolean: {
          disabled: "true",
        },
      })
    })

    it("атрибут со значением false", () => {
      const attrs = parseAttributes(tag + ' disabled="false">')
      expect(attrs).toEqual({
        boolean: {
          disabled: "false",
        },
      })
    })

    it("атрибут с пустым значением", () => {
      const attrs = parseAttributes(tag + ' disabled="">')
      expect(attrs).toEqual({
        boolean: {
          disabled: "true",
        },
      })
    })
  })

  describe("динамические булевые атрибуты", () => {
    it("простое условие", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.disabled}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.disabled" },
        },
      })
    })

    it("условие с оператором И", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.disabled && context.loading}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.disabled && context.loading" },
        },
      })
    })

    it("условие с оператором ИЛИ", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.disabled || context.error}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.disabled || context.error" },
        },
      })
    })

    it("условие с оператором НЕ", () => {
      const attrs = parseAttributes(tag + ' disabled="${!context.enabled}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "!context.enabled" },
        },
      })
    })
  })

  describe("операторы сравнения", () => {
    it("оператор равенства", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.status === "loading"}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: 'context.status === "loading"' },
        },
      })
    })

    it("оператор неравенства", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.status !== "ready"}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: 'context.status !== "ready"' },
        },
      })
    })

    it("оператор больше", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.count > 5}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.count > 5" },
        },
      })
    })

    it("оператор больше или равно", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.count >= 10}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.count >= 10" },
        },
      })
    })
  })

  describe("тернарные операторы", () => {
    it("простой тернарный оператор", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.disabled ? true : false}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.disabled ? true : false" },
        },
      })
    })

    it("тернарный оператор с условием", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.count > 5 ? true : false}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.count > 5 ? true : false" },
        },
      })
    })
  })

  describe("различные булевые атрибуты", () => {
    it("атрибут checked", () => {
      const attrs = parseAttributes(tag + ' checked="${context.checked}">')
      expect(attrs).toEqual({
        string: {
          checked: { type: "dynamic", value: "context.checked" },
        },
      })
    })

    it("атрибут readonly", () => {
      const attrs = parseAttributes(tag + ' readonly="${context.readonly}">')
      expect(attrs).toEqual({
        string: {
          readonly: { type: "dynamic", value: "context.readonly" },
        },
      })
    })

    it("атрибут required", () => {
      const attrs = parseAttributes(tag + ' required="${context.required}">')
      expect(attrs).toEqual({
        string: {
          required: { type: "dynamic", value: "context.required" },
        },
      })
    })
  })

  describe("сложные выражения", () => {
    it("выражение с методами", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.items.length > 0}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.items.length > 0" },
        },
      })
    })

    it("выражение с вложенными свойствами", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.user.permissions.canEdit}">')
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.user.permissions.canEdit" },
        },
      })
    })
  })

  describe("множественные булевые атрибуты", () => {
    it("несколько булевых атрибутов", () => {
      const attrs = parseAttributes(
        tag + ' disabled="${context.disabled}" readonly="${context.readonly}" required="${context.required}">'
      )
      expect(attrs).toEqual({
        string: {
          disabled: { type: "dynamic", value: "context.disabled" },
          readonly: { type: "dynamic", value: "context.readonly" },
          required: { type: "dynamic", value: "context.required" },
        },
      })
    })

    it("смешанные статические и динамические булевые атрибуты", () => {
      const attrs = parseAttributes(tag + ' disabled="${context.disabled}" readonly required>')
      expect(attrs).toEqual({
        boolean: {
          readonly: "true",
          required: "true",
        },
        string: {
          disabled: { type: "dynamic", value: "context.disabled" },
        },
      })
    })
    
  })
})
