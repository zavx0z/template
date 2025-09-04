import type {
  AttributeEvent,
  AttributeArray,
  AttributeString,
  AttributeBoolean,
  PartAttrs,
  PartAttrElement,
  PartAttrMeta,
  PartAttrMap,
  PartAttrCondition,
} from "./attributes.t"
import type { Context, Core, State, RenderParams, Node } from "./index.t"
import { findMapOpen, findMapClose } from "./map"
import { findCondElse, findCondClose, findAllConditions } from "./cond"
import { findText, formatAttributeText } from "./text"
import { VOID_TAGS } from "./element"
import type {StreamToken} from "./parser.t"
import {
  classifyValue,
  formatExpression,
  getBuiltinResolved,
  isEmptyAttributeValue,
  isFullyDynamicToken,
  matchBalancedBraces,
  normalizeValueForOutput,
  readAttributeRawValue,
  splitBySpace,
} from "./attributes"
import { createNodeDataElement } from "./data"
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
  child: PartAttrs = []

  constructor(child: PartAttrs) {
    this.child = child
  }

  /** Путь к элементу */
  path: number[] = []
  /** Имена в пути элементов */
  parts: string[] = []

  /** Элемент курсора */
  get element(): PartAttrs {
    let el: PartAttrs = this as unknown as PartAttrs
    for (const path of this.path) {
      const { child } = el as unknown as PartAttrElement | PartAttrMeta | PartAttrMap | PartAttrCondition
      el = child![path] as unknown as PartAttrs
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
    this.path.push((this.element as unknown as PartAttrElement | PartAttrMeta).child!.length - 1)
  }
}

class Hierarchy {
  child: PartAttrs = []
  cursor: Cursor
  constructor() {
    this.child = []
    this.cursor = new Cursor(this.child)
  }
  get lastElement(): PartAttrs {
    const cursorElement = this.cursor.element
    if (Object.hasOwn(cursorElement, "child")) {
      const { child } = cursorElement as unknown as PartAttrElement | PartAttrMeta | PartAttrMap | PartAttrCondition
      return child![child!.length - 1] as unknown as PartAttrs
    }
    return cursorElement
  }

  /** Добавляет текст в child массив
   * - не создает курсор на этот блок
   * @param value - текст условия
   */
  text(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
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
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
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
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
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
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "map", text: value, child: [] })
    this.cursor.push("map")
    return
  }

  /** Добавляет элемент в child массив
   * - не создает курсор на этот блок
   * @param part - текст условия
   */
  self(part: PartAttrElement | PartAttrMeta) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
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
  open(part: PartAttrElement | PartAttrMeta) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
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
export const extractHtmlElements = (input: string): Node[] => {
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
      store.self({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    } else if (VOID_TAGS.has(name) && !name.startsWith("meta-")) {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/\/>$/, ""))
      store.self({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    } else {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/>$/, ""))
      store.open({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    }

    TAG_LOOKAHEAD.lastIndex = tagEnd
    lastIndex = tagEnd
  }
  const context = { pathStack: [], level: 0 }
  if (store.child.length) return store.child.map((node) => createNodeDataElement(node, context))
  else {
    // если нет тегов, то парсим текст и операторы
    parseTextAndOperators(input.slice(lastIndex), store)
    return store.child.map((node) => createNodeDataElement(node, context))
  }
}

export const parseAttributes = (
  inside: string
): {
  event?: AttributeEvent
  array?: AttributeArray
  string?: AttributeString
  boolean?: AttributeBoolean
  style?: string
  context?: string
  core?: string
} => {
  const len = inside.length
  let i = 0

  const result: {
    event?: AttributeEvent
    array?: AttributeArray
    string?: AttributeString
    boolean?: AttributeBoolean
    style?: string
    context?: string
    core?: string
  } = {}

  const ensure = {
    event: () => (result.event ??= {}),
    array: () => (result.array ??= {}),
    string: () => (result.string ??= {}),
    boolean: () => (result.boolean ??= {}),
    style: () => (result.style ??= ""),
    context: () => (result.context ??= ""),
    core: () => (result.core ??= ""),
  }

  while (i < len) {
    while (i < len && /\s/.test(inside[i] || "")) i++
    if (i >= len) break

    // Обработка условных булевых атрибутов ${condition && 'attribute'}
    if (inside[i] === "$" && inside[i + 1] === "{") {
      const braceStart = i
      const braceEnd = matchBalancedBraces(inside, i + 2)
      if (braceEnd === -1) break

      const braceContent = inside.slice(braceStart + 2, braceEnd - 1)

      // Проверяем, является ли это условным выражением вида condition ? "attr1" : "attr2"
      const ternaryMatch = braceContent.match(/^(.+?)\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']$/)

      if (ternaryMatch) {
        const [, condition, trueAttr, falseAttr] = ternaryMatch

        if (condition && trueAttr && falseAttr) {
          // Создаем два атрибута: один для true случая, другой для false
          ensure.boolean()[trueAttr] = {
            type: "dynamic",
            value: condition.trim(),
          }

          ensure.boolean()[falseAttr] = {
            type: "dynamic",
            value: `!(${condition.trim()})`,
          }
        }

        i = braceEnd
        continue
      }

      // Обработка обычных условных атрибутов ${condition && 'attribute'}
      const parts = braceContent.split("&&").map((s) => s.trim())

      if (parts.length >= 2) {
        // Последняя часть - это имя атрибута в кавычках
        const attributeName = parts[parts.length - 1]?.replace(/['"]/g, "") // убираем кавычки

        if (attributeName) {
          // Все части кроме последней - это условие
          const condition = parts.slice(0, -1).join(" && ")

          ensure.boolean()[attributeName] = {
            type: "dynamic",
            value: condition || "",
          }
        }
      }

      i = braceEnd
      continue
    }

    const nameStart = i
    while (i < len) {
      const ch = inside[i]
      if (!ch || /\s/.test(ch) || ch === "=") break
      i++
    }
    const name = inside.slice(nameStart, i)
    if (!name) break

    // Игнорируем атрибут "/" для самозакрывающихся тегов
    if (name === "/") {
      continue
    }

    // события - обрабатываем в первую очередь
    if (name.startsWith("on")) {
      while (i < len && /\s/.test(inside[i] || "")) i++

      let value: string | null = null
      if (inside[i] === "=") {
        i++
        const r = readAttributeRawValue(inside, i)
        value = r.value
        i = r.nextIndex
      }

      const eventValue = value ? formatExpression(value.slice(2, -1)) : ""
      ensure.event()[name] = eventValue
      continue
    }

    // стили - обрабатываем как объекты
    if (name === "style") {
      while (i < len && /\s/.test(inside[i] || "")) i++

      let value: string | null = null
      if (inside[i] === "=") {
        i++
        const r = readAttributeRawValue(inside, i)
        value = r.value
        i = r.nextIndex
      }

      if (value && value.startsWith("${{")) {
        // Извлекаем содержимое объекта стилей и возвращаем как строку
        const styleContent = value.slice(3, -2).trim()
        if (styleContent) {
          result.style = `{ ${formatExpression(styleContent)} }`
        } else {
          result.style = "{}"
        }
      }
      continue
    }

    // context и core для meta-компонентов - обрабатываем как объекты
    if (name === "context" || name === "core") {
      while (i < len && /\s/.test(inside[i] || "")) i++

      let value: string | null = null
      if (inside[i] === "=") {
        i++
        const r = readAttributeRawValue(inside, i)
        value = r.value
        i = r.nextIndex
      }

      const objectValue = value
        ? value.startsWith("${{")
          ? value.slice(3, -2).trim()
            ? `{ ${formatExpression(value.slice(3, -2))} }`
            : "{}"
          : formatExpression(value.slice(2, -1))
        : "{}"

      // Не добавляем пустые core и context атрибуты
      if (objectValue === "{}") {
        continue
      }

      // Для meta-компонентов context и core будут обработаны отдельно
      if (name === "context") {
        result.context = objectValue
      } else {
        result.core = objectValue
      }
      continue
    }

    while (i < len && /\s/.test(inside[i] || "")) i++

    let value: string | null = null
    let hasQuotes = false
    if (inside[i] === "=") {
      i++
      hasQuotes = inside[i] === '"' || inside[i] === "'"
      const r = readAttributeRawValue(inside, i)
      value = r.value
      i = r.nextIndex
    } else {
      // value остается null - это означает булевый атрибут со значением true
    }

    // списковые атрибуты (class и встроенные)
    const isClass = name === "class"
    const resolved = isClass ? null : getBuiltinResolved(name)

    if (isClass || resolved) {
      if (isEmptyAttributeValue(value)) {
        continue
      }

      const tokens = isClass ? splitBySpace(value ?? "") : resolved!.fn(value ?? "")

      // Если только одно значение, обрабатываем как строку
      if (tokens.length === 1) {
        ensure.string()[name] = {
          type: classifyValue(value ?? ""),
          value: normalizeValueForOutput(value ?? ""),
        }
        continue
      }

      const out = tokens.map((tok) => ({
        type: classifyValue(tok),
        value: normalizeValueForOutput(tok),
      }))
      // @ts-ignore
      ensure.array()[name] = out
      continue
    }

    if (
      !hasQuotes &&
      !name.startsWith("on") &&
      (value === null ||
        value === "true" ||
        value === "false" ||
        (value && isFullyDynamicToken(value) && !value.includes("?") && !value.includes(":")) ||
        (value &&
          isFullyDynamicToken(value) &&
          value.includes("?") &&
          value.includes(":") &&
          (value.includes("true") || value.includes("false"))))
    ) {
      if (value && isFullyDynamicToken(value)) {
        ensure.boolean()[name] = {
          type: "dynamic",
          value: normalizeValueForOutput(value).replace(/^\${/, "").replace(/}$/, ""),
        }
      } else {
        ensure.boolean()[name] = { type: "static", value: value === "true" || value === null }
      }
      continue
    }

    // string
    if (!isEmptyAttributeValue(value)) {
      ensure.string()[name] = {
        type: classifyValue(value ?? ""),
        value: normalizeValueForOutput(value ?? ""),
      }
    }
  }

  return result
}
