import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("conditions", () => {
  describe("тернарник с внутренними тегами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, context }) => html` <div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, context }) => html`
          <div>
            <header>Header</header>
            ${context.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
            <footer>Footer</footer>
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements, "простой тернарный оператор с context с оберткой и соседними элементами").toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, context }) =>
          html`<div>${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
      )
    })

    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, context }) => html`
          <div>${context.cond === context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ a: number; b: number; c: number; d: number }>(
        ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
      )
    })

    it.todo("data", () => {
      expect(elements).toEqual([
        {
          type: "text",
          data: ["/context/a", "/context/b", "/context/c", "/context/d"],
          expr: '${[0] < [1] && [2] > [3] ? "1" : "0"}',
        },
      ])
    })
  })

  describe("условие вокруг self/void", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html, context }) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`)
    })

    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { items: { show: boolean }[] }>(
        ({ html, core }) => html`
          <div>
            ${core.items.map((item) =>
              item.show ? html`<div class="true-branch"></div>` : html`<div class="false-branch"></div>`
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map(
              (_, i) => html` <li>${i % 2 ? html` <em>${"A"}</em> ` : html` <strong>${"B"}</strong>`}</li> `
            )}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ a: number; b: number; c: number; d: number }>(
        ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "text",
          data: ["/context/a", "/context/b", "/context/c", "/context/d"],
          expr: '${[0] < [1] && [2] > [3] ? "1" : "0"}',
        },
      ])
    })
  })
})
