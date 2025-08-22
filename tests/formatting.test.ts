import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("formatting", () => {
  it("форматирует тернарные выражения, удаляя лишние пробелы и переносы строк", () => {
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

    // Проверяем, что выражения отформатированы правильно
    const divElement = data[0] as any
    const spanElement = divElement?.child?.[0] as any
    expect(spanElement).toHaveProperty("tag", "span")
    expect(spanElement?.attr?.class).toBeDefined()
    expect(spanElement?.attr?.class?.expr).toBe('${0} ? "active" : "inactive"')

    const spanText = spanElement?.child?.[0] as any
    expect(spanText).toHaveProperty("type", "text")
    expect(spanText?.expr).toBe('${0}: ${${1} ? "Active" : "Inactive"}')

    const pElement = divElement?.child?.[1] as any
    expect(pElement).toHaveProperty("tag", "p")
    expect(pElement?.attr?.class).toBeDefined()
    expect(pElement?.attr?.class?.expr).toBe('${0} && ${0} ? "double-active" : "not-active"')

    const pText = pElement?.child?.[0] as any
    expect(pText).toHaveProperty("type", "text")
    expect(pText?.expr).toBe('${${0} ? "This is a very long text that should be formatted properly" : "Short text"}')
  })
})
