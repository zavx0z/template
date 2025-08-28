import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"

describe("map соседствующие", () => {
  describe("map соседствующий с map на верхнем уровне", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    const mainHtml = extractMainHtmlBlock<any, Core>(
      ({ html, core }) => html`
        ${core.list1.map(({ title }) => html` <div>${title}</div> `)}
        ${core.list2.map(({ title }) => html` <div>${title}</div> `)}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<div>", index: 47, name: "div", kind: "open" },
        { text: "${title}", index: 52, name: "", kind: "text" },
        { text: "</div>", index: 60, name: "div", kind: "close" },
        { text: "<div>", index: 117, name: "div", kind: "open" },
        { text: "${title}", index: 122, name: "", kind: "text" },
        { text: "</div>", index: 130, name: "div", kind: "close" },
      ]))
    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })`",
          child: [
            {
              tag: "div",
              type: "el",
              text: "<div>",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          text: "core.list2.map(({ title })`",
          child: [
            {
              tag: "div",
              type: "el",
              text: "<div>",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
      ]))

    const attributes = extractAttributes(hierarchy)
    it("attributes", () =>
      expect(attributes).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })`",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          text: "core.list2.map(({ title })`",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
      ]))

    const data = enrichWithData(attributes)
    it("data", () =>
      expect(data).toEqual([
        {
          type: "map",
          data: "/core/list1",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          data: "/core/list2",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("map соседствующий с map внутри элемента", () => {
    type Context = {
      categories: string[]
    }
    type Core = {
      items: {
        categoryId: number
        title: string
      }[]
    }
    const mainHtml = extractMainHtmlBlock<Context, Core>(
      ({ html, context, core }) => html`
        <div class="dashboard">
          ${context.categories.map((cat) => html`<span class="category">${cat}</span>`)}
          ${core.items.map(
            (item) => html`
              <div class="item" data-category="${item.categoryId}">
                <h4>${item.title}</h4>
              </div>
            `
          )}
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: '<div class="dashboard">', index: 9, name: "div", kind: "open" },
        { text: '<span class="category">', index: 82, name: "span", kind: "open" },
        { text: "${cat}", index: 105, name: "", kind: "text" },
        { text: "</span>", index: 111, name: "span", kind: "close" },
        { text: '<div class="item" data-category="${item.categoryId}">', index: 179, name: "div", kind: "open" },
        { text: "<h4>", index: 249, name: "h4", kind: "open" },
        { text: "${item.title}", index: 253, name: "", kind: "text" },
        { text: "</h4>", index: 266, name: "h4", kind: "close" },
        { text: "</div>", index: 286, name: "div", kind: "close" },
        { text: "</div>", index: 317, name: "div", kind: "close" },
      ]))
    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="dashboard">',
          child: [
            {
              type: "map",
              text: "context.categories.map((cat)`",
              child: [
                {
                  tag: "span",
                  type: "el",
                  text: '<span class="category">',
                  child: [
                    {
                      type: "text",
                      text: "${cat}",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              text: "core.items.map((item)`",
              child: [
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="item" data-category="${item.categoryId}">',
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      text: "<h4>",
                      child: [
                        {
                          type: "text",
                          text: "${item.title}",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("attributes", () =>
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: { type: "static", value: "dashboard" },
          },
          child: [
            {
              type: "map",
              text: "context.categories.map((cat)`",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: { type: "static", value: "category" },
                  },
                  child: [
                    {
                      type: "text",
                      text: "${cat}",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              text: "core.items.map((item)`",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "item" },
                    "data-category": { type: "dynamic", value: "item.categoryId" },
                  },
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          text: "${item.title}",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
    it("data", () =>
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: "dashboard",
          },
          child: [
            {
              type: "map",
              data: "/context/categories",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: "category",
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              data: "/core/items",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "item",
                    "data-category": {
                      data: "[item]/categoryId",
                    },
                  },
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
                        },
                      ],
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
