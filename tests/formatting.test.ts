import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

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
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)

    it("span element tag", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement).toHaveProperty("tag", "span")
    })

    it("span element class attr", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.attr?.class).toBeDefined()
    })

    it("span element class expr", () => {
      const divElement = data[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.attr?.class?.expr).toBe('${0} ? "active" : "inactive"')
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
      expect(spanText?.expr).toBe('${0}: ${${1} ? "Active" : "Inactive"}')
    })

    it("p element tag", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement).toHaveProperty("tag", "p")
    })

    it("p element class attr", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.attr?.class).toBeDefined()
    })

    it("p element class expr", () => {
      const divElement = data[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.attr?.class?.expr).toBe('${0} && ${0} ? "double-active" : "not-active"')
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
      expect(pText?.expr).toBe('${${0} ? "This is a very long text that should be formatted properly" : "Short text"}')
    })
  })
})
