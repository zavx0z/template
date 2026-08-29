import {afterAll, beforeAll, describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {JsxCompileError} from "./errors.ts"
import {JsxCompilerSession} from "./session.ts"

const fixtureRoot = resolve(import.meta.dir, "test-fixture")
const session = new JsxCompilerSession({cwd: fixtureRoot, sourceRoots: [fixtureRoot]})

beforeAll(() => session.prepareFiles([
  resolve(fixtureRoot, "static-style.tsx"),
  resolve(fixtureRoot, "style-precedence.tsx"),
  resolve(fixtureRoot, "style-dynamic-pseudo.tsx"),
  resolve(fixtureRoot, "style-object-spread.tsx"),
  resolve(fixtureRoot, "style-array-spread.tsx"),
  resolve(fixtureRoot, "style-computed-key.tsx"),
]))
afterAll(() => session.close())

describe("Template static style compiler", () => {
  test("extracts component-local static styles and pseudos into compiled metadata", async () => {
    const code = await compiled("static-style.tsx")
    expect(code).toContain("styleSheets: [{id:")
    expect(code).toContain("@zavx0z/template/style/")
    expect(code).toContain("data-z-")
    expect(code).toContain(":hover{")
    expect(code).toContain(":active{")
    expect(code).toContain(":focus{")
    expect(code).toContain(":disabled{")
    expect(code).toContain("String(color(regular.inner))")
    expect(code).toContain("Boolean(props.selected)")
    expect(code).toContain("Boolean(!showLabel)")
    expect(code).toContain("[{opacity: props.opacity}, props.style]")
    expect(code.match(/BindStyle\(__zComp0Node/g)).toHaveLength(1)
    expect(code).not.toContain("defineStyles")
    expect(code).not.toContain('":hover": {')

    const styleSheetIds = [...code.matchAll(/\{id: "([^"]+)"/g)].map(match => match[1]!)
    expect(styleSheetIds).toHaveLength(8)
    expect(new Set(styleSheetIds).size).toBe(styleSheetIds.length)
    const iconMarkers = [...code.matchAll(/cssText: "\[(data-z-[a-f0-9]+)\]\{width:/g)]
      .map(match => match[1]!)
    const hiddenMarkers = [...code.matchAll(/cssText: "\[(data-z-[a-f0-9]+)\]\{display:" \+ "none\}"/g)]
      .map(match => match[1]!)
    expect(iconMarkers).toHaveLength(2)
    expect(hiddenMarkers).toHaveLength(3)
    expect(new Set(iconMarkers).size).toBe(iconMarkers.length)
    expect(new Set(hiddenMarkers).size).toBe(hiddenMarkers.length)
  })

  test("emits deterministic metadata for an unchanged source", async () => {
    const first = await compiled("static-style.tsx")
    const second = await compiled("static-style.tsx")
    expect(second).toBe(first)
  })

  test("preserves owner fragment order and leaves caller precedence in the inline channel", async () => {
    const code = await compiled("style-precedence.tsx")
    const baseRule = code.search(/cssText: "\[data-z-[a-f0-9]+\]\{display:" \+ "inline;color:"/)
    const hiddenRule = code.search(/cssText: "\[data-z-[a-f0-9]+\]\{display:" \+ "none\}"/)
    expect(baseRule).toBeGreaterThan(-1)
    expect(hiddenRule).toBeGreaterThan(baseRule)
    expect(code).toMatch(/setAttribute\("data-z-[a-f0-9]+", ""\)/)
    expect(code).toMatch(/BindProperty\(__zComp0Node0, "data-z-[a-f0-9]+"\), __zComp0BindStyle\(__zComp0Node0\)/)
    expect(code).toContain("Boolean(props.hidden)")
    expect(code).toContain("__zComp0Write(__zComp0Values, 1, [props.style])")
  })

  test("fails closed for dynamic pseudos, style spreads and computed keys", async () => {
    const cases = [
      ["style-dynamic-pseudo.tsx", "cannot depend on props or component state"],
      ["style-object-spread.tsx", "style objects cannot contain spreads"],
      ["style-array-spread.tsx", "style arrays cannot contain spreads"],
      ["style-computed-key.tsx", "computed property names"],
    ] as const
    for (const [file, message] of cases) {
      try {
        await compiled(file)
        throw new Error(`${file} unexpectedly compiled`)
      } catch (error) {
        expect(error).toBeInstanceOf(JsxCompileError)
        expect((error as Error).message).toContain(message)
      }
    }
  })
})

async function compiled(file: string): Promise<string> {
  return session.transformFile(resolve(fixtureRoot, file))
}
