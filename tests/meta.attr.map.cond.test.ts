import { makeHierarchy } from "../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { describe, it, expect } from "bun:test"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"

describe("meta-компоненты с core/context в map и condition", () => {
  describe("meta-элемент с пустыми объектами", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html` <meta-hash context=${{}} core=${{}} /> `)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    it("attributes", () => {
      expect(attributes, "при обработке пустых объектов не должен устанавливаться core и context").toEqual([
        {
          tag: "meta-hash",
          type: "meta",
        },
      ])
    })
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data, "core и context не должно быть в data").toEqual([
        {
          tag: "meta-hash",
          type: "meta",
        },
      ])
    })
  })
  describe("meta-компоненты в map с core объектами", () => {
    type Core = { items: any[]; tag: string; type: string }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core, context }) => html`
        <div>
          ${core.items.map(
            (item) => html`
              <meta-${core.tag}
                core=${{ id: item.id, name: item.name, type: core.type }}
                context=${{ status: item.status, active: item.active }} />
            `
          )}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  core: {
                    data: ["[item]/id", "[item]/name", "/core/type"],
                    expr: "{ id: [0], name: [1], type: [2] }",
                  },
                  context: {
                    data: ["[item]/status", "[item]/active"],
                    expr: "{ status: [0], active: [1] }",
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в condition с core/context объектами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, core, context }) => html`
        <div>
          ${context.showMeta
            ? html`<meta-${core.tag}
                core=${{ id: context.id, name: context.name }}
                context=${{ type: "primary", active: true }} />`
            : html`<meta-${core.tag}
                core=${{ id: "default", name: "default" }}
                context=${{ type: "secondary", active: false }} />`}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: {
                data: "/core/tag",
                expr: "meta-${[0]}",
              },
              type: "meta",
              core: {
                data: ["/context/id", "/context/name"],
                expr: "{ id: [0], name: [1] }",
              },
              context: '{ type: "primary", active: true }',
            },
            {
              tag: {
                data: "/core/tag",
                expr: "meta-${[0]}",
              },
              type: "meta",
              core: '{ id: "default", name: "default" }',
              context: '{ type: "secondary", active: false }',
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в map внутри condition", () => {
    type Core = { items: any[]; tag: string; type: string }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core, context }) => html`
        <div>
          ${context.showList
            ? html`
                ${core.items.map(
                  (item) => html`
                    <meta-${core.tag}
                      core=${{
                        id: item.id,
                        name: item.name,
                        type: core.type,
                        metadata: item.metadata,
                      }}
                      context=${{
                        status: item.status,
                        active: item.active,
                        permissions: item.permissions,
                      }} />
                  `
                )}
              `
            : html`<meta-${core.tag}
                core=${{ id: "empty", name: "empty" }}
                context=${{ type: "empty", active: false }} />`}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  core: {
                    data: ["[item]/id", "[item]/name", "/core/type", "[item]/metadata"],
                    expr: "{ id: [0], name: [1], type: [2], metadata: [3] }",
                  },
                  context: {
                    data: ["[item]/status", "[item]/active", "[item]/permissions"],
                    expr: "{ status: [0], active: [1], permissions: [2] }",
                  },
                },
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: '{ type: "empty", active: false }',
                  core: '{ id: "empty", name: "empty" }',
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в condition внутри map", () => {
    type Core = { items: any[]; tag: string }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core }) => html`
        <div>
          ${core.items.map(
            (item) => html`
              ${item.isActive
                ? html`<meta-${core.tag}
                    core=${{ id: item.id, name: item.name, type: "active" }}
                    context=${{ status: "active", permissions: item.permissions }} />`
                : item.hasError
                ? html`<meta-${core.tag}
                    core=${{ id: item.id, name: item.name, type: "error" }}
                    context=${{ status: "error", message: "Item has error" }} />`
                : html`<meta-${core.tag}
                    core=${{ id: item.id, name: item.name, type: "inactive" }}
                    context=${{ status: "inactive" }} />`}
            `
          )}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: {
                    data: "[item]/permissions",
                    expr: '{ status: "active", permissions: [0] }',
                  },
                  core: {
                    data: ["[item]/id", "[item]/name"],
                    expr: '{ id: [0], name: [1], type: "active" }',
                  },
                },
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: '{ status: "error", message: "Item has error" }',
                  core: {
                    data: ["[item]/id", "[item]/name"],
                    expr: '{ id: [0], name: [1], type: "error" }',
                  },
                },
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: '{ status: "inactive" }',
                  core: {
                    data: ["[item]/id", "[item]/name"],
                    expr: '{ id: [0], name: [1], type: "inactive" }',
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сложные meta-компоненты с вложенными core/context объектами", () => {
    type Core = { users: any[]; tag: string }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core, context }) => html`
        <div>
          ${core.users.map(
            (user) => html`
              ${user.permissions.includes("admin")
                ? html`<meta-${core.tag}
                    core=${{
                      id: user.id,
                      name: user.name,
                      type: "admin",
                      permissions: user.permissions,
                      metadata: {
                        level: "admin",
                        access: "full",
                        settings: user.settings,
                      },
                    }}
                    context=${{
                      status: "admin",
                      active: user.isOnline,
                      canEdit: true,
                      canDelete: true,
                      canManage: true,
                    }} />`
                : user.permissions.includes("moderator")
                ? html`<meta-${core.tag}
                    core=${{
                      id: user.id,
                      name: user.name,
                      type: "moderator",
                      permissions: user.permissions,
                      metadata: {
                        level: "moderator",
                        access: "limited",
                        settings: user.settings,
                      },
                    }}
                    context=${{
                      status: "moderator",
                      active: user.isOnline,
                      canEdit: true,
                      canDelete: false,
                      canManage: false,
                    }} />`
                : html`<meta-${core.tag}
                    core=${{
                      id: user.id,
                      name: user.name,
                      type: "user",
                      permissions: user.permissions,
                      metadata: {
                        level: "user",
                        access: "basic",
                        settings: user.settings,
                      },
                    }}
                    context=${{
                      status: "user",
                      active: user.isOnline,
                      canEdit: false,
                      canDelete: false,
                      canManage: false,
                    }} />`}
            `
          )}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/users",
              child: [
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: {
                    data: "[item]/isOnline",
                    expr: '{ status: "admin", active: [0], canEdit: true, canDelete: true, canManage: true }',
                  },
                  core: {
                    data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                    expr: '{ id: [0], name: [1], type: "admin", permissions: [2], metadata: { level: "admin", access: "full", settings: [3] } }',
                  },
                },
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: {
                    data: "[item]/isOnline",
                    expr: '{ status: "moderator", active: [0], canEdit: true, canDelete: false, canManage: false }',
                  },
                  core: {
                    data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                    expr: '{ id: [0], name: [1], type: "moderator", permissions: [2], metadata: { level: "moderator", access: "limited", settings: [3] } }',
                  },
                },
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: {
                    data: "[item]/isOnline",
                    expr: '{ status: "user", active: [0], canEdit: false, canDelete: false, canManage: false }',
                  },
                  core: {
                    data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                    expr: '{ id: [0], name: [1], type: "user", permissions: [2], metadata: { level: "user", access: "basic", settings: [3] } }',
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты с динамическими core/context объектами", () => {
    type Core = { items: any[]; tag: string; type: string }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core, context }) => html`
        <div>
          ${core.items.map(
            (item) => html`
              <meta-${core.tag}
                core=${{
                  id: item.id,
                  name: item.name,
                  type: core.type,
                  dynamic: item.isActive ? "active" : "inactive",
                  computed: `${item.id}-${item.name}`,
                  metadata: {
                    status: item.status,
                    priority: item.priority || "normal",
                    tags: item.tags || [],
                  },
                }}
                context=${{
                  status: item.isActive ? "active" : "inactive",
                  active: item.isActive,
                  canEdit: item.permissions.includes("edit"),
                  canDelete: item.permissions.includes("delete"),
                  dynamic: {
                    lastModified: item.lastModified,
                    created: item.created,
                    updated: item.updated || item.lastModified,
                  },
                }} />
            `
          )}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    const hierarchy = makeHierarchy(mainHtml, elements)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)

    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: {
                    data: "/core/tag",
                    expr: "meta-${[0]}",
                  },
                  type: "meta",
                  context: {
                    data: [
                      "[item]/isActive",
                      "[item]/permissions/includes",
                      "[item]/lastModified",
                      "[item]/created",
                      "[item]/updated",
                    ],
                    expr: '{ status: [0] ? "active" : "inactive", active: [0], canEdit: [1]("edit"), canDelete: [1]("delete"), dynamic: { lastModified: [2], created: [3], updated: [4] || [2] } }',
                  },
                  core: {
                    data: [
                      "[item]/id",
                      "[item]/name",
                      "/core/type",
                      "[item]/isActive",
                      "[item]/status",
                      "[item]/priority",
                      "[item]/tags",
                    ],
                    expr: '{ id: [0], name: [1], type: [2], dynamic: [3] ? "active" : "inactive", computed: `${[0]}-${[1]}`, metadata: { status: [4], priority: [5] || "normal", tags: [6] || [] } }',
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
