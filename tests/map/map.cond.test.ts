import { describe, it, expect, beforeAll } from "bun:test"
import { extractMainHtmlBlock, extractHtmlElements } from "../../parser"
import { enrichWithData } from "../../data"
import type { Node } from "../../index.t"
import type { PartAttrs } from "../../attributes.t"

describe("map с условиями", () => {
  describe("map соседствующий с map в условии на верхнем уровне", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<Context, Core>(
        ({ html, context, core }) => html`
          ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
          ${context.flag
            ? html`<div class="conditional">
                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
              </div>`
            : html`<div class="fallback">No items</div>`}
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          type: "map",
          text: "core.list1.map(({ title })",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: { type: "static", value: "item1" },
              },
              child: [
                {
                  type: "text",
                  text: "${title}",
                },
              ],
            },
          ],
        },
        {
          type: "cond",
          text: "context.flag",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: { type: "static", value: "conditional" },
              },
              child: [
                {
                  type: "map",
                  text: "core.list2.map(({ title })",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: { type: "static", value: "item2" },
                      },
                      child: [
                        {
                          type: "text",
                          text: "${title}",
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
              string: {
                class: { type: "static", value: "fallback" },
              },
              child: [
                {
                  type: "text",
                  text: "No items",
                },
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          type: "map",
          data: "/core/list1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "item1",
              },
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
        {
          type: "cond",
          data: "/context/flag",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "conditional",
              },
              child: [
                {
                  type: "map",
                  data: "/core/list2",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "item2",
                      },
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
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
              string: {
                class: "fallback",
              },
              child: [
                {
                  type: "text",
                  value: "No items",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map соседствующий с map в условии внутри элемента", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<Context, Core>(
        ({ html, context, core }) => html`
          <div class="container">
            ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
            ${context.flag
              ? html`<div class="conditional">
                  ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                </div>`
              : html`<div class="fallback">No items</div>`}
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })
    it("attributes", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              type: "static",
              value: "container",
            },
          },
          child: [
            {
              type: "map",
              text: "core.list1.map(({ title })",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "item1",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      text: "${title}",
                    },
                  ],
                },
              ],
            },
            {
              type: "cond",
              text: "context.flag",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "conditional",
                    },
                  },
                  child: [
                    {
                      type: "map",
                      text: "core.list2.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "item2",
                            },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
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
                  string: {
                    class: {
                      type: "static",
                      value: "fallback",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      text: "No items",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })

    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/core/list1",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                  ],
                  string: {
                    class: "item1",
                  },
                },
              ],
            },
            {
              type: "cond",
              data: "/context/flag",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "/core/list2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item2",
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    class: "conditional",
                  },
                },
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "No items",
                    },
                  ],
                  string: {
                    class: "fallback",
                  },
                },
              ],
            },
          ],
          string: {
            class: "container",
          },
        },
      ])
    })
  })

  describe("map соседствующий с map в условии на глубоком уровне вложенности", () => {
    type Context = {
      flag: boolean
      deepFlag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<Context, Core>(
        ({ html, context, core }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
                ${context.flag
                  ? html`<div class="conditional">
                      ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                      ${context.deepFlag
                        ? html`<div class="deep-conditional">
                            ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
                          </div>`
                        : html`<div class="deep-fallback">No deep items</div>`}
                    </div>`
                  : html`<div class="fallback">No items</div>`}
              </div>
            </div>
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              type: "static",
              value: "level1",
            },
          },
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: {
                  type: "static",
                  value: "level2",
                },
              },
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: {
                      type: "static",
                      value: "level3",
                    },
                  },
                  child: [
                    {
                      type: "map",
                      text: "core.list1.map(({ title })",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "item1",
                            },
                          },
                          child: [
                            {
                              type: "text",
                              text: "${title}",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "cond",
                      text: "context.flag",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: {
                              type: "static",
                              value: "conditional",
                            },
                          },
                          child: [
                            {
                              type: "map",
                              text: "core.list2.map(({ title })",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  string: {
                                    class: {
                                      type: "static",
                                      value: "item2",
                                    },
                                  },
                                  child: [
                                    {
                                      type: "text",
                                      text: "${title}",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "cond",
                              text: "context.deepFlag",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  string: {
                                    class: {
                                      type: "static",
                                      value: "deep-conditional",
                                    },
                                  },
                                  child: [
                                    {
                                      type: "map",
                                      text: "core.list3.map(({ title })",
                                      child: [
                                        {
                                          tag: "div",
                                          type: "el",
                                          string: {
                                            class: {
                                              type: "static",
                                              value: "item3",
                                            },
                                          },
                                          child: [
                                            {
                                              type: "text",
                                              text: "${title}",
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
                                  string: {
                                    class: {
                                      type: "static",
                                      value: "deep-fallback",
                                    },
                                  },
                                  child: [
                                    {
                                      type: "text",
                                      text: "No deep items",
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
                          string: {
                            class: {
                              type: "static",
                              value: "fallback",
                            },
                          },
                          child: [
                            {
                              type: "text",
                              text: "No items",
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

  describe("map внутри condition", () => {
    let elements: PartAttrs
    let data: Node[]

    beforeAll(() => {
      const mainHtml = extractMainHtmlBlock<{ show: boolean }, { items: string[] }>(
        ({ html, core, context }) => html`
          <div>
            ${context.show
              ? html` ${core.items.map((item) => html`<div class="true-${item}"></div>`)}`
              : html` ${core.items.map((item) => html`<div class="false-${item}"></div>`)}`}
          </div>
        `
      )
      elements = extractHtmlElements(mainHtml)
    })

    it("hierarchy", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              text: "context.show",
              child: [
                {
                  type: "map",
                  text: "core.items.map((item)",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          type: "mixed",
                          value: "true-${item}",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "map",
                  text: "core.items.map((item)",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          type: "mixed",
                          value: "false-${item}",
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
    it.skip("data", () => {
      beforeAll(() => {
        data = enrichWithData(elements)
      })
      expect(data).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/context/show",
              child: [
                {
                  type: "map",
                  data: "/core/items",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          data: "[item]",
                          expr: "true-${[0]}",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "map",
                  data: "/core/items",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          data: "[item]",
                          expr: "false-${[0]}",
                        },
                      },
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
