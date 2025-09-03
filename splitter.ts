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

/**
 * Курсор по структуре элементов
 *
 * - не устанавливается на самозакрывающиеся теги и void элементы
 *
 */
class Cursor {
  /** Структура элементов по которым двигается курсор */
  child: PartHierarchy[] = []

  constructor(child: PartHierarchy[]) {
    this.child = child
  }

  /** Путь к элементу */
  path: number[] = []
  /** Имена в пути элементов */
  parts: string[] = []

  /** Элемент курсора */
  get element(): PartHierarchy {
    let el: PartHierarchy = this as unknown as PartHierarchy
    for (const path of this.path) {
      const { child } = el as PartElement | PartMeta | PartMap | PartCondition
      el = child![path] as PartHierarchy
    }
    return el
  }

  /** Имя последнего элемента */
  get part() {
    return this.parts[this.parts.length - 1]
  }

  /** Удаляет последний элемент из пути и возвращает его имя */
  back() {
    this.path.pop()
    return this.parts.pop()
  }

  push(name: string) {
    this.parts.push(name)
    this.path.push(this.element.child!.length - 1)
  }
}

class Hierarchy {
  child: PartHierarchy[] = []
  cursor: Cursor
  constructor() {
    this.child = []
    this.cursor = new Cursor(this.child)
  }
  get lastElement(): PartHierarchy {
    const cursorElement = this.cursor.element
    if (Object.hasOwn(cursorElement, "child")) {
      const { child } = cursorElement as PartElement | PartMeta | PartMap | PartCondition
      return child![child!.length - 1] as PartHierarchy
    }
    return cursorElement
  }

  /** Добавляет текст в child массив
   * - не создает курсор на этот блок
   * @param value - текст условия
   */
  text(value: any) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "text", text: value.text })
    return
  }

  /** Добавляет элемент в child массив
   * - не создает курсор на этот блок
   * @param value - текст условия
   */
  self(value: PartElement | PartMeta) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push(value)
    return
  }

  /** Добавляет блок if в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * @param value - текст условия
   */
  if(value: string) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "cond", text: value, child: [] })
    this.cursor.push("if")
    return
  }
  /** Заменяет последний элемент в именах пути
   * для добавления блока else вторым элементом cond в child массиве
   * - создает курсор на этот блок
   * - cursor.path не изменяется
   * - cursor.parts изменяется с if на else
   */
  else() {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    if (this.cursor.part === "if") {
      this.cursor.parts.pop()
      this.cursor.parts.push("else")
    }
    return
  }

  /** Добавляет блок map в child массив
   * - создает курсор на этот блок
   * @param value - текст условия
   */
  map(value: string) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "map", text: value, child: [] })
    this.cursor.parts.push(value)
    return
  }

  /** Добавляет элемент в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * - cursor.parts добавляется с именем тега
   * @param value - текст условия
   */
  open(part: PartElement | PartMeta) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push(part)
    this.cursor.push(part.tag)
    return
  }
  close(tagName: string) {
    /** html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}⬇️</div>`
     *                                              самозакрывающийся тег
     */
    if (this.cursor.part === "else") {
      // выходим из else
      this.cursor.back()
      // закрываем тег
      this.cursor.back()
      return
    } else {
      const deleted = this.cursor.back()
      if (deleted !== tagName) {
        throw new Error(`Expected ${tagName} but got ${deleted}`)
      }
      /** Выходим из else если были в блоке else */
      if (this.cursor.part === "else") {
        this.cursor.back() // удаляем else и выходим из элемента cond
      }
      return
    }
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
