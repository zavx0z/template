import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../parser"
import { enrichWithData } from "../data"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("basic", () => {
  describe("простая пара тегов", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
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
        },
      ])
    })
  })

  describe("вложенность и соседние узлы", () => {
    let elements: PartAttrs
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
    })

    it("attributes", () => {
      expect(elements).toEqual([
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

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
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
    let elements: PartAttrs
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
    })
    it("attributes", () => {
      expect(elements).toEqual([
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
