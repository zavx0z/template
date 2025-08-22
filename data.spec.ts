import { describe, it, expect } from "bun:test"
import {
  parseMapData,
  parseMapParams,
  parseConditionData,
  parseTextData,
  splitTextIntoParts,
  enrichHierarchyWithData,
} from "./data"

describe("data-parser", () => {
  describe("parseMapData", () => {
    it("парсит простой map с одним параметром", () => {
      const result = parseMapData("context.list.map((name) => html`")
      expect(result.path).toBe("/context/list")
      expect(result.metadata?.params).toEqual(["name"])
    })

    it("парсит map с деструктуризацией", () => {
      const result = parseMapData("core.data.map(({ title, nested }) => html`")
      expect(result.path).toBe("/core/data")
      expect(result.metadata?.params).toEqual(["title", "nested"])
    })

    it("парсит map с несколькими параметрами", () => {
      const result = parseMapData("items.map((item, index) => html`")
      expect(result.path).toBe("/items")
      expect(result.metadata?.params).toEqual(["item", "index"])
    })

    it("парсит вложенный map в контексте", () => {
      const context = { currentPath: "/core/list", pathStack: ["/core/list"], level: 1, mapParams: ["item"] }
      const result = parseMapData("nested.map((n) => html`", context)
      expect(result.path).toBe("[item]/nested")
      expect(result.metadata?.params).toEqual(["n"])
    })

    it("парсит вложенный map с полным путем", () => {
      const context = { currentPath: "/core/list", pathStack: ["/core/list"], level: 1, mapParams: ["item"] }
      const result = parseMapData("item.nested.map((n) => html`", context)
      expect(result.path).toBe("[item]/nested")
    })
  })

  describe("parseMapParams", () => {
    it("парсит простой параметр", () => {
      const params = parseMapParams("name")
      expect(params).toEqual(["name"])
    })

    it("парсит несколько параметров", () => {
      const params = parseMapParams("item, index")
      expect(params).toEqual(["item", "index"])
    })

    it("парсит деструктуризацию", () => {
      const params = parseMapParams("{ title, nested }")
      expect(params).toEqual(["title", "nested"])
    })

    it("парсит деструктуризацию с пробелами", () => {
      const params = parseMapParams("{ title , nested }")
      expect(params).toEqual(["title", "nested"])
    })

    it("возвращает пустой массив для пустых параметров", () => {
      const params = parseMapParams("")
      expect(params).toEqual([])
    })
  })

  describe("parseConditionData", () => {
    it("парсит простое условие", () => {
      const result = parseConditionData("context.flag")
      expect(result.path).toBe("/context/flag")
      expect(result.metadata?.expression).toBe("${0}")
    })

    it("парсит сложное условие", () => {
      const result = parseConditionData("context.cond && context.cond2")
      expect(result.path).toEqual(["/context/cond", "/context/cond2"])
      expect(result.metadata?.expression).toBe("${0} && ${1}")
    })

    it("парсит условие с операторами", () => {
      const result = parseConditionData("context.flag === context.cond2")
      expect(result.path).toEqual(["/context/flag", "/context/cond2"])
      expect(result.metadata?.expression).toBe("${0} === ${1}")
    })
  })

  describe("parseTextData", () => {
    it("парсит статический текст", () => {
      const result = parseTextData("Hello, world!")
      expect(result.value).toBe("Hello, world!")
      expect(result.data).toBeUndefined()
      expect(result.expr).toBeUndefined()
    })

    it("парсит текст с одной переменной", () => {
      const result = parseTextData("Hello, ${name}!")
      expect(result.data).toBe("/name")
      expect(result.expr).toBe("Hello, ${0}!")
      expect(result.value).toBeUndefined()
    })

    it("парсит текст с переменной в контексте map", () => {
      const context = { currentPath: "/context/list", pathStack: ["/context/list"], level: 1, mapParams: ["name"] }
      const result = parseTextData("Hello, ${name}!", context)
      expect(result.data).toBe("[item]")
      expect(result.expr).toBe("Hello, ${0}!")
      expect(result.value).toBeUndefined()
    })

    it("парсит текст с несколькими переменными", () => {
      const result = parseTextData("${title} - ${description}")
      expect(result.data).toEqual(["/title", "/description"])
      expect(result.expr).toBe("${0} - ${1}")
      expect(result.value).toBeUndefined()
    })
  })

  describe("splitTextIntoParts", () => {
    it("разбивает статический текст", () => {
      const parts = splitTextIntoParts("Hello, world!")
      expect(parts).toEqual([{ type: "static", text: "Hello, world!" }])
    })

    it("разбивает текст с одной переменной", () => {
      const parts = splitTextIntoParts("Hello, ${name}!")
      expect(parts).toEqual([
        { type: "static", text: "Hello, " },
        { type: "dynamic", text: "${name}" },
        { type: "static", text: "!" },
      ])
    })

    it("разбивает текст с несколькими переменными", () => {
      const parts = splitTextIntoParts("${title} - ${description}")
      expect(parts).toEqual([
        { type: "dynamic", text: "${title}" },
        { type: "static", text: " - " },
        { type: "dynamic", text: "${description}" },
      ])
    })

    it("разбивает текст с переменной в начале", () => {
      const parts = splitTextIntoParts("${name} is here")
      expect(parts).toEqual([
        { type: "dynamic", text: "${name}" },
        { type: "static", text: " is here" },
      ])
    })

    it("разбивает текст с переменной в конце", () => {
      const parts = splitTextIntoParts("Hello, ${name}")
      expect(parts).toEqual([
        { type: "static", text: "Hello, " },
        { type: "dynamic", text: "${name}" },
      ])
    })
  })

  describe("enrichHierarchyWithData", () => {
    it("обогащает простую иерархию", () => {
      const hierarchy = [
        {
          type: "el",
          tag: "div",
          text: '<div class="${className}">',
          child: [
            {
              type: "text",
              text: "Hello, ${name}!",
            },
          ],
        },
      ]

      const enriched = enrichHierarchyWithData(hierarchy)
      expect(enriched[0]?.type).toBe("el")
      const element = enriched[0] as any
      expect(element.child?.[0]?.type).toBe("text")
      expect(element.child?.[0]?.data).toBe("/name")
    })

    it("обогащает иерархию с map", () => {
      const hierarchy = [
        {
          type: "map",
          text: "context.list.map((name) => html`",
          child: [
            {
              type: "el",
              tag: "li",
              text: "<li>",
              child: [
                {
                  type: "text",
                  text: "${name}",
                },
              ],
            },
          ],
        },
      ]

      const enriched = enrichHierarchyWithData(hierarchy)
      expect(enriched[0]?.type).toBe("map")
      const mapNode = enriched[0] as any
      expect(mapNode.data).toBe("/context/list")
      expect(mapNode.child?.[0]?.child?.[0]?.data).toBe("[item]")
    })

    it("обогащает иерархию с условием", () => {
      const hierarchy = [
        {
          type: "cond",
          text: "context.flag",
          true: { type: "el", tag: "div", text: "<div>", child: [] },
          false: { type: "el", tag: "span", text: "<span>", child: [] },
        },
      ]

      const enriched = enrichHierarchyWithData(hierarchy)
      expect(enriched[0]?.type).toBe("cond")
      const condNode = enriched[0] as any
      expect(condNode.data).toBe("/context/flag")
      expect(condNode.expr).toBeUndefined()
    })
  })
})
