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

export type Content = Record<string, string | number | boolean | null | Array<string | number | boolean | null>>
export type Core = Record<string, any>
export type State = string

export type Render<C extends Content = Content, I extends Core = Core, S extends State = State> = (args: {
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  core: I
  context: C
  state: State
}) => void

export type TagKind = "open" | "close" | "self" | "void"
export type TagToken = { text: string; index: number; name: string; kind: TagKind }

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
  return src.slice(firstIndex + 5, lastBacktick)
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
        // Пропускаем template literal
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

type ElementHierarchy = Record<string, any>
type ElementsHierarchy = ElementHierarchy[]

export const elementsHierarchy = (html: string, tags: TagToken[]): ElementsHierarchy => {
  const hierarchy: ElementsHierarchy = []
  return hierarchy
}
