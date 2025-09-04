import { extractHtmlElements, extractMainHtmlBlock } from "../../parser"
import { type PartsHierarchy } from "../../parser.t"
import { describe, it, expect, beforeAll } from "bun:test"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"

describe("core/context в атрибутах", () => {
  describe("core с динамическими значениями", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`<meta-${core.tag} core=${{ id: context.id, name: context.name }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`<meta-${core.tag} core=${{ id: "1", name: "2" }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "meta-${core.tag}",
          type: "meta",
          core: '{ id: "1", name: "2" }',
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`
          <div><meta-${core.tag} context=${{ id: context.id, name: context.name }} /></div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
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
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`<meta-${core.tag} context=${{ id: context.id, name: context.name }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`
          <meta-${core.tag}
            core=${{ id: context.id, name: context.name }}
            context=${{ id: context.id, name: context.name }} />
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
