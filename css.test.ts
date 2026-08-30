import {describe, expect, test} from "bun:test"
import {css} from "./css.ts"
import {getCssTemplateShape, parseCssTemplateShape} from "./css-shape.ts"

describe("scoped css tagged template", () => {
  test("caches one parsed shape by exact TemplateStringsArray identity", () => {
    const render = (color: string, offset: number) => css`
      & {
        color: ${color};
        transform: translateX(${offset}px);
      }
      &:hover { background: var(--hover-color, rgb(1 2 3)); }
    `
    const first = render("red", 4)
    const second = render("blue", 8)
    const firstShape = getCssTemplateShape(first.strings)
    const secondShape = getCssTemplateShape(second.strings)

    expect(first.strings).toBe(second.strings)
    expect(firstShape).toBe(secondShape)
    expect(first.values).toEqual(["red", 4])
    expect(second.values).toEqual(["blue", 8])
    expect(Object.isFrozen(first.values)).toBe(true)
    expect(firstShape.rules).toHaveLength(2)
    expect(firstShape.rules[0]).toMatchObject({
      pseudo: "",
      declarations: [
        {property: "color"},
        {property: "transform"},
      ],
    })
    expect(firstShape.rules[0]!.declarations[0]!.segments).toEqual([
      {type: "slot", index: 0},
    ])
    expect(firstShape.rules[0]!.declarations[1]!.segments).toEqual([
      {type: "static", value: "translateX("},
      {type: "slot", index: 1},
      {type: "static", value: "px)"},
    ])
    expect(firstShape.rules[1]!.declarations[0]!.segments).toEqual([
      {type: "static", value: "var(--hover-color, rgb(1 2 3))"},
    ])
  })

  test("preserves cooked strings and parses comments without String.raw", () => {
    const result = css`& { content: "line\nvalue"; /* owner */ color: red; }`
    const shape = getCssTemplateShape(result.strings)
    expect(result.strings[0]).toContain("line\nvalue")
    expect(shape.rules[0]!.declarations.map(({property}) => property)).toEqual(["content", "color"])
  })

  test("fails raw generic runtime consumption with a precise error", () => {
    const result = css`& { color: red; }`
    expect(() => Object.entries(result)).toThrow("generic runtime style binding")
  })

  test("fails closed outside declaration values and outside the scoped selector profile", () => {
    expect(() => css`${"&"} { color: red; }`).toThrow("must start with &")
    expect(() => css`& { ${"color"}: red; }`).toThrow("property names cannot contain interpolations")
    expect(() => css`& { color: red; } ${"bad"}`).toThrow("CSS rule fragments require")
    expect(() => css`:root { color: red; }`).toThrow("must start with &")
    expect(() => css`& > span { color: red; }`).toThrow("Unsupported component CSS selector")
    expect(() => css`& { color: red; &:hover { color: blue; } }`).toThrow("Nested")
    expect(() => css`@media (width > 1px) { color: red; }`).toThrow("must start with &")
  })

  test("admits nested css/conditional rule fragments but rejects raw strings and arrays", () => {
    const nested = css`&[data-size="large"]:hover { color: red; }`
    const result = css`
      & { display: block; }
      ${false}
      ${nested}
      ${undefined}
    `

    expect(result.values).toEqual([false, nested, undefined])
    const shape = getCssTemplateShape(result.strings)
    expect(shape.fragmentSlots).toEqual([0, 1, 2])
    expect(shape.items.map(item => item.type)).toEqual(["rule", "fragment", "fragment", "fragment"])
    expect(getCssTemplateShape(nested.strings).rules[0]?.pseudo)
      .toBe('[data-size="large"]:hover')
    expect(() => css`& { display: block; } ${"color: red"}`).toThrow("CSS rule fragments require")
    expect(() => css`& { display: block; } ${[nested] as never}`).toThrow("CSS rule fragments require")
  })

  test("rejects invalid values and malformed static source", () => {
    expect(() => css`& { color: ${{bad: true} as never}; }`).toThrow("finite primitive")
    expect(() => css`& { color: red`).toThrow("closing brace")
    expect(() => parseCssTemplateShape(["& { color: red; "])).toThrow("closing brace")
  })
})
