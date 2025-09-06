import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("вложенные условия", () => {
  describe("if else if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { flag1: boolean; flag2: boolean }>(
        ({ html, context }) => html`
          ${context.flag1
            ? html`<div class="flag1"></div>`
            : context.flag2
            ? html`<div class="flag2"></div>`
            : html`<div class="flag3"></div>`}
        `
      )
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          type: "cond",
          data: "/context/flag1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "flag1",
              },
            },
            {
              type: "cond",
              data: "/context/flag2",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "flag2",
                  },
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "flag3",
                  },
                },
              ],
            },
          ],
        },
      ]))
  })
  describe("if if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { hasPermission: boolean; isAdmin: boolean }>(
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
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/hasPermission",
              child: [
                {
                  type: "cond",
                  data: "/context/isAdmin",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          string: {
                            class: "admin",
                          },
                          child: [{ type: "text", value: "Admin Action" }],
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
                            class: "user",
                          },
                          child: [{ type: "text", value: "User Action" }],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-access",
                  },
                  child: [{ type: "text", value: "Access Denied" }],
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("if if if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { hasPermission: boolean; isAdmin: boolean; isSuperAdmin: boolean }>(
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
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/hasPermission",
              child: [
                {
                  type: "cond",
                  data: "/context/isAdmin",
                  child: [
                    {
                      type: "cond",
                      data: "/context/isSuperAdmin",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "super-admin",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Super Admin Panel",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "admin",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Admin Panel",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "user",
                      },
                      child: [
                        {
                          type: "text",
                          value: "User Panel",
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-access",
                  },
                  child: [
                    {
                      type: "text",
                      value: "Access Denied",
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
