import type { TagKind, TagToken } from "./splitter.t"
import type { Content, Core, State, Render } from "./index.t"

/**
 * @fileoverview HTML Tag Scanner
 *
 * Предоставляет утилиты для:
 *  - извлечения основного HTML-блока из render-функции
 *  - сканирования HTML-строки и выделения тегов с их типами и позициями
 *
 * Алгоритм использует два регулярных выражения:
 *  TAG_LOOKAHEAD — быстрое определение возможных тегов
 *  TAG_MATCH     — точный парсер одного тега
 *
 * Поддерживаются:
 *  - Простые, вложенные, self и void теги
 *  - Namespace-теги (например, svg:use)
 *  - Атрибуты с кавычками и спецсимволами
 * Игнорируются: комментарии, DOCTYPE, processing instructions
 */

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

// Упрощенное регулярное выражение для поиска тегов
const TAG_LOOKAHEAD = /(?=<\/?[A-Za-z][A-Za-z0-9:-]*[^>]*>)/gi

// Функция для валидации имени тега
const isValidTagName = (name: string) => /^[A-Za-z][A-Za-z0-9:-]*$/.test(name) && !name.includes("*")

const shouldIgnoreAt = (input: string, i: number) => input[i + 1] === "!" || input[i + 1] === "?"

/**
 * Извлекает основной HTML-блок из render-функции.
 *
 * @template C extends Content
 * @template I extends Core
 * @template S extends State
 * @param {Render<C,I,S>} render - функция вида ({ html, context, core, state }) => html`...`
 * @returns {string} сырой HTML-текст внутри template literal
 */
export function extractMainHtmlBlock<C extends Content = Content, I extends Core = Core, S extends State = State>(
  render: Render<C, I, S>
): string {
  const src = Function.prototype.toString.call(render)
  const firstIndex = src.indexOf("html`")
  if (firstIndex === -1) throw new Error("функция render не содержит html`")
  const lastBacktick = src.lastIndexOf("`")
  if (lastBacktick === -1 || lastBacktick <= firstIndex) throw new Error("render function does not contain html`")
  const htmlContent = src.slice(firstIndex + 5, lastBacktick)

  // Восстанавливаем минифицированные булевые значения
  return htmlContent.replace(/!0/g, "true").replace(/!1/g, "false")
}

/**
 * Сканирует HTML-строку и возвращает список токенов тегов.
 *
 * Алгоритм:
 * 1. Ищет возможные теги через TAG_LOOKAHEAD (быстрое обнаружение).
 * 2. Находит точное совпадение с помощью TAG_MATCH.
 * 3. Определяет тип тега (open/close/self/void).
 * 4. Формирует массив токенов с index и текстом.
 *
 * @param html - входная HTML-строка
 * @returns список токенов с полями { text, index, name, kind }
 */
export function scanHtmlTags(input: string, offset = 0): TagToken[] {
  const out: TagToken[] = []
  TAG_LOOKAHEAD.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_LOOKAHEAD.exec(input)) !== null) {
    const localIndex = m.index
    if (shouldIgnoreAt(input, localIndex)) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    // Находим правильный конец тега, учитывая вложенные кавычки и template literals
    const tagStart = localIndex
    let tagEnd = -1
    let i = localIndex + 1

    while (i < input.length) {
      const char = input[i]
      if (char === ">") {
        tagEnd = i + 1
        break
      } else if (char === '"' || char === "'") {
        // Пропускаем содержимое кавычек
        const quote = char
        i++
        while (i < input.length && input[i] !== quote) {
          if (input[i] === "\\") {
            i++ // пропускаем экранированные символы
            i++
          } else if (input[i] === "$" && i + 1 < input.length && input[i + 1] === "{") {
            // Пропускаем template literal внутри кавычек
            i += 2 // пропускаем ${
            let braceCount = 1
            while (i < input.length && braceCount > 0) {
              if (input[i] === "{") braceCount++
              else if (input[i] === "}") braceCount--
              i++
            }
          } else {
            i++
          }
        }
        if (i < input.length) i++ // пропускаем закрывающую кавычку
      } else if (char === "$" && i + 1 < input.length && input[i + 1] === "{") {
        // Пропускаем template literal, но обрабатываем вложенные template literals
        i += 2 // пропускаем ${
        let braceCount = 1
        while (i < input.length && braceCount > 0) {
          if (input[i] === "{") braceCount++
          else if (input[i] === "}") braceCount--
          i++
        }
      } else {
        i++
      }
    }

    if (tagEnd === -1) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    const full = input.slice(tagStart, tagEnd)

    // Извлекаем имя тега вручную
    const tagNameMatch = full.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s|>|\/)/i)
    if (!tagNameMatch) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    const name = (tagNameMatch[1] || "").toLowerCase()

    // Проверяем валидность имени тега
    if (!isValidTagName(tagNameMatch[1] || "")) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    // Определяем тип тега
    let kind: TagKind
    if (full.startsWith("</")) kind = "close"
    else if (full.endsWith("/>")) kind = "self"
    else if (VOID_TAGS.has(name)) kind = "void"
    else kind = "open"

    out.push({ text: full, index: offset + localIndex, name, kind })
    TAG_LOOKAHEAD.lastIndex = tagEnd
  }
  return out
}

/**
 * Унифицированные виды узлов: теги + текст
 */
export type ElementKind = TagKind | "text"

/**
 * Унифицированный токен узла: для тегов сохраняем name и исходный фрагмент,
 * для текста: name = "" (пустая строка), kind = "text".
 */
export type ElementToken = { text: string; index: number; name: string; kind: ElementKind }

/**
 * Извлекает из HTML-строки единый плоский список узлов (теги + текст).
 * - Текстовые узлы формируются из промежутков между последовательными тегами.
 * - JavaScript-выражения в ${...} пропускаются и не включаются в текстовые узлы.
 * - Пустые или состоящие только из пробелов/переводов строк узлы игнорируются.
 * - Для текста поле `name` — пустая строка.
 */
export function extractHtmlElements(input: string): ElementToken[] {
  const tags = scanHtmlTags(input)
  const out: ElementToken[] = []
  let cursor = 0

  const pushText = (chunk: string, index: number) => {
    // Обрабатываем текст между тегами
    // Template literals включаются в текст только если они полностью закрываются в этом куске
    let processedChunk = ""
    let i = 0

    // Проверяем, не является ли весь кусок частью незакрытого template literal
    // Ищем незакрытые скобки или ` в начале/конце (части большого template literal)
    if (
      chunk.startsWith("`") ||
      chunk.match(/^\s*:\s*html`/) ||
      chunk.match(/`\}\s*$/) ||
      chunk.match(/^\s*`\}\s*$/) ||
      chunk.match(/^\s+`\)\}\s*$/) ||
      chunk.match(/^\s*`\s*:\s*html`\s*$/)
    ) {
      return // пропускаем куски, которые явно являются частями template literals
    }

    while (i < chunk.length) {
      if (chunk[i] === "$" && i + 1 < chunk.length && chunk[i + 1] === "{") {
        // Нашли начало template literal
        const startPos = i
        i += 2 // пропускаем ${
        let braceCount = 1

        // Ищем закрывающую скобку
        while (i < chunk.length && braceCount > 0) {
          if (chunk[i] === "{") braceCount++
          else if (chunk[i] === "}") braceCount--
          i++
        }

        if (braceCount === 0) {
          // Литерал полностью закрывается в этом куске - включаем в текст
          processedChunk += chunk.slice(startPos, i)
        } else {
          // Литерал не закрывается - остальное пропускаем
          break
        }
      } else {
        processedChunk += chunk[i]
        i++
      }
    }

    if (processedChunk.trim().length > 0) {
      out.push({ text: processedChunk, index, name: "", kind: "text" })
    }
  }

  for (const tag of tags) {
    if (tag.index > cursor) {
      pushText(input.slice(cursor, tag.index), cursor)
    }
    out.push(tag as unknown as ElementToken)
    cursor = tag.index + tag.text.length
  }

  if (cursor < input.length) {
    pushText(input.slice(cursor), cursor)
  }

  return out
}
