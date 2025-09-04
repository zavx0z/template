import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../parser"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import type { PartsHierarchy } from "../hierarchy.t"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("text", () => {
  describe("динамический текст в map где значением является строка элемент массива", () => {
    let elements: PartsHierarchy

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map((name) => html`<li>${name}</li>`)}
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
          text: "<ul>",
          child: [
            {
              type: "map",
              text: "context.list.map((name)",
              child: [
                {
                  tag: "li",
                  type: "el",
                  text: "<li>",
                  child: [
                    {
                      type: "text",
                      text: "${name}",
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

  describe("динамический текст с разными именами переменных элемента массива", () => {
    let elements: PartsHierarchy

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { list: { name: string; family: string }[] }>(
        ({ html, context }) => html`
          <div>
            <p>static</p>
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
              tag: "p",
              type: "el",
              text: "<p>",
              child: [
                {
                  type: "text",
                  text: "static",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("смешанный текст - статический + динамический (с одной переменной)", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ name: string }>(
        ({ html, context }) => html`
          <div>
            <p>Hello, ${context.name}!</p>
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
              tag: "p",
              type: "el",
              text: "<p>",
              child: [
                {
                  type: "text",
                  text: "Hello, ${context.name}!",
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
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/name",
                  expr: "Hello, ${[0]}!",
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("смешанный текст - статический + динамический (с несколькими переменными)", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ family: string; name: string }>(
        ({ html, context }) => html`
          <div>
            <p>Hello, ${context.family} ${context.name}!</p>
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
              tag: "p",
              type: "el",
              text: "<p>",
              child: [
                {
                  type: "text",
                  text: "Hello, ${context.family} ${context.name}!",
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
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/context/family", "/context/name"],
                  expr: "Hello, ${[0]} ${[1]}!",
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("условие в тексте", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ show: boolean; name: string }>(
        ({ html, context }) => html`
          <div>
            <p>${context.show ? "Visible" : "Hidden"}</p>
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
              tag: "p",
              type: "el",
              text: "<p>",
              child: [
                {
                  type: "text",
                  text: '${context.show ? "Visible" : "Hidden"}',
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
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/show",
                  expr: '${[0] ? "Visible" : "Hidden"}',
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("map в рядом с текстом, рядом с динамическим текстом из map выше уровня", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.list.map(({ title, nested }) => html` <li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li> `)}
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
          text: "<ul>",
          child: [
            {
              type: "map",
              text: "core.list.map(({ title, nested })",
              child: [
                {
                  tag: "li",
                  type: "el",
                  text: "<li>",
                  child: [
                    {
                      type: "text",
                      text: "${title} ",
                    },
                    {
                      type: "map",
                      text: "nested.map((n)",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          text: "<em>",
                          child: [
                            {
                              type: "text",
                              text: "${n}",
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
        attributes = extractAttributes(elements)
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                    {
                      type: "map",
                      data: "[item]/nested",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]",
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
  describe("динамический текст в условии", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ show: boolean; name: string }>(
        ({ html, context }) => html`
          <div>${context.show ? html`<p>Visible: ${context.name}</p>` : html`<p>Hidden</p>`}</div>
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
              text: "context.show",
              child: [
                {
                  tag: "p",
                  type: "el",
                  text: "<p>",
                  child: [
                    {
                      type: "text",
                      text: "Visible: ${context.name}",
                    },
                  ],
                },
                {
                  tag: "p",
                  type: "el",
                  text: "<p>",
                  child: [
                    {
                      type: "text",
                      text: "Hidden",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
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
                data: "/context/show",
                true: {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "/context/name",
                      expr: "Visible: ${[0]}",
                    },
                  ],
                },
                false: {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Hidden",
                    },
                  ],
                },
              },
            ],
          },
        ])
      })
    })
  })

  describe("статический текст в элементе на одном уровне с динамическим текстом", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html, context }) => html`<div><b>Hello, </b>${context.name}</div>`)
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
              tag: "b",
              type: "el",
              text: "<b>",
              child: [
                {
                  type: "text",
                  text: "Hello, ",
                },
              ],
            },
            {
              type: "text",
              text: "${context.name}",
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
              tag: "b",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Hello, ",
                },
              ],
            },
            {
              type: "text",
              data: "/context/name",
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст со статическим текстом в элементе на одном уровне", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html, context }) => html`<div>${context.name}<b>-hello</b></div>`)
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
              type: "text",
              text: "${context.name}",
            },
            {
              tag: "b",
              type: "el",
              text: "<b>",
              child: [
                {
                  type: "text",
                  text: "-hello",
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
              type: "text",
              data: "/context/name",
            },
            {
              tag: "b",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "-hello",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамические тексты вокруг статического текста", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html`<div>${context.family} <b>-hello</b>${context.name}</div>`
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
              type: "text",
              text: "${context.family} ",
            },
            {
              tag: "b",
              type: "el",
              text: "<b>",
              child: [
                {
                  type: "text",
                  text: "-hello",
                },
              ],
            },
            {
              type: "text",
              text: "${context.name}",
            },
          ],
        },
      ])
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
                type: "text",
                data: "/context/family",
              },
              {
                tag: "b",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "-hello",
                  },
                ],
              },
              {
                type: "text",
                data: "/context/name",
              },
            ],
          },
        ])
      })
    })
  })

  describe("динамический текст в map с доступом по ключу в элементе массива, на разных уровнях", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { users: { name: string; role: string }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.users.map((user) => html` <li><strong>${user.name}</strong> - ${user.role}</li> `)}
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
          text: "<ul>",
          child: [
            {
              type: "map",
              text: "core.users.map((user)",
              child: [
                {
                  tag: "li",
                  type: "el",
                  text: "<li>",
                  child: [
                    {
                      tag: "strong",
                      type: "el",
                      text: "<strong>",
                      child: [
                        {
                          type: "text",
                          text: "${user.name}",
                        },
                      ],
                    },
                    {
                      type: "text",
                      text: " - ${user.role}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
      it.skip("data", () => {
        beforeAll(() => {
          attributes = extractAttributes(elements)
          data = enrichWithData(attributes)
        })
        expect(data).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/core/users",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        tag: "strong",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            data: "[item]/name",
                          },
                        ],
                      },
                      {
                        type: "text",
                        data: "[item]/role",
                        expr: "- ${[0]}",
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
  })

  describe("обрабатывает выражения в ${}", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
        ({ html, context }) => html`
          <div>
            <p>${context.list.map((item) => item.toUpperCase())}</p>
          </div>
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
          tag: "div",
          type: "el",
          child: [
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/list",
                  expr: "${[0]}.map((item) => item.toUpperCase())",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("обрабатывает выражения с точками в ${} к вложенным элементам ядра", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { user: { name: string } }>(
        ({ html, core }) => html`
          <div>
            <p>${core.user.name}</p>
          </div>
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
          tag: "div",
          type: "el",
          child: [
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/core/user/name",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
