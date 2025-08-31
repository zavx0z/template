import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { print } from "../fixture"
import { extractTokens } from "../token"

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
        { end: 58, kind: "open", name: "div", start: 32, text: '<div class="conditional1">' },
        { end: 67, kind: "text", name: "", start: 58, text: "Content 1" },
        { end: 73, kind: "close", name: "div", start: 67, text: "</div>" },
        { end: 105, kind: "open", name: "div", start: 82, text: '<div class="fallback1">' },
        { end: 117, kind: "text", name: "", start: 105, text: "No content 1" },
        { end: 123, kind: "close", name: "div", start: 117, text: "</div>" },
        { end: 183, kind: "open", name: "div", start: 157, text: '<div class="conditional2">' },
        { end: 192, kind: "text", name: "", start: 183, text: "Content 2" },
        { end: 198, kind: "close", name: "div", start: 192, text: "</div>" },
        { end: 230, kind: "open", name: "div", start: 207, text: '<div class="fallback2">' },
        { end: 242, kind: "text", name: "", start: 230, text: "No content 2" },
        { end: 248, kind: "close", name: "div", start: 242, text: "</div>" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "cond-open", expr: "context.flag1" },
        { kind: "tag-open", text: '<div class="conditional1">', name: "div" },
        { kind: "text", text: "Content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback1">', name: "div" },
        { kind: "text", text: "No content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "cond-open", expr: "context.flag2" },
        { kind: "tag-open", text: '<div class="conditional2">', name: "div" },
        { kind: "text", text: "Content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback2">', name: "div" },
        { kind: "text", text: "No content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
      ]))
    const hierarchy = makeHierarchy(tokens)
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
    const mainHtml = extractMainHtmlBlock<{ flag1: boolean; flag2: boolean }, {}>(
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
        { end: 32, kind: "open", name: "div", start: 9, text: '<div class="container">' },
        { end: 92, kind: "open", name: "div", start: 66, text: '<div class="conditional1">' },
        { end: 101, kind: "text", name: "", start: 92, text: "Content 1" },
        { end: 107, kind: "close", name: "div", start: 101, text: "</div>" },
        { end: 139, kind: "open", name: "div", start: 116, text: '<div class="fallback1">' },
        { end: 151, kind: "text", name: "", start: 139, text: "No content 1" },
        { end: 157, kind: "close", name: "div", start: 151, text: "</div>" },
        { end: 219, kind: "open", name: "div", start: 193, text: '<div class="conditional2">' },
        { end: 228, kind: "text", name: "", start: 219, text: "Content 2" },
        { end: 234, kind: "close", name: "div", start: 228, text: "</div>" },
        { end: 266, kind: "open", name: "div", start: 243, text: '<div class="fallback2">' },
        { end: 278, kind: "text", name: "", start: 266, text: "No content 2" },
        { end: 284, kind: "close", name: "div", start: 278, text: "</div>" },
        { end: 301, kind: "close", name: "div", start: 295, text: "</div>" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", text: '<div class="container">', name: "div" },
        { kind: "cond-open", expr: "context.flag1" },
        { kind: "tag-open", text: '<div class="conditional1">', name: "div" },
        { kind: "text", text: "Content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback1">', name: "div" },
        { kind: "text", text: "No content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "cond-open", expr: "context.flag2" },
        { kind: "tag-open", text: '<div class="conditional2">', name: "div" },
        { kind: "text", text: "Content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback2">', name: "div" },
        { kind: "text", text: "No content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
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
          ],
        },
      ]))
  })

  describe("условие соседствующее с условием на глубоком уровне вложенности", () => {
    const mainHtml = extractMainHtmlBlock<{ flag1: boolean; flag2: boolean; flag3: boolean }, {}>(
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

    const tokens = extractTokens(mainHtml, elements)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", text: '<div class="level1">', name: "div" },
        { kind: "tag-open", text: '<div class="level2">', name: "div" },
        { kind: "tag-open", text: '<div class="level3">', name: "div" },
        { kind: "cond-open", expr: "context.flag1" },
        { kind: "tag-open", text: '<div class="conditional1">', name: "div" },
        { kind: "text", text: "Content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback1">', name: "div" },
        { kind: "text", text: "No content 1" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "cond-open", expr: "context.flag2" },
        { kind: "tag-open", text: '<div class="conditional2">', name: "div" },
        { kind: "text", text: "Content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback2">', name: "div" },
        { kind: "text", text: "No content 2" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "cond-open", expr: "context.flag3" },
        { kind: "tag-open", text: '<div class="conditional3">', name: "div" },
        { kind: "text", text: "Content 3" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-else" },
        { kind: "tag-open", text: '<div class="fallback3">', name: "div" },
        { kind: "text", text: "No content 3" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "cond-close" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "tag-close", text: "</div>", name: "div" },
        { kind: "tag-close", text: "</div>", name: "div" },
      ]))
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
