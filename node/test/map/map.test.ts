import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map", () => {
  describe("простой map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, context }) => html`
          <ul>
            ${context.list.map((name) => html`<li>${name}</li>`)}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/context/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("простой map с несколькими детьми", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ list: string[] }>(
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
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/context/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
                {
                  tag: "br",
                  type: "el",
                },
              ],
            },
          ],
        },
      ])
    })
    describe("map в элементе вложенный в map", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<any, { list: { title: string; nested: string[] }[] }>(
          // prettier-ignore
          ({ html, core }) => html`
          <ul>
            ${core.list.map(
              ({ title, nested }) => html`
                <li>
                  <p>${title} </p>
                  ${nested.map((n) => html`<em>${n}</em>`)}
                </li>
              `
            )}
          </ul>
        `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/core/list",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        tag: "p",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            data: "[item]/title",
                          },
                        ],
                      },
                      {
                        type: "map",
                        data: "[item]/nested",
                        child: [
                          {
                            tag: "em",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: "[item]",
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
        ])
      })
    })
    describe("map рендерит вложенные шаблоны (последовательность name/kind)", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ list: string[] }>(
          ({ html, context }) => html`
            <ul>
              ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
            </ul>
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/context/list",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        type: "cond",
                        data: "[index]",
                        expr: "_[0] % 2",
                        child: [
                          {
                            tag: "em",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                value: "A",
                              },
                            ],
                          },
                          {
                            tag: "strong",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                value: "B",
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
        ])
      })
    })
    describe("map в условии", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
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
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            type: "cond",
            data: "/context/flag",
            child: [
              {
                tag: "ul",
                type: "el",
                child: [
                  {
                    type: "map",
                    data: "/core/list",
                    child: [
                      {
                        tag: "li",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            data: "[item]/title",
                          },
                          {
                            type: "map",
                            data: "[item]/nested",
                            child: [
                              {
                                tag: "em",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    data: "[item]",
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
              {
                tag: "div",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "x",
                  },
                ],
              },
            ],
          },
        ])
      })
    })
  })
  describe("map в text вложенный в map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { list: { title: string; nested: string[] }[] }>(
        ({ html, core }) => html`
          <ul>
            ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                    {
                      type: "map",
                      data: "[item]/nested",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]",
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
      ])
    })
  })
})
