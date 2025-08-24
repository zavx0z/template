import { describe, it, expect } from "bun:test"
import { parse } from "../index"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("update", () => {
  describe("функция обновления контекста в функции рендера", () => {
    const data = parse<{ name: string }>(
      ({ html, update }) => html` <button onclick=${() => update({ name: "Jane Doe" })}>OK</button> `
    )
    it("парсинг", () => {
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              data: [],
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
    const data = parse<{ name: string; age: number; active: boolean }>(
      ({ html, update }) =>
        html` <button onclick=${() => update({ name: "John", age: 25, active: true })}>Update</button> `
    )
    it("парсинг нескольких ключей", () => {
      expect(data, "должен распознать несколько ключей в update").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              data: [],
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
    const data = parse<{ count: number }>(
      ({ html, update, context }) => html` <button onclick=${() => update({ count: context.count + 1 })}>OK</button> `
    )
    it("парсинг", () => {
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              upd: "count",
              data: "/context/count",
              expr: "() => update({ count: ${0} + 1 })",
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
    const data = parse<{ count: number; iteration: number }>(
      ({ html, update, core, context }) =>
        html`
          <button onclick=${() => update({ count: core.count + context.count, iteration: context.iteration + 1 })}>
            OK
          </button>
        `
    )
    it("парсинг", () => {
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          attr: {
            onclick: {
              upd: ["count", "iteration"],
              data: ["/core/count", "/context/count", "/context/iteration"],
              expr: "() => update({ count: ${0} + ${1}, iteration: ${2} + 1 })",
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
    const data = parse<
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
    it("парсинг", () => {
      expect(data, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          type: "map",
          data: "/core/items",
          child: [
            {
              tag: "button",
              type: "el",
              attr: {
                onclick: {
                  upd: ["count", "iteration"],
                  data: ["/core/count", "[item]/count", "[item]/iteration"],
                  expr: "() => update({ count: ${0} + ${1}, iteration: ${2} + 1 })",
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
