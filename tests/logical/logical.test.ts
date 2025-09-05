import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("логические операторы", () => {
  describe("простой логический оператор &&", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ error: string }>(
        ({ html, context }) => html` <div>${context.error && html`<span class="error">${context.error}</span>`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/context/error",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: "error",
                  },
                  child: [
                    {
                      type: "text",
                      data: "/context/error",
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

  describe("логический оператор с вложенными элементами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { user: { name: string; avatar: string } }>(
        ({ html, core }) => html`
          <div>
            ${core.user &&
            html`
              <div class="user">
                <img src="${core.user.avatar}" alt="${core.user.name}" />
                <span>${core.user.name}</span>
              </div>
            `}
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
              type: "log",
              data: "/core/user",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user",
                  },
                  child: [
                    {
                      tag: "img",
                      type: "el",
                      string: {
                        src: {
                          data: "/core/user/avatar",
                        },
                        alt: {
                          data: "/core/user/name",
                        },
                      },
                    },
                    {
                      tag: "span",
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
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с булевым условием", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isVisible: boolean; message: string }>(
        ({ html, context }) => html` <div>${context.isVisible && html`<p>${context.message}</p>`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/context/isVisible",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "/context/message",
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

  describe("логический оператор с самозакрывающимся тегом", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ hasError: boolean }>(
        ({ html, context }) => html` <div>${context.hasError && html`<br />`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/context/hasError",
              child: [
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
  })
})
