import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map с условиями", () => {
  describe("map соседствующий с map в условии на верхнем уровне", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
        ({ html, context, core }) => html`
          ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
          ${context.flag
            ? html`<div class="conditional">
                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
              </div>`
            : html`<div class="fallback">No items</div>`}
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
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
    })
    it("data", () => {
      expect(elements).toEqual([
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
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
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
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
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
                            {
                              type: "cond",
                              data: "/context/deepFlag",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  child: [
                                    {
                                      type: "map",
                                      data: "/core/list3",
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
                                            class: "item3",
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                  string: {
                                    class: "deep-conditional",
                                  },
                                },
                                {
                                  tag: "div",
                                  type: "el",
                                  child: [
                                    {
                                      type: "text",
                                      value: "No deep items",
                                    },
                                  ],
                                  string: {
                                    class: "deep-fallback",
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
                    class: "level3",
                  },
                },
              ],
              string: {
                class: "level2",
              },
            },
          ],
          string: {
            class: "level1",
          },
        },
      ])
    })
  })

  describe("map внутри condition", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ show: boolean }, { items: string[] }>(
        ({ html, core, context }) => html`
          <div>
            ${context.show
              ? html` ${core.items.map((item) => html`<div class="true-${item}"></div>`)}`
              : html` ${core.items.map((item) => html`<div class="false-${item}"></div>`)}`}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
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
                          expr: "true-${_[0]}",
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
                          expr: "false-${_[0]}",
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
