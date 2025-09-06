import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map соседствующие", () => {
  describe("map соседствующий с map на верхнем уровне", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, core }) => html`
          ${core.list1.map(({ title }) => html` <div>${title}</div> `)}
          ${core.list2.map(({ title }) => html` <div>${title}</div> `)}
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]
    beforeAll(() => {
      elements = parse<Context, Core>(
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
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{}, Core>(
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
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
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
                          string: {
                            class: "item1",
                          },
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
                          string: {
                            class: "item2",
                          },
                        },
                      ],
                    },
                    {
                      type: "map",
                      data: "/core/list3",
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
                          string: {
                            class: "item3",
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    class: "level3",
                  },
                },
              ],
              string: {
                class: "level2",
              },
            },
          ],
          string: {
            class: "level1",
          },
        },
      ])
    })
  })
})
