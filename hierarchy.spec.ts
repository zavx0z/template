import { describe, expect, it } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "./splitter"
import { elementsHierarchy } from "./hierarchy"

describe("hierarchy", () => {
  it("map в элементе вложенный в map", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(
            ({ title, nested }) => html`
              <li>
                <p>${title}</p>
                ${nested.map((n) => html`<em>${n}</em>`)}
              </li>
            `
          )}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 83, name: "li", kind: "open" },
      { text: "<p>", index: 104, name: "p", kind: "open" },
      { text: "${title}", index: 107, name: "", kind: "text" },
      { text: "</p>", index: 115, name: "p", kind: "close" },
      { text: "<em>", index: 161, name: "em", kind: "open" },
      { text: "${n}", index: 165, name: "", kind: "text" },
      { text: "</em>", index: 169, name: "em", kind: "close" },
      { text: "</li>", index: 192, name: "li", kind: "close" },
      { text: "</ul>", index: 222, name: "ul", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "ul",
        type: "el",
        text: "<ul>",
        child: [
          {
            type: "map",
            text: "core.list.map(({ title, nested })`",
            child: [
              {
                tag: "li",
                type: "el",
                text: "<li>",
                child: [
                  {
                    tag: "p",
                    type: "el",
                    text: "<p>",
                    child: [
                      {
                        type: "text",
                        text: "${title}",
                      },
                    ],
                  },
                  {
                    type: "map",
                    text: "nested.map((n)`",
                    child: [
                      {
                        type: "text",
                        text: "${n}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })
  it("map в условии", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
      ({ html, core, context }) => html`
        ${context.flag
          ? html`<ul>
              ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
            </ul>`
          : html`<div>x</div>`}
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<ul>", index: 31, name: "ul", kind: "open" },
      { text: "<li>", index: 94, name: "li", kind: "open" },
      { text: "${title} ", index: 98, name: "", kind: "text" },
      { text: "<em>", index: 132, name: "em", kind: "open" },
      { text: "${n}", index: 136, name: "", kind: "text" },
      { text: "</em>", index: 140, name: "em", kind: "close" },
      { text: "</li>", index: 148, name: "li", kind: "close" },
      { text: "</ul>", index: 169, name: "ul", kind: "close" },
      { text: "<div>", index: 183, name: "div", kind: "open" },
      { text: "x", index: 188, name: "", kind: "text" },
      { text: "</div>", index: 189, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        type: "cond",
        text: "context.flag",
        true: {
          tag: "ul",
          type: "el",
          text: "<ul>",
          child: [
            {
              type: "map",
              text: "core.list.map(({ title, nested })`",
              child: [
                {
                  tag: "li",
                  type: "el",
                  text: "<li>",
                  child: [
                    {
                      type: "text",
                      text: "${title} ",
                    },
                    {
                      type: "map",
                      text: "nested.map((n)`",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          text: "<em>",
                          child: [
                            {
                              type: "text",
                              text: "${n}",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        false: {
          tag: "div",
          type: "el",
          text: "<div>",
          child: [
            {
              type: "text",
              text: "x",
            },
          ],
        },
      },
    ])
  })
})
