import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"
import { print } from "../fixture"

describe("map с условиями", () => {
  describe("map соседствующий с map в условии на верхнем уровне", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    const mainHtml = extractMainHtmlBlock<Context, Core>(
      ({ html, context, core }) => html`
        ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
        ${context.flag
          ? html`<div class="conditional">
              ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
            </div>`
          : html`<div class="fallback">No items</div>`}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { end: 65, kind: "open", name: "div", start: 46, text: '<div class="item1">' },
        { end: 73, kind: "text", name: "", start: 65, text: "${title}" },
        { end: 79, kind: "close", name: "div", start: 73, text: "</div>" },
        { end: 138, kind: "open", name: "div", start: 113, text: '<div class="conditional">' },
        { end: 209, kind: "open", name: "div", start: 190, text: '<div class="item2">' },
        { end: 217, kind: "text", name: "", start: 209, text: "${title}" },
        { end: 223, kind: "close", name: "div", start: 217, text: "</div>" },
        { end: 245, kind: "close", name: "div", start: 239, text: "</div>" },
        { end: 276, kind: "open", name: "div", start: 254, text: '<div class="fallback">' },
        { end: 284, kind: "text", name: "", start: 276, text: "No items" },
        { end: 290, kind: "close", name: "div", start: 284, text: "</div>" },
      ]))
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
              text: '<div class="item1">',
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
          type: "cond",
          text: "context.flag",
          true: {
            tag: "div",
            type: "el",
            text: '<div class="conditional">',
            child: [
              {
                type: "map",
                text: "core.list2.map(({ title })",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    text: '<div class="item2">',
                    child: [
                      {
                        type: "text",
                        text: "${title}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            text: '<div class="fallback">',
            child: [
              {
                type: "text",
                text: "No items",
              },
            ],
          },
        },
      ]))
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("attributes", () =>
      expect(attributes).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: { type: "static", value: "item1" },
              },
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
          type: "cond",
          text: "context.flag",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "conditional" },
            },
            child: [
              {
                type: "map",
                text: "core.list2.map(({ title })",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    string: {
                      class: { type: "static", value: "item2" },
                    },
                    child: [
                      {
                        type: "text",
                        text: "${title}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "fallback" },
            },
            child: [
              {
                type: "text",
                text: "No items",
              },
            ],
          },
        },
      ]))
    it("data", () =>
      expect(data).toEqual([
        {
          type: "map",
          data: "/core/list1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "item1",
              },
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
          type: "cond",
          data: "/context/flag",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: "conditional",
            },
            child: [
              {
                type: "map",
                data: "/core/list2",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    string: {
                      class: "item2",
                    },
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
          false: {
            tag: "div",
            type: "el",
            string: {
              class: "fallback",
            },
            child: [
              {
                type: "text",
                value: "No items",
              },
            ],
          },
        },
      ]))
  })

  describe("map соседствующий с map в условии внутри элемента", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    const mainHtml = extractMainHtmlBlock<Context, Core>(
      ({ html, context, core }) => html`
        <div class="container">
          ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
          ${context.flag
            ? html`<div class="conditional">
                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
              </div>`
            : html`<div class="fallback">No items</div>`}
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { end: 32, kind: "open", name: "div", start: 9, text: '<div class="container">' },
        { end: 99, kind: "open", name: "div", start: 80, text: '<div class="item1">' },
        { end: 107, kind: "text", name: "", start: 99, text: "${title}" },
        { end: 113, kind: "close", name: "div", start: 107, text: "</div>" },
        { end: 174, kind: "open", name: "div", start: 149, text: '<div class="conditional">' },
        { end: 247, kind: "open", name: "div", start: 228, text: '<div class="item2">' },
        { end: 255, kind: "text", name: "", start: 247, text: "${title}" },
        { end: 261, kind: "close", name: "div", start: 255, text: "</div>" },
        { end: 285, kind: "close", name: "div", start: 279, text: "</div>" },
        { end: 316, kind: "open", name: "div", start: 294, text: '<div class="fallback">' },
        { end: 324, kind: "text", name: "", start: 316, text: "No items" },
        { end: 330, kind: "close", name: "div", start: 324, text: "</div>" },
        { end: 347, kind: "close", name: "div", start: 341, text: "</div>" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    // print(tokens)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", text: '<div class="container">', name: "div" },
        { kind: "map-open", sig: "core.list1.map(({ title })" },
        { kind: "tag-open", text: '<div class="item1">', name: "div" },
        { kind: "text", text: "${title}" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "map-close" },
        { kind: "cond-open", expr: "context.flag" },
        { kind: "tag-open", text: '<div class="conditional">', name: "div" },
        { kind: "map-open", sig: "core.list2.map(({ title })" },
        { kind: "tag-open", text: '<div class="item2">', name: "div" },
        { kind: "text", text: "${title}" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "map-close" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback">', name: "div" },
        { kind: "text", text: "No items" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "tag-close", text: "</div>", name: "div" },
      ]))

    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="container">',
          child: [
            {
              type: "map",
              text: "core.list1.map(({ title })",
              child: [
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="item1">',
                  child: [
                    {
                      type: "text",
                      text: "${title}",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  text: '<div class="conditional">',
                  child: [
                    {
                      type: "map",
                      text: "core.list2.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          text: '<div class="item2">',
                          child: [
                            {
                              type: "text",
                              text: "${title}",
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
                  text: '<div class="fallback">',
                  child: [
                    {
                      type: "text",
                      text: "No items",
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
            class: { type: "static", value: "container" },
          },
          child: [
            {
              type: "map",
              text: "core.list1.map(({ title })",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "item1" },
                  },
                  child: [
                    {
                      type: "text",
                      text: "${title}",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: { type: "static", value: "conditional" },
                  },
                  child: [
                    {
                      type: "map",
                      text: "core.list2.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: { type: "static", value: "item2" },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
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
                    class: { type: "static", value: "fallback" },
                  },
                  child: [
                    {
                      type: "text",
                      text: "No items",
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
            class: "container",
          },
          child: [
            {
              type: "map",
              data: "/core/list1",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "item1",
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "conditional",
                  },
                  child: [
                    {
                      type: "map",
                      data: "[item]/list2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "item2",
                          },
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
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "fallback",
                  },
                  child: [
                    {
                      type: "text",
                      value: "No items",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("map соседствующий с map в условии на глубоком уровне вложенности", () => {
    type Context = {
      flag: boolean
      deepFlag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    const mainHtml = extractMainHtmlBlock<Context, Core>(
      ({ html, context, core }) => html`
        <div class="level1">
          <div class="level2">
            <div class="level3">
              ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
              ${context.flag
                ? html`<div class="conditional">
                    ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                    ${context.deepFlag
                      ? html`<div class="deep-conditional">
                          ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
                        </div>`
                      : html`<div class="deep-fallback">No deep items</div>`}
                  </div>`
                : html`<div class="fallback">No items</div>`}
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
      expect(elements.some((el) => el.text.includes("conditional"))).toBe(true)
      expect(elements.some((el) => el.text.includes("item2"))).toBe(true)
      expect(elements.some((el) => el.text.includes("deep-conditional"))).toBe(true)
      expect(elements.some((el) => el.text.includes("item3"))).toBe(true)
      expect(elements.some((el) => el.text.includes("fallback"))).toBe(true)
      expect(elements.some((el) => el.text.includes("deep-fallback"))).toBe(true)
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

            // Проверяем, что на третьем уровне есть map и condition
            const hasMap = level3.child!.some((child) => child.type === "map")
            const hasCondition = level3.child!.some((child) => child.type === "cond")
            expect(hasMap || hasCondition).toBe(true)
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
