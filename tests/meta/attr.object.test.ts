import { extractHtmlElements, extractMainHtmlBlock } from "../../parser"
import { describe, it, expect, beforeAll } from "bun:test"
import { enrichWithData } from "../../data"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"

describe("core/context в атрибутах", () => {
  describe("core с динамическими значениями", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`<meta-${core.tag} core=${{ id: context.id, name: context.name }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
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
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`<meta-${core.tag} core=${{ id: "1", name: "2" }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "meta-${core.tag}",
          type: "meta",
          core: '{ id: "1", name: "2" }',
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
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
      let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`
          <div><meta-${core.tag} context=${{ id: context.id, name: context.name }} /></div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
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
        data = enrichWithData(elements)
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
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core, context }) => html`<meta-${core.tag} context=${{ id: context.id, name: context.name }} />`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
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
    let elements: PartAttrs
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
        data = enrichWithData(elements)
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
