import type {
  Expression,
  Identifier,
  Node,
  ObjectLiteralExpression,
  PropertyName,
  SourceFile,
} from "typescript/unstable/ast"
import {skipOuterExpressions, SyntaxKind} from "typescript/unstable/ast"
import {
  isArrayLiteralExpression,
  isBinaryExpression,
  isComputedPropertyName,
  isFalseLiteral,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isNullLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isOmittedExpression,
  isParenthesizedExpression,
  isPropertyAssignment,
  isShorthandPropertyAssignment,
  isSpreadAssignment,
  isSpreadElement,
  isStringLiteral,
} from "typescript/unstable/ast/is"
import {JsxCompileError} from "./errors.ts"

export type JsxStylePrimitiveKind = "nullish" | "number" | "string" | "unsupported"

export type CompiledStyleFragment = Readonly<{
  attributeName: `data-z-${string}`
  condition: string | null
  cssTextExpression: string
  id: string
}>

export type CompiledStyleExtraction = Readonly<{
  fragments: readonly CompiledStyleFragment[]
  residualExpression: string | null
}>

export type StyleExtractionContext = Readonly<{
  nextIdentity(source: string): Readonly<{
    attributeName: `data-z-${string}`
    id: string
  }>
  primitiveKinds: ReadonlyMap<Node, JsxStylePrimitiveKind>
  sourceFile: SourceFile
  sourcePath: string
  symbols: ReadonlyMap<Node, number>
  unstableSymbols: ReadonlySet<number>
}>

type CssValue = Readonly<{code: string; empty: boolean}>
type CssDeclaration = Readonly<{property: string; value: CssValue}>
type CssRule = Readonly<{declarations: readonly CssDeclaration[]; pseudo: string}>
type ObjectExtraction = Readonly<{
  rules: readonly CssRule[]
  residualExpression: string | null
}>

const supportedPseudos: ReadonlySet<string> = new Set([
  ":active",
  ":checked",
  ":disabled",
  ":focus",
  ":focus-within",
  ":hover",
  ":indeterminate",
])

export function extractCompiledStyle(
  expression: Expression,
  context: StyleExtractionContext,
): CompiledStyleExtraction {
  const value = unwrap(expression)
  if (isArrayLiteralExpression(value)) return extractArray(value.elements, context)
  const conditional = logicalStaticObject(value)
  if (conditional) return extractObject(conditional.object, conditional.condition, context)
  if (isObjectLiteralExpression(value)) return extractObject(value, null, context)
  return Object.freeze({fragments: Object.freeze([]), residualExpression: value.getText(context.sourceFile)})
}

function extractArray(
  elements: readonly Expression[],
  context: StyleExtractionContext,
): CompiledStyleExtraction {
  const fragments: CompiledStyleFragment[] = []
  const residual: string[] = []
  for (const element of elements) {
    if (isOmittedExpression(element)) continue
    if (isSpreadElement(element)) {
      throw compileError(context, "style arrays cannot contain spreads")
    }
    const value = unwrap(element)
    if (isNullLiteral(value) || isFalseLiteral(value) || isUndefinedIdentifier(value)) continue
    const extracted = extractCompiledStyle(value, context)
    fragments.push(...extracted.fragments)
    if (extracted.residualExpression !== null) residual.push(extracted.residualExpression)
  }
  return Object.freeze({
    fragments: Object.freeze(fragments),
    residualExpression: residual.length === 0 ? null : `[${residual.join(", ")}]`,
  })
}

function extractObject(
  object: ObjectLiteralExpression,
  condition: string | null,
  context: StyleExtractionContext,
): CompiledStyleExtraction {
  const parsed = parseObject(object, context)
  const fragments: CompiledStyleFragment[] = []
  if (parsed.rules.some(rule => rule.declarations.length > 0)) {
    const identity = context.nextIdentity(serializeRules("data-z-style-scope", parsed.rules))
    fragments.push(Object.freeze({
      ...identity,
      condition,
      cssTextExpression: serializeRules(identity.attributeName, parsed.rules),
    }))
  }
  return Object.freeze({
    fragments: Object.freeze(fragments),
    residualExpression: parsed.residualExpression === null
      ? null
      : condition === null
        ? parsed.residualExpression
        : `(${condition}) && ${parsed.residualExpression}`,
  })
}

function parseObject(
  object: ObjectLiteralExpression,
  context: StyleExtractionContext,
): ObjectExtraction {
  const base: CssDeclaration[] = []
  const pseudos: CssRule[] = []
  const residual: string[] = []
  for (const property of object.properties) {
    if (isSpreadAssignment(property)) throw compileError(context, "style objects cannot contain spreads")
    if (!isPropertyAssignment(property) && !isShorthandPropertyAssignment(property)) {
      throw compileError(context, "style objects support only property assignments")
    }
    if (isComputedPropertyName(property.name)) {
      throw compileError(context, "style objects cannot contain computed property names")
    }
    const sourceName = propertyName(property.name, context)
    const initializer = isPropertyAssignment(property) ? property.initializer : property.name
    if (sourceName.startsWith(":")) {
      if (!supportedPseudos.has(sourceName)) {
        throw compileError(context, `unsupported style pseudo ${sourceName}`)
      }
      const pseudoValue = unwrap(initializer)
      if (!isObjectLiteralExpression(pseudoValue)) {
        throw compileError(context, `style pseudo ${sourceName} must be a static declaration object`)
      }
      pseudos.push(Object.freeze({
        pseudo: sourceName,
        declarations: Object.freeze(parsePseudoDeclarations(pseudoValue, sourceName, context)),
      }))
      continue
    }
    const cssName = cssPropertyName(sourceName, context)
    if (!isModuleStable(initializer, context)) {
      residual.push(property.getText(context.sourceFile))
      continue
    }
    const value = cssValue(cssName, initializer, context)
    if (!value.empty) base.push(Object.freeze({property: cssName, value}))
  }
  const rules: CssRule[] = [Object.freeze({pseudo: "", declarations: Object.freeze(base)}), ...pseudos]
  return Object.freeze({
    rules: Object.freeze(rules),
    residualExpression: residual.length === 0 ? null : `{${residual.join(", ")}}`,
  })
}

function parsePseudoDeclarations(
  object: ObjectLiteralExpression,
  pseudo: string,
  context: StyleExtractionContext,
): CssDeclaration[] {
  const declarations: CssDeclaration[] = []
  for (const property of object.properties) {
    if (isSpreadAssignment(property)) {
      throw compileError(context, `style pseudo ${pseudo} cannot contain spreads`)
    }
    if (!isPropertyAssignment(property) && !isShorthandPropertyAssignment(property)) {
      throw compileError(context, `style pseudo ${pseudo} supports only property assignments`)
    }
    if (isComputedPropertyName(property.name)) {
      throw compileError(context, `style pseudo ${pseudo} cannot contain computed property names`)
    }
    const sourceName = propertyName(property.name, context)
    if (sourceName.startsWith(":")) {
      throw compileError(context, `style pseudo ${pseudo} cannot nest ${sourceName}`)
    }
    const initializer = isPropertyAssignment(property) ? property.initializer : property.name
    if (!isModuleStable(initializer, context)) {
      throw compileError(context, `style pseudo ${pseudo}.${sourceName} cannot depend on props or component state`)
    }
    const cssName = cssPropertyName(sourceName, context)
    const value = cssValue(cssName, initializer, context)
    if (!value.empty) declarations.push(Object.freeze({property: cssName, value}))
  }
  return declarations
}

function cssValue(
  property: string,
  expression: Expression,
  context: StyleExtractionContext,
): CssValue {
  const value = unwrap(expression)
  if (isStringLiteral(value) || isNoSubstitutionTemplateLiteral(value)) {
    return Object.freeze({code: JSON.stringify(value.text), empty: value.text.length === 0})
  }
  if (isNumericLiteral(value)) {
    const number = Number(value.text)
    const serialized = number === 0 || unitless(property) || property.startsWith("--")
      ? String(number)
      : `${number}px`
    return Object.freeze({code: JSON.stringify(serialized), empty: false})
  }
  if (isNullLiteral(value) || isUndefinedIdentifier(value)) {
    return Object.freeze({code: JSON.stringify(""), empty: true})
  }
  const kind = context.primitiveKinds.get(value) ?? "unsupported"
  if (kind === "nullish") return Object.freeze({code: JSON.stringify(""), empty: true})
  if (kind === "string") {
    return Object.freeze({code: `String(${value.getText(context.sourceFile)})`, empty: false})
  }
  if (kind === "number") {
    const source = `String(${value.getText(context.sourceFile)})`
    return Object.freeze({
      code: unitless(property) || property.startsWith("--") ? source : `${source} + "px"`,
      empty: false,
    })
  }
  throw compileError(context, `style property ${property} must resolve to string, number, null, or undefined`)
}

function serializeRules(attributeName: string, rules: readonly CssRule[]): string {
  const parts: string[] = []
  for (const rule of rules) {
    if (rule.declarations.length === 0) continue
    appendStatic(parts, `[${attributeName}]${rule.pseudo}{`)
    for (let index = 0; index < rule.declarations.length; index += 1) {
      const declaration = rule.declarations[index]!
      if (index > 0) appendStatic(parts, ";")
      appendStatic(parts, `${declaration.property}:`)
      parts.push(declaration.value.code)
    }
    appendStatic(parts, "}")
  }
  return parts.length === 0 ? JSON.stringify("") : parts.join(" + ")
}

function appendStatic(parts: string[], value: string): void {
  if (value.length === 0) return
  const previous = parts.at(-1)
  if (previous?.startsWith('"') && previous.endsWith('"')) {
    const decoded = JSON.parse(previous) as string
    parts[parts.length - 1] = JSON.stringify(decoded + value)
    return
  }
  parts.push(JSON.stringify(value))
}

function propertyName(name: PropertyName, context: StyleExtractionContext): string {
  if (isIdentifier(name) || isStringLiteral(name) || isNoSubstitutionTemplateLiteral(name)) {
    return name.text
  }
  throw compileError(context, "style property names must be identifiers or string literals")
}

function cssPropertyName(value: string, context: StyleExtractionContext): string {
  if (!/^(?:--[a-zA-Z0-9_-]+|-?(?:[a-z][a-zA-Z0-9]*|[a-z][a-z0-9-]*))$/.test(value)) {
    throw compileError(context, `invalid style property ${value}`)
  }
  return value.startsWith("--") ? value : value.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)
}

function unitless(property: string): boolean {
  return property === "flex" || property === "opacity" || property === "z-index" ||
    property === "line-height" || property === "flex-grow" || property === "flex-shrink" ||
    property === "font-weight"
}

function logicalStaticObject(
  expression: Expression,
): Readonly<{condition: string; object: ObjectLiteralExpression}> | null {
  if (!isBinaryExpression(expression) ||
    expression.operatorToken.kind !== SyntaxKind.AmpersandAmpersandToken) return null
  const right = unwrap(expression.right)
  if (!isObjectLiteralExpression(right)) return null
  return Object.freeze({condition: expression.left.getText(expression.getSourceFile()), object: right})
}

function isModuleStable(expression: Expression, context: StyleExtractionContext): boolean {
  let stable = true
  visit(expression, node => {
    if (!stable || !isIdentifier(node)) return
    const id = context.symbols.get(node)
    if (id !== undefined && context.unstableSymbols.has(id)) stable = false
  })
  return stable
}

function isUndefinedIdentifier(expression: Expression): expression is Identifier {
  return isIdentifier(expression) && expression.text === "undefined"
}

function unwrap(expression: Expression): Expression {
  let value = expression
  while (isParenthesizedExpression(value)) value = value.expression
  return skipOuterExpressions(value)
}

function visit(node: Node, callback: (node: Node) => void): void {
  callback(node)
  node.forEachChild(child => {
    visit(child, callback)
    return undefined
  })
}

function compileError(context: StyleExtractionContext, message: string): JsxCompileError {
  return new JsxCompileError(message, context.sourcePath)
}
