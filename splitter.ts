import type { TagKind, TagToken } from "./splitter.t"
import type { Context, Core, State, RenderParams } from "./index.t"

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

export const scanHtmlTags = (input: string, offset = 0): TagToken[] => {
  const out: TagToken[] = []
  TAG_LOOKAHEAD.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = TAG_LOOKAHEAD.exec(input)) !== null) {
    const localIndex = m.index
    if (shouldIgnoreAt(input, localIndex)) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
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

    let kind: TagKind
    if (full.startsWith("</")) kind = "close"
    else if (full.endsWith("/>")) kind = "self"
    else if (VOID_TAGS.has(name) && !name.startsWith("meta-")) kind = "void"
    else kind = "open"

    out.push({ text: full, index: offset + localIndex, name, kind })
    TAG_LOOKAHEAD.lastIndex = tagEnd
  }

  return out
}

export type ElementKind = TagKind | "text"
export type ElementToken = { text: string; index: number; name: string; kind: ElementKind }

const formatAttributeText = (text: string): string =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()

// Чистый «клей» между шаблонами (целиком служебный кусок)
const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" ||
    trimmed.startsWith("`") || // закрытие предыдущего html`
    /^`}\)?\s*;?\s*$/.test(trimmed) || // `} или `}) (+ ;)
    /^`\)\}\s*,?\s*$/.test(trimmed)) // `)} (иногда с запятой)

// Обрезаем всё после первого открытия следующего html-шаблона
const cutBeforeNextHtml = (s: string): string => {
  const idx = s.indexOf("html`")
  return idx >= 0 ? s.slice(0, idx) : s
}

/**
 * Извлекает из HTML-строки единый плоский список узлов (теги + текст).
 * - Текстовые узлы берутся из промежутков между тегами.
 * - ${...} сохраняются, если внутри куска они полностью закрыты.
 * - Если в куске встречается начало нового html` — всё справа от него отбрасываем.
 * - Чистый «клей» (` , `} , `)} …) игнорируется.
 * - Пустые/пробельные узлы удаляются (одиночный пробел-разделитель тоже).
 */
export const extractHtmlElements = (input: string): ElementToken[] => {
  const tags = scanHtmlTags(input)
  const out: ElementToken[] = []
  let cursor = 0

  const pushText = (chunk: string, index: number) => {
    if (!chunk || /^\s+$/.test(chunk)) return

    const trimmed = chunk.trim()
    if (isPureGlue(trimmed)) return

    // Сохраняем левую «видимую» часть до html`
    let visible = cutBeforeNextHtml(chunk)
    if (!visible || /^\s+$/.test(visible)) return

    // Собираем, оставляя только полностью закрытые ${...}
    let processed = ""
    let i = 0
    while (i < visible.length) {
      const ch = visible[i]
      if (ch === "$" && i + 1 < visible.length && visible[i + 1] === "{") {
        const start = i
        i += 2
        let b = 1
        while (i < visible.length && b > 0) {
          if (visible[i] === "{") b++
          else if (visible[i] === "}") b--
          i++
        }
        if (b === 0) {
          processed += visible.slice(start, i) // закрытая интерполяция — сохраняем
          continue
        } else {
          break // незакрытая — это «клей», остаток отбрасываем
        }
      }
      processed += ch
      i++
    }

    const collapsed = processed.replace(/\s+/g, " ")
    if (collapsed === " ") return

    const final = /^\s*\n[\s\S]*\n\s*$/.test(chunk) ? collapsed.trim() : collapsed
    if (final.length > 0) {
      out.push({ text: final, index, name: "", kind: "text" })
    }
  }

  for (const tag of tags) {
    if (tag.index > cursor) {
      pushText(input.slice(cursor, tag.index), cursor)
    }
    out.push({ ...tag, text: formatAttributeText(tag.text) })
    cursor = tag.index + tag.text.length
  }

  if (cursor < input.length) {
    pushText(input.slice(cursor), cursor)
  }

  return out
}
