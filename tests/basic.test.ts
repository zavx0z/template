import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../parser"
import { extractAttributes } from "../attributes"
import { enrichWithData } from "../data"
import type { PartsHierarchy } from "../hierarchy.t"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("basic", () => {
  describe("простая пара тегов", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
      elements = extractHtmlElements(mainHtml)
      attributes = extractAttributes(elements)
      data = enrichWithData(attributes)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
        },
      ])
    })

    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
        },
      ])
    })

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
        },
      ])
    })
  })

  describe("вложенность и соседние узлы", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <ul>
            <li>a</li>
            <li>b</li>
          </ul>
        `
      )
      elements = extractHtmlElements(mainHtml)
      attributes = extractAttributes(elements)
      data = enrichWithData(attributes)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          text: "<ul>",
          child: [
            {
              tag: "li",
              type: "el",
              text: "<li>",
              child: [
                {
                  type: "text",
                  text: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              text: "<li>",
              child: [
                {
                  type: "text",
                  text: "b",
                },
              ],
            },
          ],
        },
      ])
    })

    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "b",
                },
              ],
            },
          ],
        },
      ])
    })

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "b",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("void и self", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <div>
            <br />
            <img src="x" />
            <input disabled />
          </div>
        `
      )

      elements = extractHtmlElements(mainHtml)
      attributes = extractAttributes(elements)
      data = enrichWithData(attributes)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              tag: "br",
              type: "el",
              text: "<br />",
            },
            {
              tag: "img",
              type: "el",
              text: '<img src="x" />',
            },
            {
              tag: "input",
              type: "el",
              text: "<input disabled />",
            },
          ],
        },
      ])
    })

    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "br",
              type: "el",
            },
            {
              tag: "img",
              type: "el",
              string: {
                src: {
                  type: "static",
                  value: "x",
                },
              },
            },
            {
              tag: "input",
              type: "el",
              boolean: {
                disabled: {
                  type: "static",
                  value: true,
                },
              },
            },
          ],
        },
      ])
    })

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "br",
              type: "el",
            },
            {
              tag: "img",
              type: "el",
              string: {
                src: "x",
              },
            },
            {
              tag: "input",
              type: "el",
              boolean: {
                disabled: true,
              },
            },
          ],
        },
      ])
    })
  })
})
