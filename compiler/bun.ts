import {realpathSync, statSync} from "node:fs"
import {stat} from "node:fs/promises"
import {dirname, extname, relative, resolve, sep} from "node:path"
import {JsxCompilerSession} from "./session.ts"

export type CreateTemplateJsxPluginOptions = Readonly<{
  /** Base for relative source roots and TypeScript project discovery. */
  cwd?: string
  /** Keep the TypeScript session across incremental dev-server rebuilds. */
  persistent?: boolean
  sourceRoots: readonly string[]
}>

export function createTemplateJsxBunPlugin(
  options: CreateTemplateJsxPluginOptions,
): Bun.BunPlugin {
  const configuredCwd = resolve(options.cwd ?? process.cwd())
  const roots = options.sourceRoots.map((root) => resolve(configuredCwd, root))
  if (roots.length === 0) throw new TypeError("Template JSX plugin requires at least one source root")
  const session = new JsxCompilerSession({
    cwd: options.cwd === undefined ? commonCwd(roots) : configuredCwd,
    sourceRoots: roots
  })
  let refresh = Promise.resolve()
  return {
    name: "zavx0z-template-jsx",
    setup(builder) {
      const hasBuildLifecycle = typeof builder.onStart === "function" &&
        typeof builder.onEnd === "function"
      if (!hasBuildLifecycle && options.persistent !== true) {
        throw new Error(
          "runtime Bun.plugin registration requires persistent: true for the Template JSX compiler",
        )
      }
      if (hasBuildLifecycle) {
        builder.onStart(() => {
          refresh = discoverSourceFiles(roots).then(files => session.refreshFiles(files))
          return refresh
        })
      }
      builder.onLoad({filter: /\.(?:[cm]?jsx|[cm]?tsx)$/}, async ({path}) => {
        if (!roots.some((root) => inside(root, path))) return undefined
        await refresh
        const code = await session.transformFile(path)
        return {contents: code, loader: sourceLoader(extname(path))}
      })
      if (hasBuildLifecycle && options.persistent !== true) builder.onEnd(() => session.close())
    },
  }
}

const discoverSourceFiles = async (roots: readonly string[]): Promise<readonly string[]> => {
  const files: string[] = []
  const pattern = new Bun.Glob("**/*.{js,jsx,ts,tsx,mjs,mjsx,mts,mtsx,cjs,cjsx,cts,ctsx}")
  for (const root of roots) {
    const metadata = await stat(root)
    if (metadata.isFile()) {
      files.push(root)
      continue
    }
    for await (const path of pattern.scan({cwd: root, onlyFiles: true})) {
      if (path.split(sep).includes("node_modules")) continue
      files.push(resolve(root, path))
    }
  }
  return Object.freeze(files)
}

const inside = (root: string, path: string): boolean => {
  const child = relative(comparablePath(root), comparablePath(path))
  return child === "" || (!child.startsWith(`..${sep}`) && child !== ".." && !child.startsWith(sep))
}

const comparablePath = (path: string): string => {
  const resolved = resolve(path)
  let absolute = resolved
  try {
    absolute = realpathSync.native(resolved)
  } catch {
    // A missing source will be reported by the owning compiler operation.
  }
  return process.platform === "darwin" || process.platform === "win32"
    ? absolute.toLowerCase()
    : absolute
}

const commonCwd = (roots: readonly string[]): string => {
  let candidate = statSync(roots[0]!).isDirectory() ? roots[0]! : dirname(roots[0]!)
  while (!roots.every(root => inside(candidate, root))) {
    const parent = dirname(candidate)
    if (parent === candidate) return candidate
    candidate = parent
  }
  return candidate
}

const sourceLoader = (extension: string): "js" | "jsx" | "ts" | "tsx" => {
  if (extension === ".jsx") return "jsx"
  if (extension === ".tsx") return "tsx"
  if (extension.endsWith("js")) return "js"
  return "ts"
}
