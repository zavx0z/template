import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("логические операторы в условиях", () => {
  describe("логический оператор с вложенными элементами в условии", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ showDetails: boolean }, { user: { name: string; isVerified: boolean } }>(
        ({ html, context, core }) => html`
          <div>
            ${core.user && context.showDetails
              ? html`
                  <div class="user-profile">
                    <h2>${core.user.name}</h2>
                    ${core.user.isVerified && html` <span class="verified-badge">VERIFIED</span> `}
                    <p>User details</p>
                  </div>
                `
              : html`
                  <div class="no-profile">
                    <p>No profile available</p>
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
              type: "cond",
              data: ["/core/user", "/context/showDetails"],
              expr: "_[0] && _[1]",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user-profile",
                  },
                  child: [
                    {
                      tag: "h2",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "/core/user/name",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "/core/user/isVerified",
                      child: [
                        {
                          tag: "span",
                          type: "el",
                          string: {
                            class: "verified-badge",
                          },
                          child: [
                            {
                              type: "text",
                              value: "VERIFIED",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "User details",
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-profile",
                  },
                  child: [
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "No profile available",
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

  describe("сложный логический оператор в условии", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isAdmin: boolean }, { user: { role: string; isActive: boolean } }>(
        ({ html, context, core }) => html`
          <div>
            ${core.user && core.user.role === "admin" && context.isAdmin
              ? html`
                  <div class="admin-dashboard">
                    <h1>Admin Dashboard</h1>
                    ${core.user.isActive &&
                    html`
                      <div class="active-admin">
                        <span class="status">Active</span>
                        <button>Manage Users</button>
                      </div>
                    `}
                  </div>
                `
              : html`
                  <div class="user-dashboard">
                    <h1>User Dashboard</h1>
                    <p>Welcome, user!</p>
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
              type: "cond",
              data: ["/core/user", "/core/user/role", "/context/isAdmin"],
              expr: '_[0] && _[1] === "admin" && _[2]',
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "admin-dashboard",
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Admin Dashboard",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "/core/user/isActive",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "active-admin",
                          },
                          child: [
                            {
                              tag: "span",
                              type: "el",
                              string: {
                                class: "status",
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "Active",
                                },
                              ],
                            },
                            {
                              tag: "button",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  value: "Manage Users",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user-dashboard",
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "User Dashboard",
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Welcome, user!",
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
