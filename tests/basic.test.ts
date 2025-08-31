import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { extractAttributes } from "../attributes"
import { enrichWithData } from "../data"
import { extractTokens } from "../token"

describe("basic", () => {
  describe("простая пара тегов", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 0, end: 5, name: "div", kind: "open" },
        { text: "</div>", start: 5, end: 11, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
        },
      ])
    })

    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
        },
      ])
    })
  })

  describe("вложенность и соседние узлы", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <ul>
          <li>a</li>
          <li>b</li>
        </ul>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<ul>", start: 9, end: 13, name: "ul", kind: "open" },
        { text: "<li>", start: 24, end: 28, name: "li", kind: "open" },
        { text: "a", start: 28, end: 29, name: "", kind: "text" },
        { text: "</li>", start: 29, end: 34, name: "li", kind: "close" },
        { text: "<li>", start: 45, end: 49, name: "li", kind: "open" },
        { text: "b", start: 49, end: 50, name: "", kind: "text" },
        { text: "</li>", start: 50, end: 55, name: "li", kind: "close" },
        { text: "</ul>", start: 64, end: 69, name: "ul", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "ul",
          type: "el",
          text: "<ul>",
          child: [
            {
              tag: "li",
              type: "el",
              text: "<li>",
              child: [
                {
                  type: "text",
                  text: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              text: "<li>",
              child: [
                {
                  type: "text",
                  text: "b",
                },
              ],
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  text: "b",
                },
              ],
            },
          ],
        },
      ])
    })

    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "a",
                },
              ],
            },
            {
              tag: "li",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "b",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("void и self", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <div>
          <br />
          <img src="x" />
          <input disabled />
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () => {
      expect(elements).toEqual([
        { text: "<div>", start: 9, end: 14, name: "div", kind: "open" },
        { text: "<br />", start: 25, end: 31, name: "br", kind: "self" },
        { text: '<img src="x" />', start: 42, end: 57, name: "img", kind: "self" },
        { text: "<input disabled />", start: 68, end: 86, name: "input", kind: "self" },
        { text: "</div>", start: 95, end: 101, name: "div", kind: "close" },
      ])
    })

    const tokens = extractTokens(mainHtml, elements)
    const hierarchy = makeHierarchy(tokens)
    it("hierarchy", () => {
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              tag: "br",
              type: "el",
              text: "<br />",
            },
            {
              tag: "img",
              type: "el",
              text: '<img src="x" />',
            },
            {
              tag: "input",
              type: "el",
              text: "<input disabled />",
            },
          ],
        },
      ])
    })

    const attributes = extractAttributes(hierarchy)
    it("attributes", () => {
      expect(attributes).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "br",
              type: "el",
            },
            {
              tag: "img",
              type: "el",
              string: {
                src: {
                  type: "static",
                  value: "x",
                },
              },
            },
            {
              tag: "input",
              type: "el",
              boolean: {
                disabled: {
                  type: "static",
                  value: true,
                },
              },
            },
          ],
        },
      ])
    })

    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "br",
              type: "el",
            },
            {
              tag: "img",
              type: "el",
              string: {
                src: "x",
              },
            },
            {
              tag: "input",
              type: "el",
              boolean: {
                disabled: true,
              },
            },
          ],
        },
      ])
    })
  })
})
