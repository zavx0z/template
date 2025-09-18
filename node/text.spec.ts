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
    let elements: Node[]
    type Context = { a: number; b: number }

    beforeAll(() => {
      elements = parse<Context>(
        //#region mathematical
        ({ html, context }) => html`<p>${context.a + context.b * 2}</p>`
        //#endregion mathematical
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectMathematical
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/context/a", "/context/b"],
                expr: "${_[0] + _[1] * 2}",
              },
            ],
          },
        ]
        //#endregion expectMathematical
      )
    })
  })

  describe("тернарный", () => {
    let elements: Node[]
    type Context = { flag: boolean }

    beforeAll(() => {
      elements = parse<Context>(
        //#region ternary
        ({ html, context }) => html`<p>${context.flag ? "Yes" : "No"}</p>`
        //#endregion ternary
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectTernary
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/flag",
                expr: '${_[0] ? "Yes" : "No"}',
              },
            ],
          },
        ]
        //#endregion expectTernary
      )
    })
  })

  describe("тернарный литерал", () => {
    let elements: Node[]
    type Context = { name: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region ternaryLiteral
        ({ html, context }) => html`<p>${context.name ? `Hi, ${context.name}!` : ""}</p>`
        //#endregion ternaryLiteral
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectTernaryLiteral
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/name",
                expr: '${_[0] ? `Hi, ${_[0]}!` : ""}',
              },
            ],
          },
        ]
        //#endregion expectTernaryLiteral
      )
    })
  })

  describe("логический", () => {
    let elements: Node[]
    type Context = { isOpen: boolean }

    beforeAll(() => {
      elements = parse<Context>(
        //#region logical
        ({ html, context }) => html`<p class=${context.isOpen && "open"}>${context.isOpen && "Open"}</p>`
        //#endregion logical
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectLogical
        [
          {
            tag: "p",
            type: "el",
            string: {
              class: {
                data: "/context/isOpen",
                expr: '${_[0] && "open"}',
              },
            },
            child: [
              {
                type: "text",
                data: "/context/isOpen",
                expr: '${_[0] && "Open"}',
              },
            ],
          },
        ]
        //#endregion expectLogical
      )
    })
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
  describe("методы", () => {
    let elements: Node[]
    type Context = { name: string; email: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region methods
        ({ html, context }) => html`<p>${context.name.toUpperCase()} - ${context.email.toLowerCase()}</p>`
        //#endregion methods
      )
    })

    it("data", () => {
      expect(elements).toEqual(
        //#region expectMethods
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/context/name/toUpperCase", "/context/email/toLowerCase"],
                expr: "${_[0]()} - ${_[1]()}",
              },
            ],
          },
        ]
        //#endregion expectMethods
      )
    })
  })
})
