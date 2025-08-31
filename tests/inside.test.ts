import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { makeHierarchy } from "../hierarchy"
import { enrichWithData } from "../data"
import { extractAttributes } from "../attributes"
import { extractTokens } from "../token"

describe("inside", () => {
  describe("теги внутри тернарника", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html` <div>${context.cond ? html`<p>a</p>` : html`<span>b</span>`}</div> `
    )

    const elements = extractHtmlElements(mainHtml)
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
              type: "cond",
              text: "context.cond",
              true: {
                tag: "p",
                type: "el",
                text: "<p>",
                child: [
                  {
                    type: "text",
                    text: "a",
                  },
                ],
              },
              false: {
                tag: "span",
                type: "el",
                text: "<span>",
                child: [
                  {
                    type: "text",
                    text: "b",
                  },
                ],
              },
            },
          ],
        },
      ])
    })
    const attributes = extractAttributes(hierarchy)
    const data = enrichWithData(attributes)
    it("data", () => {
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/cond",
              true: {
                tag: "p",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "a",
                  },
                ],
              },
              false: {
                tag: "span",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "b",
                  },
                ],
              },
            },
          ],
        },
      ])
    })
  })
})
