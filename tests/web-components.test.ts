import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock, type PartsHierarchy } from "../parser"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import type { PartAttrs } from "../attributes.t"
import type { Node } from "../index.t"

describe("web-components", () => {
  describe("базовые custom elements", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<my-element></my-element>`)
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "my-element",
          type: "el",
        },
      ])
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "my-element",
          type: "el",
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "my-element",
          type: "el",
        },
      ])
    })
  })

  describe("custom elements с атрибутами", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<user-card name="John" age="25"></user-card>`)
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "user-card",
          type: "el",
          text: 'name="John" age="25"',
        },
      ])
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "user-card",
          type: "el",
          string: {
            name: {
              type: "static",
              value: "John",
            },
            age: {
              type: "static",
              value: "25",
            },
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
          tag: "user-card",
          type: "el",
          string: {
            age: "25",
            name: "John",
          },
        },
      ])
    })
  })

  describe("self-closing custom elements", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<loading-spinner />`)
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "loading-spinner",
          type: "el",
        },
      ]))
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "loading-spinner",
          type: "el",
        },
      ])
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "loading-spinner",
          type: "el",
        },
      ])
    })
  })

  describe("вложенные custom elements", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <app-header>
            <nav-menu>
              <menu-item>Home</menu-item>
            </nav-menu>
          </app-header>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "app-header",
          type: "el",
          child: [
            {
              tag: "nav-menu",
              type: "el",
              child: [
                {
                  tag: "menu-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      text: "Home",
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
          tag: "app-header",
          type: "el",
          child: [
            {
              tag: "nav-menu",
              type: "el",
              child: [
                {
                  tag: "menu-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      text: "Home",
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
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "app-header",
          type: "el",
          child: [
            {
              tag: "nav-menu",
              type: "el",
              child: [
                {
                  tag: "menu-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Home",
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

  describe("custom elements с template literals в атрибутах", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ userId: string; theme: string }>(
        ({ html, context }) => html`<user-profile id="${context.userId}" theme="${context.theme}"></user-profile>`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "user-profile",
          type: "el",
          string: {
            id: {
              type: "dynamic",
              value: "${context.userId}",
            },
            theme: {
              type: "dynamic",
              value: "${context.theme}",
            },
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
          tag: "user-profile",
          type: "el",
          string: {
            id: {
              data: "/context/userId",
            },
            theme: {
              data: "/context/theme",
            },
          },
        },
      ])
    })
  })

  describe("custom elements в условиях", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ isAdmin: boolean }>(
        ({ html, context }) =>
          html`${context.isAdmin ? html`<admin-panel></admin-panel>` : html`<user-panel></user-panel>`}`
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          type: "cond",
          text: "context.isAdmin",
          child: [
            {
              tag: "admin-panel",
              type: "el",
            },
            {
              tag: "user-panel",
              type: "el",
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
          text: "context.isAdmin",
          child: [
            {
              tag: "admin-panel",
              type: "el",
            },
            {
              tag: "user-panel",
              type: "el",
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
          type: "cond",
          data: "/context/isAdmin",
          child: [
            {
              tag: "admin-panel",
              type: "el",
            },
            {
              tag: "user-panel",
              type: "el",
            },
          ],
        },
      ])
    })
  })

  describe("custom elements в map", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { users: { id: string; name: string }[] }>(
        ({ html, core }) => html`
          <user-list>
            ${core.users.map((user) => html`<user-item id="${user.id}">${user.name}</user-item>`)}
          </user-list>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "user-list",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.users.map((user)",
              child: [
                {
                  tag: "user-item",
                  type: "el",
                  text: 'id="${user.id}"',
                  child: [
                    {
                      type: "text",
                      text: "${user.name}",
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
          tag: "user-list",
          type: "el",
          child: [
            {
              type: "map",
              text: "core.users.map((user)",
              child: [
                {
                  tag: "user-item",
                  type: "el",
                  string: {
                    id: {
                      type: "dynamic",
                      value: "${user.id}",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      text: "${user.name}",
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
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        {
          tag: "user-list",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/users",
              child: [
                {
                  tag: "user-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
                    },
                  ],
                  string: {
                    id: {
                      data: "[item]/id",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("custom elements с дефисами в разных позициях", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <x-component></x-component>
          <my-component></my-component>
          <component-with-dashes></component-with-dashes>
          <a-b-c-d></a-b-c-d>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        { tag: "x-component", type: "el" },
        { tag: "my-component", type: "el" },
        { tag: "component-with-dashes", type: "el" },
        { tag: "a-b-c-d", type: "el" },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(attributes)
      })
      expect(data).toEqual([
        { tag: "x-component", type: "el" },
        { tag: "my-component", type: "el" },
        { tag: "component-with-dashes", type: "el" },
        { tag: "a-b-c-d", type: "el" },
      ])
    })
  })
  describe("custom elements с сложными атрибутами", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <data-table columns='["name", "age", "email"]' sortable="true" filterable theme="dark"></data-table>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "data-table",
          type: "el",
          text: 'columns=\'["name", "age", "email"]\' sortable="true" filterable theme="dark"',
        },
      ]))

    it.skip("attributes", () => {
      beforeAll(() => {
        attributes = extractAttributes(elements)
      })
      expect(attributes).toEqual([
        {
          tag: "data-table",
          type: "el",
          string: {
            columns: {
              type: "static",
              value: '["name", "age", "email"]',
            },
            sortable: {
              type: "static",
              value: "true",
            },
            theme: {
              type: "static",
              value: "dark",
            },
          },
          boolean: {
            filterable: {
              type: "static",
              value: true,
            },
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
          tag: "data-table",
          type: "el",
          string: {
            columns: '["name", "age", "email"]',
            sortable: "true",
            theme: "dark",
          },
          boolean: {
            filterable: true,
          },
        },
      ])
    })
  })

  describe("custom elements с событиями", () => {
    let elements: PartsHierarchy
    let attributes: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`
          <modal-dialog onclose=${() => core.close()} onopen=${() => core.open()} data-modal-id="user-modal">
          </modal-dialog>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "modal-dialog",
          type: "el",
          text: 'onclose=${() => core.close()} onopen=${() => core.open()} data-modal-id="user-modal"',
        },
      ]))
  })
})
