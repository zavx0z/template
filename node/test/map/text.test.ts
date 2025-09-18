import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("text", () => {
  describe("примитивы", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        // #region itemValue
        ({ html, context }) => html`
          <ul>
            ${context.list.map((name) => html`<li>${name}</li>`)}
          </ul>
        `
        // #endregion itemValue
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectItemValue
        [
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
        ]
        // #endregion expectItemValue
      )
    })
  })

  describe("объекты без деструктуризации", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { configs: { name: string; value: string }[] }>(
        // #region objectValues
        ({ html, core }) => html`
          <ul>
            ${core.configs.map((config) => html`<li>${config.name} ${config.value}</li>`)}
          </ul>
        `
        // #endregion objectValues
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectObjectValues
        [
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/core/configs",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: ["[item]/name", "[item]/value"],
                        expr: "${_[0]} ${_[1]}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]
        // #endregion expectObjectValues
      )
    })
  })
  describe("объекты с деструктуризацией", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { configs: { name: string; value: string }[] }>(
        // #region objectDestructValues
        ({ html, core }) => html`
          <ul>
            ${core.configs.map(({ name, value }) => html`<li>${name} ${value}</li>`)}
          </ul>
        `
        // #endregion objectDestructValues
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
              data: "/core/configs",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/value"],
                      expr: "${_[0]} ${_[1]}",
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

  describe("вложенные объекты", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { posts: { author: { name: string; email: string } }[] }>(
        ({ html, core }) => html`
          <div>${core.posts.map((post) => html`<p>Author: ${post.author.name} (${post.author.email})</p>`)}</div>
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
              data: "/core/posts",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/author/name", "[item]/author/email"],
                      expr: "Author: ${_[0]} (${_[1]})",
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

  describe("динамический текст в map с условными выражениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { items: { name: string; isActive: boolean }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.items.map((item) => html`<li>${item.isActive ? item.name : "Inactive"}</li>`)}
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
              data: "/core/items",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/isActive", "[item]/name"],
                      expr: '${_[0] ? _[1] : "Inactive"}',
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

  describe("динамический текст в map с вычислениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { products: { name: string; price: number; quantity: number }[] }>(
        ({ html, core }) => html`
          <div>
            ${core.products.map((product) => html`<p>${product.name}: $${product.price * product.quantity}</p>`)}
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
              data: "/core/products",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/price", "[item]/quantity"],
                      expr: "${_[0]}: $${_[1] * _[2]}",
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

  describe("динамический текст в map с методами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { users: { name: string; email: string }[] }>(
        ({ html, core }) => html`
          <div>${core.users.map((user) => html`<p>${user.name.toUpperCase()} - ${user.email.toLowerCase()}</p>`)}</div>
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
              data: "/core/users",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/email"],
                      expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}",
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

  describe("динамический текст в map с вложенными map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { categories: { name: string; products: { name: string; price: number }[] }[] }>(
        ({ html, core }) => html`
          <div>
            ${core.categories.map(
              (category) => html`
                <h2>${category.name}</h2>
                <ul>
                  ${category.products.map((product) => html`<li>${product.name} - $${product.price}</li>`)}
                </ul>
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
          child: [
            {
              type: "map",
              data: "/core/categories",
              child: [
                {
                  tag: "h2",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
                    },
                  ],
                },
                {
                  tag: "ul",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "[item]/products",
                      child: [
                        {
                          tag: "li",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: ["[item]/name", "[item]/price"],
                              expr: "${_[0]} - $${_[1]}",
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

  describe("динамический текст в map с условными элементами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { items: { name: string; isVisible: boolean; description: string }[] }>(
        ({ html, core }) => html`
          <div>
            ${core.items.map(
              (item) => html`
                ${item.isVisible ? html`<p>${item.name}: ${item.description}</p>` : html`<p>Hidden item</p>`}
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
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  type: "cond",
                  data: "[item]/isVisible",
                  child: [
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: ["[item]/name", "[item]/description"],
                          expr: "${_[0]}: ${_[1]}",
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Hidden item",
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
