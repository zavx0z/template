import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../../splitter"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import type { Node } from "../../index.t"
import type { PartAttrs } from "../../attributes.t"
import type { PartsHierarchy } from "../../hierarchy.t"

describe("условия соседствующие", () => {
  describe("условие соседствующее с условием на верхнем уровне", () => {
    type Context = {
      flag1: boolean
      flag2: boolean
    }
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<Context, {}>(
        ({ html, context }) => html`
          ${context.flag1
            ? html`<div class="conditional1">Content 1</div>`
            : html`<div class="fallback1">No content 1</div>`}
          ${context.flag2
            ? html`<div class="conditional2">Content 2</div>`
            : html`<div class="fallback2">No content 2</div>`}
        `
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          type: "cond",
          text: "context.flag1",
          child: [
            {
              tag: "div",
              type: "el",
              text: '<div class="conditional1">',
              child: [
                {
                  type: "text",
                  text: "Content 1",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              text: '<div class="fallback1">',
              child: [
                {
                  type: "text",
                  text: "No content 1",
                },
              ],
            },
          ],
        },
        {
          type: "cond",
          text: "context.flag2",
          child: [
            {
              tag: "div",
              type: "el",
              text: '<div class="conditional2">',
              child: [
                {
                  type: "text",
                  text: "Content 2",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              text: '<div class="fallback2">',
              child: [
                {
                  type: "text",
                  text: "No content 2",
                },
              ],
            },
          ],
        },
      ]))

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          type: "cond",
          text: "context.flag1",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "conditional1" },
            },
            child: [
              {
                type: "text",
                text: "Content 1",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "fallback1" },
            },
            child: [
              {
                type: "text",
                text: "No content 1",
              },
            ],
          },
        },
        {
          type: "cond",
          text: "context.flag2",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "conditional2" },
            },
            child: [
              {
                type: "text",
                text: "Content 2",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "fallback2" },
            },
            child: [
              {
                type: "text",
                text: "No content 2",
              },
            ],
          },
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          type: "cond",
          data: "/context/flag1",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: "conditional1",
            },
            child: [
              {
                type: "text",
                value: "Content 1",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: "fallback1",
            },
            child: [
              {
                type: "text",
                value: "No content 1",
              },
            ],
          },
        },
        {
          type: "cond",
          data: "/context/flag2",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: "conditional2",
            },
            child: [
              {
                type: "text",
                value: "Content 2",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: "fallback2",
            },
            child: [
              {
                type: "text",
                value: "No content 2",
              },
            ],
          },
        },
      ])
    })
  })

  describe("условие соседствующее с условием внутри элемента", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ flag1: boolean; flag2: boolean }, {}>(
        ({ html, context }) => html`
          <div class="container">
            ${context.flag1
              ? html`<div class="conditional1">Content 1</div>`
              : html`<div class="fallback1">No content 1</div>`}
            ${context.flag2
              ? html`<div class="conditional2">Content 2</div>`
              : html`<div class="fallback2">No content 2</div>`}
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
          text: '<div class="container">',
          child: [
            {
              type: "cond",
              text: "context.flag1",
              child: [
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="conditional1">',
                  child: [
                    {
                      type: "text",
                      text: "Content 1",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="fallback1">',
                  child: [
                    {
                      type: "text",
                      text: "No content 1",
                    },
                  ],
                },
              ],
            },
            {
              type: "cond",
              text: "context.flag2",
              child: [
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="conditional2">',
                  child: [
                    {
                      type: "text",
                      text: "Content 2",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="fallback2">',
                  child: [
                    {
                      type: "text",
                      text: "No content 2",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: { type: "static", value: "container" },
          },
          child: [
            {
              type: "cond",
              text: "context.flag1",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "conditional1" },
                },
                child: [
                  {
                    type: "text",
                    text: "Content 1",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "fallback1" },
                },
                child: [
                  {
                    type: "text",
                    text: "No content 1",
                  },
                ],
              },
            },
            {
              type: "cond",
              text: "context.flag2",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "conditional2" },
                },
                child: [
                  {
                    type: "text",
                    text: "Content 2",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "fallback2" },
                },
                child: [
                  {
                    type: "text",
                    text: "No content 2",
                  },
                ],
              },
            },
          ],
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: "container",
          },
          child: [
            {
              type: "cond",
              data: "/context/flag1",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: "conditional1",
                },
                child: [
                  {
                    type: "text",
                    value: "Content 1",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: "fallback1",
                },
                child: [
                  {
                    type: "text",
                    value: "No content 1",
                  },
                ],
              },
            },
            {
              type: "cond",
              data: "/context/flag2",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: "conditional2",
                },
                child: [
                  {
                    type: "text",
                    value: "Content 2",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: "fallback2",
                },
                child: [
                  {
                    type: "text",
                    value: "No content 2",
                  },
                ],
              },
            },
          ],
        },
      ])
    })
  })

  describe("условие соседствующее с условием на глубоком уровне вложенности", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ flag1: boolean; flag2: boolean; flag3: boolean }, {}>(
        ({ html, context }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${context.flag1
                  ? html`<div class="conditional1">Content 1</div>`
                  : html`<div class="fallback1">No content 1</div>`}
                ${context.flag2
                  ? html`<div class="conditional2">Content 2</div>`
                  : html`<div class="fallback2">No content 2</div>`}
                ${context.flag3
                  ? html`<div class="conditional3">Content 3</div>`
                  : html`<div class="fallback3">No content 3</div>`}
              </div>
            </div>
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
      // attributes = extractAttributes(elements)
      // data = enrichWithData(attributes)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="level1">',
          child: [
            {
              tag: "div",
              type: "el",
              text: '<div class="level2">',
              child: [
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="level3">',
                  child: [
                    {
                      type: "cond",
                      text: "context.flag1",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="conditional1">',
                          child: [
                            {
                              type: "text",
                              text: "Content 1",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="fallback1">',
                          child: [
                            {
                              type: "text",
                              text: "No content 1",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "cond",
                      text: "context.flag2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="conditional2">',
                          child: [
                            {
                              type: "text",
                              text: "Content 2",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="fallback2">',
                          child: [
                            {
                              type: "text",
                              text: "No content 2",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "cond",
                      text: "context.flag3",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="conditional3">',
                          child: [
                            {
                              type: "text",
                              text: "Content 3",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="fallback3">',
                          child: [
                            {
                              type: "text",
                              text: "No content 3",
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
