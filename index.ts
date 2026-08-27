/**
Browser-safe parser for the package's bounded HTML-like template syntax.

The parser reads `Function.prototype.toString()` and never invokes the supplied
callback. It owns syntax only: elements, attributes, text, template
expressions, conditions, logical branches, maps, recursive style object
literals and `meta-*` elements. Domain meaning and validation belong to
consumers such as the MetaFor Matter DSL.

@packageDocumentation
*/

import { createNode } from "./node"
import type { Node } from "./node/index.t"
import { extractHtmlElements } from "./parser"

export type { Node } from "./node/index.t"
export type { Attributes } from "./attribute/index.t"
export type { ValueStyle, ValueStyleObject } from "./attribute/style.t"

export type TemplateParameters<
  Fields extends object = Record<string, any>,
  Mass extends object = Record<string, any>,
  State = string,
> = {
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  fields: Fields
  mass: Mass
  state: State
  update: (fields: Partial<Fields>) => void
  [binding: string]: any
}

/**
Parses the first `html` tagged template found in a callback source.

The parameter type is intentionally generic. A domain can pass its own typed
declaration callback without making this package depend on that domain. The
default parameter shape only provides contextual typing for inline templates;
the callback is never executed.

@param template - Callback whose source contains an `html` tagged template.
@returns Root syntax nodes in authored order.
@throws Error when the callback source contains no complete `html` block.

@example
```ts
const nodes = parse(({html, value}) => html`
  <section>${value.title}</section>
`)
```
*/
export function parse<
  Fields extends object = Record<string, any>,
  Mass extends object = Record<string, any>,
  State = string,
>(template: (parameters: TemplateParameters<Fields, Mass, State>) => unknown): Node[]
export function parse<Parameters extends object>(template: (parameters: Parameters) => unknown): Node[]
export function parse(template: Function): Node[] {
  const mainHtml = extractMainHtmlBlock(template)
  const hierarchy = extractHtmlElements(mainHtml)
  const context = { pathStack: [], level: 0 }
  return hierarchy.map((node) => createNode(node, context))
}

const extractMainHtmlBlock = (template: Function): string => {
  const src = Function.prototype.toString.call(template)
  const firstIndex = src.indexOf("html`")
  if (firstIndex === -1) throw new Error("функция template не содержит html`")
  const lastBacktick = src.lastIndexOf("`")
  if (lastBacktick === -1 || lastBacktick <= firstIndex) throw new Error("template function does not contain html`")
  const htmlContent = src.slice(firstIndex + 5, lastBacktick)
  return htmlContent.replace(/!0/g, "true").replace(/!1/g, "false")
}
