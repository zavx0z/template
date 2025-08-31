import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { makeHierarchy } from "../../hierarchy"
import { enrichWithData } from "../../data"
import { extractAttributes } from "../../attributes"
import { extractTokens } from "../../token"
import { print } from "../../fixture"

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
    const elements = extractHtmlElements(mainHtml)
    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", text: "<div>", name: "div" },
        { kind: "cond-open", expr: "context.hasPermission" },
        { kind: "cond-else-if", expr: "context.isAdmin" },
        { kind: "tag-open", text: "<div>", name: "div" },
        { kind: "tag-open", text: '<button class="admin">', name: "button" },
        { kind: "text", text: "Admin Action" },
        { kind: "tag-close", text: "</button>", name: "button" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: "<div>", name: "div" },
        { kind: "tag-open", text: '<button class="user">', name: "button" },
        { kind: "text", text: "User Action" },
        { kind: "tag-close", text: "</button>", name: "button" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="no-access">', name: "div" },
        { kind: "text", text: "Access Denied" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "tag-close", text: "</div>", name: "div" },
      ]))
    const hierarchy = makeHierarchy(tokens)
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
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
    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", text: "<div>", name: "div" },
        { kind: "cond-open", expr: "context.hasPermission" },
        { kind: "cond-else-if", expr: "context.isAdmin" },
        { kind: "cond-else-if", expr: "context.isSuperAdmin" },
        { kind: "tag-open", text: '<div class="super-admin">', name: "div" },
        { kind: "text", text: "Super Admin Panel" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="admin">', name: "div" },
        { kind: "text", text: "Admin Panel" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="user">', name: "div" },
        { kind: "text", text: "User Panel" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="no-access">', name: "div" },
        { kind: "text", text: "Access Denied" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "tag-close", text: "</div>", name: "div" },
      ]))
  })
})
