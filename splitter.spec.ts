import { describe, it, expect } from "bun:test"
import { scanHtmlTags, extractMainHtmlBlock, extractHtmlElements } from "./splitter"

describe("извлечение тегов", () => {
  describe("простые случаи", () => {
    it("один корневой тег", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div></div>`)
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<div>", start: 0, end: 5, name: "div", kind: "open" },
        { text: "</div>", start: 5, end: 11, name: "div", kind: "close" },
      ])
    })

    it("несколько корневых тегов", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html }) => html`
          <div>a</div>
          <div>b</div>
        `
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<div>", start: 11, end: 16, name: "div", kind: "open" },
        { text: "a", start: 16, end: 17, name: "", kind: "text" },
        { text: "</div>", start: 17, end: 23, name: "div", kind: "close" },
        { text: "<div>", start: 34, end: 39, name: "div", kind: "open" },
        { text: "b", start: 39, end: 40, name: "", kind: "text" },
        { text: "</div>", start: 40, end: 46, name: "div", kind: "close" },
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
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<ul>", start: 11, end: 15, name: "ul", kind: "open" },
        { text: "<li>", start: 28, end: 32, name: "li", kind: "open" },
        { text: "a", start: 32, end: 33, name: "", kind: "text" },
        { text: "</li>", start: 33, end: 38, name: "li", kind: "close" },
        { text: "<li>", start: 51, end: 55, name: "li", kind: "open" },
        { text: "b", start: 55, end: 56, name: "", kind: "text" },
        { text: "</li>", start: 56, end: 61, name: "li", kind: "close" },
        { text: "</ul>", start: 72, end: 77, name: "ul", kind: "close" },
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
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<div>", start: 11, end: 16, name: "div", kind: "open" },
        { text: "<br />", start: 29, end: 35, name: "br", kind: "self" },
        { text: '<img src="x" />', start: 48, end: 63, name: "img", kind: "self" },
        { text: "<input disabled />", start: 76, end: 94, name: "input", kind: "self" },
        { text: "</div>", start: 105, end: 111, name: "div", kind: "close" },
      ])
    })

    it("meta-теги", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, core }) => html`
          <meta-hash></meta-hash>
          <meta-hash />
          <meta-${core.tag}></meta-${core.tag}>
        `
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<meta-hash>", start: 11, end: 22, name: "meta-hash", kind: "open" },
        { text: "</meta-hash>", start: 22, end: 34, name: "meta-hash", kind: "close" },
        { text: "<meta-hash />", start: 45, end: 58, name: "meta-hash", kind: "self" },
        { text: "<meta-${core.tag}>", start: 69, end: 87, name: "meta-${core.tag}", kind: "open" },
        { text: "</meta-${core.tag}>", start: 87, end: 106, name: "meta-${core.tag}", kind: "close" },
      ])
    })
  })
  describe("атрибуты", () => {
    it("namespace", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<svg:use xlink:href="#id">', start: 0, end: 26, name: "svg:use", kind: "open" },
        { text: "</svg:use>", start: 26, end: 36, name: "svg:use", kind: "close" },
      ])
    })

    it("двойные/одинарные кавычки", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<a href="https://e.co" target="_blank">', start: 0, end: 39, name: "a", kind: "open" },
        { text: "x", start: 39, end: 40, name: "", kind: "text" },
        { text: "</a>", start: 40, end: 44, name: "a", kind: "close" },
      ])
    })

    it("угловые скобки внутри значения", () => {
      const mainHtml = extractMainHtmlBlock(({ html }) => html`<div title="a > b, c < d"></div>`)
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<div title="a > b, c < d">', start: 0, end: 26, name: "div", kind: "open" },
        { text: "</div>", start: 26, end: 32, name: "div", kind: "close" },
      ])
    })
    it("условие в атрибуте", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<div title="${context.flag ? "a > b" : "c < d"}">', start: 0, end: 49, name: "div", kind: "open" },
        { text: "</div>", start: 49, end: 55, name: "div", kind: "close" },
      ])
    })
    it("условие в аттрибуте без кавычек", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<div title=${context.flag ? "a > b" : "c < d"}></div>`
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<div title=${context.flag ? "a > b" : "c < d"}>', start: 0, end: 47, name: "div", kind: "open" },
        { text: "</div>", start: 47, end: 53, name: "div", kind: "close" },
      ])
    })
    it("условие в аттрибуте с одинарными кавычками", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        // prettier-ignore
        ({ html, context }) => html`<div title='${context.flag ? "a > b" : "c < d"}'></div>`
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<div title=\'${context.flag ? "a > b" : "c < d"}\'>', start: 0, end: 49, name: "div", kind: "open" },
        { text: "</div>", start: 49, end: 55, name: "div", kind: "close" },
      ])
    })
    it("булевые атрибуты", () => {
      const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
        ({ html, context }) => html`<button ${context.flag && "disabled"}></button>`
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: '<button ${context.flag && "disabled"}>', start: 0, end: 38, name: "button", kind: "open" },
        { text: "</button>", start: 38, end: 47, name: "button", kind: "close" },
      ])
    })
  })

  describe("внутри ${...}", () => {
    it("теги внутри условия", () => {
      const mainHtml = extractMainHtmlBlock(
        ({ html, context }) => html` <div>${context.cond ? html`<p>a</p>` : html`<span>b</span>`}</div> `
      )
      const elements = extractHtmlElements(mainHtml)

      expect(elements).toEqual([
        { text: "<div>", start: 1, end: 6, name: "div", kind: "open" },
        { text: "<p>", start: 28, end: 31, name: "p", kind: "open" },
        { text: "a", start: 31, end: 32, name: "", kind: "text" },
        { text: "</p>", start: 32, end: 36, name: "p", kind: "close" },
        { text: "<span>", start: 45, end: 51, name: "span", kind: "open" },
        { text: "b", start: 51, end: 52, name: "", kind: "text" },
        { text: "</span>", start: 52, end: 59, name: "span", kind: "close" },
        { text: "</div>", start: 61, end: 67, name: "div", kind: "close" },
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
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<ul>", start: 11, end: 15, name: "ul", kind: "open" },
        { text: "<li>", start: 62, end: 66, name: "li", kind: "open" },
        { text: "${name}", start: 66, end: 73, name: "", kind: "text" },
        { text: "</li>", start: 73, end: 78, name: "li", kind: "close" },
        { text: "</ul>", start: 92, end: 97, name: "ul", kind: "close" },
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
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<ul>", start: 11, end: 15, name: "ul", kind: "open" },
        { text: "<li>", start: 79, end: 83, name: "li", kind: "open" },
        { text: "${name}", start: 83, end: 90, name: "", kind: "text" },
        { text: "</li>", start: 90, end: 95, name: "li", kind: "close" },
        { text: "<br />", start: 112, end: 118, name: "br", kind: "self" },
        { text: "</ul>", start: 147, end: 152, name: "ul", kind: "close" },
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
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<ul>", start: 50, end: 54, name: "ul", kind: "open" },
        { text: "<li>", start: 117, end: 121, name: "li", kind: "open" },
        { text: "${title} ", start: 121, end: 130, name: "", kind: "text" },
        { text: "<em>", start: 155, end: 159, name: "em", kind: "open" },
        { text: "${n}", start: 159, end: 163, name: "", kind: "text" },
        { text: "</em>", start: 163, end: 168, name: "em", kind: "close" },
        { text: "</li>", start: 171, end: 176, name: "li", kind: "close" },
        { text: "</ul>", start: 196, end: 201, name: "ul", kind: "close" },
        { text: "<div>", start: 225, end: 230, name: "div", kind: "open" },
        { text: "x", start: 230, end: 231, name: "", kind: "text" },
        { text: "</div>", start: 231, end: 237, name: "div", kind: "close" },
      ])
    })

    it("condition в тексте", () => {
      const mainHtml = extractMainHtmlBlock<{ show: boolean; name: string }>(
        ({ html, context }) => html`
          <div>${context.show ? html`<p>Visible: ${context.name}</p>` : html`<p>Hidden</p>`}</div>
        `
      )
      const elements = extractHtmlElements(mainHtml)
      expect(elements).toEqual([
        { text: "<div>", start: 11, end: 16, name: "div", kind: "open" },
        { text: "<p>", start: 38, end: 41, name: "p", kind: "open" },
        { text: "Visible: ${context.name}", start: 41, end: 65, name: "", kind: "text" },
        { text: "</p>", start: 65, end: 69, name: "p", kind: "close" },
        { text: "<p>", start: 78, end: 81, name: "p", kind: "open" },
        { text: "Hidden", start: 81, end: 87, name: "", kind: "text" },
        { text: "</p>", start: 87, end: 91, name: "p", kind: "close" },
        { text: "</div>", start: 93, end: 99, name: "div", kind: "close" },
      ])
    })
  })

  describe("восстановление минифицированных булевых значений", () => {
    it("восстанавливает !0 в true", () => {
      const mainHtml = extractMainHtmlBlock<{ active: boolean }>(
        ({ html, update }) => html`<button onclick=${() => update({ active: true })}>Click</button>`
      )
      expect(mainHtml).toContain("active: true")
      expect(mainHtml).not.toContain("active: !0")
    })

    it("восстанавливает !1 в false", () => {
      const mainHtml = extractMainHtmlBlock<{ disabled: boolean }>(
        ({ html, update }) => html`<button onclick=${() => update({ disabled: false })}>Click</button>`
      )
      expect(mainHtml).toContain("disabled: false")
      expect(mainHtml).not.toContain("disabled: !1")
    })

    it("восстанавливает множественные булевые значения", () => {
      const mainHtml = extractMainHtmlBlock<{ active: boolean; disabled: boolean; visible: boolean }>(
        ({ html, update }) =>
          html`<button onclick=${() => update({ active: true, disabled: false, visible: true })}>Click</button>`
      )
      expect(mainHtml).toContain("active: true")
      expect(mainHtml).toContain("disabled: false")
      expect(mainHtml).toContain("visible: true")
      expect(mainHtml).not.toContain("!0")
      expect(mainHtml).not.toContain("!1")
    })

    it("восстанавливает булевые значения в сложных выражениях", () => {
      const mainHtml = extractMainHtmlBlock<{ count: number; active: boolean; flag: boolean }, { count: number }>(
        ({ html, update, context }) =>
          html`<button onclick=${() => update({ count: context.count + 1, active: true, flag: false })}>Click</button>`
      )
      expect(mainHtml).toContain("active: true")
      expect(mainHtml).toContain("flag: false")
      expect(mainHtml).not.toContain("!0")
      expect(mainHtml).not.toContain("!1")
    })

    it("не изменяет другие части выражения", () => {
      const mainHtml = extractMainHtmlBlock<{ name: string; age: number; active: boolean }>(
        ({ html, update }) =>
          html`<button onclick=${() => update({ name: "John", age: 25, active: true })}>Click</button>`
      )
      expect(mainHtml).toContain('name: "John"')
      expect(mainHtml).toContain("age: 25")
      expect(mainHtml).toContain("active: true")
      expect(mainHtml).not.toContain("!0")
    })
  })
})
