import {afterAll, beforeAll, describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {JsxCompileError} from "./errors.ts"
import {JsxCompilerSession} from "./session.ts"

const fixtureRoot = resolve(import.meta.dir, "test-fixture")
const session = new JsxCompilerSession({
  cwd: fixtureRoot,
  sourceRoots: [fixtureRoot],
  styleSourceRootIds: ["@fixture/styles"],
})

beforeAll(() => session.prepareFiles([
  resolve(fixtureRoot, "css-style.tsx"),
  resolve(fixtureRoot, "css-alias.tsx"),
  resolve(fixtureRoot, "css-dynamic-pseudo.tsx"),
  resolve(fixtureRoot, "css-fake-global.tsx"),
  resolve(fixtureRoot, "css-fake-branded-global.tsx"),
  resolve(fixtureRoot, "css-component-prop.tsx"),
  resolve(fixtureRoot, "css-component-pseudo.tsx"),
  resolve(fixtureRoot, "css-invalid-selector.tsx"),
  resolve(fixtureRoot, "css-shadow.tsx"),
]))
afterAll(() => session.close())

describe("Template scoped css JSX compiler", () => {
  test("lowers inline and same-module const css through existing style metadata", async () => {
    const code = await compiled("css-style.tsx")
    const component = code.slice(
      code.indexOf("export const CssButton"),
      code.indexOf("export function createCssStyleRuntimeRoot"),
    )
    const ids = [...component.matchAll(/StyleSheet\("([^"]+)"/g)].map(match => match[1]!)

    expect(ids).toHaveLength(1)
    expect(new Set(ids).size).toBe(ids.length)
    expect(component).toContain(':focus{border-color:" + String(focusColor)')
    expect(component).toContain(':hover{background:" + "var(--hover-color);color:')
    expect(component).toContain('"var(--hover-text, rgb(255 255 255))}"')
    expect(component).toContain("Boolean(props.selected)")
    expect(component).toContain('"--hover-color: " + String(props.hoverColor)')
    expect(component).toContain('"width: " + String(props.width) + "px"')
    expect(component).toContain("props.style")
    expect(component.match(/BindStyle\(__zComp0Node0\)/g)).toHaveLength(1)
    expect(component).toContain('kind: "authored-css"')
    expect(component).toContain('moduleId: "@fixture/styles/css-style.tsx"')
    expect(component).toContain('componentName: "CssButton"')
    expect(component).toContain('"&:hover{background:" + "var(--hover-color)')
    expect(component.match(/, \{kind: "authored-css"/g)).toHaveLength(1)
    expect(component).toContain(' + "\\n" + "&:hover{background:"')
    expect(component).toContain(' + "\\n" + "&{color:"')
    expect(component).toContain('&[data-variant=\\"text\\"]')
    expect(component).toContain('&[data-variant=\\"text\\"][aria-pressed=\\"true\\"]:hover')
    expect(component).not.toContain('cssText: "[&]')
    expect(component).not.toContain('cssText: "&{--hover-color:')
    expect(component).not.toContain("css`")
  })

  test("lowers base-only component style props into inline CSS", async () => {
    const code = await compiled("css-component-prop.tsx")
    expect(code).toContain('"style": ["color: " + "red"]')
    expect(code).not.toContain("css`")
  })

  test("rejects imports, shadows, caller pseudos, invalid selectors and dynamic owner selectors", async () => {
    const cases = [
      ["css-dynamic-pseudo.tsx", "cannot depend on props or component state"],
      ["css-component-pseudo.tsx", "component style prop rejects selector &:hover"],
      ["css-invalid-selector.tsx", "must start with &"],
      ["css-alias.tsx", "remove the css import"],
      ["css-shadow.tsx", "intrinsic style authoring requires a css tagged template"],
      ["css-fake-global.tsx", "intrinsic style authoring requires a css tagged template"],
      ["css-fake-branded-global.tsx", "intrinsic style authoring requires a css tagged template"],
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
