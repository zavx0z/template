import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../parser"
import { enrichWithData } from "../../data"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"

describe("conditions", () => {
  describe("тернарник с внутренними тегами", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html` <div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
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
              type: "cond",
              text: "context.cond",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
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
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/cond",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "A",
                    },
                  ],
                },
                {
                  tag: "span",
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
          ],
        },
      ])
    })
  })

  describe("простой тернарный оператор с context с оберткой и соседними элементами", () => {
    let elements: PartAttrs
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

    it("attributes", () => {
      expect(elements).toEqual([
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
              child: [{ type: "text", text: "Footer" }],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
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
              child: [
                {
                  tag: "span",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Active",
                    },
                  ],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Inactive",
                    },
                  ],
                },
              ],
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
    let elements: PartAttrs
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
          child: [
            {
              type: "cond",
              text: "context.cond && context.cond2",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
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
        data = enrichWithData(elements)
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
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", value: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [{ type: "text", value: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сравнение переменных на равенство", () => {
    let elements: PartAttrs
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
          child: [
            {
              type: "cond",
              text: "context.cond === context.cond2",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", text: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
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
        data = enrichWithData(elements)
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
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", value: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [{ type: "text", value: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логические операторы без тегов — ничего не находится", () => {
    let elements: PartAttrs
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
    let elements: PartAttrs
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
          child: [
            {
              type: "cond",
              text: "context.flag",
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
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/flag",
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
              ],
            },
          ],
        },
      ])
    })
  })

  describe("condition внутри map", () => {
    let elements: PartAttrs
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
                      string: {
                        class: {
                          type: "static",
                          value: "true-branch",
                        },
                      },
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          type: "static",
                          value: "false-branch",
                        },
                      },
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
        data = enrichWithData(elements)
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
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "true-branch",
                      },
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "false-branch",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("map + условия", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map(
              (_, i) => html` <li>${i % 2 ? html` <em>${"A"}</em> ` : html` <strong>${"B"}</strong>`}</li> `
            )}
          </ul>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              text: "context.list.map((_, i)",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "cond",
                      text: "i % 2",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              text: '${"A"}',
                            },
                          ],
                        },
                        {
                          tag: "strong",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              text: '${"B"}',
                            },
                          ],
                        },
                      ],
                    },
                  ],
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
              type: "map",
              data: "/context/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "cond",
                      data: "[index]",
                      expr: "${[0] % 2}",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              value: "A",
                            },
                          ],
                        },
                        {
                          tag: "strong",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              value: "B",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("операторы сравнения — без тегов", () => {
    let elements: PartAttrs

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ a: number; b: number; c: number; d: number }>(
        ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          type: "text",
          text: '${context.a < context.b && context.c > context.d ? "1" : "0"}',
        },
      ])
    })
  })
})
