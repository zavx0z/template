import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("web-components", () => {
  describe("базовые custom elements", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<my-element></my-element>`)

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<my-element>", index: 0, name: "my-element", kind: "open" },
        { text: "</my-element>", index: 12, name: "my-element", kind: "close" },
      ])
    })

    const hierarchy = elementsHierarchy(mainHtml, elements)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "my-element",
          type: "el",
          text: "<my-element>",
        },
      ])
    })

    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    it.skip("data", () => {
      expect(enrichedHierarchy).toEqual([
        {
          tag: "my-element",
          type: "el",
        },
      ])
    })
  })

  describe("custom elements с атрибутами", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<user-card name="John" age="25"></user-card>`)

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: '<user-card name="John" age="25">', index: 0, name: "user-card", kind: "open" },
        { text: "</user-card>", index: 32, name: "user-card", kind: "close" },
      ])
    })

    const hierarchy = elementsHierarchy(mainHtml, elements)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "user-card",
          type: "el",
          text: '<user-card name="John" age="25">',
        },
      ])
    })

    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    it.skip("data", () => {
      expect(enrichedHierarchy).toEqual([
        {
          tag: "user-card",
          type: "el",
          attr: {
            name: {
              value: "John",
            },
            age: {
              value: "25",
            },
          },
        },
      ])
    })
  })

  it("self-closing custom elements", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<loading-spinner />`)
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([{ text: "<loading-spinner />", index: 0, name: "loading-spinner", kind: "self" }])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "loading-spinner",
        type: "el",
        text: "<loading-spinner />",
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "loading-spinner",
        type: "el",
      },
    ])
  })

  it("вложенные custom elements", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <app-header>
          <nav-menu>
            <menu-item>Home</menu-item>
          </nav-menu>
        </app-header>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<app-header>", index: 9, name: "app-header", kind: "open" },
      { text: "<nav-menu>", index: 32, name: "nav-menu", kind: "open" },
      { text: "<menu-item>", index: 55, name: "menu-item", kind: "open" },
      { text: "Home", index: 66, name: "", kind: "text" },
      { text: "</menu-item>", index: 70, name: "menu-item", kind: "close" },
      { text: "</nav-menu>", index: 93, name: "nav-menu", kind: "close" },
      { text: "</app-header>", index: 113, name: "app-header", kind: "close" },
    ])
  })

  it("custom elements с template literals в атрибутах", () => {
    const mainHtml = extractMainHtmlBlock<{ userId: string; theme: string }>(
      ({ html, context }) => html`<user-profile id="${context.userId}" theme="${context.theme}"></user-profile>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      {
        text: '<user-profile id="${context.userId}" theme="${context.theme}">',
        index: 0,
        name: "user-profile",
        kind: "open",
      },
      { text: "</user-profile>", index: 62, name: "user-profile", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "user-profile",
        type: "el",
        attr: {
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

  it("custom elements в условиях", () => {
    const mainHtml = extractMainHtmlBlock<{ isAdmin: boolean }>(
      ({ html, context }) =>
        html`${context.isAdmin ? html`<admin-panel></admin-panel>` : html`<user-panel></user-panel>`}`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<admin-panel>", index: 25, name: "admin-panel", kind: "open" },
      { text: "</admin-panel>", index: 38, name: "admin-panel", kind: "close" },
      { text: "<user-panel>", index: 61, name: "user-panel", kind: "open" },
      { text: "</user-panel>", index: 73, name: "user-panel", kind: "close" },
    ])
  })

  it("custom elements в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { users: { id: string; name: string }[] }>(
      ({ html, core }) => html`
        <user-list> ${core.users.map((user) => html`<user-item id="${user.id}">${user.name}</user-item>`)} </user-list>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<user-list>", index: 9, name: "user-list", kind: "open" },
      { text: '<user-item id="${user.id}">', index: 53, name: "user-item", kind: "open" },
      { text: "${user.name}", index: 80, name: "", kind: "text" },
      { text: "</user-item>", index: 92, name: "user-item", kind: "close" },
      { text: "</user-list>", index: 108, name: "user-list", kind: "close" },
    ])
  })

  it("custom elements с дефисами в разных позициях", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <x-component></x-component>
        <my-component></my-component>
        <component-with-dashes></component-with-dashes>
        <a-b-c-d></a-b-c-d>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<x-component>", index: 9, name: "x-component", kind: "open" },
      { text: "</x-component>", index: 22, name: "x-component", kind: "close" },
      { text: "<my-component>", index: 45, name: "my-component", kind: "open" },
      { text: "</my-component>", index: 59, name: "my-component", kind: "close" },
      { text: "<component-with-dashes>", index: 83, name: "component-with-dashes", kind: "open" },
      { text: "</component-with-dashes>", index: 106, name: "component-with-dashes", kind: "close" },
      { text: "<a-b-c-d>", index: 139, name: "a-b-c-d", kind: "open" },
      { text: "</a-b-c-d>", index: 148, name: "a-b-c-d", kind: "close" },
    ])
  })

  it("custom elements с числами в имени", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <component-1></component-1>
        <my-component-2></my-component-2>
        <widget-3d></widget-3d>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<component-1>", index: 9, name: "component-1", kind: "open" },
      { text: "</component-1>", index: 22, name: "component-1", kind: "close" },
      { text: "<my-component-2>", index: 45, name: "my-component-2", kind: "open" },
      { text: "</my-component-2>", index: 61, name: "my-component-2", kind: "close" },
      { text: "<widget-3d>", index: 87, name: "widget-3d", kind: "open" },
      { text: "</widget-3d>", index: 98, name: "widget-3d", kind: "close" },
    ])
  })

  it("custom elements с сложными атрибутами", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`<data-table
        columns='["name", "age", "email"]'
        sortable="true"
        filterable
        theme="dark"></data-table>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      {
        text: '<data-table\n        columns=\'["name", "age", "email"]\'\n        sortable="true"\n        filterable\n        theme="dark">',
        index: 0,
        name: "data-table",
        kind: "open",
      },
      {
        text: "</data-table>",
        index: 119,
        name: "data-table",
        kind: "close",
      },
    ])
  })

  it("custom elements с событиями", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <modal-dialog onclose="handleClose()" onopen="handleOpen(event)" data-modal-id="user-modal"></modal-dialog>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      {
        text: '<modal-dialog onclose="handleClose()" onopen="handleOpen(event)" data-modal-id="user-modal">',
        index: 9,
        name: "modal-dialog",
        kind: "open",
      },
      {
        text: "</modal-dialog>",
        index: 101,
        name: "modal-dialog",
        kind: "close",
      },
    ])
  })

  it("custom elements с shadow DOM", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <shadow-host>
          <template>
            <div class="shadow-content">
              <slot name="header"></slot>
              <slot></slot>
            </div>
          </template>
        </shadow-host>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<shadow-host>", index: 9, name: "shadow-host", kind: "open" },
      { text: "<template>", index: 33, name: "template", kind: "open" },
      { text: '<div class="shadow-content">', index: 56, name: "div", kind: "open" },
      { text: '<slot name="header">', index: 99, name: "slot", kind: "open" },
      { text: "</slot>", index: 119, name: "slot", kind: "close" },
      { text: "<slot>", index: 141, name: "slot", kind: "open" },
      { text: "</slot>", index: 147, name: "slot", kind: "close" },
      { text: "</div>", index: 167, name: "div", kind: "close" },
      { text: "</template>", index: 184, name: "template", kind: "close" },
      { text: "</shadow-host>", index: 204, name: "shadow-host", kind: "close" },
    ])
  })

  it("custom elements с условными атрибутами", () => {
    const mainHtml = extractMainHtmlBlock<{ isVisible: boolean; isDisabled: boolean }>(
      ({ html, context }) => html`<custom-button
        ${context.isVisible ? 'style="display: block"' : 'style="display: none"'}
        ${context.isDisabled ? "disabled" : ""}
        >Click me</custom-button
      >`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      {
        text: '<custom-button\n        ${context.isVisible ? \'style="display: block"\' : \'style="display: none"\'}\n        ${context.isDisabled ? "disabled" : ""}\n        >',
        index: 0,
        name: "custom-button",
        kind: "open",
      },
      {
        text: "Click me",
        index: 154,
        name: "",
        kind: "text",
      },
      {
        text: "</custom-button\n      >",
        index: 162,
        name: "custom-button",
        kind: "close",
      },
    ])
  })

  it.skip("невалидные custom elements игнорируются", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <1invalid-element></1invalid-element>
        <invalid*element></invalid*element>
        <valid-element></valid-element>
        <-invalid-element></-invalid-element>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<valid-element>", index: 99, name: "valid-element", kind: "open" },
      { text: "</valid-element>", index: 114, name: "valid-element", kind: "close" },
    ])
  })

  it.todo("custom elements с namespace", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <svg:circle cx="50" cy="50" r="40"></svg:circle>
        <math:formula>E = mc²</math:formula>
        <custom:component></custom:component>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<svg:circle cx="50" cy="50" r="40">', index: 9, name: "svg:circle", kind: "open" },
      { text: "</svg:circle>", index: 44, name: "svg:circle", kind: "close" },
      { text: "<math:formula>", index: 66, name: "math:formula", kind: "open" },
      { text: `E = mc\u00B2`, index: 80, name: "", kind: "text" },
      { text: "</math:formula>", index: 92, name: "math:formula", kind: "close" },
      { text: "<custom:component>", index: 116, name: "custom:component", kind: "open" },
      { text: "</custom:component>", index: 134, name: "custom:component", kind: "close" },
    ])
  })
})
