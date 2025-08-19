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

type MapInfo = {
  src: "context" | "core"
  key: string
}

type ConditionInfo = {
  src: "context" | "core"
  key: string
  value: boolean
}

type ElementHierarchy = {
  tag: string
  type: "el"
  child?: ElementHierarchy[]
  item?: MapInfo
  cond?: ConditionInfo
}

type ElementsHierarchy = ElementHierarchy[]

export const elementsHierarchy = (html: string, tags: TagToken[]): ElementsHierarchy => {
  const hierarchy: ElementsHierarchy = []
  const stack: { tag: TagToken; element: ElementHierarchy }[] = []

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (!tag) continue

    if (tag.kind === "open") {
      const element: ElementHierarchy = {
        tag: tag.name,
        type: "el",
      }

      // Проверяем, является ли этот элемент частью map, используя диапазон между родителем и текущим тегом
      if (stack.length > 0) {
        const parentItem = stack[stack.length - 1]
        if (parentItem) {
          const parentOpenTag = parentItem.tag
          const rangeStart = parentOpenTag.index + parentOpenTag.text.length
          const rangeEnd = tag.index
          if (rangeEnd > rangeStart) {
            const slice = html.slice(rangeStart, rangeEnd)
            const mapInfo = findMapPattern(slice)
            if (mapInfo) {
              element.item = mapInfo
            }

            // Проверяем условные элементы
            const condInfo = findConditionPattern(slice, i, tags)
            if (condInfo) {
              element.cond = condInfo
            }
          }
        }
      }

      if (stack.length > 0) {
        // Добавляем как дочерний элемент
        const parent = stack[stack.length - 1]
        if (parent && parent.element) {
          if (!parent.element.child) parent.element.child = []
          parent.element.child.push(element)
        }
      } else {
        // Корневой элемент
        hierarchy.push(element)
      }

      stack.push({ tag, element })
    } else if (tag.kind === "close") {
      // Закрываем элемент
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === tag.name) {
          stack.pop()
        }
      }
    }
    // Игнорируем self и void теги для иерархии
  }

  return hierarchy
}

/**
 * Ищет паттерны map-операций в строке
 *
 * @param slice - подстрока для поиска
 * @returns информация о найденном map-паттерне или null
 */
function findMapPattern(slice: string): MapInfo | null {
  // Ищем паттерны context.<key>.map( или core.<key>.map(
  const ctx = slice.match(/context\.(\w+)\.map\s*\(/)
  if (ctx && ctx[1]) return { src: "context", key: ctx[1] }
  const core = slice.match(/core\.(\w+)\.map\s*\(/)
  if (core && core[1]) return { src: "core", key: core[1] }
  return null
}

/**
 * Ищет паттерны условных операторов в строке
 *
 * @param slice - подстрока для поиска
 * @param tagIndex - индекс текущего тега
 * @param tags - массив всех тегов
 * @returns информация о найденном условном паттерне или null
 */
function findConditionPattern(slice: string, tagIndex: number, tags: TagToken[]): ConditionInfo | null {
  // Ищем паттерны context.<key> ? или core.<key> ?
  const ctx = slice.match(/context\.(\w+)\s*\?/)
  if (ctx && ctx[1]) {
    const value = determineConditionValue(tagIndex, tags)
    return { src: "context", key: ctx[1], value }
  }

  const core = slice.match(/core\.(\w+)\s*\?/)
  if (core && core[1]) {
    const value = determineConditionValue(tagIndex, tags)
    return { src: "core", key: core[1], value }
  }

  return null
}

/**
 * Определяет значение условия на основе позиции тега
 */
function determineConditionValue(tagIndex: number, tags: TagToken[]): boolean {
  // В тернарном операторе: первый элемент = true, второй = false
  const currentTag = tags[tagIndex]
  if (!currentTag) return true

  // Ищем все открывающие теги до текущего, исключая родительские
  let count = 0
  for (let i = 0; i < tagIndex; i++) {
    const tag = tags[i]
    if (tag && tag.kind === "open" && tag.name !== "div") {
      count++
    }
  }

  // Первый элемент = true, второй = false
  return count === 0
}
