import type {
  PartAttrs,
  PartAttrElement,
  PartAttrMeta,
  PartAttrMap,
  PartAttrCondition,
  PartAttrLogical,
} from "./attributes.t"
import type { Context, Core, State, RenderParams, Node } from "./index.t"
import type { StreamToken } from "./parser.t"
import { parseAttributes } from "./attributes"
import { createNodeDataElement } from "./data"
import type { TokenMapOpen, TokenMapClose } from "./parser.t"
import type { TokenCondElse, TokenCondOpen, TokenCondClose, TokenLogicalOpen } from "./parser.t"

// ============================================================================
// КОНСТАНТЫ И УТИЛИТЫ
// ============================================================================
// Быстрый lookahead на теги (включая meta-${...})
const TAG_LOOKAHEAD = /(?=<\/?[A-Za-z][A-Za-z0-9:-]*[^>]*>|<\/?meta-[^>]*>|<\/?meta-\$\{[^}]*\}[^>]*>)/gi

const isValidTagName = (name: string) =>
  (/^[A-Za-z][A-Za-z0-9:-]*$/.test(name) && !name.includes("*")) || name.startsWith("meta-")

const shouldIgnoreAt = (input: string, i: number) => input[i + 1] === "!" || input[i + 1] === "?"

export const VOID_TAGS = new Set([
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

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ ПАРСИНГА
// ============================================================================
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

export const extractHtmlElements = (input: string): PartAttrs => {
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
  if (store.child.length) return store.child
  // если нет тегов, то парсим текст и операторы
  parseTextAndOperators(input.slice(lastIndex), store)
  return store.child
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
        case "log-open":
          store.logical(token.expr)
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

// ============================================================================
// ТОКЕНИЗАЦИЯ
// ============================================================================
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

  // --------- logical operators ---------
  const logicals = findLogicalOperators(expr)
  for (const logical of logicals) {
    if (isNotInText(logical[0])) {
      tokens.set(...logical)
    }
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

// ============================================================================
// ПОИСК ТОКЕНОВ
// ============================================================================
export const findMapOpen = (expr: string): [number, TokenMapOpen] | undefined => {
  const mapOpenRegex = /\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\.map\([^)]*\))/g
  let match
  while ((match = mapOpenRegex.exec(expr)) !== null) {
    return [match.index, { kind: "map-open", sig: match[1]! }]
  }
}

export const findMapClose = (expr: string): [number, TokenMapClose] | undefined => {
  const mapCloseRegex = /`?\)\}/g
  let closeMatch
  while ((closeMatch = mapCloseRegex.exec(expr)) !== null) {
    return [closeMatch.index, { kind: "map-close" }]
  }
}

export const findCondElse = (expr: string): [number, TokenCondElse] | undefined => {
  const condElseRegex = /:\s*/g // допускаем произвольные пробелы/переводы строк
  let match
  while ((match = condElseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-else" }]
  }
}

export const findAllConditions = (expr: string): [number, TokenCondOpen][] => {
  // Ищем все условия (включая вложенные)
  const results: [number, TokenCondOpen][] = []

  // Сначала ищем первое условие (после ${ или =>)
  let i = 0
  while (i < expr.length) {
    const d = expr.indexOf("${", i)
    const a = expr.indexOf("=>", i)
    if (d === -1 && a === -1) break

    const useDollar = d !== -1 && (a === -1 || d < a)
    const start = useDollar ? d : a
    let j = start + 2
    while (j < expr.length && /\s/.test(expr[j]!)) j++

    const q = expr.indexOf("?", j)
    if (q === -1) {
      i = j + 1
      continue
    }

    const between = expr.slice(j, q)

    // если это ветка "=>", и до '?' попался backtick, то это тегированный шаблон:
    // переносим курсор на сам backtick и ищем следующий кандидат (внутренний ${ ... ? ... }).
    if (!useDollar) {
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    // если это ветка "${", и до '?' попался .map( — пропускаем внешний map-кандидат
    // и двигаемся внутрь.
    if (useDollar) {
      const m = between.indexOf(".map(")
      if (m !== -1) {
        i = j + m + 1
        continue
      }
      // защитно: если внутри выражения внезапно встретился backtick — тоже двигаемся к нему
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    results.push([j, { kind: "cond-open", expr: between.trim() }])
    i = q + 1
  }

  // Затем ищем все вложенные условия вида: ? ... ? или : ... ?
  i = 0
  while (i < expr.length) {
    const questionMark = expr.indexOf("?", i)
    const colon = expr.indexOf(":", i)

    if (questionMark === -1 && colon === -1) break

    // Выбираем ближайший символ
    const useQuestion = questionMark !== -1 && (colon === -1 || questionMark < colon)
    const pos = useQuestion ? questionMark : colon

    // Ищем следующий ? или : после текущего
    const nextQuestion = expr.indexOf("?", pos + 1)
    const nextColon = expr.indexOf(":", pos + 1)

    if (nextQuestion === -1 && nextColon === -1) break

    // Выбираем ближайший следующий символ
    const useNextQuestion = nextQuestion !== -1 && (nextColon === -1 || nextQuestion < nextColon)
    const nextPos = useNextQuestion ? nextQuestion : nextColon

    // Извлекаем условие между текущим и следующим символом
    const condition = expr.slice(pos + 1, nextPos).trim()

    // Проверяем, что это не пустое условие и не содержит html`
    if (condition && !condition.includes("html`")) {
      results.push([pos + 1, { kind: "cond-open", expr: condition }])
    }

    // Продолжаем поиск с позиции после текущего символа
    i = pos + 1
  }

  return results
}

export const findCondClose = (expr: string): [number, TokenCondClose] | undefined => {
  // Ищем } которая НЕ является частью деструктуризации в параметрах функции
  // Исключаем случаи типа ({ title }) => или (({ title })) =>
  const condCloseRegex = /[^\)]}(?!\s*\)\s*=>)/g
  let match
  while ((match = condCloseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-close" }]
  }
}

export const findLogicalOperators = (expr: string): [number, TokenLogicalOpen][] => {
  const results: [number, TokenLogicalOpen][] = []

  // Ищем паттерн: ${condition && html`...`}
  // Это более специфичный поиск для логических операторов с html шаблонами
  let i = 0
  while (i < expr.length) {
    const dollarIndex = expr.indexOf("${", i)
    if (dollarIndex === -1) break

    // Ищем && после переменной или выражения
    const andIndex = expr.indexOf("&&", dollarIndex + 2)
    if (andIndex === -1) {
      i = dollarIndex + 2
      continue
    }

    // Проверяем, что после && идет html` (а не тернарный оператор)
    const htmlIndex = expr.indexOf("html`", andIndex + 2)
    const ternaryIndex = expr.indexOf("?", andIndex + 2)

    // Если есть тернарный оператор раньше html`, то это не логический оператор
    if (ternaryIndex !== -1 && (htmlIndex === -1 || ternaryIndex < htmlIndex)) {
      i = andIndex + 2
      continue
    }

    if (htmlIndex === -1) {
      i = andIndex + 2
      continue
    }

    // Извлекаем выражение до &&
    const condition = expr.slice(dollarIndex + 2, andIndex).trim()

    // Проверяем, что это валидное условие (содержит переменную или сложное выражение)
    if (condition && /[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*/.test(condition)) {
      results.push([dollarIndex + 2, { kind: "log-open", expr: condition }])
    }

    i = andIndex + 2
  }

  return results
}

export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return

  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  // Сохраняем левую «видимую» часть до html`
  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  // Собираем, оставляя только полностью закрытые ${...}
  let processed = ""
  let i = 0
  let usedEndLocal = 0 // сколько символов исходного куска реально «поглощено»

  while (i < visible.length) {
    const ch = visible[i]
    if (ch === "$" && i + 1 < visible.length && visible[i + 1] === "{") {
      const exprStart = i
      i += 2
      let b = 1
      while (i < visible.length && b > 0) {
        if (visible[i] === "{") b++
        else if (visible[i] === "}") b--
        i++
      }
      if (b === 0) {
        // закрытая интерполяция — целиком сохраняем
        processed += visible.slice(exprStart, i)
        usedEndLocal = i
        continue
      } else {
        // незакрытая — это «клей», остаток отбрасываем начиная с exprStart
        // индексы конца должны соответствовать реально использованной части
        break
      }
    }
    processed += ch
    i++
    usedEndLocal = i
  }

  const collapsed = processed.replace(/\s+/g, " ")
  if (collapsed === " ") return

  const final = /^\s*\n[\s\S]*\n\s*$/.test(chunk) ? collapsed.trim() : collapsed

  if (final.length > 0) {
    return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
  }
}

// ============================================================================
// УТИЛИТЫ ДЛЯ ТЕКСТА
// ============================================================================
// Чистый «клей» между шаблонами (целиком служебный кусок)
export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" ||
    trimmed.startsWith("`") || // закрытие предыдущего html`
    /^`}\)?\s*;?\s*$/.test(trimmed) || // `} или `}) (+ ;)
    /^`\)\}\s*,?\s*$/.test(trimmed)) // `)} (иногда с запятой)

// Обрезаем всё после первого открытия следующего html-шаблона
export const cutBeforeNextHtml = (s: string): string => {
  const idx = s.indexOf("html`")
  return idx >= 0 ? s.slice(0, idx) : s
}

export const formatAttributeText = (text: string): string =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()

// ============================================================================
// КЛАССЫ ДЛЯ УПРАВЛЕНИЯ ИЕРАРХИЕЙ
// ============================================================================
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

  /** Добавляет блок logical в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * @param value - текст условия
   */
  logical(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "log", text: value, child: [] })
    this.cursor.push("log")
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
   * @param part - текст условия
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
    } else if (this.cursor.part === "log") {
      // выходим из логического оператора
      this.cursor.back()
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
