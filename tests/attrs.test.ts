import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../parser"
import { enrichWithData } from "../data"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("атрибуты", () => {
  describe("namespace", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "svg:use",
          type: "el",
          string: {
            "xlink:href": {
              type: "static",
              value: "#id",
            },
          },
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "svg:use",
          type: "el",
          string: {
            "xlink:href": "#id",
          },
        },
      ])
    })
  })
  describe("пустые значения", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div class="" id="">Content</div>`)
      elements = extractHtmlElements(mainHtml)
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
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
  describe("двойные/одинарные кавычки", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "a",
          type: "el",
          string: {
            href: {
              type: "static",
              value: "https://e.co",
            },
            target: {
              type: "static",
              value: "_blank",
            },
          },
          child: [
            {
              type: "text",
              text: "x",
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
          tag: "a",
          type: "el",
          string: {
            href: "https://e.co",
            target: "_blank",
          },
          child: [
            {
              type: "text",
              value: "x",
            },
          ],
        },
      ])
    })
  })

  describe("угловые скобки внутри значения", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div title="a > b, c < d"></div>`)
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              type: "static",
              value: "a > b, c < d",
            },
          },
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
          string: {
            title: "a > b, c < d",
          },
        },
      ])
    })
  })

  describe("условие в атрибуте", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              type: "dynamic",
              value: '${context.flag ? "a > b" : "c < d"}',
            },
          },
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
          string: {
            title: {
              data: "/context/flag",
              expr: '${[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])
    })
  })

  describe("условие в аттрибуте без кавычек", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title=${context.flag ? "a > b" : "c < d"}></div>`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              type: "dynamic",
              value: '${context.flag ? "a > b" : "c < d"}',
            },
          },
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
          string: {
            title: {
              data: "/context/flag",
              expr: '${[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])
    })
  })

  describe("условие в аттрибуте с одинарными кавычками", () => {
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        // prettier-ignore
        ({ html, context }) => html`<div title='${context.flag ? "a > b" : "c < d"}'></div>`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              type: "dynamic",
              value: '${context.flag ? "a > b" : "c < d"}',
            },
          },
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
          string: {
            title: {
              data: "/context/flag",
              expr: '${[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])
    })
  })
})

it("булевые атрибуты", () => {
  let elements: PartAttrs
  let data: Node[]
  beforeAll(() => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      ({ html, context }) => html`<button ${context.flag && "disabled"}></button>`
    )
    elements = extractHtmlElements(mainHtml)
  })
  it("attributes", () => {
    expect(elements).toEqual([
      {
        tag: "button",
        type: "el",
        boolean: {
          disabled: {
            type: "dynamic",
            value: "${context.flag}",
          },
        },
      },
    ])
  })
  it.skip("data", () => {
    beforeAll(() => {
      data = enrichWithData(elements)
    })
    expect(data).toEqual([
      {
        tag: "button",
        type: "el",
        boolean: {
          disabled: {
            data: "/context/flag",
          },
        },
      },
    ])
  })
})

describe("класс в map", () => {
  let elements: PartAttrs
  let data: Node[]
  beforeAll(() => {
    const mainHtml = extractMainHtmlBlock<any, { items: { type: string; name: string }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.items.map((item) => html`<li class="item-${item.type}" title="${item.name}">${item.name}</li>`)}
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
            type: "map",
            text: "core.items.map((item)",
            child: [
              {
                tag: "li",
                type: "el",
                string: {
                  class: {
                    type: "mixed",
                    value: "item-${item.type}",
                  },
                  title: {
                    type: "dynamic",
                    value: "${item.name}",
                  },
                },
                child: [
                  {
                    type: "text",
                    text: "${item.name}",
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
            data: "/core/items",
            child: [
              {
                tag: "li",
                type: "el",
                string: {
                  class: {
                    data: "[item]/type",
                    expr: "item-${[0]}",
                  },
                  title: {
                    data: "[item]/name",
                  },
                },
                child: [
                  {
                    type: "text",
                    data: "[item]/name",
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

describe("сложные условные атрибуты class", () => {
  let elements: PartAttrs
  let data: Node[]
  beforeAll(() => {
    const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
      ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}">Content</div>`
    )
    elements = extractHtmlElements(mainHtml)
  })
  it("attributes", () => {
    expect(elements).toEqual([
      {
        tag: "div",
        type: "el",
        string: {
          class: {
            type: "mixed",
            value: 'div-${core.active ? "active" : "inactive"}',
          },
        },
        child: [
          {
            type: "text",
            text: "Content",
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
        string: {
          class: {
            data: "/core/active",
            expr: 'div-${[0] ? "active" : "inactive"}',
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
