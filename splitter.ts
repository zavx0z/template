import type { Context, Core, State, RenderParams } from "./index.t"
import type { PartCondition, PartElement, PartHierarchy, PartMap, PartMeta, PartsHierarchy } from "./hierarchy.t"
import { findCondElse, findCondClose, findMapOpen, findMapClose, findAllConditions } from "./token"
import type { StreamToken } from "./token.t"
import { findText } from "./text"
// ============================================================================
// HTML EXTRACTION
// ============================================================================

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

// Быстрый lookahead на теги (включая meta-${...})
const TAG_LOOKAHEAD = /(?=<\/?[A-Za-z][A-Za-z0-9:-]*[^>]*>|<\/?meta-[^>]*>|<\/?meta-\$\{[^}]*\}[^>]*>)/gi

const isValidTagName = (name: string) =>
  (/^[A-Za-z][A-Za-z0-9:-]*$/.test(name) && !name.includes("*")) || name.startsWith("meta-")

const shouldIgnoreAt = (input: string, i: number) => input[i + 1] === "!" || input[i + 1] === "?"

export const extractMainHtmlBlock = <C extends Context = Context, I extends Core = Core, S extends State = State>(
  render: (params: RenderParams<C, I, S>) => void
): string => {
  const src = Function.prototype.toString.call(render)
  const firstIndex = src.indexOf("html`")
  if (firstIndex === -1) throw new Error("функция render не содержит html`")
  const lastBacktick = src.lastIndexOf("`")
  if (lastBacktick === -1 || lastBacktick <= firstIndex) throw new Error("render function does not contain html`")
  const htmlContent = src.slice(firstIndex + 5, lastBacktick)
  return htmlContent.replace(/!0/g, "true").replace(/!1/g, "false")
}

function getTokens(expr: string): StreamToken[] {
  const tokens = new Map<number, StreamToken>()

  // --------- conditions ---------
  const conds = findAllConditions(expr)
  for (const cond of conds) tokens.set(...cond)

  const tokenCondElse = findCondElse(expr)
  tokenCondElse && tokens.set(...tokenCondElse)

  const tokenCondClose = findCondClose(expr)
  tokenCondClose && tokens.set(...tokenCondClose)

  // ------------- map -------------
  const tokenMapOpen = findMapOpen(expr)
  // console.log("tokenMapOpen", expr, tokenMapOpen)
  if (tokenMapOpen) {
    tokens.set(...tokenMapOpen)
  }

  const tokenMapClose = findMapClose(expr)
  if (tokenMapClose) {
    tokens.set(...tokenMapClose)
  }

  // Сортируем по позиции и возвращаем токены
  return Array.from(tokens.entries())
    .sort(([a], [b]) => a - b)
    .map(([, token]) => token)
}

class Hierarchy {
  child: PartHierarchy[] = []
  path: number[] = []
  parts: string[] = []
  get cursorPart() {
    return this.parts[this.parts.length - 1]
  }
  get cursor(): PartHierarchy {
    let el: PartHierarchy = this as unknown as PartHierarchy
    for (const path of this.path) {
      const { child } = el as PartElement | PartMeta | PartMap | PartCondition
      el = child![path] as PartHierarchy
    }
    return el
  }
  get lastPartElement(): PartHierarchy {
    const cursor = this.cursor
    if (Object.hasOwn(cursor, "child")) {
      const { child } = cursor as PartElement | PartMeta | PartMap | PartCondition
      return child![child!.length - 1] as PartHierarchy
    }
    return cursor
  }

  text(value: any) {
    const last = this.cursor as PartElement | PartMeta
    !Object.hasOwn(last, "child") && (last.child = [])
    last.child!.push({ type: "text", text: value.text })
    return
  }

  self(value: PartElement | PartMeta) {
    const cursor = this.cursor as PartElement | PartMeta
    !Object.hasOwn(cursor, "child") && (cursor.child = [])
    cursor.child!.push(value)
    return
  }

  if(value: string) {
    const last = this.cursor as PartElement | PartMeta
    !Object.hasOwn(last, "child") && (last.child = [])
    last.child!.push({ type: "cond", text: value, child: [] })
    this.parts.push("if")
    this.path.push(last.child!.length - 1)
    return
  }

  else() {
    const last = this.cursor as PartElement | PartMeta
    !Object.hasOwn(last, "child") && (last.child = [])
    if (this.cursorPart === "if") {
      this.parts.pop()
      this.parts.push("else")
    }
    return
  }

  map(value: string) {
    const last = this.cursor as PartElement | PartMeta
    !Object.hasOwn(last, "child") && (last.child = [])
    last.child!.push({ type: "map", text: value, child: [] })
    this.parts.push(value)
    return
  }

  open(part: PartElement | PartMeta) {
    const last = this.cursor as PartElement | PartMeta
    !Object.hasOwn(last, "child") && (last.child = [])
    last.child!.push(part)
    this.path.push(last.child!.length - 1)
    this.parts.push(part.tag)
    return
  }
  close(tagName: string) {
    /** html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}⬇️</div>`
     *                                              самозакрывающийся тег
     */
    if (this.cursorPart === "else") {
      // выходим из else
      this.parts.pop()
      this.path.pop()
      // закрываем тег
      this.parts.pop()
      this.path.pop()
      return
    } else if (this.parts.pop() !== tagName) {
      throw new Error(`Expected ${tagName} but got ${this.parts[this.parts.length - 1]}`)
    }
    this.path.pop()
    /** Выходим из else */
    if (this.cursorPart === "else") {
      this.parts.pop() // удаляем else
      this.path.pop() // выходим из элемента cond
    }
    return
  }
}

export const extractHtmlElements = (input: string): PartsHierarchy => {
  const cursor = new Hierarchy()

  let lastIndex = 0

  TAG_LOOKAHEAD.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = TAG_LOOKAHEAD.exec(input)) !== null) {
    const localIndex = m.index
    if (shouldIgnoreAt(input, localIndex)) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    // текст между предыдущим и текущим тегом
    const sliced = input.slice(lastIndex, localIndex).trim()
    if (sliced) {
      const text = findText(sliced, lastIndex)
      text && cursor.text(text)

      const tokens = getTokens(sliced)
      for (const token of tokens) {
        switch (token.kind) {
          case "cond-open":
            cursor.if(token.expr)
            break
          case "cond-else":
            cursor.else()
            break
          case "cond-close":
            break
          case "map-open":
            cursor.map(token.sig)
            break
          case "map-close":
            cursor.close("map")
            break
        }
      }
    }

    const tagStart = localIndex
    let tagEnd = -1
    let i = localIndex + 1

    while (i < input.length) {
      const ch = input[i]

      if (ch === ">") {
        tagEnd = i + 1
        break
      }

      if (ch === `"` || ch === `'`) {
        const quote = ch
        i++
        while (i < input.length && input[i] !== quote) {
          if (input[i] === "\\") {
            i += 2
            continue
          }
          if (input[i] === "$" && input[i + 1] === "{") {
            i += 2
            let b = 1
            while (i < input.length && b > 0) {
              if (input[i] === "{") b++
              else if (input[i] === "}") b--
              i++
            }
            continue
          }
          i++
        }
        if (i < input.length) i++
        continue
      }

      if (ch === "$" && input[i + 1] === "{") {
        i += 2
        let b = 1
        while (i < input.length && b > 0) {
          if (input[i] === "{") b++
          else if (input[i] === "}") b--
          i++
        }
        continue
      }

      i++
    }

    if (tagEnd === -1) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    const full = input.slice(tagStart, tagEnd)

    let name = ""
    let valid = false

    const tagNameMatch = full.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s|>|\/)/i)
    if (tagNameMatch) {
      name = (tagNameMatch[1] || "").toLowerCase()
      valid = isValidTagName(tagNameMatch[1] || "")
    }

    if (!valid) {
      const metaMatch = full.match(/^<\/?(meta-\$\{[^}]+\})/i)
      if (metaMatch) {
        name = metaMatch[1] || ""
        valid = true
      }
    }

    if (!valid) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    if (full.startsWith("</")) {
      cursor.close(name)
    } else if (full.endsWith("/>")) {
      cursor.self({ tag: name, type: "el", text: full })
    } else if (VOID_TAGS.has(name) && !name.startsWith("meta-")) {
      cursor.self({ tag: name, type: "el", text: full })
    } else {
      cursor.open({ tag: name, type: "el", text: full })
    }

    TAG_LOOKAHEAD.lastIndex = tagEnd
    lastIndex = tagEnd
  }

  return cursor.child
}

const formatAttributeText = (text: string): string =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
