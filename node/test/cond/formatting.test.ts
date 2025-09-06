import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("formatting", () => {
  describe("форматирует тернарные выражения, удаляя лишние пробелы и переносы строк", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { flag: boolean }>(
        ({ html, context }) => html`
          <div>
            <span class="${context.flag ? "active" : "inactive"}">
              Status: ${context.flag ? "Active" : "Inactive"}</span
            >
            <p class="${context.flag && context.flag ? "double-active" : "not-active"}">
              ${context.flag ? "This is a very long text that should be formatted properly" : "Short text"}
            </p>
          </div>
        `
      )
    })
    it("проверяет структуру данных", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement).toBeDefined()
    })

    it("span element class attr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class).toBeDefined()
    })

    it("span element class expr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class?.expr).toBe('${[0] ? "active" : "inactive"}')
    })

    it("span text type", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText).toHaveProperty("type", "text")
    })

    it("span text expr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText?.expr).toBe('Status: ${[0] ? "Active" : "Inactive"}')
    })

    it("p element tag", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement).toHaveProperty("tag", "p")
    })

    it("p element class attr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class).toBeDefined()
    })

    it("p element class expr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class?.expr).toBe('${[0] && [0] ? "double-active" : "not-active"}')
    })

    it("p text type", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText).toHaveProperty("type", "text")
    })

    it("p text expr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText?.expr).toBe(`\${[0] ? "This is a very long text that should be formatted properly" : "Short text"}`)
    })
  })

  describe("форматирует атрибуты с условными выражениями", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { theme: string; size: string }>(
        ({ html, context }) => html`
          <div>
            <button class="btn ${context.theme === "dark" ? "btn-dark" : "btn-light"} ${context.size || "medium"}">
              Click me
            </button>
            <input
              type="text"
              class="input ${context.theme === "dark" ? "input-dark" : "input-light"}"
              placeholder="${context.size === "large" ? "Enter large text here" : "Enter text here"}" />
          </div>
        `
      )
    })

    it("проверяет структуру данных", () => {
      const divElement = elements[0] as any
      const buttonElement = divElement?.child?.[0] as any
      expect(buttonElement).toBeDefined()
    })

    it("форматирует условные классы в button", () => {
      const divElement = elements[0] as any
      const buttonElement = divElement?.child?.[0] as any
      expect(buttonElement?.array?.class).toBeDefined()
      expect(buttonElement?.array?.class?.[1]?.expr).toBe('${[0] === "dark" ? "btn-dark" : "btn-light"}')
      expect(buttonElement?.array?.class?.[2]?.expr).toBe('${[0] || "medium"}')
    })

    it("форматирует условные классы в input", () => {
      const divElement = elements[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.array?.class).toBeDefined()
      expect(inputElement?.array?.class?.[1]?.expr).toBe('${[0] === "dark" ? "input-dark" : "input-light"}')
    })

    it("форматирует условный placeholder", () => {
      const divElement = elements[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.string?.placeholder?.expr).toBe(
        '${[0] === "large" ? "Enter large text here" : "Enter text here"}'
      )
    })
  })
})
