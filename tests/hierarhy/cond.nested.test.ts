import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"

describe("вложенные условия", () => {
  describe("двойное условие", () => {
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
    const hierarchy = extractHtmlElements(mainHtml)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
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
                      text: "<div>",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          text: '<button class="admin">',
                          child: [{ type: "text", text: "Admin Action" }],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      text: "<div>",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          text: '<button class="user">',
                          child: [{ type: "text", text: "User Action" }],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="no-access">',
                  child: [{ type: "text", text: "Access Denied" }],
                },
              ],
            },
          ],
        },
      ]))
    // const attributes = extractAttributes(hierarchy)
    // const data = enrichWithData(attributes)
    // console.log(data)
    // it.skip("data", () => expect(data).toEqual([]))
  })

  describe("тройное условие", () => {
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
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
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
                          text: '<div class="super-admin">',
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
                          text: '<div class="admin">',
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
                      text: '<div class="user">',
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
                  text: '<div class="no-access">',
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
