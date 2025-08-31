import { makeHierarchy } from "../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { describe, it, expect } from "bun:test"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"

describe("core/context в атрибутах", () => {
  describe("core с динамическими значениями", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core, context }) => html`<meta-${core.tag} core=${{ id: context.id, name: context.name }} />`
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: {
            data: "/core/tag",
            expr: "meta-${[0]}",
          },
          type: "meta",
          core: {
            data: ["/context/id", "/context/name"],
            expr: "{ id: [0], name: [1] }",
          },
        },
      ])
    })
  })

  describe("core со статическими значениями", () => {
    const mainHtml = extractMainHtmlBlock(({ html, core }) => html`<meta-${core.tag} core=${{ id: "1", name: "2" }} />`)

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    it("attributes", () =>
      expect(attributes).toEqual([
        {
          tag: "meta-${core.tag}",
          type: "meta",
          core: '{ id: "1", name: "2" }',
        },
      ]))
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: {
            data: "/core/tag",
            expr: "meta-${[0]}",
          },
          type: "meta",
          core: '{ id: "1", name: "2" }',
        },
      ])
    })
  })

  describe("core/context во вложенных элементах", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core, context }) => html`
        <div><meta-${core.tag} context=${{ id: context.id, name: context.name }} /></div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)

    it("attributes", () =>
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "meta-${core.tag}",
              type: "meta",
              context: "{ id: context.id, name: context.name }",
            },
          ],
        },
      ]))
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: {
                data: "/core/tag",
                expr: "meta-${[0]}",
              },
              type: "meta",
              context: {
                data: ["/context/id", "/context/name"],
                expr: "{ id: [0], name: [1] }",
              },
            },
          ],
        },
      ])
    })
  })

  describe("context", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core, context }) => html`<meta-${core.tag} context=${{ id: context.id, name: context.name }} />`
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: {
            data: "/core/tag",
            expr: "meta-${[0]}",
          },
          type: "meta",
          context: {
            data: ["/context/id", "/context/name"],
            expr: "{ id: [0], name: [1] }",
          },
        },
      ])
    })
  })

  describe("core/context", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core, context }) => html`
        <meta-${core.tag}
          core=${{ id: context.id, name: context.name }}
          context=${{ id: context.id, name: context.name }} />
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: {
            data: "/core/tag",
            expr: "meta-${[0]}",
          },
          type: "meta",
          core: {
            data: ["/context/id", "/context/name"],
            expr: "{ id: [0], name: [1] }",
          },
          context: {
            data: ["/context/id", "/context/name"],
            expr: "{ id: [0], name: [1] }",
          },
        },
      ])
    })
  })
})
