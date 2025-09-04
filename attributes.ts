import type { ValueType } from "./attributes.t"
import { BUILTIN_LIST_SPLITTERS } from "./element"
import type { SplitterResolved } from "./element.t"

// ============================
// ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
// ============================

/**
 * Форматирует выражение по HTML-правилам схлопывания пробелов.
 * - Схлопывает последовательности пробельных символов в один пробел
 * - Обрезает пробелы по краям
 */
export function formatExpression(expr: string): string {
  return expr.replace(/\s+/g, " ").trim()
}

/** Найти позицию ПОСЛЕ закрывающей '}' для сбалансированного блока, начиная с индекса после '{' в последовательности `${` */
export function matchBalancedBraces(s: string, startAfterBraceIndex: number): number {
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

/** Найти позицию ПОСЛЕ закрывающей '}' для двойных фигурных скобок ${{...}} */
export function matchDoubleBraces(s: string, startIndex: number): number {
  let depth = 1
  for (let i = startIndex + 2; i < s.length; i++) {
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
export function isFullyDynamicToken(token: string): boolean {
  const v = token.trim()
  if (!(v.startsWith("${") && v.endsWith("}"))) return false
  const end = matchBalancedBraces(v, 2)
  return end === v.length
}

/** Классифицировать значение: static / dynamic / mixed */
export function classifyValue(token: string): ValueType {
  if (isFullyDynamicToken(token)) return "dynamic"
  if (token.includes("${")) return "mixed"
  return "static"
}

/**
 * Нормализует исходное значение атрибута для записи в результат.
 * - Форматирует строку целиком, сохраняя структуру ${...}
 */
export function normalizeValueForOutput(token: string): string {
  return formatExpression(token)
}

/** Проверить, является ли значение атрибута пустым */
export function isEmptyAttributeValue(value: string | null): boolean {
  if (value === null) return false
  // Если значение содержит динамические выражения, не считаем его пустым
  if (value.includes("${")) return false
  const normalized = normalizeValueForOutput(value)
  return normalized === "" || normalized.trim() === ""
}

/** Резка по разделителю на верхнем уровне (вне кавычек и ${...}) */
export function splitTopLevel(raw: string, sep: string): string[] {
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
export function splitBySpace(raw: string): string[] {
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

export const splitByComma = (raw: string) => splitTopLevel(raw, ",")
export const splitBySemicolon = (raw: string) => splitTopLevel(raw, ";")

export type SplitterFn = (raw: string) => string[]

export function getBuiltinResolved(name: string): SplitterResolved | null {
  const lower = name.toLowerCase()
  // aria-hidden является булевым атрибутом, а не списковым
  if (lower.startsWith("aria-") && lower !== "aria-hidden") return { fn: splitBySpace, delim: " " }
  return BUILTIN_LIST_SPLITTERS[lower] || null
}

/** Прочитать "сырое" значение атрибута из строки inside, начиная с позиции cursor */
export function readAttributeRawValue(inside: string, cursor: number): { value: string; nextIndex: number } {
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
        // Проверяем двойные фигурные скобки ${{...}}
        if (inside[cursor + 2] === "{") {
          const end = matchDoubleBraces(inside, cursor)
          if (end === -1) {
            v += inside.slice(cursor)
            return { value: v, nextIndex: len }
          } else {
            v += inside.slice(cursor, end)
            cursor = end
            continue
          }
        } else {
          // Обычные фигурные скобки ${...}
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
      // Проверяем двойные фигурные скобки ${{...}}
      if (inside[cursor + 2] === "{") {
        const end = matchDoubleBraces(inside, cursor)
        if (end === -1) {
          v += inside.slice(cursor)
          return { value: v, nextIndex: len }
        } else {
          v += inside.slice(cursor, end)
          cursor = end
          continue
        }
      } else {
        // Обычные фигурные скобки ${...}
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
    }
    v += c
    cursor++
  }
  return { value: v, nextIndex: cursor }
}
