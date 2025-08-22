import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"
import { enrichHierarchyWithData } from "../data"

describe("атрибуты", () => {
  it("namespace", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<svg:use xlink:href="#id">', index: 0, name: "svg:use", kind: "open" },
      { text: "</svg:use>", index: 26, name: "svg:use", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "svg:use",
        type: "el",
        text: '<svg:use xlink:href="#id">',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "svg:use",
        type: "el",
        attr: {
          href: {
            value: "#id",
          },
          xlink: {
            value: "",
          },
        },
      },
    ])
  })

  it("двойные/одинарные кавычки", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<a href="https://e.co" target="_blank">', index: 0, name: "a", kind: "open" },
      { text: "x", index: 39, name: "", kind: "text" },
      { text: "</a>", index: 40, name: "a", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "a",
        type: "el",
        text: '<a href="https://e.co" target="_blank">',
        child: [
          {
            type: "text",
            text: "x",
          },
        ],
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "a",
        type: "el",
        attr: {
          href: {
            value: "https://e.co",
          },
          target: {
            value: "_blank",
          },
        },
        child: [
          {
            type: "text",
            value: "x",
          },
        ],
      },
    ])
  })

  it("угловые скобки внутри значения", () => {
    const mainHtml = extractMainHtmlBlock(({ html }) => html`<div title="a > b, c < d"></div>`)
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<div title="a > b, c < d">', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 26, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        text: '<div title="a > b, c < d">',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        attr: {
          title: {
            value: "a > b, c < d",
          },
        },
      },
    ])
  })
  it("условие в атрибуте", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<div title="${context.flag ? "a > b" : "c < d"}">', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 49, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        text: '<div title="${context.flag ? "a > b" : "c < d"}">',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        attr: {
          title: {
            value: "${context.flag ? ",
          },
          a: {
            value: "",
          },
          b: {
            value: "",
          },
          c: {
            value: "",
          },
          d: {
            value: "",
          },
        },
      },
    ])
  })
  it("условие в аттрибуте без кавычек", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      ({ html, context }) => html`<div title=${context.flag ? "a > b" : "c < d"}></div>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<div title=${context.flag ? "a > b" : "c < d"}>', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 47, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        text: '<div title=${context.flag ? "a > b" : "c < d"}>',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        attr: {
          a: {
            value: "",
          },
          b: {
            value: "",
          },
          c: {
            value: "",
          },
          context: {
            value: "",
          },
          d: {
            value: "",
          },
          flag: {
            value: "",
          },
        },
      },
    ])
  })
  it("условие в аттрибуте с одинарными кавычками", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      // prettier-ignore
      ({ html, context }) => html`<div title='${context.flag ? "a > b" : "c < d"}'></div>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<div title=\'${context.flag ? "a > b" : "c < d"}\'>', index: 0, name: "div", kind: "open" },
      { text: "</div>", index: 49, name: "div", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        text: '<div title=\'${context.flag ? "a > b" : "c < d"}\'>',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        attr: {
          title: {
            value: '${context.flag ? "a > b" : "c < d"}',
          },
        },
      },
    ])
  })
  it("булевые атрибуты", () => {
    const mainHtml = extractMainHtmlBlock<{ flag: boolean }>(
      ({ html, context }) => html`<button ${context.flag && "disabled"}></button>`
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: '<button ${context.flag && "disabled"}>', index: 0, name: "button", kind: "open" },
      { text: "</button>", index: 38, name: "button", kind: "close" },
    ])
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "button",
        type: "el",
        text: '<button ${context.flag && "disabled"}>',
      },
    ])
    const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
    expect(enrichedHierarchy).toEqual([
      {
        tag: "button",
        type: "el",
        attr: {
          context: {
            value: "",
          },
          disabled: {
            value: "",
          },
          flag: {
            value: "",
          },
        },
      },
    ])
  })
})
