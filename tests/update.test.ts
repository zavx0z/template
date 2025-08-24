import { describe, it, expect } from "bun:test"
import { parse } from "../index"

describe("update", () => {
  it("функция обновления контекста в функции рендера", () => {
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
})
