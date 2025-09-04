import { describe, it, expect, beforeAll } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../parser"
import { enrichWithData } from "../data"
import type { Node } from "../index.t"
import type { PartAttrs } from "../attributes.t"

describe("update", () => {
  describe("функция обновления контекста в функции рендера", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ name: string }>(
        ({ html, update }) => html` <button onclick=${() => update({ name: "Jane Doe" })}>OK</button> `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: "name",
              expr: `() => update({ name: "Jane Doe" })`,
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления нескольких ключей контекста", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ name: string; age: number; active: boolean }>(
        ({ html, update }) =>
          html` <button onclick=${() => update({ name: "John", age: 25, active: true })}>Update</button> `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: ["name", "age", "active"],
              expr: '() => update({ name: "John", age: 25, active: true })',
            },
          },
          child: [
            {
              type: "text",
              value: "Update",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления контекста данными из контекста", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ count: number }>(
        ({ html, update, context }) => html` <button onclick=${() => update({ count: context.count + 1 })}>OK</button> `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: "count",
              data: "/context/count",
              expr: "() => update({ count: ${[0]} + 1 })",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления контекста данными из core и context", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ count: number; iteration: number }>(
        ({ html, update, core, context }) =>
          html`
            <button onclick=${() => update({ count: core.count + context.count, iteration: context.iteration + 1 })}>
              OK
            </button>
          `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: "() => update({ count: core.count + context.count, iteration: context.iteration + 1 })",
          },
          child: [
            {
              type: "text",
              text: "OK",
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: ["count", "iteration"],
              data: ["/core/count", "/context/count", "/context/iteration"],
              expr: "() => update({ count: ${[0]} + ${[1]}, iteration: ${[2]} + 1 })",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления контекста данными из core и context внутри массива вложенного в массив", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<
        { count: number; iteration: number },
        { items: { count: number; iteration: number }[]; count: number; iteration: number }
      >(
        ({ html, update, core }) =>
          html`
            ${core.items.map(
              (item) => html`
                <button onclick=${() => update({ count: core.count + item.count, iteration: item.iteration + 1 })}>
                  OK
                </button>
              `
            )}
          `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          type: "map",
          data: "/core/items",
          child: [
            {
              tag: "button",
              type: "el",
              event: {
                onclick: {
                  upd: ["count", "iteration"],
                  data: ["/core/count", "[item]/count", "[item]/iteration"],
                  expr: "() => update({ count: ${[0]} + ${[1]}, iteration: ${[2]} + 1 })",
                },
              },
              child: [
                {
                  type: "text",
                  value: "OK",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
