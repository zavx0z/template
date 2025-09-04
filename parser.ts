import type { Context, Core, State, RenderParams } from "./index.t"
import { findMapOpen, findMapClose } from "./map"
import { findCondElse, findCondClose, findAllConditions } from "./cond"
import { findText, formatAttributeText } from "./text"
import { VOID_TAGS } from "./element"
import type {
  StreamToken,
  PartHierarchy,
  PartElement,
  PartMeta,
  PartMap,
  PartCondition,
  PartsHierarchy,
} from "./parser.t"
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

  const text = findText(expr)
  text && tokens.set(text.start, { text: text.text, kind: "text" })

  const isNotInText = (index: number) => (text ? index < text.start || index > text.end : true)
  // --------- conditions ---------
  const conds = findAllConditions(expr)
  for (const cond of conds) {
    if (isNotInText(cond[0])) {
      tokens.set(...cond)
    }
  }
  const tokenCondElse = findCondElse(expr)
  if (tokenCondElse && isNotInText(tokenCondElse[0])) {
    tokens.set(...tokenCondElse)
  }

  const tokenCondClose = findCondClose(expr)
  if (tokenCondClose && isNotInText(tokenCondClose[0])) {
    tokens.set(...tokenCondClose)
  }

  // ------------- map -------------
  const tokenMapOpen = findMapOpen(expr)
  // console.log("tokenMapOpen", expr, tokenMapOpen)
  if (tokenMapOpen && isNotInText(tokenMapOpen[0])) {
    tokens.set(...tokenMapOpen)
  }

  const tokenMapClose = findMapClose(expr)
  if (tokenMapClose && isNotInText(tokenMapClose[0])) {
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
    this.path.push((this.element as unknown as PartElement | PartMeta).child!.length - 1)
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
  text(value: string) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "text", text: value })
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
    this.cursor.push("map")
    return
  }

  /** Добавляет элемент в child массив
   * - не создает курсор на этот блок
   * @param part - текст условия
   */
  self(part: PartElement | PartMeta) {
    const curEl = this.cursor.element as PartElement | PartMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push(part)
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
  #recursiveCloseMultipleElse() {
    if (this.cursor.part === "else") {
      this.cursor.back()
      this.#recursiveCloseMultipleElse()
    }
  }
  close(tagName: string) {
    /** html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}⬇️</div>`
     *                                              самозакрывающийся тег
     */
    if (this.cursor.part === "else") {
      // выходим из всех else
      this.#recursiveCloseMultipleElse()
      // закрываем тег
      const deleted = this.cursor.back()
      if (deleted !== tagName) {
        throw new Error(`Expected ${tagName} but got ${deleted}`)
      }
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
export const parseTextAndOperators = (input: string, store: Hierarchy) => {
  // текст между предыдущим и текущим тегом
  if (input.trim()) {
    const tokens = getTokens(input)
    for (const token of tokens) {
      switch (token.kind) {
        case "text":
          store.text(token.text)
          break
        case "cond-open":
          store.if(token.expr)
          break
        case "cond-else":
          store.else()
          break
        case "cond-close":
          break
        case "map-open":
          store.map(token.sig)
          break
        case "map-close":
          store.close("map")
          break
      }
    }
  }
}
export const extractHtmlElements = (input: string): PartsHierarchy => {
  const store = new Hierarchy()

  let lastIndex = 0

  TAG_LOOKAHEAD.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = TAG_LOOKAHEAD.exec(input)) !== null) {
    const localIndex = m.index
    if (shouldIgnoreAt(input, localIndex)) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }
    parseTextAndOperators(input.slice(lastIndex, localIndex), store)
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
    let type: "el" | "meta" = "el"

    const tagNameMatch = full.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s|>|\/)/i)
    if (tagNameMatch) {
      name = (tagNameMatch[1] || "").toLowerCase()
      valid = isValidTagName(tagNameMatch[1] || "")
      if (name.startsWith("meta-")) {
        type = "meta"
      }
    }

    if (!valid) {
      const metaMatch = full.match(/^<\/?(meta-\$\{[^}]+\})/i)
      if (metaMatch) {
        name = metaMatch[1] || ""
        valid = true
        type = "meta"
      }
    }

    if (!valid) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    if (full.startsWith("</")) {
      store.close(name)
    } else if (full.endsWith("/>")) {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/\/>$/, ""))
      store.self({ tag: name, type, ...(text ? { text } : {}) })
    } else if (VOID_TAGS.has(name) && !name.startsWith("meta-")) {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/\/>$/, ""))
      store.self({ tag: name, type, ...(text ? { text } : {}) })
    } else {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/>$/, ""))
      store.open({ tag: name, type, ...(text ? { text } : {}) })
    }

    TAG_LOOKAHEAD.lastIndex = tagEnd
    lastIndex = tagEnd
  }

  if (store.child.length) return store.child
  else {
    // если нет тегов, то парсим текст и операторы
    parseTextAndOperators(input.slice(lastIndex), store)
    return store.child
  }
}
