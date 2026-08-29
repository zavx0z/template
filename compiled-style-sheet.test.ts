import {describe, expect, test} from "bun:test"
import {defineCompiledTemplate} from "./compiled.ts"

describe("compiled stylesheet ABI", () => {
  test("owns immutable deduplicated stylesheet metadata", () => {
    const source = {id: "button.root", cssText: "[data-z-button]{display:flex}"}
    const template = defineCompiledTemplate({
      bindingCount: 0,
      styleSheets: [source, {...source}],
      mount: () => ({nodes: [], bindings: []}),
      render() {}
    })

    source.cssText = "changed"
    expect(template.styleSheets).toEqual([
      {id: "button.root", cssText: "[data-z-button]{display:flex}"}
    ])
    expect(Object.isFrozen(template.styleSheets)).toBe(true)
    expect(Object.isFrozen(template.styleSheets[0])).toBe(true)
    expect(defineCompiledTemplate({
      bindingCount: 0,
      mount: () => ({nodes: [], bindings: []}),
      render() {}
    }).styleSheets).toEqual([])
  })

  test("fails closed for invalid and conflicting metadata", () => {
    expect(() => defineCompiledTemplate({
      bindingCount: 0,
      styleSheets: [{id: "", cssText: "a"}],
      mount: () => ({nodes: [], bindings: []}),
      render() {}
    })).toThrow("non-empty id")
    expect(() => defineCompiledTemplate({
      bindingCount: 0,
      styleSheets: [
        {id: "same", cssText: "a"},
        {id: "same", cssText: "b"}
      ],
      mount: () => ({nodes: [], bindings: []}),
      render() {}
    })).toThrow("conflicting cssText")
  })
})
