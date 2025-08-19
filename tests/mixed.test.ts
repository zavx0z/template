import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"

describe("scanTagsFromRender / смешанные сценарии", () => {
  it("map + условия", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map(
            (_, i) => html` <li>${i % 2 ? html` <em>${"A"}</em> ` : html` <strong>${"B"}</strong>`}</li> `
          )}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 59, name: "li", kind: "open" },
      { text: "<em>", index: 79, name: "em", kind: "open" },
      { text: '${"A"}', index: 83, name: "", kind: "text" },
      { text: "</em>", index: 89, name: "em", kind: "close" },
      { text: "<strong>", index: 105, name: "strong", kind: "open" },
      { text: '${"B"}', index: 113, name: "", kind: "text" },
      { text: "</strong>", index: 119, name: "strong", kind: "close" },
      { text: "</li>", index: 130, name: "li", kind: "close" },
      { text: "</ul>", index: 148, name: "ul", kind: "close" },
    ])
  })

  it("операторы сравнения — без тегов", () => {
    const mainHtml = extractMainHtmlBlock<{ a: number; b: number; c: number; d: number }>(
      ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { index: 0, kind: "text", name: "", text: '${context.a < context.b && context.c > context.d ? "1" : "0"}' },
    ])
  })

  it.skip("недопустимые имена не матчатся", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <di*v>
          bad
        </di*v> 
        <1a>
          no
        </1a>
         <-x>no</-x> 
         <good-tag/>
        `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      {
        index: 0,
        kind: "text",
        name: "",
        text: `        <di*v>
          bad
        </di*v> 
       <1a>
         no
       </1a>
        <-x>no</-x>            `,
      },
      {
        index: 118,
        kind: "self",
        name: "good-tag",
        text: "<good-tag/>",
      },
    ])
  })

  it.skip("PI/комментарии/doctype игнор", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <?xml version="1.0"?>
        <!--c-->
        <!DOCTYPE html>
        <span></span>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<span>", index: 80, name: "span", kind: "open" },
      { text: "</span>", index: 86, name: "span", kind: "close" },
    ])
  })
})
