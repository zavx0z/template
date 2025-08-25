import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe.each([
  ["rect", '<area shape="rect"'],
  ["poly", '<area shape="poly"'],
])("coords для %s", (shape, tag) => {
  it("простые числа через запятую", () => {
    const attrs = parseAttributes(tag + ' coords="34,44,270,350">')
    expect(attrs).toEqual({
      array: {
        coords: {
          splitter: ",",
          values: [
            { type: "static", value: "34" },
            { type: "static", value: "44" },
            { type: "static", value: "270" },
            { type: "static", value: "350" },
          ],
        },
      },
      string: {
        shape: shape,
      },
    })
  })
  it("смешанные значения", () => {
    const attrs = parseAttributes(tag + ' coords="10, ${core.x}, 30, ${core.y}">')
    expect(attrs).toEqual({
      array: {
        coords: {
          splitter: ",",
          values: [
            { type: "static", value: "10" },
            { type: "dynamic", value: "core.x" },
            { type: "static", value: "30" },
            { type: "dynamic", value: "core.y" },
          ],
        },
      },
      string: {
        shape: shape,
      },
    })
  })
})
