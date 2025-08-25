import type { ValueType, AttributeEvent, AttributeArray, AttributeString, AttributeBoolean } from "./attributes.t"

// ============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================

/**
 * Возвращает индекс символа ПОСЛЕ закрывающей '}' для сбалансированного блока,
 * начиная с позиции после '${' (то есть указатель должен указывать на первый символ ПОСЛЕ '{').
 * Если не найдено — возвращает -1.
 */
function matchBalancedBraces(s: string, startAfterBraceIndex: number): number {
  // ожидается, что s[startAfterBraceIndex-2:startAfterBraceIndex] === "${"
  let depth = 1 // уже внутри одного '{'
  for (let i = startAfterBraceIndex; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") {
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0) {
        return i + 1 // позиция после закрывающей '}'
      }
    }
  }
  return -1
}

/**
 * Проверка: вся строка — один ${...} (без префиксов/суффиксов).
 */
function isFullyDynamicToken(token: string): boolean {
  const v = token.trim()
  if (!(v.startsWith("${") && v.endsWith("}"))) return false
  const end = matchBalancedBraces(v, 2)
  return end === v.length
}

/**
 * Тип токена class-значения.
 */
function classifyValue(token: string): ValueType {
  if (isFullyDynamicToken(token)) return "dynamic"
  if (token.includes("${")) return "mixed"
  return "static"
}

/**
 * Если токен полностью динамический (${...}), возвращаем внутреннее содержимое без ${}.
 * Иначе оставляем как есть.
 */
function normalizeValueForOutput(token: string): string {
  if (isFullyDynamicToken(token)) {
    const v = token.trim()
    return v.slice(2, -1)
  }
  return token
}

/**
 * Разбивает class-значение на токены по пробелам верхнего уровня, учитывая кавычки и ${...}.
 * ВАЖНО: сюда уже приходит чистое значение БЕЗ внешних кавычек атрибута.
 *
 * Примеры:
 *  - '${a? "x":"y"}'                -> ['${a? "x":"y"}']
 *  - 'div-${a} btn ${b? "x":"y"}'   -> ['div-${a}', 'btn', '${b? "x":"y"}']
 *  - '${a} ${b}'                    -> ['${a}', '${b}']
 */
function splitClassTopLevel(value: string): string[] {
  const parts: string[] = []
  let buf = ""
  let i = 0
  let inQuote: '"' | "'" | null = null

  const flush = () => {
    const t = buf.trim()
    if (t.length) parts.push(t)
    buf = ""
  }

  while (i < value.length) {
    const ch = value[i]

    // Внутри строкового литерала (внутри самого значения class, не внешние кавычки атрибута)
    if (inQuote) {
      buf += ch
      if (ch === inQuote) {
        inQuote = null
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      inQuote = ch
      buf += ch
      i++
      continue
    }

    // Динамический фрагмент
    if (ch === "$" && value[i + 1] === "{") {
      const end = matchBalancedBraces(value, i + 2)
      if (end === -1) {
        // деградируем: забираем остаток как есть
        buf += value.slice(i)
        i = value.length
        break
      } else {
        buf += value.slice(i, end)
        i = end
        continue
      }
    }

    // Разделение по верхнеуровневым пробелам
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      flush()
      // пропускаем последовательные пробелы
      i++
      while (i < value.length) {
        const char = value[i]
        if (char === undefined || !/\s/.test(char)) break
        i++
      }
      continue
    }

    buf += ch
    i++
  }
  flush()
  return parts
}

/**
 * Читает "сырое" значение атрибута, начиная с позиции cursor в tag,
 * поддерживая три варианта: "quoted", 'quoted', unquoted.
 * В процессе чтения корректно пропускает ${...}.
 *
 * Возвращает: { value, nextIndex }
 *  - value: без внешних кавычек (если были)
 *  - nextIndex: позиция первого символа после значения (на пробеле/>, следующем атрибуте и т.п.)
 */
function readAttributeRawValue(tag: string, cursor: number): { value: string; nextIndex: number } {
  const len = tag.length
  // пропустим пробелы
  while (cursor < len) {
    const char = tag[cursor]
    if (char === undefined || !/\s/.test(char)) break
    cursor++
  }
  if (cursor >= len) return { value: "", nextIndex: cursor }

  const first = tag[cursor]
  // Кавычечные значения
  if (first === '"' || first === "'") {
    const quote = first as '"' | "'"
    cursor++ // пропускаем открывающую кавычку
    let v = ""
    while (cursor < len) {
      const c = tag[cursor]
      // динамика
      if (c === "$" && tag[cursor + 1] === "{") {
        const end = matchBalancedBraces(tag, cursor + 2)
        if (end === -1) {
          v += tag.slice(cursor)
          return { value: v, nextIndex: len }
        } else {
          v += tag.slice(cursor, end)
          cursor = end
          continue
        }
      }
      if (c === quote) {
        // закрывающая кавычка атрибута
        cursor++
        break
      }
      v += c
      cursor++
    }
    return { value: v, nextIndex: cursor }
  }

  // Без кавычек: до пробела/'>'
  let v = ""
  while (cursor < len) {
    const c = tag[cursor]
    if (c === ">" || (c && /\s/.test(c))) break
    if (c === "$" && tag[cursor + 1] === "{") {
      const end = matchBalancedBraces(tag, cursor + 2)
      if (end === -1) {
        v += tag.slice(cursor)
        return { value: v, nextIndex: len }
      } else {
        v += tag.slice(cursor, end)
        cursor = end
        continue
      }
    }
    v += c
    cursor++
  }
  return { value: v, nextIndex: cursor }
}

/**
 * Возвращает срез "внутренности" тега (после имени тега и до символа '>'),
 * не включая '>', при этом корректно пропуская кавычки и ${...}.
 */
function sliceInsideTag(tagSource: string): string {
  // стартуем после имени тега — на первом пробеле
  const firstSpace = tagSource.indexOf(" ")
  if (firstSpace === -1) return ""
  let i = firstSpace + 1
  let inQuote: '"' | "'" | null = null
  let out = ""

  while (i < tagSource.length) {
    const ch = tagSource[i]
    if (inQuote) {
      out += ch
      if (ch === inQuote) inQuote = null
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch
      out += ch
      i++
      continue
    }
    if (ch === "$" && tagSource[i + 1] === "{") {
      const end = matchBalancedBraces(tagSource, i + 2)
      if (end === -1) {
        out += tagSource.slice(i)
        i = tagSource.length
        break
      } else {
        out += tagSource.slice(i, end)
        i = end
        continue
      }
    }
    if (ch === ">") break
    out += ch
    i++
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

  // мелкий сканер: name[=value]
  while (i < len) {
    // пропуск пробелов
    while (i < len) {
      const char = inside[i]
      if (char === undefined || !/\s/.test(char)) break
      i++
    }
    if (i >= len) break

    // читаем имя
    const nameStart = i
    while (i < len) {
      const char = inside[i]
      if (char === undefined || /\s/.test(char) || char === "=") break
      i++
    }
    const name = inside.slice(nameStart, i)
    if (!name) break

    // пропуск пробелов
    while (i < len) {
      const char = inside[i]
      if (char === undefined || !/\s/.test(char)) break
      i++
    }

    // есть ли '='
    let value: string | null = null
    if (inside[i] === "=") {
      i++
      // читаем сырое значение из оригинального tagSource (а не только из 'inside'),
      // чтобы избежать возможных краевых несоответствий. Но у нас уже есть inside.
      const { value: v, nextIndex } = readAttributeRawValue(inside, i)
      value = v
      i = nextIndex
    } else {
      // булев атрибут
      value = ""
    }

    // === Запись в результат по категориям ===
    if (name === "class") {
      const tokens = splitClassTopLevel(value ?? "")
      const out = tokens.map((tok) => ({
        type: classifyValue(tok),
        value: normalizeValueForOutput(tok),
      }))
      ensure.array()[name] = out
      continue
    }

    if (name.startsWith("on")) {
      ensure.event()[name] = value ?? ""
      continue
    }

    // boolean: отсутствие значения или явные 'true'/'false'
    if (value === "" || value === "true" || value === "false") {
      ensure.boolean()[name] = value || "true"
      continue
    }

    // прочие строковые атрибуты
    ensure.string()[name] = value ?? ""
  }

  return result
}
