import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { PartsHierarchy } from "../../hierarchy.t"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"

describe("conditions", () => {
  describe("тернарник с внутренними тегами", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html` <div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond",
              child: [
                {
                  tag: "em",
                  type: "el",
                  text: "<em>",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  text: "<span>",
                  child: [{ type: "text", text: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html`
          <div>
            <header>Header</header>
            ${context.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
            <footer>Footer</footer>
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
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
              child: [
                {
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
                {
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
              ],
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

    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) =>
          html`<div>${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond && context.cond2",
              child: [
                {
                  tag: "em",
                  type: "el",
                  text: "<em>",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  text: "<span>",
                  child: [{ type: "text", text: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html`
          <div>${context.cond === context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.cond === context.cond2",
              child: [
                {
                  tag: "em",
                  type: "el",
                  text: "<em>",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  text: "<span>",
                  child: [{ type: "text", text: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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
    let elements: PartsHierarchy
    beforeAll(() => {
      const html = `a < b && c > d ? "1" : "0"`
      elements = extractHtmlElements(html)
    })

    it.todo("hierarchy", () => {
      expect(elements).toEqual([
        {
          type: "text",
          text: 'a < b && c > d ? "1" : "0"',
        },
      ])
    })
  })

  describe("условие вокруг self/void", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.flag",
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
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
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

  describe("condition внутри map", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { items: { show: boolean }[] }>(
        ({ html, core }) => html`
          <div>
            ${core.items.map((item) =>
              item.show ? html`<div class="true-branch"></div>` : html`<div class="false-branch"></div>`
            )}
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "map",
              text: "core.items.map((item)",
              child: [
                {
                  type: "cond",
                  text: "item.show",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      text: '<div class="true-branch">',
                    },
                    {
                      tag: "div",
                      type: "el",
                      text: '<div class="false-branch">',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
    it.skip("data", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  type: "cond",
                  data: "[item]/show",
                  true: {
                    tag: "div",
                    type: "el",
                    string: {
                      class: "true-branch",
                    },
                  },
                  false: {
                    tag: "div",
                    type: "el",
                    string: {
                      class: "false-branch",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
