import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("text", () => {
  describe("динамический текст в map где значением является строка элемент массива", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map((name) => html`<li>${name}</li>`)}
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

  describe("динамический текст с разными именами переменных элемента массива", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<div><p>static</p></div>`)
    })
    it("data", () => {
      expect(elements).toEqual([
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
                  value: "static",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с несколькими переменными", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { users: { firstName: string; lastName: string }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.users.map((user) => html`<li>${user.firstName} ${user.lastName}</li>`)}
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
              data: "/core/users",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/firstName", "[item]/lastName"],
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

  describe("динамический текст в map с вложенными объектами", () => {
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
                      expr: "${_[0]} - ${_[1]}",
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
