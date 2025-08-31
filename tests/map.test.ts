import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"

describe("map", () => {
  describe("простой map", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map((name) => html`<li>${name}</li>`)}
        </ul>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 58, end: 62, name: "li", kind: "open" },
        { text: "${name}", start: 62, end: 69, name: "", kind: "text" },
        { text: "</li>", start: 69, end: 74, name: "li", kind: "close" },
        { text: "</ul>", start: 86, end: 91, name: "ul", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
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
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
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
                      type: "text",
                      data: "[item]",
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

  describe("простой map с несколькими детьми", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map(
            (name) => html`
              <li>${name}</li>
              <br />
            `
          )}
        </ul>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 73, end: 77, name: "li", kind: "open" },
        { text: "${name}", start: 77, end: 84, name: "", kind: "text" },
        { text: "</li>", start: 84, end: 89, name: "li", kind: "close" },
        { text: "<br />", start: 104, end: 110, name: "br", kind: "self" },
        { text: "</ul>", start: 135, end: 140, name: "ul", kind: "close" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
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
                {
                  tag: "br",
                  type: "el",
                  text: "<br />",
                },
              ],
            },
          ],
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
                {
                  tag: "br",
                  type: "el",
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("map в элементе вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      // prettier-ignore
      ({ html, core }) => html`
        <ul>
          ${core.list.map(
            ({ title, nested }) => html`
              <li>
                <p>${title} </p>
                ${nested.map((n) => html`<em>${n}</em>`)}
              </li>
            `
          )}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 83, end: 87, name: "li", kind: "open" },
        { text: "<p>", start: 104, end: 107, name: "p", kind: "open" },
        { text: "${title} ", start: 107, end: 116, name: "", kind: "text" },
        { text: "</p>", start: 116, end: 120, name: "p", kind: "close" },
        { text: "<em>", start: 162, end: 166, name: "em", kind: "open" },
        { text: "${n}", start: 166, end: 170, name: "", kind: "text" },
        { text: "</em>", start: 170, end: 175, name: "em", kind: "close" },
        { text: "</li>", start: 193, end: 198, name: "li", kind: "close" },
        { text: "</ul>", start: 223, end: 228, name: "ul", kind: "close" },
      ]))
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
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
                      tag: "p",
                      type: "el",
                      text: "<p>",
                      child: [
                        {
                          type: "text",
                          text: "${title} ",
                        },
                      ],
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
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
                        },
                      ],
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
      ]))
  })

  describe("map рендерит вложенные шаблоны (последовательность name/kind)", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 58, end: 62, name: "li", kind: "open" },
        { text: "<em>", start: 77, end: 81, name: "em", kind: "open" },
        { text: "A", start: 81, end: 82, name: "", kind: "text" },
        { text: "</em>", start: 82, end: 87, name: "em", kind: "close" },
        { text: "<strong>", start: 96, end: 104, name: "strong", kind: "open" },
        { text: "B", start: 104, end: 105, name: "", kind: "text" },
        { text: "</strong>", start: 105, end: 114, name: "strong", kind: "close" },
        { text: "</li>", start: 116, end: 121, name: "li", kind: "close" },
        { text: "</ul>", start: 133, end: 138, name: "ul", kind: "close" },
      ]))
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "ul",
          type: "el",
          text: "<ul>",
          child: [
            {
              type: "map",
              text: "context.list.map((_, i)",
              child: [
                {
                  tag: "li",
                  type: "el",
                  text: "<li>",
                  child: [
                    {
                      type: "cond",
                      text: "i % 2",
                      true: {
                        tag: "em",
                        type: "el",
                        text: "<em>",
                        child: [
                          {
                            type: "text",
                            text: "A",
                          },
                        ],
                      },
                      false: {
                        tag: "strong",
                        type: "el",
                        text: "<strong>",
                        child: [
                          {
                            type: "text",
                            text: "B",
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
                        tag: "strong",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            value: "B",
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("map в text вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 68, end: 72, name: "li", kind: "open" },
        { text: "${title} ", start: 72, end: 81, name: "", kind: "text" },
        { text: "<em>", start: 106, end: 110, name: "em", kind: "open" },
        { text: "${n}", start: 110, end: 114, name: "", kind: "text" },
        { text: "</em>", start: 114, end: 119, name: "em", kind: "close" },
        { text: "</li>", start: 122, end: 127, name: "li", kind: "close" },
        { text: "</ul>", start: 139, end: 144, name: "ul", kind: "close" },
      ]))
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
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
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
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
      ]))
  })
  describe("map в условии", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
      ({ html, core, context }) => html`
        ${context.flag
          ? html`<ul>
              ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
            </ul>`
          : html`<div>x</div>`}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<ul>", start: 31, end: 35, name: "ul", kind: "open" },
        { text: "<li>", start: 94, end: 98, name: "li", kind: "open" },
        { text: "${title} ", start: 98, end: 107, name: "", kind: "text" },
        { text: "<em>", start: 132, end: 136, name: "em", kind: "open" },
        { text: "${n}", start: 136, end: 140, name: "", kind: "text" },
        { text: "</em>", start: 140, end: 145, name: "em", kind: "close" },
        { text: "</li>", start: 148, end: 153, name: "li", kind: "close" },
        { text: "</ul>", start: 169, end: 174, name: "ul", kind: "close" },
        { text: "<div>", start: 183, end: 188, name: "div", kind: "open" },
        { text: "x", start: 188, end: 189, name: "", kind: "text" },
        { text: "</div>", start: 189, end: 195, name: "div", kind: "close" },
      ]))
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          type: "cond",
          text: "context.flag",
          true: {
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
          false: {
            tag: "div",
            type: "el",
            text: "<div>",
            child: [
              {
                type: "text",
                text: "x",
              },
            ],
          },
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () =>
      expect(data).toEqual([
        {
          type: "cond",
          data: "/context/flag",
          true: {
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
          false: {
            tag: "div",
            type: "el",
            child: [
              {
                type: "text",
                value: "x",
              },
            ],
          },
        },
      ]))
  })
})
