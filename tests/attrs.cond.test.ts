import { extractAttributes } from "../attributes"
import { enrichWithData } from "../data"
import { makeHierarchy } from "../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { describe, it, expect } from "bun:test"
import { extractTokens } from "./token"

describe("", () => {
  describe("тернарный оператор в атрибуте с числом в качестве условия", () => {
    const mainHtml = extractMainHtmlBlock<{ count: number }>(
      ({ html, context }) => html`
        <div class="${10 > context.count && context.count < 3 ? "active" : "inactive"}">Content</div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () =>
      expect(data, "одна переменная в нескольких местах").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: "/context/count",
              expr: '${10 > [0] && [0] < 3 ? "active" : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ]))
  })

  describe("тернарный оператор сравнения через === с динамическими результатами", () => {
    const mainHtml = extractMainHtmlBlock<{ isActive: boolean; status: "waiting" | "running"; item: string }>(
      ({ html, context, core }) => html`
        <div class="${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}">
          Content
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy, "hierarchy").toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}">',
          child: [
            {
              type: "text",
              text: "Content",
            },
          ],
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    it("attributes", () =>
      expect(attributes, "тернарный оператор сравнения с динамическими результатами").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              type: "dynamic",
              value: '${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              text: "Content",
            },
          ],
        },
      ]))
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data, "тернарный оператор сравнения с динамическими результатами").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: ["/core/isActive", "/context/isActive", "/context/item", "/context/status"],
              expr: '${[0] === [1] ? `${[2]}-active-${[3]}` : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
})
