import type {
  ArrowFunction,
  CallExpression,
  Expression,
  FunctionDeclaration,
  Identifier,
  JsxAttribute,
  JsxChild,
  JsxElement,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  ParenthesizedExpression,
  ReturnStatement,
  SourceFile,
} from "typescript/unstable/ast"
import {NodeFlags, SyntaxKind} from "typescript/unstable/ast"
import {
  isArrowFunction,
  isBlock,
  isCallExpression,
  isBinaryExpression,
  isConditionalExpression,
  isDoStatement,
  isExportDeclaration,
  isExternalModuleReference,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isFunctionLikeDeclaration,
  isIdentifier,
  isIfStatement,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isJsxSpreadAttribute,
  isJsxText,
  isNamedImports,
  isNullLiteral,
  isParenthesizedExpression,
  isPostfixUnaryExpression,
  isPrefixUnaryExpression,
  isPropertyAccessExpression,
  isReturnStatement,
  isStringLiteral,
  isSwitchStatement,
  isTryStatement,
  isVariableDeclaration,
  isVariableDeclarationList,
  isVariableStatement,
  isWhileStatement,
  isWithStatement,
  isAssignmentOperator,
  skipOuterExpressions,
} from "typescript/unstable/ast/is"
import {JsxCompileError} from "./errors.ts"

type Edit = Readonly<{start: number; end: number; text: string}>

type CompileContext = {
  readonly components: ReadonlySet<number>
  readonly consumedJsx: Set<Node>
  readonly childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  readonly helper: string
  readonly propsSymbol: number | null
  readonly source: string
  readonly sourceFile: SourceFile
  readonly sourcePath: string
  readonly symbols: ReadonlyMap<Node, number>
  readonly arrayExpressions: ReadonlySet<Node>
  readonly mount: string[]
  readonly bindings: string[]
  readonly writes: string[]
  nodeIndex: number
}

type ComponentExpression = Readonly<{
  expression: string
  key: string
  props: string
  template: string
}>

type ComponentExpressionContext = Readonly<{
  arrayExpressions: ReadonlySet<Node>
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  components: ReadonlySet<number>
  consumedJsx: Set<Node>
  helper: string
  propsSymbol: number | null
  sourceFile: SourceFile
  sourcePath: string
  symbols: ReadonlyMap<Node, number>
}>

type RuntimeImportBindings = Readonly<{
  createRoot: ReadonlySet<number>
  hooks: ReadonlyMap<number, Readonly<{name: string; supported: boolean}>>
  memo: ReadonlySet<number>
}>

const supportedHooks = Object.freeze([
  "useCallback",
  "useContext",
  "useDebugValue",
  "useEffect",
  "useEffectEvent",
  "useId",
  "useImperativeHandle",
  "useInsertionEffect",
  "useLayoutEffect",
  "useMemo",
  "useReducer",
  "useRef",
  "useState",
  "useSyncExternalStore",
] as const)

export const jsxAuthoringProfile = Object.freeze({
  componentChildren: Object.freeze({
    arbitraryArrays: false,
    explicitChildrenAttribute: false,
    fragments: false,
    intrinsicElements: false,
    keyedComponents: true,
    nullableComponent: true,
    primitiveText: true,
    receiver: "props.children" as const,
    singleComponent: true,
  }),
  customHooks: true,
  sourceMaps: false,
  supportedHooks,
})

const supportedHookNames: ReadonlySet<string> = new Set(supportedHooks)

export type JsxTransformSymbols = Readonly<{
  arrayExpressions: ReadonlySet<Node>
  byNode: ReadonlyMap<Node, number>
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  dependencyPaths: ReadonlySet<string>
  importedComponents: ReadonlySet<number>
  importedCustomHooks: ReadonlySet<number>
}>

export type JsxChildrenExpressionKind =
  | "component"
  | "keyed-components"
  | "nullable-component"
  | "text"
  | "unsupported"

/** Lowers the bounded component TSX profile into the shared compiled-template ABI. */
export function transformJsxSourceFile(
  sourceFile: SourceFile,
  symbols: JsxTransformSymbols,
): string {
  const source = sourceFile.text
  const sourcePath = sourceFile.fileName
  const helper = uniqueHelperPrefix(source)
  const edits: Edit[] = []
  const runtimeBindings = runtimeImportBindings(sourceFile, symbols.byNode, sourcePath)
  const componentDeclarations = sourceFile.statements.filter(
    (statement): statement is FunctionDeclaration =>
      isFunctionDeclaration(statement) &&
      statement.name !== undefined &&
      /^[A-Z]/.test(statement.name.text) &&
      componentReturn(statement) !== null,
  )
  const customHookDeclarations = sourceFile.statements.filter(
    (statement): statement is FunctionDeclaration =>
      isFunctionDeclaration(statement) && statement.name !== undefined &&
      /^use[A-Z0-9]/.test(statement.name.text),
  )
  const consumedJsx = new Set<Node>()
  let needsCompiledRuntime = false
  const componentSymbols = new Set(symbols.importedComponents)
  const customHookSymbols = new Set(symbols.importedCustomHooks)
  for (const declaration of componentDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id !== null) componentSymbols.add(id)
  }
  for (const declaration of componentDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id === null) continue
    const declarations = sourceFile.statements.filter(statement =>
      isFunctionDeclaration(statement) && statement.name !== undefined &&
      symbolId(symbols.byNode, statement.name) === id)
    if (declarations.length !== 1) {
      throw compileError(sourcePath, `${declaration.name!.text} overloads are unsupported`)
    }
  }
  for (const declaration of customHookDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id !== null) customHookSymbols.add(id)
  }

  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement)) continue
    if ((statement.declarationList.flags & NodeFlags.Const) === 0) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!isVariableDeclaration(declaration) || !isIdentifier(declaration.name)) continue
      const initializer = declaration.initializer
      if (
        initializer && isCallExpression(initializer) && isIdentifier(initializer.expression) &&
        runtimeBindings.memo.has(symbolId(symbols.byNode, initializer.expression) ?? -1) &&
        initializer.arguments.length >= 1 && initializer.arguments.length <= 2 &&
        isIdentifier(initializer.arguments[0]!) &&
        componentSymbols.has(symbolId(symbols.byNode, initializer.arguments[0]!) ?? -1)
      ) {
        const id = symbolId(symbols.byNode, declaration.name)
        if (id !== null) componentSymbols.add(id)
      }
    }
  }
  assertNoReactRuntimeReferences(sourceFile, sourcePath)
  assertNoSymbolWrites(sourceFile, componentSymbols, symbols.byNode, sourcePath)
  for (const declaration of customHookDeclarations) {
    const name = declaration.name!.text
    const modifiers = declaration.modifiers?.map(modifier => modifier.getText(sourceFile)) ?? []
    if (!declaration.body || !isBlock(declaration.body) || declaration.asteriskToken ||
      modifiers.includes("async") || modifiers.includes("default")) {
      throw compileError(sourcePath, `${name} must be a synchronous governed custom hook`)
    }
  }
  validateHookCalls(
    sourceFile,
    new Set([...componentDeclarations, ...customHookDeclarations]),
    runtimeBindings.hooks,
    customHookSymbols,
    symbols.byNode,
    sourcePath,
  )

  for (const declaration of componentDeclarations) {
    needsCompiledRuntime = true
    edits.push({
      start: declaration.getStart(sourceFile),
      end: declaration.getEnd(),
      text: compileComponent(
        declaration,
        componentSymbols,
        helper,
        sourceFile,
        symbols.byNode,
        symbols.arrayExpressions,
        symbols.childrenExpressionKinds,
        consumedJsx,
      ),
    })
  }

  const componentRanges = componentDeclarations.map((declaration) => ({
    start: declaration.getStart(sourceFile),
    end: declaration.getEnd(),
  }))
  const componentRoots = componentRootBindings(
    sourceFile,
    runtimeBindings.createRoot,
    symbols.byNode,
  )
  visit(sourceFile, (node) => {
    if (!isCallExpression(node) || !isPropertyAccessExpression(node.expression)) return
    if (node.expression.name.text !== "render" || node.arguments.length !== 1) return
    if (!isComponentRootExpression(
      node.expression.expression,
      componentRoots,
      runtimeBindings.createRoot,
      symbols.byNode,
    )) return
    const start = node.getStart(sourceFile)
    if (componentRanges.some((range) => start >= range.start && start < range.end)) return
    const argument = skipParentheses(node.arguments[0]!)
    if (!isJsxElement(argument) && !isJsxSelfClosingElement(argument)) return
    const compiled = componentExpression(argument, {
      arrayExpressions: symbols.arrayExpressions,
      childrenExpressionKinds: symbols.childrenExpressionKinds,
      components: componentSymbols,
      consumedJsx,
      helper,
      propsSymbol: null,
      sourceFile,
      sourcePath,
      symbols: symbols.byNode,
    })
    needsCompiledRuntime = true
    edits.push({
      start,
      end: node.getEnd(),
      text: `${node.expression.expression.getText(sourceFile)}.render(${compiled.template}, ${compiled.props}${compiled.key === "null" ? "" : `, {key: ${compiled.key}}`})`,
    })
  })

  visit(sourceFile, (node) => {
    if (!isJsxElement(node) && !isJsxSelfClosingElement(node) && !isJsxFragment(node)) return
    if (consumedJsx.has(node)) return
    throw compileError(
      sourcePath,
      "JSX is outside a supported final-return function component or exact createRoot render",
    )
  })

  if (needsCompiledRuntime) {
    edits.push({
      start: importInsertionOffset(source),
      end: importInsertionOffset(source),
      text: [
        `import {`,
        `  bindChild as ${helper}BindChild,`,
        `  bindConditional as ${helper}BindConditional,`,
        `  bindEvent as ${helper}BindEvent,`,
        `  bindKeyed as ${helper}BindKeyed,`,
        `  bindProperty as ${helper}BindProperty,`,
        `  bindRef as ${helper}BindRef,`,
        `  bindStyle as ${helper}BindStyle,`,
        `  bindText as ${helper}BindText,`,
        `  defineCompiledTemplate as ${helper}Define,`,
        `  writeBinding as ${helper}Write`,
        `} from "@zavx0z/template/compiled"`,
        `import {`,
        `  component as ${helper}Component,`,
        `  keyedComponents as ${helper}Keyed`,
        `} from "@zavx0z/react"`,
        "",
      ].join("\n"),
    })
  }

  return applyEdits(source, edits, sourcePath, helper)
}

function compileComponent(
  declaration: FunctionDeclaration,
  components: ReadonlySet<number>,
  helper: string,
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
  arrayExpressions: ReadonlySet<Node>,
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>,
  consumedJsx: Set<Node>,
): string {
  const name = declaration.name!.text
  const body = declaration.body
  if (!body || !isBlock(body)) throw compileError(sourceFile.fileName, `${name} requires a block body`)
  if (declaration.asteriskToken) throw compileError(sourceFile.fileName, `${name} cannot be a generator`)
  const modifiers = declaration.modifiers?.map(modifier => modifier.getText(sourceFile)) ?? []
  if (modifiers.includes("default")) {
    throw compileError(sourceFile.fileName, `${name} default export is unsupported`)
  }
  if (modifiers.includes("async")) {
    throw compileError(sourceFile.fileName, `${name} async components are unsupported`)
  }
  if (declaration.parameters.length > 1) {
    throw compileError(sourceFile.fileName, `${name} accepts at most one props parameter`)
  }
  if (declaration.typeParameters && declaration.typeParameters.length > 0) {
    throw compileError(sourceFile.fileName, `${name} generic components are unsupported`)
  }
  if (declaration.parameters[0]?.dotDotDotToken) {
    throw compileError(sourceFile.fileName, `${name} rest props are unsupported`)
  }
  const returned = componentReturn(declaration)
  if (!returned?.expression) throw compileError(sourceFile.fileName, `${name} requires one final JSX return`)
  assertSingleReturnPath(declaration, returned, sourceFile.fileName)
  const parameter = declaration.parameters[0]?.getText(sourceFile) ?? "_props: Record<string, never>"
  const prelude = sourceFile.text.slice(body.getStart(sourceFile) + 1, returned.getStart(sourceFile))
  const context: CompileContext = {
    arrayExpressions,
    childrenExpressionKinds,
    components,
    consumedJsx,
    helper,
    propsSymbol: declaration.parameters[0] && isIdentifier(declaration.parameters[0].name)
      ? symbolId(symbols, declaration.parameters[0].name)
      : null,
    source: sourceFile.text,
    sourceFile,
    sourcePath: sourceFile.fileName,
    symbols,
    mount: [],
    bindings: [],
    writes: [],
    nodeIndex: 0,
  }
  const rootNodes = compileJsx(skipParentheses(returned.expression), context)
  const exported = declaration.modifiers?.some((modifier) => modifier.getText(sourceFile) === "export")
    ? "export "
    : ""
  return [
    `${exported}const ${name} = ${helper}Define({`,
    `  displayName: ${JSON.stringify(name)},`,
    `  bindingCount: ${context.bindings.length},`,
    `  mount(document) {`,
    ...context.mount.map((line) => `    ${line}`),
    `    return {`,
    `      nodes: [${rootNodes.join(", ")}],`,
    `      bindings: [${context.bindings.join(", ")}]`,
    `    }`,
    `  },`,
    `  render(${parameter}, ${helper}Values) {${prelude}`,
    ...context.writes.map((line) => `    ${line}`),
    `  }`,
    `})`,
  ].join("\n")
}

function compileJsx(expression: Expression, context: CompileContext): string[] {
  context.consumedJsx.add(expression)
  if (isJsxFragment(expression)) {
    throw compileError(context.sourcePath, "JSX fragments are outside the first compiler profile")
  }
  if (!isJsxElement(expression) && !isJsxSelfClosingElement(expression)) {
    throw compileError(context.sourcePath, "component return must be one JSX element")
  }
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  const tag = opening.tagName.getText(context.sourceFile)
  if (/^[a-z]/.test(tag)) return [compileIntrinsic(expression, opening, tag, context)]
  if (
    !isIdentifier(opening.tagName) ||
    !context.components.has(symbolId(context.symbols, opening.tagName) ?? -1)
  ) {
    throw compileError(context.sourcePath, `unknown or dynamic component ${tag}`)
  }
  return compileComponentRange(expression, "child", context)
}

function compileIntrinsic(
  expression: JsxElement | JsxSelfClosingElement,
  opening: JsxOpeningElement | JsxSelfClosingElement,
  tag: string,
  context: CompileContext,
): string {
  context.consumedJsx.add(expression)
  const variable = nextNode(context)
  context.mount.push(`const ${variable} = document.createElement(${JSON.stringify(tag)})`)
  for (const attribute of opening.attributes.properties) {
    if (isJsxSpreadAttribute(attribute)) {
      throw compileError(context.sourcePath, "JSX attribute spreads are unsupported")
    }
    if (!isJsxAttribute(attribute)) continue
    const name = attribute.name.getText(context.sourceFile)
    if (name === "key") throw compileError(context.sourcePath, "key is valid only on component children")
    if (name === "class" || name === "className") {
      throw compileError(
        context.sourcePath,
        "class-based component styling is unsupported; compose defineStyles tokens through style",
      )
    }
    if (name === "dangerouslySetInnerHTML") {
      throw compileError(context.sourcePath, "dangerouslySetInnerHTML is unsupported")
    }
    const value = attributeValue(attribute, context.sourceFile, context.sourcePath)
    const event = /^on[A-Z]/.test(name)
    const liveProperty = name === "value" || name === "checked" || name === "selected" ||
      name === "selectedIndex"
    const requiresBinding = name === "style" || name === "ref" || event || liveProperty ||
      value.staticValue === undefined
    if (!requiresBinding && value.staticValue !== undefined) {
      if (value.staticValue === true) context.mount.push(`${variable}.setAttribute(${JSON.stringify(attributeName(name))}, "")`)
      else context.mount.push(`${variable}.setAttribute(${JSON.stringify(attributeName(name))}, ${JSON.stringify(value.staticValue)})`)
      continue
    }
    if ((name === "ref" || event) && value.staticValue !== undefined) {
      throw compileError(context.sourcePath, `${name} requires a JSX expression`)
    }
    const slot = context.bindings.length
    if (name === "style") context.bindings.push(`${context.helper}BindStyle(${variable})`)
    else if (name === "ref") context.bindings.push(`${context.helper}BindRef(${variable})`)
    else if (event) {
      const options = name.endsWith("Capture") ? ", {capture: true}" : ""
      context.bindings.push(
        `${context.helper}BindEvent(${variable}, ${JSON.stringify(eventName(name))}${options})`,
      )
    } else {
      context.bindings.push(
        `${context.helper}BindProperty(${variable}, ${JSON.stringify(attributeName(name))})`,
      )
    }
    context.writes.push(`${context.helper}Write(${context.helper}Values, ${slot}, ${value.expression})`)
  }

  const children = isJsxElement(expression) ? expression.children : []
  for (const child of children) {
    for (const childNode of compileChild(child, context)) context.mount.push(`${variable}.appendChild(${childNode})`)
  }
  return variable
}

function compileChild(child: JsxChild, context: CompileContext): string[] {
  if (isJsxText(child)) {
    const value = normalizeJsxText(child.text)
    if (value === "") return []
    const variable = nextNode(context)
    context.mount.push(`const ${variable} = document.createTextNode(${JSON.stringify(value)})`)
    return [variable]
  }
  if (isJsxElement(child) || isJsxSelfClosingElement(child)) {
    const opening = isJsxElement(child) ? child.openingElement : child
    const tag = opening.tagName.getText(context.sourceFile)
    if (/^[a-z]/.test(tag)) return [compileIntrinsic(child, opening, tag, context)]
    return compileComponentRange(child, "child", context)
  }
  if (!isJsxExpression(child) || !child.expression) return []
  const expression = skipParentheses(child.expression)
  const childrenKind = context.childrenExpressionKinds.get(expression)
  if (isDirectPropsChildrenExpression(expression, context)) {
    if (childrenKind === "component") {
      return compileValueRange(expression, "child", context)
    }
    if (childrenKind === "nullable-component") {
      return compileValueRange(expression, "conditional", context, true)
    }
    if (childrenKind === "keyed-components") {
      return compileValueRange(expression, "keyed", context)
    }
    if (childrenKind !== "text") {
      throw compileError(
        context.sourcePath,
        "props.children must be typed as authored JSX, authored JSX or null, keyed authored JSX, or primitive text",
      )
    }
  } else if (
    isChildrenNamedExpression(expression) &&
    childrenKind !== undefined &&
    childrenKind !== "unsupported"
  ) {
    throw compileError(
      context.sourcePath,
      "component-valued children must be rendered as direct props.children in the first compiler profile",
    )
  }
  if (isConditionalExpression(expression)) return compileConditional(expression, context)
  const keyed = keyedMapExpression(expression, context)
  if (keyed !== null) return keyed
  if (context.arrayExpressions.has(expression)) {
    throw compileError(context.sourcePath, "array children require a keyed component .map() expression")
  }
  const variable = nextNode(context)
  context.mount.push(`const ${variable} = document.createTextNode("")`)
  const slot = context.bindings.length
  context.bindings.push(`${context.helper}BindText(${variable})`)
  context.writes.push(`${context.helper}Write(${context.helper}Values, ${slot}, ${expression.getText(context.sourceFile)})`)
  return [variable]
}

function compileValueRange(
  expression: Expression,
  kind: "child" | "conditional" | "keyed",
  context: CompileContext,
  normalizeNullish = false,
): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment(${JSON.stringify(`${kind}:start`)})`)
  context.mount.push(`const ${end} = document.createComment(${JSON.stringify(`${kind}:end`)})`)
  const slot = context.bindings.length
  if (kind === "child") context.bindings.push(`${context.helper}BindChild(${start}, ${end})`)
  else if (kind === "conditional") {
    context.bindings.push(`${context.helper}BindConditional(${start}, ${end})`)
  } else context.bindings.push(`${context.helper}BindKeyed(${start}, ${end})`)
  const value = expression.getText(context.sourceFile)
  context.writes.push(
    `${context.helper}Write(${context.helper}Values, ${slot}, ${normalizeNullish ? `(${value} ?? null)` : value})`,
  )
  return [start, end]
}

function compileComponentRange(
  expression: JsxElement | JsxSelfClosingElement,
  kind: "child" | "conditional",
  context: CompileContext,
): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment(${JSON.stringify(`${kind}:start`)})`)
  context.mount.push(`const ${end} = document.createComment(${JSON.stringify(`${kind}:end`)})`)
  const slot = context.bindings.length
  context.bindings.push(
    kind === "child"
      ? `${context.helper}BindChild(${start}, ${end})`
      : `${context.helper}BindConditional(${start}, ${end})`,
  )
  const compiled = componentExpression(expression, context)
  context.writes.push(`${context.helper}Write(${context.helper}Values, ${slot}, ${compiled.expression})`)
  return [start, end]
}

function compileConditional(expression: ReturnType<typeof asConditional>, context: CompileContext): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment("conditional:start")`)
  context.mount.push(`const ${end} = document.createComment("conditional:end")`)
  const slot = context.bindings.length
  context.bindings.push(`${context.helper}BindConditional(${start}, ${end})`)
  context.writes.push(
    `${context.helper}Write(${context.helper}Values, ${slot}, ${conditionalComponentValueExpression(expression, context)})`,
  )
  return [start, end]
}

function conditionalComponentValueExpression(
  expression: ReturnType<typeof asConditional>,
  context: ComponentExpressionContext,
): string {
  const whenTrue = conditionalBranch(expression.whenTrue, context)
  const whenFalse = conditionalBranch(expression.whenFalse, context)
  return `${expression.condition.getText(context.sourceFile)} ? ${whenTrue} : ${whenFalse}`
}

function conditionalBranch(expression: Expression, context: ComponentExpressionContext): string {
  const branch = skipParentheses(expression)
  if (isNullLiteral(branch)) return "null"
  if (!isJsxElement(branch) && !isJsxSelfClosingElement(branch)) {
    throw compileError(context.sourcePath, "conditional JSX branches must be components or null")
  }
  return componentExpression(branch, context).expression
}

function keyedMapExpression(expression: Expression, context: CompileContext): string[] | null {
  const value = keyedMapValueExpression(expression, context)
  if (value === null) return null
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment("keyed:start")`)
  context.mount.push(`const ${end} = document.createComment("keyed:end")`)
  const slot = context.bindings.length
  context.bindings.push(`${context.helper}BindKeyed(${start}, ${end})`)
  context.writes.push(`${context.helper}Write(${context.helper}Values, ${slot}, ${value})`)
  return [start, end]
}

function keyedMapValueExpression(
  expression: Expression,
  context: ComponentExpressionContext,
): string | null {
  if (!isCallExpression(expression) || !isPropertyAccessExpression(expression.expression)) return null
  if (expression.expression.name.text !== "map" || expression.arguments.length !== 1) return null
  const callback = expression.arguments[0]!
  if (!isArrowFunction(callback) || callback.parameters.length === 0) {
    throw compileError(context.sourcePath, "keyed JSX map requires an arrow callback")
  }
  const callbackModifiers = callback.modifiers?.map(modifier => modifier.getText(context.sourceFile)) ?? []
  if (callbackModifiers.includes("async")) {
    throw compileError(context.sourcePath, "keyed JSX map callback cannot be async")
  }
  const body = skipParentheses(callback.body as Expression)
  if (!isJsxElement(body) && !isJsxSelfClosingElement(body)) {
    throw compileError(context.sourcePath, "keyed JSX map body must be one component")
  }
  const compiled = componentExpression(body, context)
  if (compiled.key === "null") throw compileError(context.sourcePath, "dynamic JSX map components require key")
  const parameters = callback.parameters.map((parameter) => parameter.getText(context.sourceFile)).join(", ")
  return `${context.helper}Keyed(${expression.expression.expression.getText(context.sourceFile)}.map((${parameters}) => ${compiled.expression}))`
}

function componentExpression(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): ComponentExpression {
  context.consumedJsx.add(expression)
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  if (!isIdentifier(opening.tagName)) {
    throw compileError(context.sourcePath, "dynamic component tag is unsupported")
  }
  const template = opening.tagName.text
  if (!context.components.has(symbolId(context.symbols, opening.tagName) ?? -1)) {
    throw compileError(context.sourcePath, `unknown component ${template}`)
  }
  const {props, key} = componentProps(expression, context)
  return {
    expression: `__COMPONENT_HELPER__(${template}, ${props}, ${key})`,
    key,
    props,
    template,
  }
}

function componentProps(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): Readonly<{props: string; key: string}> {
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  const properties: string[] = []
  let key = "null"
  for (const attribute of opening.attributes.properties) {
    if (isJsxSpreadAttribute(attribute)) {
      throw compileError(context.sourcePath, "component prop spreads are unsupported")
    }
    if (!isJsxAttribute(attribute)) continue
    const name = attribute.name.getText(context.sourceFile)
    if (name === "children") {
      throw compileError(
        context.sourcePath,
        "component children must be authored between component tags",
      )
    }
    if (name === "class" || name === "className") {
      throw compileError(
        context.sourcePath,
        "class-based component styling is unsupported; pass one style prop",
      )
    }
    const value = attributeValue(attribute, context.sourceFile, context.sourcePath)
    const expressionValue = value.staticValue !== undefined
      ? JSON.stringify(value.staticValue)
      : value.expression
    if (name === "key") key = expressionValue
    else properties.push(`${JSON.stringify(name)}: ${expressionValue}`)
  }
  const children = componentChildrenValue(expression, context)
  if (children !== null) properties.push(`${JSON.stringify("children")}: ${children}`)
  return Object.freeze({props: `{${properties.join(", ")}}`, key})
}

function componentChildrenValue(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): string | null {
  if (!isJsxElement(expression)) return null
  const children = expression.children.filter(child => !isEmptyJsxChild(child))
  if (children.length === 0) return null
  if (children.length === 1) return componentChildValue(children[0]!, context)

  const values: string[] = []
  for (const child of children) {
    if (isJsxFragment(child)) {
      throw compileError(context.sourcePath, "component children do not support JSX fragments")
    }
    if (!isJsxElement(child) && !isJsxSelfClosingElement(child)) {
      throw compileError(
        context.sourcePath,
        "multiple component children require explicit keyed governed components",
      )
    }
    const opening = isJsxElement(child) ? child.openingElement : child
    if (/^[a-z]/.test(opening.tagName.getText(context.sourceFile))) {
      throw compileError(
        context.sourcePath,
        "intrinsic elements cannot cross a component children boundary",
      )
    }
    const compiled = componentExpression(child, context)
    if (compiled.key === "null") {
      throw compileError(
        context.sourcePath,
        "multiple component children require a non-null key on every component",
      )
    }
    values.push(compiled.expression)
  }
  return `${context.helper}Keyed([${values.join(", ")}])`
}

function componentChildValue(child: JsxChild, context: ComponentExpressionContext): string {
  if (isJsxFragment(child)) {
    throw compileError(context.sourcePath, "component children do not support JSX fragments")
  }
  if (isJsxText(child)) return JSON.stringify(normalizeJsxText(child.text))
  if (isJsxElement(child) || isJsxSelfClosingElement(child)) {
    return componentElementChildValue(child, context)
  }
  if (!isJsxExpression(child) || !child.expression) {
    throw compileError(context.sourcePath, "empty component child is unsupported")
  }
  const value = skipParentheses(child.expression)
  if (isJsxFragment(value)) {
    throw compileError(context.sourcePath, "component children do not support JSX fragments")
  }
  if (isJsxElement(value) || isJsxSelfClosingElement(value)) {
    return componentElementChildValue(value, context)
  }
  if (isNullLiteral(value)) return "null"
  const keyed = keyedMapValueExpression(value, context)
  if (keyed !== null) return keyed
  const kind = context.childrenExpressionKinds.get(value)
  if (isConditionalExpression(value)) {
    if (kind === "text") return value.getText(context.sourceFile)
    return conditionalComponentValueExpression(asConditional(value), context)
  }
  if (context.arrayExpressions.has(value) || kind === "keyed-components") {
    if (isDirectPropsChildrenExpression(value, context)) return value.getText(context.sourceFile)
    throw compileError(
      context.sourcePath,
      "component array children require compiler-owned keyed JSX map or explicit keyed components",
    )
  }
  if (kind === "text") return value.getText(context.sourceFile)
  if (
    (kind === "component" || kind === "nullable-component") &&
    isDirectPropsChildrenExpression(value, context)
  ) return value.getText(context.sourceFile)
  throw compileError(
    context.sourcePath,
    "component child expressions must be primitive text, direct props.children, governed JSX, or compiler-owned keyed JSX",
  )
}

function componentElementChildValue(
  child: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): string {
  const opening = isJsxElement(child) ? child.openingElement : child
  if (/^[a-z]/.test(opening.tagName.getText(context.sourceFile))) {
    throw compileError(
      context.sourcePath,
      "intrinsic elements cannot cross a component children boundary",
    )
  }
  return componentExpression(child, context).expression
}

function attributeValue(
  attribute: JsxAttribute,
  sourceFile: SourceFile,
  sourcePath: string,
): Readonly<{staticValue?: string | true; expression: string}> {
  const initializer = attribute.initializer
  if (!initializer) return Object.freeze({staticValue: true, expression: "true"})
  if (isStringLiteral(initializer)) {
    return Object.freeze({staticValue: initializer.text, expression: JSON.stringify(initializer.text)})
  }
  if (isJsxExpression(initializer) && initializer.expression) {
    return Object.freeze({expression: initializer.expression.getText(sourceFile)})
  }
  throw compileError(sourcePath, `unsupported JSX attribute ${attribute.name.getText(sourceFile)}`)
}

function componentReturn(declaration: FunctionDeclaration): ReturnStatement | null {
  const body = declaration.body
  if (!body || !isBlock(body)) return null
  const returns = body.statements.filter(isReturnStatement)
  if (returns.length !== 1 || returns[0] !== body.statements.at(-1)) return null
  const expression = returns[0]!.expression
  if (!expression) return null
  const unwrapped = skipParentheses(expression)
  return isJsxElement(unwrapped) || isJsxSelfClosingElement(unwrapped) || isJsxFragment(unwrapped)
    ? returns[0]!
    : null
}

function assertSingleReturnPath(
  declaration: FunctionDeclaration,
  finalReturn: ReturnStatement,
  sourcePath: string,
): void {
  const body = declaration.body
  if (!body) return
  const walk = (node: Node): void => {
    if (node !== declaration && isFunctionLikeDeclaration(node)) return
    if (isReturnStatement(node) && node !== finalReturn) {
      throw compileError(sourcePath, `${declaration.name!.text} has an unsupported nested or early return`)
    }
    node.forEachChild(child => {
      walk(child)
      return undefined
    })
  }
  walk(body)
}

function nextNode(context: CompileContext): string {
  const variable = `${context.helper}Node${context.nodeIndex}`
  context.nodeIndex += 1
  return variable
}

function normalizeJsxText(value: string): string {
  const lines = value.replaceAll("\t", " ").split(/\r?\n/)
  let lastNonEmpty = -1
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]!.trim() !== "") lastNonEmpty = index
  }
  let result = ""
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index]!
    if (index !== 0) line = line.replace(/^ +/, "")
    if (index !== lines.length - 1) line = line.replace(/ +$/, "")
    if (line === "") continue
    result += line
    if (index !== lastNonEmpty) result += " "
  }
  return result
}

function eventName(name: string): string {
  const base = name.endsWith("Capture") ? name.slice(2, -"Capture".length) : name.slice(2)
  return base.toLowerCase()
}

function attributeName(name: string): string {
  return name === "className" ? "class" : name === "htmlFor" ? "for" : name
}

function runtimeImportBindings(
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): RuntimeImportBindings {
  const createRoot = new Set<number>()
  const hooks = new Map<number, Readonly<{name: string; supported: boolean}>>()
  const memo = new Set<number>()
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue
    if (statement.moduleSpecifier.text !== "@zavx0z/react") continue
    if (statement.importClause?.name) {
      throw compileError(sourcePath, "@zavx0z/react has no default compiler import")
    }
    const named = statement.importClause?.namedBindings
    if (named && !isNamedImports(named)) {
      throw compileError(sourcePath, "@zavx0z/react namespace imports are unsupported")
    }
    if (!named) continue
    for (const specifier of named.elements) {
      const imported = specifier.propertyName?.text ?? specifier.name.text
      const hook = imported === "use" || /^use[A-Z0-9]/.test(imported)
      if (
        (imported === "createRoot" || imported === "memo" || hook) &&
        (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly)
      ) {
        throw compileError(sourcePath, `${imported} must be imported as a runtime value`)
      }
      const id = symbolId(symbols, specifier.name)
      if (id === null) continue
      if (imported === "createRoot") createRoot.add(id)
      else if (imported === "memo") memo.add(id)
      else if (hook) {
        hooks.set(id, Object.freeze({
          name: imported,
          supported: supportedHookNames.has(imported),
        }))
      }
    }
  }
  return Object.freeze({createRoot, hooks, memo})
}

function validateHookCalls(
  sourceFile: SourceFile,
  hookOwners: ReadonlySet<FunctionDeclaration>,
  hooks: ReadonlyMap<number, Readonly<{name: string; supported: boolean}>>,
  customHooks: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): void {
  const walk = (
    node: Node,
    owner: FunctionDeclaration | null,
    guarded: boolean,
  ): void => {
    let nextOwner = owner
    let nextGuarded = guarded
    if (isFunctionLikeDeclaration(node)) {
      if (isFunctionDeclaration(node) && hookOwners.has(node)) {
        nextOwner = node
        nextGuarded = false
      } else if (owner !== null) {
        nextGuarded = true
      } else {
        nextOwner = null
      }
    }
    if (nextOwner !== null && isHookControlFlow(node)) nextGuarded = true

    if (isCallExpression(node) && isIdentifier(node.expression)) {
      const id = symbolId(symbols, node.expression) ?? -1
      const hook = hooks.get(id) ?? (customHooks.has(id)
        ? Object.freeze({name: node.expression.text, supported: true})
        : undefined)
      const hookLikeName = node.expression.text === "use" || /^use[A-Z0-9]/.test(node.expression.text)
      if (hook) {
        if (!hook.supported) {
          throw compileError(sourcePath, `${hook.name} is outside the supported hook profile`)
        }
        if (nextOwner === null) {
          throw compileError(sourcePath, `${hook.name} must be called inside a compiled function component`)
        }
        if (nextGuarded) {
          throw compileError(sourcePath, `${hook.name} must be called unconditionally at component top level`)
        }
      } else if (nextOwner !== null && hookLikeName) {
        throw compileError(
          sourcePath,
          `custom or shadowed hook ${node.expression.text} is outside the active compiler profile`,
        )
      }
    }

    node.forEachChild(child => {
      walk(child, nextOwner, nextGuarded)
      return undefined
    })
  }
  walk(sourceFile, null, false)
}

function isHookControlFlow(node: Node): boolean {
  if (
    isIfStatement(node) || isConditionalExpression(node) || isDoStatement(node) ||
    isForInStatement(node) || isForOfStatement(node) || isForStatement(node) ||
    isSwitchStatement(node) || isTryStatement(node) || isWhileStatement(node) ||
    isWithStatement(node)
  ) return true
  if (!isBinaryExpression(node)) return false
  return node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
    node.operatorToken.kind === SyntaxKind.BarBarToken ||
    node.operatorToken.kind === SyntaxKind.QuestionQuestionToken
}

function componentRootBindings(
  sourceFile: SourceFile,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): ReadonlySet<number> {
  const roots = new Set<number>()
  visit(sourceFile, node => {
    if (!isVariableDeclaration(node) || !isIdentifier(node.name) ||
      !isVariableDeclarationList(node.parent) ||
      (node.parent.flags & NodeFlags.Const) === 0) return
    if (!isCreateRootCall(node.initializer, createRootBindings, symbols)) return
    const id = symbolId(symbols, node.name)
    if (id !== null) roots.add(id)
  })
  return roots
}

function isComponentRootExpression(
  expression: Expression,
  roots: ReadonlySet<number>,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): boolean {
  const value = skipParentheses(expression)
  return isIdentifier(value)
    ? roots.has(symbolId(symbols, value) ?? -1)
    : isCreateRootCall(value, createRootBindings, symbols)
}

function isCreateRootCall(
  expression: Expression | undefined,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): boolean {
  if (!expression) return false
  const value = skipParentheses(expression)
  return isCallExpression(value) && isIdentifier(value.expression) &&
    createRootBindings.has(symbolId(symbols, value.expression) ?? -1)
}

function symbolId(symbols: ReadonlyMap<Node, number>, node: Node): number | null {
  return symbols.get(node) ?? null
}

function isDirectPropsChildrenExpression(
  expression: Expression,
  context: Pick<CompileContext, "propsSymbol" | "symbols">,
): boolean {
  return context.propsSymbol !== null &&
    isPropertyAccessExpression(expression) &&
    expression.name.text === "children" &&
    isIdentifier(expression.expression) &&
    symbolId(context.symbols, expression.expression) === context.propsSymbol
}

function isChildrenNamedExpression(expression: Expression): boolean {
  return isIdentifier(expression)
    ? expression.text === "children"
    : isPropertyAccessExpression(expression) && expression.name.text === "children"
}

function isEmptyJsxChild(child: JsxChild): boolean {
  if (isJsxText(child)) return normalizeJsxText(child.text) === ""
  return isJsxExpression(child) && child.expression === undefined
}

function skipParentheses(expression: Expression): Expression {
  let current = expression
  while (isParenthesizedExpression(current)) current = current.expression
  return skipOuterExpressions(current)
}

function visit(node: Node, callback: (node: Node) => void): void {
  callback(node)
  node.forEachChild((child) => {
    visit(child, callback)
    return undefined
  })
}

function importInsertionOffset(source: string): number {
  const directive = /^(?:(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*;?)*/.exec(source)?.[0] ?? ""
  return directive.length
}

function uniqueHelperPrefix(source: string): string {
  let suffix = 0
  while (source.includes(`__zComp${suffix}`)) suffix += 1
  return `__zComp${suffix}`
}

function applyEdits(
  source: string,
  edits: readonly Edit[],
  sourcePath: string,
  helper: string,
): string {
  const ordered = [...edits].sort((left, right) => left.start - right.start || left.end - right.end)
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index]!.start < ordered[index - 1]!.end) {
      throw compileError(sourcePath, "compiler produced overlapping source edits")
    }
  }
  let result = source
  for (const edit of [...ordered].reverse()) {
    const text = edit.text.replaceAll("__COMPONENT_HELPER__", `${helper}Component`)
    result = `${result.slice(0, edit.start)}${text}${result.slice(edit.end)}`
  }
  return result
}

function assertNoReactRuntimeReferences(sourceFile: SourceFile, sourcePath: string): void {
  const reject = (moduleName: string): void => {
    if (!isReactRuntimeModule(moduleName)) return
    throw compileError(
      sourcePath,
      "React runtime references are forbidden; import hooks and createRoot from @zavx0z/react",
    )
  }
  visit(sourceFile, node => {
    if (isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)) {
      reject(node.moduleSpecifier.text)
      return
    }
    if (isExportDeclaration(node) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      reject(node.moduleSpecifier.text)
      return
    }
    if (isImportEqualsDeclaration(node) && isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression && isStringLiteral(node.moduleReference.expression)) {
      reject(node.moduleReference.expression.text)
      return
    }
    if (!isCallExpression(node) || node.arguments.length === 0 ||
      !isStringLiteral(node.arguments[0]!)) return
    const dynamicImport = node.expression.kind === SyntaxKind.ImportKeyword
    const commonJsRequire = isIdentifier(node.expression) && node.expression.text === "require"
    const commonJsResolve = isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "resolve" && isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "require"
    if (dynamicImport || commonJsRequire || commonJsResolve) reject(node.arguments[0]!.text)
  })
}

function isReactRuntimeModule(moduleName: string): boolean {
  return moduleName === "react" || moduleName.startsWith("react/") ||
    moduleName === "react-dom" || moduleName.startsWith("react-dom/") ||
    moduleName === "react-reconciler" || moduleName.startsWith("react-reconciler/")
}

function assertNoSymbolWrites(
  sourceFile: SourceFile,
  protectedSymbols: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): void {
  const rejectWritten = (node: Node): void => {
    visit(node, candidate => {
      if (!isIdentifier(candidate)) return
      const id = symbolId(symbols, candidate)
      if (id !== null && protectedSymbols.has(id)) {
        throw compileError(
          sourcePath,
          `compiled component binding ${candidate.text} cannot be reassigned`,
        )
      }
    })
  }
  visit(sourceFile, node => {
    if (isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
      rejectWritten(node.left)
      return
    }
    if (isPrefixUnaryExpression(node) || isPostfixUnaryExpression(node)) {
      if (node.operator === SyntaxKind.PlusPlusToken || node.operator === SyntaxKind.MinusMinusToken) {
        rejectWritten(node.operand)
      }
    }
  })
}

function compileError(sourcePath: string, message: string): JsxCompileError {
  return new JsxCompileError(message, sourcePath)
}

function asConditional(node: Node) {
  if (!isConditionalExpression(node)) throw new TypeError("Expected ConditionalExpression")
  return node
}
