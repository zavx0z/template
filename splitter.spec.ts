import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock } from "./splitter"

describe("извлечение тегов", () => {
  describe("простые случаи", () => {
    it("один корневой тег", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<div>", index: 0, name: "div", kind: "open" },
        { text: "</div>", index: 5, name: "div", kind: "close" },
      ])
    })

    it("несколько корневых тегов", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <div>a</div>
          <div>b</div>
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<div>", index: 11, name: "div", kind: "open" },
        { text: "</div>", index: 17, name: "div", kind: "close" },
        { text: "<div>", index: 34, name: "div", kind: "open" },
        { text: "</div>", index: 40, name: "div", kind: "close" },
      ])
    })

    it("вложенность и соседние узлы", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <ul>
            <li>a</li>
            <li>b</li>
          </ul>
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<ul>", index: 11, name: "ul", kind: "open" },
        { text: "<li>", index: 28, name: "li", kind: "open" },
        { text: "</li>", index: 33, name: "li", kind: "close" },
        { text: "<li>", index: 51, name: "li", kind: "open" },
        { text: "</li>", index: 56, name: "li", kind: "close" },
        { text: "</ul>", index: 72, name: "ul", kind: "close" },
      ])
    })

    it("void и self", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <div>
            <br />
            <img src="x" />
            <input disabled />
          </div>
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<div>", index: 11, name: "div", kind: "open" },
        { text: "<br />", index: 29, name: "br", kind: "self" },
        { text: '<img src="x" />', index: 48, name: "img", kind: "self" },
        { text: "<input disabled />", index: 76, name: "input", kind: "self" },
        { text: "</div>", index: 105, name: "div", kind: "close" },
      ])
    })
  })
  describe("атрибуты", () => {
    it("namespace", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<svg:use xlink:href="#id">', index: 0, name: "svg:use", kind: "open" },
        { text: "</svg:use>", index: 26, name: "svg:use", kind: "close" },
      ])
    })

    it("двойные/одинарные кавычки", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<a href="https://e.co" target="_blank">', index: 0, name: "a", kind: "open" },
        { text: "</a>", index: 40, name: "a", kind: "close" },
      ])
    })

    it("угловые скобки внутри значения", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div title="a > b, c < d"></div>`)
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<div title="a > b, c < d">', index: 0, name: "div", kind: "open" },
        { text: "</div>", index: 26, name: "div", kind: "close" },
      ])
    })
    it("условие в атрибуте", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<div title="${context.flag ? "a > b" : "c < d"}">', index: 0, name: "div", kind: "open" },
        { text: "</div>", index: 49, name: "div", kind: "close" },
      ])
    })
    it("условие в аттрибуте без кавычек", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title=${context.flag ? "a > b" : "c < d"}></div>`
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<div title=${context.flag ? "a > b" : "c < d"}>', index: 0, name: "div", kind: "open" },
        { text: "</div>", index: 47, name: "div", kind: "close" },
      ])
    })
    it("условие в аттрибуте с одинарными кавычками", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        // prettier-ignore
        ({ html, context }) => html`<div title='${context.flag ? "a > b" : "c < d"}'></div>`
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<div title=\'${context.flag ? "a > b" : "c < d"}\'>', index: 0, name: "div", kind: "open" },
        { text: "</div>", index: 49, name: "div", kind: "close" },
      ])
    })
    it("булевые атрибуты", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<button ${context.flag && "disabled"}></button>`
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: '<button ${context.flag && "disabled"}>', index: 0, name: "button", kind: "open" },
        { text: "</button>", index: 38, name: "button", kind: "close" },
      ])
    })
  })

  describe("внутри ${...}", () => {
    it("теги внутри условия", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html` <div>${context.cond ? html`<p>a</p>` : html`<span>b</span>`}</div> `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<div>", index: 1, name: "div", kind: "open" },
        { text: "<p>", index: 28, name: "p", kind: "open" },
        { text: "</p>", index: 32, name: "p", kind: "close" },
        { text: "<span>", index: 45, name: "span", kind: "open" },
        { text: "</span>", index: 52, name: "span", kind: "close" },
        { text: "</div>", index: 61, name: "div", kind: "close" },
      ])
    })

    it("теги внутри map", () => {
      const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map((name) => html`<li>${name}</li>`)}
          </ul>
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<ul>", index: 11, name: "ul", kind: "open" },
        { text: "<li>", index: 62, name: "li", kind: "open" },
        { text: "</li>", index: 73, name: "li", kind: "close" },
        { text: "</ul>", index: 92, name: "ul", kind: "close" },
      ])
    })

    it("соседствующие теги внутри map", () => {
      const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map(
              (name) => html`
                <li>${name}</li>
                <br />
              `
            )}
          </ul>
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<ul>", index: 11, name: "ul", kind: "open" },
        { text: "<li>", index: 79, name: "li", kind: "open" },
        { text: "</li>", index: 90, name: "li", kind: "close" },
        { text: "<br />", index: 112, name: "br", kind: "self" },
        { text: "</ul>", index: 147, name: "ul", kind: "close" },
      ])
    })

    it("теги внутри map находящихся в условии", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
        ({ html, core, context }) => html`
          ${context.flag
            ? html`
                <ul>
                  ${core.list.map(
                    ({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`
                  )}
                </ul>
              `
            : html`<div>x</div>`}
        `
      )
      const tags = scanHtmlTags(mainHtml)
      expect(tags).toEqual([
        { text: "<ul>", index: 50, name: "ul", kind: "open" },
        { text: "<li>", index: 117, name: "li", kind: "open" },
        { text: "<em>", index: 155, name: "em", kind: "open" },
        { text: "</em>", index: 163, name: "em", kind: "close" },
        { text: "</li>", index: 171, name: "li", kind: "close" },
        { text: "</ul>", index: 196, name: "ul", kind: "close" },
        { text: "<div>", index: 225, name: "div", kind: "open" },
        { text: "</div>", index: 231, name: "div", kind: "close" },
      ])
    })
  })
})
