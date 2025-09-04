import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements, type PartsHierarchy } from "../../parser"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { Node } from "../../index.t"
import type { PartAttrs } from "../../attributes.t"

describe("map", () => {
  describe("простой map", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

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
          child: [
            {
              type: "map",
              text: "context.list.map((name)",
              child: [
                {
                  tag: "li",
                  type: "el",
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
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]
    beforeAll(() => {
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
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              text: "context.list.map((name)",
              child: [
                {
                  tag: "li",
                  type: "el",
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
      ])
    })
    describe("map в элементе вложенный в map", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
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
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () =>
        expect(elements).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                text: "core.list.map(({ title, nested })",
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
        ])
      })
    })
    describe("map рендерит вложенные шаблоны (последовательность name/kind)", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
          ({ html, context }) => html`
            <ul>
              ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
            </ul>
          `
        )
        elements = extractHtmlElements(mainHtml)
      })
      it("hierarchy", () =>
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
                                text: "A",
                              },
                            ],
                          },
                          {
                            tag: "strong",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                text: "B",
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
    describe("map в условии", () => {
      let elements: PartsHierarchy
      let attributes: PartAttrs
      let data: Node[]
      beforeAll(() => {
        const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
          ({ html, core, context }) => html`
            ${context.flag
              ? html`<ul>
                  ${core.list.map(
                    ({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`
                  )}
                </ul>`
              : html`<div>x</div>`}
          `
        )
        elements = extractHtmlElements(mainHtml)
      })

      it("hierarchy", () =>
        expect(elements).toEqual([
          {
            type: "cond",
            text: "context.flag",
            child: [
              {
                tag: "ul",
                type: "el",
                child: [
                  {
                    type: "map",
                    text: "core.list.map(({ title, nested })",
                    child: [
                      {
                        tag: "li",
                        type: "el",
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
              {
                tag: "div",
                type: "el",
                child: [
                  {
                    type: "text",
                    text: "x",
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
            type: "cond",
            data: "/context/flag",
            child: [
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
              {
                tag: "div",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "x",
                  },
                ],
              },
            ],
          },
        ])
      })
    })
  })
  describe("map в text вложенный в map", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
          </ul>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.list.map(({ title, nested })",
              child: [
                {
                  tag: "li",
                  type: "el",
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
})
