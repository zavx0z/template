import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("text-formatting", () => {
  it("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    const mainHtml = extractMainHtmlBlock<any, { name: string; title: string }>(
      ({ html, context }) => html`
        <div>
          <p>Hello World</p>
          <span> ${context.name} - ${context.title} </span>
          <div>Welcome to our site!</div>
          <p>${context.name} is ${context.title}</p>
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const data = enrichHierarchyWithData(hierarchy)

    // Проверяем форматирование статического текста
    const divElement = data[0] as any
    const p1Element = divElement?.child?.[0] as any
    expect(p1Element).toHaveProperty("tag", "p")
    const p1Text = p1Element?.child?.[0] as any
    expect(p1Text).toHaveProperty("type", "text")
    expect(p1Text?.value).toBe("Hello World")

    // Проверяем форматирование смешанного текста
    const spanElement = divElement?.child?.[1] as any
    expect(spanElement).toHaveProperty("tag", "span")
    const spanText = spanElement?.child?.[0] as any
    expect(spanText).toHaveProperty("type", "text")
    expect(spanText?.expr).toBe(" ${0} - ${1} ")

    // Проверяем форматирование многострочного статического текста
    const divElement2 = divElement?.child?.[2] as any
    expect(divElement2).toHaveProperty("tag", "div")
    const divText = divElement2?.child?.[0] as any
    expect(divText).toHaveProperty("type", "text")
    expect(divText?.value).toBe("Welcome to our site!")

    // Проверяем форматирование многострочного смешанного текста
    const p2Element = divElement?.child?.[3] as any
    expect(p2Element).toHaveProperty("tag", "p")
    const p2Text = p2Element?.child?.[0] as any
    expect(p2Text).toHaveProperty("type", "text")
    expect(p2Text?.expr).toBe("${0} is ${1}")
  })
})
