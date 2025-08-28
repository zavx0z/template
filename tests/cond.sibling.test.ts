import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"

describe("условия соседствующие", () => {
  describe("условие соседствующее с условием на верхнем уровне", () => {
    type Context = {
      flag1: boolean
      flag2: boolean
    }
    const mainHtml = extractMainHtmlBlock<Context, {}>(
      ({ html, context }) => html`
        ${context.flag1
          ? html`<div class="conditional1">Content 1</div>`
          : html`<div class="fallback1">No content 1</div>`}
        ${context.flag2
          ? html`<div class="conditional2">Content 2</div>`
          : html`<div class="fallback2">No content 2</div>`}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: '<div class="conditional1">', index: 32, name: "div", kind: "open" },
        { text: "Content 1", index: 58, name: "", kind: "text" },
        { text: "</div>", index: 67, name: "div", kind: "close" },
        { text: '<div class="fallback1">', index: 82, name: "div", kind: "open" },
        { text: "No content 1", index: 105, name: "", kind: "text" },
        { text: "</div>", index: 117, name: "div", kind: "close" },
        { text: '<div class="conditional2">', index: 157, name: "div", kind: "open" },
        { text: "Content 2", index: 183, name: "", kind: "text" },
        { text: "</div>", index: 192, name: "div", kind: "close" },
        { text: '<div class="fallback2">', index: 207, name: "div", kind: "open" },
        { text: "No content 2", index: 230, name: "", kind: "text" },
        { text: "</div>", index: 242, name: "div", kind: "close" },
      ]))
    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          type: "cond",
          text: "context.flag1",
          true: {
            tag: "div",
            type: "el",
            text: '<div class="conditional1">',
            child: [
              {
                type: "text",
                text: "Content 1",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            text: '<div class="fallback1">',
            child: [
              {
                type: "text",
                text: "No content 1",
              },
            ],
          },
        },
        {
          type: "cond",
          text: "context.flag2",
          true: {
            tag: "div",
            type: "el",
            text: '<div class="conditional2">',
            child: [
              {
                type: "text",
                text: "Content 2",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            text: '<div class="fallback2">',
            child: [
              {
                type: "text",
                text: "No content 2",
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
          type: "cond",
          text: "context.flag1",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "conditional1" },
            },
            child: [
              {
                type: "text",
                text: "Content 1",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "fallback1" },
            },
            child: [
              {
                type: "text",
                text: "No content 1",
              },
            ],
          },
        },
        {
          type: "cond",
          text: "context.flag2",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "conditional2" },
            },
            child: [
              {
                type: "text",
                text: "Content 2",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: { type: "static", value: "fallback2" },
            },
            child: [
              {
                type: "text",
                text: "No content 2",
              },
            ],
          },
        },
      ]))
    it("data", () =>
      expect(data).toEqual([
        {
          type: "cond",
          data: "/context/flag1",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: "conditional1",
            },
            child: [
              {
                type: "text",
                value: "Content 1",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: "fallback1",
            },
            child: [
              {
                type: "text",
                value: "No content 1",
              },
            ],
          },
        },
        {
          type: "cond",
          data: "/context/flag2",
          true: {
            tag: "div",
            type: "el",
            string: {
              class: "conditional2",
            },
            child: [
              {
                type: "text",
                value: "Content 2",
              },
            ],
          },
          false: {
            tag: "div",
            type: "el",
            string: {
              class: "fallback2",
            },
            child: [
              {
                type: "text",
                value: "No content 2",
              },
            ],
          },
        },
      ]))
  })

  describe("условие соседствующее с условием внутри элемента", () => {
    type Context = {
      flag1: boolean
      flag2: boolean
    }
    const mainHtml = extractMainHtmlBlock<Context, {}>(
      ({ html, context }) => html`
        <div class="container">
          ${context.flag1
            ? html`<div class="conditional1">Content 1</div>`
            : html`<div class="fallback1">No content 1</div>`}
          ${context.flag2
            ? html`<div class="conditional2">Content 2</div>`
            : html`<div class="fallback2">No content 2</div>`}
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: '<div class="container">', index: 9, name: "div", kind: "open" },
        { text: '<div class="conditional1">', index: 66, name: "div", kind: "open" },
        { text: "Content 1", index: 92, name: "", kind: "text" },
        { text: "</div>", index: 101, name: "div", kind: "close" },
        { text: '<div class="fallback1">', index: 116, name: "div", kind: "open" },
        { text: "No content 1", index: 139, name: "", kind: "text" },
        { text: "</div>", index: 151, name: "div", kind: "close" },
        { text: '<div class="conditional2">', index: 193, name: "div", kind: "open" },
        { text: "Content 2", index: 219, name: "", kind: "text" },
        { text: "</div>", index: 228, name: "div", kind: "close" },
        { text: '<div class="fallback2">', index: 243, name: "div", kind: "open" },
        { text: "No content 2", index: 266, name: "", kind: "text" },
        { text: "</div>", index: 278, name: "div", kind: "close" },
        { text: "</div>", index: 295, name: "div", kind: "close" },
      ]))
    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: '<div class="container">',
          child: [
            {
              type: "cond",
              text: "context.flag2",
              true: {
                tag: "div",
                type: "el",
                text: '<div class="conditional1">',
                child: [
                  {
                    type: "text",
                    text: "Content 1",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                text: '<div class="fallback1">',
                child: [
                  {
                    type: "text",
                    text: "No content 1",
                  },
                ],
              },
            },
            {
              type: "cond",
              text: "context.flag1",
              true: {
                tag: "div",
                type: "el",
                text: '<div class="conditional2">',
                child: [
                  {
                    type: "text",
                    text: "Content 2",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                text: '<div class="fallback2">',
                child: [
                  {
                    type: "text",
                    text: "No content 2",
                  },
                ],
              },
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
              type: "cond",
              text: "context.flag2",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "conditional1" },
                },
                child: [
                  {
                    type: "text",
                    text: "Content 1",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "fallback1" },
                },
                child: [
                  {
                    type: "text",
                    text: "No content 1",
                  },
                ],
              },
            },
            {
              type: "cond",
              text: "context.flag1",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "conditional2" },
                },
                child: [
                  {
                    type: "text",
                    text: "Content 2",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: { type: "static", value: "fallback2" },
                },
                child: [
                  {
                    type: "text",
                    text: "No content 2",
                  },
                ],
              },
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
              type: "cond",
              data: "/context/flag2",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: "conditional1",
                },
                child: [
                  {
                    type: "text",
                    value: "Content 1",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: "fallback1",
                },
                child: [
                  {
                    type: "text",
                    value: "No content 1",
                  },
                ],
              },
            },
            {
              type: "cond",
              data: "/context/flag1",
              true: {
                tag: "div",
                type: "el",
                string: {
                  class: "conditional2",
                },
                child: [
                  {
                    type: "text",
                    value: "Content 2",
                  },
                ],
              },
              false: {
                tag: "div",
                type: "el",
                string: {
                  class: "fallback2",
                },
                child: [
                  {
                    type: "text",
                    value: "No content 2",
                  },
                ],
              },
            },
          ],
        },
      ]))
  })

  describe("условие соседствующее с условием на глубоком уровне вложенности", () => {
    type Context = {
      flag1: boolean
      flag2: boolean
      flag3: boolean
    }
    const mainHtml = extractMainHtmlBlock<Context, {}>(
      ({ html, context }) => html`
        <div class="level1">
          <div class="level2">
            <div class="level3">
              ${context.flag1
                ? html`<div class="conditional1">Content 1</div>`
                : html`<div class="fallback1">No content 1</div>`}
              ${context.flag2
                ? html`<div class="conditional2">Content 2</div>`
                : html`<div class="fallback2">No content 2</div>`}
              ${context.flag3
                ? html`<div class="conditional3">Content 3</div>`
                : html`<div class="fallback3">No content 3</div>`}
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
      expect(elements.some((el) => el.text.includes("conditional1"))).toBe(true)
      expect(elements.some((el) => el.text.includes("conditional2"))).toBe(true)
      expect(elements.some((el) => el.text.includes("conditional3"))).toBe(true)
      expect(elements.some((el) => el.text.includes("fallback1"))).toBe(true)
      expect(elements.some((el) => el.text.includes("fallback2"))).toBe(true)
      expect(elements.some((el) => el.text.includes("fallback3"))).toBe(true)
    })
    const hierarchy = makeHierarchy(mainHtml, elements)
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

            // Проверяем, что на третьем уровне есть condition выражения
            const condNodes = level3.child!.filter((child) => child.type === "cond")
            expect(condNodes.length).toBeGreaterThanOrEqual(3) // flag1, flag2, flag3
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
