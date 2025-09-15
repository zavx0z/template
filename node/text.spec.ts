import { parse, type Node } from "../index"
import { describe, expect, beforeAll, it } from "bun:test"

describe("text", () => {
  describe("статический", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(
        // #region static
        ({ html }) => html`Static text`
        // #endregion static
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectStatic
        [{ type: "text", value: "Static text" }]
        // #endregion expectStatic
      )
    })
  })
  describe("динамический", () => {
    let elements: Node[]
    type Context = { dynamic: string }
    beforeAll(() => {
      elements = parse<Context>(
        // #region dynamic
        ({ html, context }) => html`<p>${context.dynamic}</p>`
        // #endregion dynamic
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectDynamic
        [
          {
            tag: "p",
            type: "el",
            child: [{ type: "text", data: "/context/dynamic" }],
          },
        ]
        // #endregion expectDynamic
      )
    })
  })
  describe("смешанный", () => {
    let elements: Node[]
    type Context = { family: string; name: string }
    beforeAll(() => {
      elements = parse<Context>(
        // #region mixed
        ({ html, context }) => html`<p>Hello, ${context.family} ${context.name}!</p>`
        // #endregion mixed
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectMixed
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/context/family", "/context/name"],
                expr: "Hello, ${_[0]} ${_[1]}!",
              },
            ],
          },
        ]
        // #endregion expectMixed
      )
    })
  })
  describe("математический", () => {
    //#region mathematical
    //#endregion mathematical
    //#region expectMathematical
    //#endregion expectMathematical
  })
  describe("методы", () => {
    //#region methods
    //#endregion methods
    //#region expectMethods
    //#endregion expectMethods
  })
  describe("тернарный", () => {
    //#region ternary
    //#endregion ternary
    //#region expectTernary
    //#endregion expectTernary
  })
  describe("тернарный литерал", () => {
    //#region ternaryLiteral
    //#endregion ternaryLiteral
    //#region expectTernaryLiteral
    //#endregion expectTernaryLiteral
  })
  describe("логический", () => {
    //#region logical
    //#endregion logical
    //#region expectLogical
    //#endregion expectLogical
  })
  describe("логический литерал", () => {
    let elements: Node[]
    type Context = { last: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region logicalLiteral
        ({ html, context }) => html` <p>${context.last && `last: ${context.last}`}</p>`
        //#endregion logicalLiteral
      )
    })
    it("expr", () => {
      expect(elements).toEqual(
        // #region expectLogicalLiteral
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/last",
                expr: "${_[0] && `last: ${_[0]}`}",
              },
            ],
          },
        ]
        // #endregion expectLogicalLiteral
      )
    })
  })
})
