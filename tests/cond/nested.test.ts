import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../parser"
import type { PartAttrs } from "../../attributes.t"

describe("вложенные условия", () => {
  describe("if else if", () => {
    let elements: PartAttrs
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { flag1: boolean; flag2: boolean }>(
        ({ html, context }) => html`
          ${context.flag1
            ? html`<div class="flag1"></div>`
            : context.flag2
            ? html`<div class="flag2"></div>`
            : html`<div class="flag3"></div>`}
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("elements", () =>
      expect(elements).toEqual([
        {
          type: "cond",
          text: "context.flag1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: {
                  type: "static",
                  value: "flag1",
                },
              },
            },
            {
              type: "cond",
              text: "context.flag2",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "flag2",
                    },
                  },
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "flag3",
                    },
                  },
                },
              ],
            },
          ],
        },
      ]))
  })
  describe("if if", () => {
    let elements: PartAttrs
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { hasPermission: boolean; isAdmin: boolean }>(
        ({ html, context }) => html`
          <div>
            ${context.hasPermission
              ? context.isAdmin
                ? html`
                    <div>
                      <button class="admin">Admin Action</button>
                    </div>
                  `
                : html`
                    <div>
                      <button class="user">User Action</button>
                    </div>
                  `
              : html`<div class="no-access">Access Denied</div>`}
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
          child: [
            {
              type: "cond",
              text: "context.hasPermission",
              child: [
                {
                  type: "cond",
                  text: "context.isAdmin",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "admin",
                            },
                          },
                          child: [{ type: "text", text: "Admin Action" }],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "user",
                            },
                          },
                          child: [{ type: "text", text: "User Action" }],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "no-access",
                    },
                  },
                  child: [{ type: "text", text: "Access Denied" }],
                },
              ],
            },
          ],
        },
      ]))
    // it.skip("data", () => expect(data).toEqual([]))
  })

  describe("if if if", () => {
    let elements: PartAttrs
    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<any, { hasPermission: boolean; isAdmin: boolean; isSuperAdmin: boolean }>(
        ({ html, context }) => html`
          <div>
            ${context.hasPermission
              ? context.isAdmin
                ? context.isSuperAdmin
                  ? html`<div class="super-admin">Super Admin Panel</div>`
                  : html`<div class="admin">Admin Panel</div>`
                : html`<div class="user">User Panel</div>`
              : html`<div class="no-access">Access Denied</div>`}
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("elements", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              text: "context.hasPermission",
              child: [
                {
                  type: "cond",
                  text: "context.isAdmin",
                  child: [
                    {
                      type: "cond",
                      text: "context.isSuperAdmin",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "super-admin",
                            },
                          },
                          child: [
                            {
                              type: "text",
                              text: "Super Admin Panel",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "admin",
                            },
                          },
                          child: [
                            {
                              type: "text",
                              text: "Admin Panel",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          type: "static",
                          value: "user",
                        },
                      },
                      child: [
                        {
                          type: "text",
                          text: "User Panel",
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "no-access",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      text: "Access Denied",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
  })
})
