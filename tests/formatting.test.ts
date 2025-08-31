import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { extractAttributes } from "../attributes"
import { enrichWithData } from "../data"
import { extractTokens } from "../token"

describe("formatting", () => {
  describe("форматирует тернарные выражения, удаляя лишние пробелы и переносы строк", () => {
    const mainHtml = extractMainHtmlBlock<any, { flag: boolean }>(
      ({ html, context }) => html`
        <div>
          <span class="${context.flag ? "active" : "inactive"}"> Status: ${context.flag ? "Active" : "Inactive"} </span>
          <p class="${context.flag && context.flag ? "double-active" : "not-active"}">
            ${context.flag ? "This is a very long text that should be formatted properly" : "Short text"}
          </p>
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("проверяет структуру данных", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      console.log("Span element structure:", JSON.stringify(spanElement, null, 2))
      expect(spanElement).toBeDefined()
    })

    it("span element class attr", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class).toBeDefined()
    })

    it("span element class expr", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class?.expr).toBe('${[0] ? "active" : "inactive"}')
    })

    it("span text type", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText).toHaveProperty("type", "text")
    })

    it("span text expr", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText?.expr).toBe('Status: ${[0] ? "Active" : "Inactive"}')
    })

    it("p element tag", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement).toHaveProperty("tag", "p")
    })

    it("p element class attr", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class).toBeDefined()
    })

    it("p element class expr", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class?.expr).toBe('${[0] && [0] ? "double-active" : "not-active"}')
    })

    it("p text type", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText).toHaveProperty("type", "text")
    })

    it("p text expr", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText?.expr).toBe(`\${[0] ? "This is a very long text that should be formatted properly" : "Short text"}`)
    })
  })

  describe("форматирует атрибуты с условными выражениями", () => {
    const mainHtml = extractMainHtmlBlock<any, { theme: string; size: string }>(
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

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("проверяет структуру данных", () => {
      const divElement = data[0] as any
      const buttonElement = divElement?.child?.[0] as any
      console.log("Button element structure:", JSON.stringify(buttonElement, null, 2))
      expect(buttonElement).toBeDefined()
    })

    it("форматирует условные классы в button", () => {
      const divElement = data[0] as any
      const buttonElement = divElement?.child?.[0] as any
      expect(buttonElement?.array?.class).toBeDefined()
      expect(buttonElement?.array?.class?.[1]?.expr).toBe('${[0] === "dark" ? "btn-dark" : "btn-light"}')
      expect(buttonElement?.array?.class?.[2]?.expr).toBe('${[0] || "medium"}')
    })

    it("форматирует условные классы в input", () => {
      const divElement = data[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.array?.class).toBeDefined()
      expect(inputElement?.array?.class?.[1]?.expr).toBe('${[0] === "dark" ? "input-dark" : "input-light"}')
    })

    it("форматирует условный placeholder", () => {
      const divElement = data[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.string?.placeholder?.expr).toBe(
        '${[0] === "large" ? "Enter large text here" : "Enter text here"}'
      )
    })
  })
})
