export type StringTreeNode = { string: string; children: StringTreeNode[] }

export type Content = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>
export type Render<C extends Content> = ({
  html,
  core,
  context,
  state,
}: {
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  core: { [key: string]: any }
  context: C
  state: string
}) => void

const RAW_KEEP_AS_IS = new Set(["textarea", "title"])

function extractHtmlFromRender<C extends Content>(render: Render<C>): string {
  const src = render.toString()
  const m = /html\s*`/.exec(src)
  if (!m) return ""
  let i = m.index + m[0].length
  let out = ""
  let inExpr = false
  let depth = 0
  while (i < src.length) {
    const ch = src[i++]
    if (!inExpr && ch === "`") break
    if (!inExpr && ch === "\\") {
      out += ch
      if (i < src.length) out += src[i++]
      continue
    }
    if (!inExpr && ch === "$" && src[i] === "{") {
      inExpr = true
      depth = 1
      out += "${"
      i++
      continue
    }
    if (inExpr) {
      const c = src[i - 1]!
      if (c === "{") depth++
      else if (c === "}") {
        depth--
        if (depth === 0) {
          out += "}"
          inExpr = false
          continue
        }
      }
      out += c
      continue
    }
    out += ch
  }
  return out
}

export function parseHtmlToStringTree<C extends Content>(render: Render<C>): StringTreeNode {
  const src = extractHtmlFromRender(render)
  const root: StringTreeNode = { string: "", children: [] }
  let current = root
  const stack: StringTreeNode[] = []

  let i = 0
  const n = src.length

  const isWsOnly = (s: string) => s.trim().length === 0
  const pushText = (s: string) => {
    if (!isWsOnly(s)) current.children.push({ string: s, children: [] })
  }

  function readTag(start: number): number {
    let j = start + 1
    let q: '"' | "'" | null = null
    let inExpr = false
    let depth = 0
    while (j < n) {
      const ch = src[j]!
      if (!inExpr && (ch === '"' || ch === "'")) {
        q = q === ch ? null : q ? q : ch
        j++
        continue
      }
      if (!q && !inExpr && ch === "$" && src[j + 1] === "{") {
        inExpr = true
        depth = 1
        j += 2
        continue
      }
      if (inExpr) {
        const c = src[j]!
        if (c === "{") depth++
        else if (c === "}") {
          depth--
          if (depth === 0) inExpr = false
        }
        j++
        continue
      }
      if (!q && ch === ">") {
        j++
        break
      }
      j++
    }
    return j
  }

  function tagName(rawTag: string): { name: string; closing: boolean; selfClosing: boolean } {
    const inner = rawTag.slice(1, -1)
    const closing = /^\s*\//.test(inner)
    const selfClosing = /\/\>\s*$/.test(rawTag)
    let s = inner.trim()
    if (closing) s = s.replace(/^\//, "").trim()
    let name = ""
    for (let k = 0; k < s.length; k++) {
      const ch = s[k]!
      if (!/[A-Za-z0-9:_-]/.test(ch)) break
      name += ch
    }
    return { name: name.toLowerCase(), closing, selfClosing }
  }

  while (i < n) {
    const lt = src.indexOf("<", i)
    if (lt === -1) {
      pushText(src.slice(i))
      break
    }
    if (lt > i) pushText(src.slice(i, lt))

    const end = readTag(lt)
    const raw = src.slice(lt, end)

    const { name, closing, selfClosing } = tagName(raw)

    if (closing) {
      current = stack.pop() ?? root
      i = end
      continue
    }

    const node: StringTreeNode = { string: raw, children: [] }
    current.children.push(node)

    if (!selfClosing && RAW_KEEP_AS_IS.has(name)) {
      const lower = src.toLowerCase()
      const closeSeq = `</${name}`
      const bodyStart = end
      const closeIdx = lower.indexOf(closeSeq, bodyStart)
      const body = closeIdx === -1 ? src.slice(bodyStart) : src.slice(bodyStart, closeIdx)
      if (!isWsOnly(body)) node.children.push({ string: body, children: [] })
      i = closeIdx === -1 ? n : readTag(closeIdx)
      continue
    }

    if (!selfClosing) {
      stack.push(current)
      current = node
    }
    i = end
  }

  return root
}
