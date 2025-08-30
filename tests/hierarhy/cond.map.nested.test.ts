import { describe, it, expect } from "bun:test"
import { makeHierarchy } from "../../hierarchy"
import { extractHtmlElements, extractMainHtmlBlock } from "../../splitter"

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
        { text: "<div>", index: 7, name: "div", kind: "open" },
        { text: '<div class="true-branch">', index: 65, name: "div", kind: "open" },
        { text: "</div>", index: 90, name: "div", kind: "close" },
        { text: '<div class="false-branch">', index: 105, name: "div", kind: "open" },
        { text: "</div>", index: 131, name: "div", kind: "close" },
        { text: "</div>", index: 147, name: "div", kind: "close" },
      ]))

    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
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
        { text: "<div>", index: 7, name: "div", kind: "open" },
        { text: '<div class="true-${item}">', index: 76, name: "div", kind: "open" },
        { text: "</div>", index: 102, name: "div", kind: "close" },
        { text: '<div class="false-${item}">', index: 153, name: "div", kind: "open" },
        { text: "</div>", index: 180, name: "div", kind: "close" },
        { text: "</div>", index: 198, name: "div", kind: "close" },
      ]))

    const hierarchy = makeHierarchy(mainHtml, elements)
    it("hierarchy", () =>
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
