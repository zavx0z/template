import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../../parser"
import { enrichWithData } from "../../data"
import type { PartAttrs } from "../../attributes.t"
import type { Node } from "../../index.t"

describe("map соседствующие", () => {
  describe("map соседствующий с map на верхнем уровне", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, Core>(
        ({ html, core }) => html`
          ${core.list1.map(({ title }) => html` <div>${title}</div> `)}
          ${core.list2.map(({ title }) => html` <div>${title}</div> `)}
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          text: "core.list2.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
      ]))
    it.skip("attributes", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(elements).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          text: "core.list2.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
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
          type: "map",
          data: "/core/list1",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          data: "/core/list2",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map соседствующий с map внутри элемента", () => {
    type Context = {
      categories: string[]
    }
    type Core = {
      items: {
        categoryId: number
        title: string
      }[]
    }
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<Context, Core>(
        ({ html, context, core }) => html`
          <div class="dashboard">
            ${context.categories.map((cat) => html`<span class="category">${cat}</span>`)}
            ${core.items.map(
              (item) => html`
                <div class="item" data-category="${item.categoryId}">
                  <h4>${item.title}</h4>
                </div>
              `
            )}
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
          string: {
            class: { type: "static", value: "dashboard" },
          },
          child: [
            {
              type: "map",
              text: "context.categories.map((cat)",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: { type: "static", value: "category" },
                  },
                  child: [
                    {
                      type: "text",
                      text: "${cat}",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              text: "core.items.map((item)",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "item" },
                    "data-category": { type: "dynamic", value: "${item.categoryId}" },
                  },
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          text: "${item.title}",
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
          tag: "div",
          type: "el",
          string: {
            class: "dashboard",
          },
          child: [
            {
              type: "map",
              data: "/context/categories",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: "category",
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "item",
                    "data-category": {
                      data: "[item]/categoryId",
                    },
                  },
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
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

  describe("map соседствующий с map на глубоком уровне вложенности", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    let elements: PartAttrs
    let data: Node[]
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{}, Core>(
        ({ html, core }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
              </div>
            </div>
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
          string: {
            class: { type: "static", value: "level1" },
          },
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: { type: "static", value: "level2" },
              },
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "level3" },
                  },
                  child: [
                    {
                      type: "map",
                      text: "core.list1.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: { type: "static", value: "item1" },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "map",
                      text: "core.list2.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: { type: "static", value: "item2" },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "map",
                      text: "core.list3.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: { type: "static", value: "item3" },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
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
