import type { ValueType, AttributeEvent, AttributeArray, AttributeString, AttributeBoolean } from "./attributes.t"

// ============================
// ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
// ============================

/** Найти позицию ПОСЛЕ закрывающей '}' для сбалансированного блока, начиная с индекса после '{' в последовательности `${` */
function matchBalancedBraces(s: string, startAfterBraceIndex: number): number {
  let depth = 1
  for (let i = startAfterBraceIndex; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

/** Полностью ли токен — одиночный ${...} без префикса/суффикса */
function isFullyDynamicToken(token: string): boolean {
  const v = token.trim()
  if (!(v.startsWith("${") && v.endsWith("}"))) return false
  const end = matchBalancedBraces(v, 2)
  return end === v.length
}

/** Классифицировать значение: static / dynamic / mixed */
function classifyValue(token: string): ValueType {
  if (isFullyDynamicToken(token)) return "dynamic"
  if (token.includes("${")) return "mixed"
  return "static"
}

/** Для вывода: если dynamic, убрать внешние ${} */
function normalizeValueForOutput(token: string): string {
  if (isFullyDynamicToken(token)) {
    const v = token.trim()
    return v.slice(2, -1)
  }
  return token
}

/** Резка по разделителю на верхнем уровне (вне кавычек и ${...}) */
function splitTopLevel(raw: string, sep: string): string[] {
  const out: string[] = []
  let buf = ""
  let inSingle = false
  let inDouble = false

  const push = () => {
    const t = buf.trim()
    if (t) out.push(t)
    buf = ""
  }

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]

    // ${...}
    if (!inSingle && !inDouble && ch === "$" && raw[i + 1] === "{") {
      const end = matchBalancedBraces(raw, i + 2)
      if (end === -1) {
        buf += ch
        continue
      } else {
        buf += raw.slice(i, end)
        i = end - 1
        continue
      }
    }

    // кавычки
    if (!inDouble && ch === "'") {
      inSingle = !inSingle
      buf += ch
      continue
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble
      buf += ch
      continue
    }

    if (!inSingle && !inDouble && ch === sep) {
      push()
      continue
    }

    buf += ch
  }
  push()
  return out
}

/** Резка по пробелам верхнего уровня (как для class), учитывая ${} и кавычки */
function splitBySpace(raw: string): string[] {
  const out: string[] = []
  let buf = ""
  let inSingle = false
  let inDouble = false

  const push = () => {
    const t = buf.trim()
    if (t) out.push(t)
    buf = ""
  }

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]

    if (inSingle || inDouble) {
      buf += ch
      if (inSingle && ch === "'") inSingle = false
      else if (inDouble && ch === '"') inDouble = false
      continue
    }

    if (ch === "$" && raw[i + 1] === "{") {
      const end = matchBalancedBraces(raw, i + 2)
      if (end === -1) {
        buf += raw.slice(i)
        break
      } else {
        buf += raw.slice(i, end)
        i = end - 1
        continue
      }
    }

    if (ch === "'") {
      inSingle = true
      buf += ch
      continue
    }
    if (ch === '"') {
      inDouble = true
      buf += ch
      continue
    }

    if (ch && /\s/.test(ch)) {
      push()
      while (i + 1 < raw.length && /\s/.test(raw[i + 1] || "")) i++
      continue
    }

    buf += ch
  }
  push()
  return out
}

const splitByComma = (raw: string) => splitTopLevel(raw, ",")
const splitBySemicolon = (raw: string) => splitTopLevel(raw, ";")

type SplitterFn = (raw: string) => string[]
type SplitterResolved = { fn: SplitterFn; delim: string }

/** Преднастройка известных списковых атрибутов */
const BUILTIN_LIST_SPLITTERS: Record<string, SplitterResolved> = {
  class: { fn: splitBySpace, delim: " " }, // спец-кейс в записи результата (см. ниже)
  rel: { fn: splitBySpace, delim: " " },
  headers: { fn: splitBySpace, delim: " " },
  itemref: { fn: splitBySpace, delim: " " },
  ping: { fn: splitBySpace, delim: " " },
  sandbox: { fn: splitBySpace, delim: " " },
  sizes: { fn: splitBySpace, delim: " " },
  "accept-charset": { fn: splitBySpace, delim: " " },
  accept: { fn: splitByComma, delim: "," },
  allow: { fn: splitBySemicolon, delim: ";" },
  srcset: {
    fn: (raw) =>
      splitByComma(raw)
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
  coords: {
    fn: (raw) =>
      splitTopLevel(raw, ",")
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
}

function getBuiltinResolved(name: string): SplitterResolved | null {
  const lower = name.toLowerCase()
  if (lower.startsWith("aria-")) return { fn: splitBySpace, delim: " " }
  return BUILTIN_LIST_SPLITTERS[lower] || null
}

/** Прочитать "сырое" значение атрибута из строки inside, начиная с позиции cursor */
function readAttributeRawValue(inside: string, cursor: number): { value: string; nextIndex: number } {
  const len = inside.length
  while (cursor < len && /\s/.test(inside[cursor] ?? "")) cursor++
  if (cursor >= len) return { value: "", nextIndex: cursor }

  const first = inside[cursor]
  if (first === '"' || first === "'") {
    const quote = first as '"' | "'"
    cursor++
    let v = ""
    while (cursor < len) {
      const c = inside[cursor]
      if (c === "$" && inside[cursor + 1] === "{") {
        const end = matchBalancedBraces(inside, cursor + 2)
        if (end === -1) {
          v += inside.slice(cursor)
          return { value: v, nextIndex: len }
        } else {
          v += inside.slice(cursor, end)
          cursor = end
          continue
        }
      }
      if (c === quote) {
        cursor++
        break
      }
      v += c
      cursor++
    }
    return { value: v, nextIndex: cursor }
  }

  let v = ""
  while (cursor < len) {
    const c = inside[cursor]
    if (c === ">" || (c && /\s/.test(c))) break
    if (c === "$" && inside[cursor + 1] === "{") {
      const end = matchBalancedBraces(inside, cursor + 2)
      if (end === -1) {
        v += inside.slice(cursor)
        return { value: v, nextIndex: len }
      } else {
        v += inside.slice(cursor, end)
        cursor = end
        continue
      }
    }
    v += c
    cursor++
  }
  return { value: v, nextIndex: cursor }
}

/** Достать часть между именем тега и закрывающим '>' на верхнем уровне */
function sliceInsideTag(tagSource: string): string {
  if (!tagSource.startsWith("<")) return ""
  let i = 1 // после '<'

  // Пройти имя тега (учитывая возможные ${...} внутри имени)
  while (i < tagSource.length) {
    const ch = tagSource[i]
    if (ch === ">" || /\s/.test(ch ?? "")) break

    if (ch === "$" && tagSource[i + 1] && tagSource[i + 1] === "{") {
      const end = matchBalancedBraces(tagSource, i + 2)
      if (end === -1) break
      i = end
      continue
    }

    i++
  }

  // Если остановились на '>', нужно проверить, есть ли после него атрибуты
  if (i < tagSource.length && tagSource[i] === ">") {
    // Проверяем, есть ли что-то после '>'
    const afterGt = tagSource.slice(i + 1).trim()
    if (afterGt && !afterGt.startsWith(">")) {
      // Есть атрибуты после '>', значит этот '>' был частью имени тега
      i = tagSource.indexOf(" ", i + 1)
      if (i === -1) i = tagSource.length
    }
  }

  // если сразу '>', атрибутов нет
  if (i >= tagSource.length || tagSource[i] === ">") return ""

  // сейчас i указывает на первый пробел после имени — начинаем собирать до ВЕРХНЕ-УРОВНЕВОГО '>'
  let j = i
  let out = ""
  let inSingle = false
  let inDouble = false

  while (j < tagSource.length) {
    const ch = tagSource[j]

    // ВАЖНО: сначала обрабатываем ${...} — и внутри, и вне кавычек
    if (ch === "$" && tagSource[j + 1] && tagSource[j + 1] === "{") {
      const end = matchBalancedBraces(tagSource, j + 2)
      if (end === -1) {
        out += tagSource.slice(j)
        break
      }
      out += tagSource.slice(j, end)
      j = end
      continue
    }

    // Только после этого переключаем кавычки (но уже гарантированно вне ${...})
    if (!inDouble && ch === "'") {
      inSingle = !inSingle
      out += ch
      j++
      continue
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble
      out += ch
      j++
      continue
    }

    // Верхне-уровневое закрытие тега
    if (!inSingle && !inDouble && ch === ">") break

    out += ch
    j++
  }

  return out
}

// ============================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================

export function parseAttributes(tagSource: string): {
  event?: AttributeEvent
  array?: AttributeArray
  string?: AttributeString
  boolean?: AttributeBoolean
} {
  const inside = sliceInsideTag(tagSource)
  const len = inside.length
  let i = 0

  const result: {
    event?: AttributeEvent
    array?: AttributeArray
    string?: AttributeString
    boolean?: AttributeBoolean
  } = {}

  const ensure = {
    event: () => (result.event ??= {}),
    array: () => (result.array ??= {}),
    string: () => (result.string ??= {}),
    boolean: () => (result.boolean ??= {}),
  }

  while (i < len) {
    while (i < len && /\s/.test(inside[i] || "")) i++
    if (i >= len) break

    const nameStart = i
    while (i < len) {
      const ch = inside[i]
      if (!ch || /\s/.test(ch) || ch === "=") break
      i++
    }
    const name = inside.slice(nameStart, i)
    if (!name) break

    while (i < len && /\s/.test(inside[i] || "")) i++

    let value: string | null = null
    if (inside[i] === "=") {
      i++
      const r = readAttributeRawValue(inside, i)
      value = r.value
      i = r.nextIndex
    } else {
      value = ""
    }

    // class — обрабатываем как обычный списковый атрибут
    if (name === "class") {
      const tokens = splitBySpace(value ?? "")
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
      ensure.array()[name] = { splitter: " ", values: out }
      continue
    }

    // события
    if (name.startsWith("on")) {
      ensure.event()[name] = value ?? ""
      continue
    }

    // списковые (только встроенные)
    {
      const resolved = getBuiltinResolved(name)
      if (resolved) {
        const tokens = resolved.fn(value ?? "")
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
        ensure.array()[name] = { splitter: resolved.delim, values: out }
        continue
      }
    }

    // boolean
    if (value === "" || value === "true" || value === "false") {
      ensure.boolean()[name] = value || "true"
      continue
    }

    // string
    ensure.string()[name] = {
      type: classifyValue(value ?? ""),
      value: normalizeValueForOutput(value ?? ""),
    }
  }

  return result
}
