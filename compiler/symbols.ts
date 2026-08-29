import {relative, resolve, sep} from "node:path"
import {realpathSync} from "node:fs"
import {
  SymbolFlags,
  TypeFlags,
  type Checker,
  type Project,
  type Symbol as TypeScriptSymbol,
  type Type,
} from "typescript/unstable/async"
import type {
  Expression,
  Identifier,
  Node,
  SourceFile,
  VariableDeclaration,
} from "typescript/unstable/ast"
import {NodeFlags} from "typescript/unstable/ast"
import {
  isBlock,
  isCallExpression,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isExpression,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isNamedImports,
  isParenthesizedExpression,
  isReturnStatement,
  isStringLiteral,
  isVariableDeclaration,
  isVariableDeclarationList,
} from "typescript/unstable/ast/is"
import {skipOuterExpressions, SyntaxKind} from "typescript/unstable/ast"
import {JsxCompileError} from "./errors.ts"
import type {
  JsxChildrenExpressionKind,
  JsxTransformSymbols
} from "./transform.ts"
import type {JsxStylePrimitiveKind} from "./style.ts"

const jsxSourceElementMarker = "@zavx0z/template/jsx-source-element"

export async function buildJsxTransformSymbols(
  sourceFile: SourceFile,
  project: Project,
  sourceRoots: readonly string[],
): Promise<JsxTransformSymbols> {
  const identifiers: Identifier[] = []
  visit(sourceFile, node => {
    if (isIdentifier(node)) identifiers.push(node)
  })
  const resolvedSymbols = await project.checker.getSymbolAtLocation(identifiers)
  const byNode = new Map<Node, number>()
  const objects = new Map<Node, TypeScriptSymbol>()
  for (let index = 0; index < identifiers.length; index += 1) {
    const symbol = resolvedSymbols[index]
    if (!symbol) continue
    byNode.set(identifiers[index]!, symbol.id)
    objects.set(identifiers[index]!, symbol)
  }

  const importedComponents = new Set<number>()
  const importedCustomHooks = new Set<number>()
  const dependencyPaths = new Set<string>()
  const styleExpressions: Expression[] = []
  const dynamicChildren: Expression[] = []
  visit(sourceFile, node => {
    if (isJsxExpression(node) && node.expression) dynamicChildren.push(node.expression)
    if (!isJsxAttribute(node) || node.name.getText(sourceFile) !== "style" ||
      !node.initializer || !isJsxExpression(node.initializer) || !node.initializer.expression) return
    visit(node.initializer.expression, child => {
      if (isExpression(child)) styleExpressions.push(child)
    })
  })
  const childTypes = await project.checker.getTypeAtLocation(dynamicChildren)
  const arrayExpressions = new Set<Node>()
  const childrenExpressionKinds = new Map<Node, JsxChildrenExpressionKind>()
  const classifiedTypes = new Map<number, Promise<JsxChildrenExpressionKind>>()
  for (let index = 0; index < dynamicChildren.length; index += 1) {
    const expression = skipParentheses(dynamicChildren[index]!)
    const type = childTypes[index]
    if (type && (
      await project.checker.isArrayType(type) || await project.checker.isTupleType(type)
    )) arrayExpressions.add(expression)
    if (!type) {
      childrenExpressionKinds.set(expression, "unsupported")
      continue
    }
    let classified = classifiedTypes.get(type.id)
    if (!classified) {
      classified = classifyChildrenExpressionType(type, project.checker)
      classifiedTypes.set(type.id, classified)
    }
    childrenExpressionKinds.set(expression, await classified)
  }
  const styleTypes = await project.checker.getTypeAtLocation(styleExpressions)
  const stylePrimitiveKinds = new Map<Node, JsxStylePrimitiveKind>()
  for (let index = 0; index < styleExpressions.length; index += 1) {
    const expression = skipParentheses(styleExpressions[index]!)
    const type = styleTypes[index]
    stylePrimitiveKinds.set(
      expression,
      type ? await classifyStylePrimitiveType(type) : "unsupported",
    )
  }
  const jsxTagSymbols = new Set<number>()
  const callSymbols = new Set<number>()
  visit(sourceFile, node => {
    if (!isJsxElement(node) && !isJsxSelfClosingElement(node)) return
    const opening = isJsxElement(node) ? node.openingElement : node
    if (!isIdentifier(opening.tagName) || !/^[A-Z]/.test(opening.tagName.text)) return
    const id = byNode.get(opening.tagName)
    if (id !== undefined) jsxTagSymbols.add(id)
  })
  visit(sourceFile, node => {
    if (!isCallExpression(node) || !isIdentifier(node.expression)) return
    const id = byNode.get(node.expression)
    if (id !== undefined) callSymbols.add(id)
  })
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue
    const moduleName = statement.moduleSpecifier.text
    if (moduleName === "@zavx0z/react" || isReactRuntimeModule(moduleName)) continue
    const clause = statement.importClause
    if (clause?.name && /^[A-Z]/.test(clause.name.text)) {
      const alias = objects.get(clause.name)
      if (alias && jsxTagSymbols.has(alias.id)) {
        throw new JsxCompileError(
          "default imported components are outside the active compiler profile",
          sourceFile.fileName,
        )
      }
    }
    if (!clause?.namedBindings || !isNamedImports(clause.namedBindings)) continue
    for (const specifier of clause.namedBindings.elements) {
      const componentCandidate = /^[A-Z]/.test(specifier.name.text)
      const hookCandidate = /^use[A-Z0-9]/.test(specifier.name.text)
      if (!componentCandidate && !hookCandidate) continue
      const alias = objects.get(specifier.name)
      if (!alias) {
        throw new JsxCompileError(`Cannot resolve imported component ${specifier.name.text}`, sourceFile.fileName)
      }
      const target = await project.checker.getAliasedSymbol(alias)
      const usedAsComponent = componentCandidate && (
        jsxTagSymbols.has(alias.id) || jsxTagSymbols.has(target.id)
      )
      const usedAsHook = hookCandidate && (callSymbols.has(alias.id) || callSymbols.has(target.id))
      if (!usedAsComponent && !usedAsHook) continue
      if (clause.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) {
        throw new JsxCompileError(
          `Type-only import ${specifier.name.text} cannot be used at runtime`,
          sourceFile.fileName,
        )
      }
      if (usedAsComponent) {
        const valid = await hasGovernedComponentDeclaration(
          target,
          project,
          sourceRoots,
          dependencyPaths,
          new Set(),
        )
        if (!valid) {
          throw new JsxCompileError(
            `Imported component ${specifier.name.text} does not resolve to a governed function component`,
            sourceFile.fileName,
          )
        }
        importedComponents.add(alias.id)
        importedComponents.add(target.id)
      }
      if (usedAsHook) {
        const valid = await hasGovernedCustomHookDeclaration(
          target,
          project,
          sourceRoots,
          dependencyPaths,
        )
        if (!valid) {
          throw new JsxCompileError(
            `Imported hook ${specifier.name.text} does not resolve to a governed custom hook`,
            sourceFile.fileName,
          )
        }
        importedCustomHooks.add(alias.id)
        importedCustomHooks.add(target.id)
      }
    }
  }

  for (const dependencyPath of dependencyPaths) {
    if (comparablePath(dependencyPath) === comparablePath(sourceFile.fileName)) {
      dependencyPaths.delete(dependencyPath)
    }
  }
  return Object.freeze({
    arrayExpressions,
    byNode,
    childrenExpressionKinds,
    dependencyPaths,
    importedComponents,
    importedCustomHooks,
    sourceIdentity: jsxSourceIdentity(sourceFile.fileName, sourceRoots),
    stylePrimitiveKinds,
  })
}

async function classifyStylePrimitiveType(type: Type): Promise<JsxStylePrimitiveKind> {
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
    return "unsupported"
  }
  const parts = type.isUnionType() ? await type.getTypes() : [type]
  let kind: JsxStylePrimitiveKind | null = null
  for (const part of parts) {
    const next = (part.flags & (TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void)) !== 0
      ? "nullish"
      : (part.flags & TypeFlags.StringLike) !== 0
        ? "string"
        : (part.flags & TypeFlags.NumberLike) !== 0
          ? "number"
          : "unsupported"
    if (next === "unsupported" || (kind !== null && kind !== next)) return "unsupported"
    kind = next
  }
  return kind ?? "unsupported"
}

function jsxSourceIdentity(sourcePath: string, roots: readonly string[]): string {
  const candidates = roots
    .map((root, index) => ({index, root}))
    .filter(({root}) => inside(root, sourcePath))
    .sort((left, right) => right.root.length - left.root.length)
  const owner = candidates[0]
  if (!owner) return sourcePath.replaceAll("\\", "/")
  return `${owner.index}:${relative(owner.root, sourcePath).replaceAll("\\", "/")}`
}

async function classifyChildrenExpressionType(
  type: Type,
  checker: Checker,
): Promise<JsxChildrenExpressionKind> {
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
    return "unsupported"
  }
  const parts = type.isUnionType() ? await type.getTypes() : [type]
  let component = false
  let keyed = false
  let nullable = false
  let text = false
  for (const part of parts) {
    if ((part.flags & (TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void)) !== 0) {
      nullable = true
      continue
    }
    if (isTextChildType(part)) {
      text = true
      continue
    }
    if (await isJsxSourceElementType(part, checker)) {
      component = true
      continue
    }
    if (await isJsxSourceElementArrayType(part, checker)) {
      keyed = true
      continue
    }
    return "unsupported"
  }
  const activeKinds = Number(component) + Number(keyed) + Number(text)
  if (activeKinds !== 1) return "unsupported"
  if (keyed) return nullable ? "unsupported" : "keyed-components"
  if (component) return nullable ? "nullable-component" : "component"
  return "text"
}

function isTextChildType(type: Type): boolean {
  return (type.flags & (
    TypeFlags.StringLike |
    TypeFlags.NumberLike |
    TypeFlags.BigIntLike |
    TypeFlags.BooleanLike
  )) !== 0
}

async function isJsxSourceElementType(type: Type, checker: Checker): Promise<boolean> {
  const marker = await checker.getPropertyOfType(type, jsxSourceElementMarker)
  if (!marker) return false
  const markerType = await checker.getTypeOfSymbol(marker)
  return markerType?.isBooleanLiteralType() === true && markerType.value === true
}

async function isJsxSourceElementArrayType(type: Type, checker: Checker): Promise<boolean> {
  const exactArray = await checker.isArrayType(type) || await checker.isTupleType(type)
  if (!exactArray && !await isReadonlyArrayType(type)) return false
  if (!type.isTypeReference()) return false
  const elementTypes = await checker.getTypeArguments(type)
  if (elementTypes.length === 0) return false
  for (const elementType of elementTypes) {
    if (!await isJsxSourceElementType(elementType, checker)) return false
  }
  return true
}

async function isReadonlyArrayType(type: Type): Promise<boolean> {
  if (!type.isTypeReference()) return false
  const target = await type.getTarget()
  return (await target.getSymbol())?.name === "ReadonlyArray"
}

async function hasGovernedComponentDeclaration(
  symbol: TypeScriptSymbol,
  project: Project,
  roots: readonly string[],
  dependencyPaths: Set<string>,
  visitedSymbols: Set<number>,
): Promise<boolean> {
  if (visitedSymbols.has(symbol.id)) return false
  visitedSymbols.add(symbol.id)
  for (const handle of symbol.declarations) {
    if (!roots.some(root => inside(root, handle.path))) continue
    dependencyPaths.add(resolve(handle.path))
    const declaration = await handle.resolve(project)
    if (declaration && isSupportedFunctionComponent(declaration)) return true
    if (
      declaration && isVariableDeclaration(declaration) &&
      await isGovernedMemoComponent(
        declaration,
        project,
        roots,
        dependencyPaths,
        visitedSymbols,
      )
    ) return true
  }
  return false
}

async function isGovernedMemoComponent(
  declaration: VariableDeclaration,
  project: Project,
  roots: readonly string[],
  dependencyPaths: Set<string>,
  visitedSymbols: Set<number>,
): Promise<boolean> {
  if (!isVariableDeclarationList(declaration.parent) ||
    (declaration.parent.flags & NodeFlags.Const) === 0) return false
  const initializer = declaration.initializer
  if (!initializer || !isCallExpression(initializer) || !isIdentifier(initializer.expression) ||
    initializer.arguments.length < 1 || initializer.arguments.length > 2 ||
    !isIdentifier(initializer.arguments[0]!)) return false
  if (!await isExactRuntimeMemo(initializer.expression, project)) return false
  const baseAlias = await project.checker.getSymbolAtLocation(initializer.arguments[0]!)
  if (!baseAlias) return false
  const base = (baseAlias.flags & SymbolFlags.Alias) !== 0
    ? await project.checker.getAliasedSymbol(baseAlias)
    : baseAlias
  return hasGovernedComponentDeclaration(
    base,
    project,
    roots,
    dependencyPaths,
    visitedSymbols,
  )
}

async function isExactRuntimeMemo(identifier: Identifier, project: Project): Promise<boolean> {
  const sourceFile = identifier.getSourceFile()
  const identifierSymbol = await project.checker.getSymbolAtLocation(identifier)
  if (!identifierSymbol) return false
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "@zavx0z/react") continue
    const named = statement.importClause?.namedBindings
    if (!named || !isNamedImports(named)) continue
    for (const specifier of named.elements) {
      if ((specifier.propertyName?.text ?? specifier.name.text) !== "memo") continue
      if (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) {
        continue
      }
      const importSymbol = await project.checker.getSymbolAtLocation(specifier.name)
      if (importSymbol?.id === identifierSymbol.id) return true
    }
  }
  return false
}

async function hasGovernedCustomHookDeclaration(
  symbol: TypeScriptSymbol,
  project: Project,
  roots: readonly string[],
  dependencyPaths: Set<string>,
): Promise<boolean> {
  for (const handle of symbol.declarations) {
    if (!roots.some(root => inside(root, handle.path))) continue
    dependencyPaths.add(resolve(handle.path))
    const declaration = await handle.resolve(project)
    if (!declaration || !isFunctionDeclaration(declaration) || !declaration.name ||
      !/^use[A-Z0-9]/.test(declaration.name.text) || !declaration.body ||
      !isBlock(declaration.body) || declaration.asteriskToken) continue
    const modifiers = declaration.modifiers?.map(modifier =>
      modifier.getText(declaration.getSourceFile())) ?? []
    if (!modifiers.includes("default") && !modifiers.includes("async")) return true
  }
  return false
}

function isSupportedFunctionComponent(node: Node): boolean {
  if (!isFunctionDeclaration(node) || !node.name || !/^[A-Z]/.test(node.name.text)) return false
  if (!node.body || !isBlock(node.body) || node.asteriskToken || node.parameters.length > 1) return false
  if (node.typeParameters && node.typeParameters.length > 0) return false
  if (node.parameters[0]?.dotDotDotToken) return false
  const modifiers = node.modifiers?.map(modifier => modifier.getText(node.getSourceFile())) ?? []
  if (modifiers.includes("default") || modifiers.includes("async")) return false
  const returns = node.body.statements.filter(isReturnStatement)
  if (returns.length !== 1 || returns[0] !== node.body.statements.at(-1) || !returns[0]!.expression) {
    return false
  }
  const expression = skipParentheses(returns[0]!.expression!)
  return isJsxElement(expression) || isJsxSelfClosingElement(expression) || isJsxFragment(expression)
}

function skipParentheses(expression: Expression): Expression {
  let current = expression
  while (isParenthesizedExpression(current)) current = current.expression
  return skipOuterExpressions(current)
}

function inside(root: string, path: string): boolean {
  const metadata = relative(comparablePath(root), comparablePath(path))
  return metadata === "" || (
    metadata !== ".." && !metadata.startsWith(`..${sep}`) && !metadata.startsWith(sep)
  )
}

function comparablePath(path: string): string {
  const resolved = resolve(path)
  let absolute = resolved
  try {
    absolute = realpathSync.native(resolved)
  } catch {
    // TypeScript can report a deleted declaration while the snapshot is updating.
  }
  return process.platform === "darwin" || process.platform === "win32"
    ? absolute.toLowerCase()
    : absolute
}

function isReactRuntimeModule(moduleName: string): boolean {
  return moduleName === "react" || moduleName.startsWith("react/") ||
    moduleName === "react-dom" || moduleName.startsWith("react-dom/") ||
    moduleName === "react-reconciler" || moduleName.startsWith("react-reconciler/")
}

function visit(node: Node, callback: (node: Node) => void): void {
  callback(node)
  node.forEachChild(child => {
    visit(child, callback)
    return undefined
  })
}
