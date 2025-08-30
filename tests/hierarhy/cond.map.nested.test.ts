import { describe, it, expect } from "bun:test"
import { makeHierarchy } from "../../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"
import { extractTokens } from "../../token"
import { print } from "../../fixture"

describe("вложенность операторов", () => {
  describe("condition внутри map", () => {
    const mainHtml = extractMainHtmlBlock<any, { items: { show: boolean }[] }>(
      ({ html, core }) => html`
        <div>
          ${core.items.map((item) =>
            item.show ? html`<div class="true-branch"></div>` : html`<div class="false-branch"></div>`
          )}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { text: "<div>", start: 9, end: 14, name: "div", kind: "open" },
        { text: '<div class="true-branch">', start: 69, end: 94, name: "div", kind: "open" },
        { text: "</div>", start: 94, end: 100, name: "div", kind: "close" },
        { text: '<div class="false-branch">', start: 109, end: 135, name: "div", kind: "open" },
        { text: "</div>", start: 135, end: 141, name: "div", kind: "close" },
        { text: "</div>", start: 153, end: 159, name: "div", kind: "close" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    // print(tokens)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", name: "div", text: "<div>" },
        { kind: "map-open", sig: "core.items.map((item)" },
        { kind: "cond-open", expr: "item.show" },
        { kind: "tag-open", name: "div", text: '<div class="true-branch">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "cond-else" },
        { kind: "tag-open", name: "div", text: '<div class="false-branch">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "map-close" },
        { kind: "cond-close" },
      ]))
    const hierarchy = makeHierarchy(mainHtml, elements)
    it.skip("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "map",
              text: "core.items.map((item)",
              child: [
                {
                  type: "cond",
                  text: "core.items.map((item) => item.show",
                  true: {
                    tag: "div",
                    type: "el",
                    text: '<div class="true-branch">',
                  },
                  false: {
                    tag: "div",
                    type: "el",
                    text: '<div class="false-branch">',
                  },
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("map внутри condition", () => {
    const mainHtml = extractMainHtmlBlock<{ show: boolean }, { items: string[] }>(
      ({ html, core, context }) => html`
        <div>
          ${context.show
            ? html` ${core.items.map((item) => html`<div class="true-${item}"></div>`)}`
            : html` ${core.items.map((item) => html`<div class="false-${item}"></div>`)}`}
        </div>
      `
    )

    const elements = extractHtmlElements(mainHtml)
    it("elements", () =>
      expect(elements).toEqual([
        { end: 14, kind: "open", name: "div", start: 9, text: "<div>" },
        { end: 106, kind: "open", name: "div", start: 80, text: '<div class="true-${item}">' },
        { end: 112, kind: "close", name: "div", start: 106, text: "</div>" },
        { end: 184, kind: "open", name: "div", start: 157, text: '<div class="false-${item}">' },
        { end: 190, kind: "close", name: "div", start: 184, text: "</div>" },
        { end: 210, kind: "close", name: "div", start: 204, text: "</div>" },
      ]))

    const tokens = extractTokens(mainHtml, elements)
    // print(tokens)
    it("tokens", () =>
      expect(tokens).toEqual([
        { kind: "tag-open", name: "div", text: "<div>" },
        { kind: "cond-open", expr: "context.show" },
        { kind: "map-open", sig: "core.items.map((item)" },
        { kind: "tag-open", name: "div", text: '<div class="true-${item}">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "map-close" },
        { kind: "cond-close" },
        { kind: "cond-else" },
        { kind: "map-open", sig: "core.items.map((item)" },
        { kind: "tag-open", name: "div", text: '<div class="false-${item}">' },
        { kind: "tag-close", name: "div", text: "</div>" },
        { kind: "map-close" },
        { kind: "cond-close" },
      ]))

    const hierarchy = makeHierarchy(mainHtml, elements)
    it.skip("hierarchy", () =>
      expect(hierarchy).toEqual([
        {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "cond",
              text: "context.show",
              true: {
                type: "map",
                text: "core.items.map((item)",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    text: '<div class="true-${item}">',
                  },
                ],
              },
              false: {
                type: "map",
                text: "core.items.map((item)",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    text: '<div class="false-${item}">',
                  },
                ],
              },
            },
          ],
        },
      ]))
  })
})
