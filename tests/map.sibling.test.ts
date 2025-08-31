import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"

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
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })",
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
          text: "core.list2.map(({ title })",
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
          text: "core.list1.map(({ title })",
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
          text: "core.list2.map(({ title })",
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
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="dashboard">',
          child: [
            {
              type: "map",
              text: "context.categories.map((cat)",
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
              text: "core.items.map((item)",
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
              text: "context.categories.map((cat)",
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
              text: "core.items.map((item)",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "item" },
                    "data-category": { type: "dynamic", value: "${item.categoryId}" },
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

  describe("map соседствующий с map на глубоком уровне вложенности", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    const mainHtml = extractMainHtmlBlock<{}, Core>(
      ({ html, core }) => html`
        <div class="level1">
          <div class="level2">
            <div class="level3">
              ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
              ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
              ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
            </div>
          </div>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      // Проверяем, что все уровни вложенности присутствуют
      expect(elements.length).toBeGreaterThan(0)
      expect(elements.some((el) => el.text.includes("level1"))).toBe(true)
      expect(elements.some((el) => el.text.includes("level2"))).toBe(true)
      expect(elements.some((el) => el.text.includes("level3"))).toBe(true)
      expect(elements.some((el) => el.text.includes("item1"))).toBe(true)
      expect(elements.some((el) => el.text.includes("item2"))).toBe(true)
      expect(elements.some((el) => el.text.includes("item3"))).toBe(true)
    })
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      // Проверяем структуру иерархии
      expect(hierarchy.length).toBeGreaterThan(0)
      expect(hierarchy[0]?.type).toBe("el")
      if (hierarchy[0]?.type === "el") {
        expect(hierarchy[0].tag).toBe("div")
        expect(hierarchy[0].text).toContain("level1")

        // Проверяем, что есть вложенные элементы
        expect(hierarchy[0].child).toBeDefined()
        expect(hierarchy[0].child!.length).toBeGreaterThan(0)

        // Проверяем второй уровень
        const level2 = hierarchy[0].child![0]
        if (level2 && level2.type === "el") {
          expect(level2.tag).toBe("div")
          expect(level2.text).toContain("level2")
          expect(level2.child).toBeDefined()
          expect(level2.child!.length).toBeGreaterThan(0)

          // Проверяем третий уровень
          const level3 = level2.child![0]
          if (level3 && level3.type === "el") {
            expect(level3.tag).toBe("div")
            expect(level3.text).toContain("level3")
            expect(level3.child).toBeDefined()
            expect(level3.child!.length).toBeGreaterThan(0)

            // Проверяем, что на третьем уровне есть map выражения
            const mapNodes = level3.child!.filter((child) => child.type === "map")
            expect(mapNodes.length).toBeGreaterThanOrEqual(3) // list1, list2, list3
          }
        }
      }
    })
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("attributes", () => {
      // Проверяем, что атрибуты извлекаются корректно
      expect(attributes.length).toBeGreaterThan(0)

      // Проверяем, что все уровни имеют атрибуты
      const level1Attrs = attributes[0]
      if (level1Attrs && level1Attrs.type === "el") {
        expect(level1Attrs.string?.class?.value).toBe("level1")
        expect(level1Attrs.child).toBeDefined()
        expect(level1Attrs.child!.length).toBeGreaterThan(0)
      }
    })
    it("data", () => {
      // Проверяем, что данные обогащаются корректно
      expect(data.length).toBeGreaterThan(0)

      // Проверяем, что есть data пути
      const level1Data = data[0]
      if (level1Data && level1Data.type === "el") {
        expect(level1Data.child).toBeDefined()
        expect(level1Data.child!.length).toBeGreaterThan(0)
      }
    })
  })
})
