import { describe, it, expect } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractTokens } from "./token"

describe("text-formatting", () => {
  describe("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    const mainHtml = extractMainHtmlBlock<{ name: string; title: string }, { items: { title: string }[] }>(
      ({ html, context, core }) => html`
        <div>
          <p>Hello World</p>
          <span>${context.name} - ${context.title}</span>
          <span>${context.name} - ${core.items.map((item) => item.title).join(", ")}</span>
          <div>Welcome to our site!</div>
          <p>${context.name} is ${context.title}</p>
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<div>", index: 9, name: "div", kind: "open" },
        { text: "<p>", index: 25, name: "p", kind: "open" },
        { text: "Hello World", index: 28, name: "", kind: "text" },
        { text: "</p>", index: 39, name: "p", kind: "close" },
        { text: "<span>", index: 54, name: "span", kind: "open" },
        { text: "${context.name} - ${context.title}", index: 60, name: "", kind: "text" },
        { text: "</span>", index: 94 , name: "span", kind: "close" },
        { text: "<span>", index: 112, name: "span", kind: "open" },
        {
          text: '${context.name} - ${core.items.map((item) => item.title).join(", ")}',
          index: 118,
          name: "",
          kind: "text",
        },
        { text: "</span>", index: 186, name: "span", kind: "close" },
        { text: "<div>", index: 204, name: "div", kind: "open" },
        { text: "Welcome to our site!", index: 209, name: "", kind: "text" },
        { text: "</div>", index: 229, name: "div", kind: "close" },
        { text: "<p>", index: 246, name: "p", kind: "open" },
        { text: "${context.name} is ${context.title}", index: 249, name: "", kind: "text" },
        { text: "</p>", index: 284, name: "p", kind: "close" },
        { text: "</div>", index: 297, name: "div", kind: "close" },
      ]))
    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    const data = enrichWithData(hierarchy)
    console.log(data)
    it("data", () =>
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Hello World",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/context/name", "/context/title"],
                  expr: "${[0]} - ${[1]}",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/name",
                  expr: "${[0]} - ${[0]}",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Welcome to our site!",
                },
              ],
            },
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/context/name", "/context/title"],
                  expr: "${[0]} is ${[1]}",
                },
              ],
            },
          ],
        },
      ]))
  })
})
