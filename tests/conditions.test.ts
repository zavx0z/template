import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"
import { print } from "../fixture"

describe("conditions", () => {
  describe("тернарник с внутренними тегами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`<div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div>`
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 0, end: 5, name: "div", kind: "open" },
        { text: "<em>", start: 27, end: 31, name: "em", kind: "open" },
        { text: "A", start: 31, end: 32, name: "", kind: "text" },
        { text: "</em>", start: 32, end: 37, name: "em", kind: "close" },
        { text: "<span>", start: 46, end: 52, name: "span", kind: "open" },
        { text: "b", start: 52, end: 53, name: "", kind: "text" },
        { text: "</span>", start: 53, end: 60, name: "span", kind: "close" },
        { text: "</div>", start: 62, end: 68, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond",
              true: {
                tag: "em",
                type: "el",
                text: "<em>",
                child: [{ type: "text", text: "A" }],
              },
              false: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [{ type: "text", text: "b" }],
              },
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/cond",
              true: {
                tag: "em",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "A",
                  },
                ],
              },
              false: {
                tag: "span",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "b",
                  },
                ],
              },
            },
          ],
        },
      ])
    })
  })

  describe("простой тернарный оператор с context с оберткой и соседними элементами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`
        <div>
          <header>Header</header>
          ${context.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
          <footer>Footer</footer>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () => {
      expect(tokens).toEqual([
        { kind: "tag-open", text: "<div>", name: "div" },
        { kind: "tag-open", text: "<header>", name: "header" },
        { kind: "text", text: "Header" },
        { kind: "tag-close", text: "</header>", name: "header" },
        { kind: "cond-open", expr: "context.isActive" },
        { kind: "tag-open", text: "<span>", name: "span" },
        { kind: "text", text: "Active" },
        { kind: "tag-close", text: "</span>", name: "span" },
        { kind: "cond-else" },
        { kind: "tag-open", text: "<span>", name: "span" },
        { kind: "text", text: "Inactive" },
        { kind: "tag-close", text: "</span>", name: "span" },
        { kind: "cond-close" },
        { kind: "tag-open", text: "<footer>", name: "footer" },
        { kind: "text", text: "Footer" },
        { kind: "tag-close", text: "</footer>", name: "footer" },
        { kind: "tag-close", text: "</div>", name: "div" },
      ])
    })
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              tag: "header",
              type: "el",
              text: "<header>",
              child: [
                {
                  type: "text",
                  text: "Header",
                },
              ],
            },
            {
              type: "cond",
              text: "context.isActive",
              true: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [
                  {
                    type: "text",
                    text: "Active",
                  },
                ],
              },
              false: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [
                  {
                    type: "text",
                    text: "Inactive",
                  },
                ],
              },
            },
            {
              tag: "footer",
              type: "el",
              text: "<footer>",
              child: [{ type: "text", text: "Footer" }],
            },
          ],
        },
      ])
    })
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data, "простой тернарный оператор с context с оберткой и соседними элементами").toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "header",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Header",
                },
              ],
            },
            {
              type: "cond",
              data: "/context/isActive",
              true: {
                tag: "span",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "Active",
                  },
                ],
              },
              false: {
                tag: "span",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "Inactive",
                  },
                ],
              },
            },
            {
              tag: "footer",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Footer",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сравнение нескольких переменных", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`<div>${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 0, end: 5, name: "div", kind: "open" },
        { text: "<em>", start: 44, end: 48, name: "em", kind: "open" },
        { text: "A", start: 48, end: 49, name: "", kind: "text" },
        { text: "</em>", start: 49, end: 54, name: "em", kind: "close" },
        { text: "<span>", start: 63, end: 69, name: "span", kind: "open" },
        { text: "b", start: 69, end: 70, name: "", kind: "text" },
        { text: "</span>", start: 70, end: 77, name: "span", kind: "close" },
        { text: "</div>", start: 79, end: 85, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond && context.cond2",
              true: {
                tag: "em",
                type: "el",
                text: "<em>",
                child: [{ type: "text", text: "A" }],
              },
              false: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [{ type: "text", text: "b" }],
              },
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/context/cond", "/context/cond2"],
              expr: "${[0]} && ${[1]}",
              true: {
                tag: "em",
                type: "el",
                child: [{ type: "text", value: "A" }],
              },
              false: {
                tag: "span",
                type: "el",
                child: [{ type: "text", value: "b" }],
              },
            },
          ],
        },
      ])
    })
  })

  describe("сравнение переменных на равенство", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`
        <div>${context.cond === context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 9, end: 14, name: "div", kind: "open" },
        { text: "<em>", start: 54, end: 58, name: "em", kind: "open" },
        { text: "A", start: 58, end: 59, name: "", kind: "text" },
        { text: "</em>", start: 59, end: 64, name: "em", kind: "close" },
        { text: "<span>", start: 73, end: 79, name: "span", kind: "open" },
        { text: "b", start: 79, end: 80, name: "", kind: "text" },
        { text: "</span>", start: 80, end: 87, name: "span", kind: "close" },
        { text: "</div>", start: 89, end: 95, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond === context.cond2",
              true: {
                tag: "em",
                type: "el",
                text: "<em>",
                child: [{ type: "text", text: "A" }],
              },
              false: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [{ type: "text", text: "b" }],
              },
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/context/cond", "/context/cond2"],
              expr: "${[0]} === ${[1]}",
              true: {
                tag: "em",
                type: "el",
                child: [{ type: "text", value: "A" }],
              },
              false: {
                tag: "span",
                type: "el",
                child: [{ type: "text", value: "b" }],
              },
            },
          ],
        },
      ])
    })
  })

  describe("логические операторы без тегов — ничего не находится", () => {
    const html = `a < b && c > d ? "1" : "0"`

    const elements = extractHtmlElements(html)
    it("elements", () => {
      expect(elements).toEqual([{ text: 'a < b && c > d ? "1" : "0"', start: 0, end: 26, name: "", kind: "text" }])
    })

    const tokens = extractTokens(html, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          type: "text",
          text: 'a < b && c > d ? "1" : "0"',
        },
      ])
    })
  })

  describe("условие вокруг self/void", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }: any) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 0, end: 5, name: "div", kind: "open" },
        { text: "<br />", start: 27, end: 33, name: "br", kind: "self" },
        { text: '<img src="x" />', start: 42, end: 57, name: "img", kind: "self" },
        { text: "</div>", start: 59, end: 65, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.flag",
              true: {
                tag: "br",
                type: "el",
                text: "<br />",
              },
              false: {
                tag: "img",
                type: "el",
                text: '<img src="x" />',
              },
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/flag",
              true: {
                tag: "br",
                type: "el",
              },
              false: {
                tag: "img",
                type: "el",
                string: {
                  src: "x",
                },
              },
            },
          ],
        },
      ])
    })
  })
})
