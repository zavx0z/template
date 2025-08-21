import { describe, it, expect } from "bun:test"
import { extractHtmlElements, extractMainHtmlBlock } from "../splitter"
import { elementsHierarchy } from "../hierarchy"

describe("text", () => {
  it("пустой элемент без текста", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <div>
          <p></p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([{ tag: "div", type: "el", child: [{ tag: "p", type: "el" }] }])
  })
  it("динамический текст в map где значением является строка элемент массива", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.list.map((name) => html`<li>${name}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
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

  it("динамический текст с разными именами переменных элемента массива", () => {
    const mainHtml = extractMainHtmlBlock<{ items: string[] }>(
      ({ html, context }) => html`
        <ul>
          ${context.items.map((item) => html`<li>${item}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "ul",
        type: "el",
        child: [
          {
            type: "map",
            data: "/context/items",
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

  it("динамический текст с core, где значением является строка элемент массива", () => {
    const mainHtml = extractMainHtmlBlock<any, { titles: string[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.titles.map((title) => html`<li>${title}</li>`)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "ul",
        type: "el",
        child: [
          {
            type: "map",
            data: "/core/titles",
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

  it("статический текст", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <div>
          <p>static</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                value: "static",
              },
            ],
          },
        ],
      },
    ])
  })

  it("смешанный текст - статический + динамический (с одной переменной)", () => {
    const mainHtml = extractMainHtmlBlock<{ name: string }>(
      ({ html, context }) => html`
        <div>
          <p>Hello, ${context.name}!</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/name",
                expr: "Hello, ${0}!",
              },
            ],
          },
        ],
      },
    ])
  })
  it("смешанный текст - статический + динамический (с несколькими переменными)", () => {
    const mainHtml = extractMainHtmlBlock<{ family: string; name: string }>(
      ({ html, context }) => html`
        <div>
          <p>Hello, ${context.family} ${context.name}!</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/context/family", "/context/name"],
                expr: "Hello, ${0} ${1}!",
              },
            ],
          },
        ],
      },
    ])
  })
  it("условие в тексте", () => {
    const mainHtml = extractMainHtmlBlock<{ show: boolean; name: string }>(
      ({ html, context }) => html`
        <div>
          <p>${context.show ? "Visible" : "Hidden"}</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/show",
                expr: "${0} ? 'Visible' : 'Hidden'",
              },
            ],
          },
        ],
      },
    ])
  })
  it("map в тексте, рядом с динамическим текстом из map выше уровня", () => {
    const mainHtml = extractMainHtmlBlock<any, { list: { title: string; nested: string[] }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.list.map(({ title, nested }) => html` <li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li> `)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    expect(elements).toEqual([
      { text: "<ul>", index: 9, name: "ul", kind: "open" },
      { text: "<li>", index: 69, name: "li", kind: "open" },
      { text: "${title} ", index: 73, name: "", kind: "text" },
      { text: "<em>", index: 107, name: "em", kind: "open" },
      { text: "${n}", index: 111, name: "", kind: "text" },
      { text: "</em>", index: 115, name: "em", kind: "close" },
      { text: "</li>", index: 123, name: "li", kind: "close" },
      { text: "</ul>", index: 141, name: "ul", kind: "close" },
    ])
  })
  it("динамический текст в условии", () => {
    const mainHtml = extractMainHtmlBlock<{ show: boolean; name: string }>(
      ({ html, context }) => html`
        <div>${context.show ? html`<p>Visible: ${context.name}</p>` : html`<p>Hidden</p>`}</div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "cond",
            data: "/context/show",
            true: {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/context/name",
                  expr: "Visible: ${0}",
                },
              ],
            },
            false: {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Hidden",
                },
              ],
            },
          },
        ],
      },
    ])
  })

  it("статический текст в элементе на одном уровне с динамическим текстом", () => {
    const mainHtml = extractMainHtmlBlock(({ html, context }) => html`<div><b>Hello, </b>${context.name}</div>`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "b",
            type: "el",
            child: [
              {
                type: "text",
                value: "Hello, ",
              },
            ],
          },
          {
            type: "text",
            data: "/context/name",
          },
        ],
      },
    ])
  })

  it("динамический текст со статическим текстом в элементе на одном уровне", () => {
    const mainHtml = extractMainHtmlBlock(({ html, context }) => html`<div>${context.name}<b>-hello</b></div>`)
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "text",
            data: "/context/name",
          },
          {
            tag: "b",
            type: "el",
            child: [
              {
                type: "text",
                value: "-hello",
              },
            ],
          },
        ],
      },
    ])
  })

  it("динамические тексты вокруг статического текста", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html, context }) => html`<div>${context.family} <b>-hello</b>${context.name}</div>`
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            type: "text",
            data: "/context/family",
          },
          {
            tag: "b",
            type: "el",
            child: [
              {
                type: "text",
                value: "-hello",
              },
            ],
          },
          {
            type: "text",
            data: "/context/name",
          },
        ],
      },
    ])
  })

  it("динамический текст в map с доступом по ключу в элементе массива, на разных уровнях", () => {
    const mainHtml = extractMainHtmlBlock<any, { users: { name: string; role: string }[] }>(
      ({ html, core }) => html`
        <ul>
          ${core.users.map((user) => html` <li><strong>${user.name}</strong> - ${user.role}</li> `)}
        </ul>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "ul",
        type: "el",
        child: [
          {
            type: "map",
            data: "/core/users",
            child: [
              {
                tag: "li",
                type: "el",
                child: [
                  {
                    tag: "strong",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: "[item]/name",
                      },
                    ],
                  },
                  {
                    type: "text",
                    data: "[item]/role",
                    expr: " - ${0}",
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })

  it("обрабатывает выражения в ${}", () => {
    const mainHtml = extractMainHtmlBlock<{ list: string[] }>(
      ({ html, context }) => html`
        <div>
          <p>${context.list.map((item) => item.toUpperCase())}</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    // Сложные выражения не должны создавать текстовые узлы
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/context/list",
                expr: "${0}.map(item => item.toUpperCase())",
              },
            ],
          },
        ],
      },
    ])
  })

  it("обрабатывает выражения с точками в ${} к вложенным элементам ядра", () => {
    const mainHtml = extractMainHtmlBlock<any, { user: { name: string } }>(
      ({ html, core }) => html`
        <div>
          <p>${core.user.name}</p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    // Выражения с точками не должны создавать текстовые узлы
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/core/user/name",
              },
            ],
          },
        ],
      },
    ])
  })

  it.todo("обрабатывает текст с переносами строк", () => {
    const mainHtml = extractMainHtmlBlock(
      ({ html }) => html`
        <div>
          <p>
            ${`Первая строка
            Вторая строка 
            Третья строка`}
          </p>
        </div>
      `
    )
    const elements = extractHtmlElements(mainHtml)
    const hierarchy = elementsHierarchy(mainHtml, elements)
    expect(hierarchy).toEqual([
      {
        tag: "div",
        type: "el",
        child: [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                value: "Первая строка\nВторая строка\nТретья строка",
              },
            ],
          },
        ],
      },
    ])
  })
})
