import {API, type Snapshot} from "typescript/unstable/async"
import {createHash} from "node:crypto"
import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import {JsxCompileError} from "./errors.ts"
import {GovernedFiles} from "./governed-paths.ts"
import {transformJsxSourceFile} from "./transform.ts"
import {buildJsxTransformSymbols} from "./symbols.ts"

export type JsxCompilerStats = Readonly<{
  cacheHits: number
  cacheMisses: number
  snapshots: number
}>

export type JsxCompilerSessionOptions = Readonly<{
  cwd: string
  sourceRoots: readonly string[]
  styleSourceRootIds?: readonly string[]
}>

type DependencyFingerprint = Readonly<{
  authorization: string
  hash: string
  path: string
}>
type CachedTransform = Readonly<{
  code: string
  dependencies: readonly DependencyFingerprint[]
  hash: string
}>

export class JsxCompilerSession {
  private readonly api: API
  private readonly cache = new Map<string, CachedTransform>()
  private readonly governedFiles: GovernedFiles
  private readonly hashes = new Map<string, string>()
  private readonly opened = new Set<string>()
  private snapshot: Snapshot | null = null
  private pending: Promise<void> = Promise.resolve()
  private cacheHits = 0
  private cacheMisses = 0
  private snapshots = 0
  private closed = false
  readonly cwd: string
  readonly sourceRoots: readonly string[]
  readonly styleSourceRootIds: readonly string[] | null

  constructor(options: JsxCompilerSessionOptions) {
    this.cwd = resolve(options.cwd)
    this.sourceRoots = Object.freeze(options.sourceRoots.map(root => resolve(root)))
    if (this.sourceRoots.length === 0) {
      throw new TypeError("JSX compiler session requires at least one source root")
    }
    this.styleSourceRootIds = normalizeStyleSourceRootIds(
      options.styleSourceRootIds,
      this.sourceRoots.length,
    )
    this.governedFiles = new GovernedFiles(this.sourceRoots)
    this.api = new API({cwd: this.cwd})
  }

  get stats(): JsxCompilerStats {
    return Object.freeze({
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      snapshots: this.snapshots,
    })
  }

  async prepareFiles(sourcePaths: readonly string[]): Promise<void> {
    await this.refreshFiles(sourcePaths)
  }

  async refreshFiles(sourcePaths: readonly string[]): Promise<void> {
    await this.exclusive(() => this.refreshFilesLocked(sourcePaths))
  }

  async transformFile(sourcePath: string): Promise<string> {
    return this.exclusive(() => this.transformFileLocked(sourcePath))
  }

  private async transformFileLocked(sourcePath: string): Promise<string> {
    if (this.closed) throw new Error("JSX compiler session is closed")
    const absolute = this.requireGoverned(resolve(sourcePath))
    const text = await readFile(absolute, "utf8")
    const hash = sourceHash(text)
    const previousHash = this.hashes.get(absolute)
    if (previousHash !== undefined && previousHash !== hash) {
      this.cache.clear()
      if (this.opened.has(absolute)) {
        await this.updateSnapshot({fileChanges: {changed: [absolute]}})
      }
    }
    this.hashes.set(absolute, hash)
    const cached = this.cache.get(absolute)
    if (cached?.hash === hash) {
      const changedDependencies = await this.changedDependencies(cached.dependencies)
      if (changedDependencies.length === 0) {
        this.cacheHits += 1
        return cached.code
      }
      this.cache.clear()
      this.api.clearSourceFileCache()
      await this.updateSnapshot({
        openFiles: [...changedDependencies],
        fileChanges: {changed: [...changedDependencies]},
      })
      for (const dependency of changedDependencies) this.opened.add(dependency)
    }

    if (!this.snapshot || !this.opened.has(absolute)) {
      await this.updateSnapshot({openFiles: [absolute]})
      this.opened.add(absolute)
    }
    let project = await this.snapshot!.getDefaultProjectForFile(absolute)
    if (!project) throw new JsxCompileError("TypeScript 7 found no project", absolute)
    let sourceFile = await project.program.getSourceFile(absolute)
    if (!sourceFile) throw new JsxCompileError("TypeScript 7 returned no source AST", absolute)
    if (sourceFile.text !== text) {
      await this.updateSnapshot({fileChanges: {changed: [absolute]}})
      project = await this.snapshot!.getDefaultProjectForFile(absolute)
      if (!project) throw new JsxCompileError("TypeScript 7 found no project", absolute)
      sourceFile = await project.program.getSourceFile(absolute)
      if (!sourceFile || sourceFile.text !== text) {
        throw new JsxCompileError("on-disk source differs from compiler input", absolute)
      }
    }
    const syntaxDiagnostics = await project.program.getSyntacticDiagnostics(absolute)
    if (syntaxDiagnostics.length > 0) {
      throw new JsxCompileError(
        `TypeScript syntax diagnostics: ${syntaxDiagnostics.map(diagnostic => diagnostic.code).join(", ")}`,
        absolute,
      )
    }
    const symbols = await buildJsxTransformSymbols(sourceFile, project, this.governedFiles)
    const styleSourceModuleId = this.styleSourceModuleId(absolute)
    const code = transformJsxSourceFile(
      sourceFile,
      symbols,
      styleSourceModuleId === undefined ? {} : {styleSourceModuleId},
    )
    const dependencies = await this.fingerprintDependencies(symbols.dependencyPaths)
    this.cache.set(absolute, Object.freeze({hash, code, dependencies}))
    this.cacheMisses += 1
    return code
  }

  async close(): Promise<void> {
    await this.pending
    if (this.closed) return
    this.closed = true
    await this.snapshot?.dispose()
    this.snapshot = null
    await this.api.close()
  }

  private styleSourceModuleId(sourcePath: string): string | undefined {
    if (this.styleSourceRootIds === null) return undefined
    const owner = this.governedFiles.matchFile(sourcePath)
    if (!owner) return undefined
    const relativePath = owner.relativePath.replaceAll("\\", "/")
    const rootId = this.styleSourceRootIds[owner.rootIndex]!
    return relativePath === "" ? rootId : `${rootId}/${relativePath}`
  }

  private exclusive<Result>(callback: () => Promise<Result>): Promise<Result> {
    const result = this.pending.then(callback, callback)
    this.pending = result.then(() => undefined, () => undefined)
    return result
  }

  private async updateSnapshot(
    parameters: Parameters<API["updateSnapshot"]>[0]
  ): Promise<void> {
    const previous = this.snapshot
    this.snapshot = await this.api.updateSnapshot(parameters)
    this.snapshots += 1
    await previous?.dispose()
  }

  private async refreshFilesLocked(sourcePaths: readonly string[]): Promise<void> {
    if (this.closed) throw new Error("JSX compiler session is closed")
    this.governedFiles.refresh()
    const files = [...new Set(sourcePaths.map(sourcePath => this.requireGoverned(resolve(sourcePath))))]
    const hashes = await Promise.all(files.map(async sourcePath => {
      const text = await readFile(sourcePath, "utf8")
      return sourceHash(text)
    }))
    const openFiles: string[] = []
    const changed: string[] = []
    for (let index = 0; index < files.length; index += 1) {
      const sourcePath = files[index]!
      const hash = hashes[index]!
      if (!this.opened.has(sourcePath)) openFiles.push(sourcePath)
      else if (this.hashes.get(sourcePath) !== hash) changed.push(sourcePath)
      this.hashes.set(sourcePath, hash)
    }
    if (changed.length > 0) this.cache.clear()
    if (openFiles.length === 0 && changed.length === 0) return
    if (changed.length > 0) this.api.clearSourceFileCache()
    await this.updateSnapshot({
      ...(openFiles.length === 0 ? {} : {openFiles}),
      ...(changed.length === 0 ? {} : {fileChanges: {changed}}),
    })
    for (const sourcePath of openFiles) this.opened.add(sourcePath)
  }

  private async changedDependencies(
    dependencies: readonly DependencyFingerprint[],
  ): Promise<readonly string[]> {
    const changed: string[] = []
    for (const dependency of dependencies) {
      const text = await readFile(dependency.path, "utf8")
      const hash = sourceHash(text)
      this.hashes.set(dependency.path, hash)
      const authorization = this.governedFiles.authorizationKey(dependency.path)
      if (hash !== dependency.hash || authorization !== dependency.authorization) {
        changed.push(dependency.path)
      }
    }
    return changed
  }

  private async fingerprintDependencies(
    dependencyPaths: ReadonlySet<string>,
  ): Promise<readonly DependencyFingerprint[]> {
    const dependencies: DependencyFingerprint[] = []
    for (const path of [...dependencyPaths].sort()) {
      const text = await readFile(path, "utf8")
      const hash = sourceHash(text)
      const authorization = this.governedFiles.authorizationKey(path)
      if (authorization === null) {
        throw new JsxCompileError("dependency is outside the governed JSX roots", path)
      }
      this.hashes.set(path, hash)
      dependencies.push(Object.freeze({authorization, hash, path}))
    }
    return Object.freeze(dependencies)
  }

  private requireGoverned(sourcePath: string): string {
    if (this.governedFiles.matchFile(sourcePath) !== null) return sourcePath
    throw new JsxCompileError("source is outside the governed JSX roots", sourcePath)
  }
}

function normalizeStyleSourceRootIds(
  source: readonly string[] | undefined,
  expectedLength: number,
): readonly string[] | null {
  if (source === undefined) return null
  if (!Array.isArray(source) || source.length !== expectedLength) {
    throw new TypeError("styleSourceRootIds must match sourceRoots")
  }
  const ids = source.map(id => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new TypeError("styleSourceRootIds require non-empty strings")
    }
    return id.trim().replace(/\/$/, "")
  })
  return Object.freeze(ids)
}

function sourceHash(source: string): string {
  return createHash("sha256").update(source).digest("hex")
}
