import type { ValueDynamic, ValueVariable } from "./parser.t"
import type { PartsAttr, Node } from "./node/index.t"
import type { Attributes } from "./attribute/index.t"
import type { PartAttrMap, TokenMapClose, TokenMapOpen } from "./node/map.t"
import type { PartAttrCondition, TokenCondClose, TokenCondElse, TokenCondOpen } from "./node/condition.t"
import type { PartAttrMeta } from "./node/meta.t"
import type { PartAttrElement } from "./node/element.t"
import type { ParseContext, ParseResult } from "./parser.t"
import type { TokenText } from "./node/text.t"
import type { TokenLogicalOpen } from "./node/logical.t"
import { formatAttributeText, parseAttributes } from "./attribute"
import { findAllConditions, findCondElse, findCondClose } from "./node/condition"
import { findLogicalOperators } from "./node/logical"
import { findText } from "./node/text"
import { findMapOpen, findMapClose } from "./node/map"
import { processArrayAttributes } from "./attribute/array"
import { processBooleanAttributes } from "./attribute/boolean"
import { processEventAttributes } from "./attribute/event"
import { processStringAttributes } from "./attribute/string"
import { processStyleAttributes } from "./attribute/style"
import { createNode } from "./node"
import { VOID_TAGS } from "./node/element"

// ============================================================================
// КОНСТАНТЫ И УТИЛИТЫ
// ============================================================================
// Быстрый lookahead на теги (включая meta-${...})
const TAG_LOOKAHEAD = /(?=<\/?[A-Za-z][A-Za-z0-9:-]*[^>]*>|<\/?meta-[^>]*>|<\/?meta-\$\{[^}]*\}[^>]*>)/gi

const isValidTagName = (name: string) =>
  (/^[A-Za-z][A-Za-z0-9:-]*$/.test(name) && !name.includes("*")) || name.startsWith("meta-")

const shouldIgnoreAt = (input: string, i: number) => input[i + 1] === "!" || input[i + 1] === "?"

export const extractHtmlElements = (input: string): PartsAttr => {
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
    if (input.trim()) parseTextAndOperators(input.slice(lastIndex, localIndex), store)
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
  if (input.trim()) parseTextAndOperators(input.slice(lastIndex), store)
  return store.child
}

export const parseTextAndOperators = (input: string, store: Hierarchy) => {
  // текст между предыдущим и текущим тегом
  const map = new Map<
    number,
    TokenText | TokenCondOpen | TokenCondElse | TokenCondClose | TokenMapOpen | TokenMapClose | TokenLogicalOpen
  >()

  const text = findText(input)
  text && map.set(text.start, { text: text.text, kind: "text" })

  const isNotInText = (index: number) => (text ? index < text.start || index > text.end : true)
  // --------- conditions ---------
  const conds = findAllConditions(input)
  for (const cond of conds) isNotInText(cond[0]) && map.set(...cond)

  const tokenCondElse = findCondElse(input)
  tokenCondElse && isNotInText(tokenCondElse[0]) && map.set(...tokenCondElse)

  const tokenCondClose = findCondClose(input)
  tokenCondClose && isNotInText(tokenCondClose[0]) && map.set(...tokenCondClose)

  // --------- logical operators ---------
  const logicals = findLogicalOperators(input)
  for (const logical of logicals) isNotInText(logical[0]) && map.set(...logical)

  // ------------- map -------------
  const tokenMapOpen = findMapOpen(input)
  tokenMapOpen && isNotInText(tokenMapOpen[0]) && map.set(...tokenMapOpen)

  const tokenMapClose = findMapClose(input)
  tokenMapClose && isNotInText(tokenMapClose[0]) && map.set(...tokenMapClose)

  // Сортируем по позиции токены
  const tokens = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([, token]) => token)

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

// Обрезаем всё после первого открытия следующего html-шаблона
export const cutBeforeNextHtml = (s: string): string => {
  const idx = s.indexOf("html`")
  return idx >= 0 ? s.slice(0, idx) : s
}

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
  child: PartsAttr = []

  constructor(child: PartsAttr) {
    this.child = child
  }

  /** Путь к элементу */
  path: number[] = []
  /** Имена в пути элементов */
  parts: string[] = []

  /** Элемент курсора */
  get element(): PartsAttr {
    let el: PartsAttr = this as unknown as PartsAttr
    for (const path of this.path) {
      const { child } = el as unknown as PartAttrElement | PartAttrMeta | PartAttrMap | PartAttrCondition
      el = child![path] as unknown as PartsAttr
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
  child: PartsAttr = []
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
    /** Выходим из логического оператора если были в блоке log */
    if (this.cursor.part === "log") {
      this.cursor.back() // удаляем log и выходим из логического оператора
    }
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
    /** Выходим из логического оператора если были в блоке log */
    if (this.cursor.part === "log") {
      this.cursor.back() // удаляем log и выходим из логического оператора
    }
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
      /** Выходим из логического оператора если были в блоке log */
      if (this.cursor.part === "log") {
        this.cursor.back() // удаляем log и выходим из логического оператора
      }
      return
    }
  }
}
// ============================================================================
// REGEX PATTERNS
// ============================================================================
// Паттерны для парсинга переменных

export const VARIABLE_WITH_DOTS_PATTERN = /([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g
const VALID_VARIABLE_PATTERN = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/
// Паттерны для парсинга событий

export const UPDATE_OBJECT_PATTERN = /update\(\s*\{([^}]+)\}\s*\)/
export const OBJECT_KEY_PATTERN = /([a-zA-Z_$][\w$]*)\s*:/g
export const CONDITIONAL_OPERATORS_PATTERN = /\?.*:/
// Паттерны для форматирования

export const WHITESPACE_PATTERN = /\s+/g
export const TEMPLATE_WRAPPER_PATTERN = /^\$\{|\}$/g
/**
 * Единый префикс для индексационных плейсхолдеров внутри expr.
 *
 * Формирует вид подстановок в унифицированных выражениях:
 *   \`${${ARGUMENTS_PREFIX}[0]}\`, \`${${ARGUMENTS_PREFIX}[1]}\`, ...
 *
 * Изменяя значение здесь, вы централизованно влияете на весь рендер expr
 * (parseEventExpression, createUnifiedExpression, parseTemplateLiteral, parseText, условия).
 * Допустимые варианты: "arguments" (классический JS) или пустая строка для специфического рантайма.
 */

export const ARGUMENTS_PREFIX = "_"
// ============================================================================
// PATH RESOLUTION UTILITIES
// ============================================================================
/**
 * Ищет переменную в стеке map контекстов и возвращает соответствующий путь.
 *
 * Эта функция является ключевой для разрешения переменных в сложных вложенных структурах.
 * Она анализирует стек map контекстов от самого глубокого уровня к самому внешнему,
 * определяя правильные относительные пути для доступа к данным.
 *
 * @param variable - Имя переменной для поиска (может содержать точки для доступа к свойствам)
 * @param context - Контекст парсера с информацией о стеке map контекстов
 * @returns Относительный путь к данным или null, если переменная не найдена
 *
 * @example
 * // В контексте: departments.map((dept) => teams.map((team) => members.map((member) => ...)))
 * findVariableInMapStack("dept.name", context) // Возвращает: "../../[item]/name"
 * findVariableInMapStack("team.id", context)   // Возвращает: "../[item]/id"
 * findVariableInMapStack("member", context)    // Возвращает: "[item]"
 */
const findVariableInMapStack = (variable: string, context: ParseContext): string | null => {
  if (!context.mapContextStack?.length) return null

  const variableParts = variable.split(".")
  const variableName = variableParts[0] || ""

  // Ищем переменную от самого глубокого уровня к внешнему
  for (let i = context.mapContextStack.length - 1; i >= 0; i--) {
    const mapContext = context.mapContextStack[i]
    if (!mapContext?.params.includes(variableName)) continue

    const levelsUp = context.mapContextStack.length - 1 - i
    const prefix = "../".repeat(levelsUp)
    const paramIndex = mapContext.params.indexOf(variableName)

    // Используем информацию о деструктуризации из контекста
    return paramIndex === 0 ? buildItemPath(prefix, variableParts, mapContext.isDestructured) : `${prefix}[index]`
  }

  return null
}
const buildItemPath = (prefix: string, variableParts: string[], isDestructured: boolean): string => {
  const hasProperty = variableParts.length > 1

  if (isDestructured) {
    return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]/${variableParts[0]}`
  }

  return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]`
}
/**
 * Обрабатывает семантические атрибуты (core/context) с подходом "единый литерал + переменные".
 *
 * Извлекает все переменные из строки и создает унифицированное выражение для дальнейшего eval.
 * Подходит для core/context атрибутов, где нужна цельная строка для выполнения.
 *
 * @param str - Строка объекта в формате "{ key: value, key2: value2 }"
 * @param ctx - Контекст парсера
 * @returns Результат с путями к данным и унифицированным выражением
 */

export const processSemanticAttributes = (
  str: string,
  ctx: ParseContext = { pathStack: [], level: 0 }
): ValueVariable | ValueDynamic | null => {
  // Извлекаем все переменные из строки объекта
  const variableMatches = str.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Убираем дубликаты переменных
  const uniqueVariables = [...new Set(variableMatches)]

  // Разрешаем пути к данным для каждой уникальной переменной
  const paths = uniqueVariables.map((variable: string) => resolveDataPath(variable, ctx) || variable)

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = str

  // Защищаем строковые литералы от замены
  const { protectedExpr, stringLiterals } = protectStringLiterals(expr)

  uniqueVariables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    const variableRegex = new RegExp(`(?<!\\w)${variable.replace(/\./g, "\\.")}(?!\\w)`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}
/**
 * Поддерживает различные типы параметров map функций:
 * - Простые параметры (один параметр)
 * - Деструктурированные свойства (несколько параметров)
 * - Параметры с индексами
 * - Доступ к свойствам через точку
 *
 * @param variable - Имя переменной для разрешения
 * @param context - Контекст парсера с информацией о текущем map контексте
 * @returns Путь к данным в формате относительного или абсолютного пути
 *
 * @example
 * // В контексте map с деструктуризацией: map(({ title, id }) => ...)
 * resolveDataPath("title", context) // Возвращает: "[item]/title"
 * resolveDataPath("id", context)    // Возвращает: "[item]/id"
 *
 * // В контексте map с простым параметром: map((item) => ...)
 * resolveDataPath("item.name", context) // Возвращает: "[item]/name"
 * resolveDataPath("item", context)      // Возвращает: "[item]"
 */

export const resolveDataPath = (variable: string, context: ParseContext): string => {
  // Сначала пытаемся найти переменную в стеке map контекстов
  const mapStackPath = findVariableInMapStack(variable, context)
  if (mapStackPath !== null) {
    return mapStackPath
  }

  // Если не найдена в стеке map, используем старую логику для обратной совместимости
  if (context.mapParams && context.mapParams.length > 0) {
    // В контексте map - различаем простые параметры и деструктурированные свойства
    const variableParts = variable.split(".")
    const mapParamVariable = variableParts[0] || ""

    // Проверяем, является ли первая часть переменной параметром map
    if (context.mapParams.includes(mapParamVariable)) {
      const paramIndex = context.mapParams.indexOf(mapParamVariable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id -> [item]/id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept -> [item])
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else if (variableParts[0] && context.mapParams.includes(variableParts[0])) {
      // Переменная начинается с имени параметра, но не содержит точку (например, dept в map((dept) => ...))
      const paramIndex = context.mapParams.indexOf(variableParts[0])
      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept)
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else if (context.mapParams.includes(variable)) {
      // Переменная точно совпадает с параметром текущего map
      const paramIndex = context.mapParams.indexOf(variable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        // Для деструктуризации всегда возвращаем [item]/property
        return `[item]/${variable}`
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else {
      // Переменная не найдена в текущих mapParams
      // Если переменная начинается с core., то это абсолютный путь
      if (variable.startsWith("core.")) {
        return `/${variable.replace(/\./g, "/")}`
      }

      // Проверяем, есть ли вложенный map
      if (context.currentPath && context.currentPath.includes("[item]")) {
        // Вложенный map - переменная может быть из внешнего контекста
        // Проверяем, есть ли в pathStack другие map контексты
        if (context.pathStack && context.pathStack.length > 1) {
          // Есть внешний map - вычисляем количество уровней подъема
          // Считаем количество map контекстов в pathStack (каждый map добавляет уровень)
          const mapLevels = context.pathStack.filter((path) => path.includes("[item]")).length
          const levelsUp = mapLevels - 1 // текущий уровень не считаем

          // Создаем префикс с нужным количеством "../"
          const prefix = "../".repeat(levelsUp)

          // Извлекаем только свойство из переменной (например, из g.id берем только id)
          const propertyPath = variableParts.length > 1 ? variableParts.slice(1).join("/") : variable
          return `${prefix}[item]/${propertyPath}`
        } else {
          // Нет внешнего map - обычный путь
          return `[item]/${variable.replace(/\./g, "/")}`
        }
      } else {
        // Обычный путь
        return `[item]/${variable.replace(/\./g, "/")}`
      }
    }
  } else if (context.currentPath && !context.currentPath.includes("[item]")) {
    // В контексте, но не map - добавляем к текущему пути
    return `${context.currentPath}/${variable.replace(/\./g, "/")}`
  } else {
    // Абсолютный путь
    return `/${variable.replace(/\./g, "/")}`
  }
}
/**
 * Извлекает базовую переменную из сложного выражения с методами.
 * Переиспользуемая функция для обработки выражений типа "context.list.map(...)".
 */

export const extractBaseVariable = (variable: string): string => {
  // Защищаем строковые литералы от обработки
  const stringLiterals: string[] = []
  let protectedVariable = variable
    .replace(/`[^`]*`/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  if (protectedVariable.includes("(")) {
    // Для выражений с методами, ищем переменную до первого вызова метода
    // Например, для "context.list.map((item) => ...)" нужно получить "context.list"
    const beforeMethod = protectedVariable
      .split(/\.\w+\(/)
      .shift()
      ?.trim()
    if (beforeMethod && VALID_VARIABLE_PATTERN.test(beforeMethod)) {
      return beforeMethod
    }
  }

  // Извлекаем только переменные с точками, исключая строковые литералы
  const variableMatches = protectedVariable.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const variablesWithDots = variableMatches.filter((v) => v.includes(".") && !v.startsWith("__STRING_"))

  if (variablesWithDots.length > 0) {
    return variablesWithDots[0] as string
  }

  return variable
}
/**
 * Создает унифицированное выражение с заменой переменных на индексы.
 *
 * Эта функция выполняет две ключевые задачи:
 * 1. Заменяет все переменные в выражении на индексы для унификации
 * 2. Форматирует выражение, удаляя избыточные пробелы и переносы строк
 *
 * Форматирование применяется с учетом строковых литералов:
 * - Строковые литералы защищаются от форматирования
 * - Пробелы и переносы строк удаляются только в логических частях выражения
 * - Строковые литералы восстанавливаются без изменений
 *
 * @param value - Исходное выражение с переменными в формате ${variable}
 * @param variables - Массив переменных для замены на индексы
 * @returns Унифицированное и отформатированное выражение
 *
 * @example
 * createUnifiedExpression("${user.name} is ${user.age} years old", ["user.name", "user.age"])
 * // Возвращает: "${0} is ${1} years old"
 *
 * createUnifiedExpression("${active ? 'Enabled' : 'Disabled'}", ["active"])
 * // Возвращает: "${0} ? 'Enabled' : 'Disabled'"
 */

export const createUnifiedExpression = (value: string, variables: string[]): string => {
  let expr = value

  // Сначала защищаем строковые литералы от замены
  const { stringLiterals } = protectStringLiterals(expr)

  // Заменяем переменные в ${} на индексы
  variables.forEach((variable, index) => {
    // Сначала заменяем точные совпадения ${variable}
    const exactRegex = new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g")
    expr = expr.replace(exactRegex, `\${${ARGUMENTS_PREFIX}[${index}]}`)

    // Затем заменяем переменные внутри ${} выражений (для условных выражений)
    // Но только если это не точное совпадение
    const insideRegex = new RegExp(`\\$\\{([^}]*?)\\b${variable.replace(/\./g, "\\.")}\\b([^}]*?)\\}`, "g")
    expr = expr.replace(insideRegex, (match, before, after) => {
      // Проверяем, что это не точное совпадение
      if (before.trim() === "" && after.trim() === "") {
        return match // Не заменяем точные совпадения
      }
      return `\${${before}${ARGUMENTS_PREFIX}[${index}]${after}}`
    })
  })

  // Удаляем лишние пробелы и переносы строк в выражениях
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  return expr
}
/**
 * Парсит путь к данным из map-выражения и создает новый контекст.
 *
 * Эта функция анализирует map-выражения и определяет:
 * - Путь к массиву данных
 * - Параметры map-функции
 * - Тип пути (абсолютный или относительный)
 * - Новый контекст для вложенных операций
 *
 * Поддерживает различные сценарии:
 * - Абсолютные пути к данным (например, core.list.map)
 * - Относительные пути в контексте map (например, nested.map)
 * - Вложенные map в контексте существующих map
 *
 * @param mapText - Текст map-выражения для парсинга
 * @param context - Текущий контекст парсера (опционально)
 * @returns Результат парсинга с путем, новым контекстом и метаданными
 *
 * @example
 * parseMap("core.list.map(({ title }) => ...)")
 * // Возвращает: { path: "/core/list", context: {...}, metadata: { params: ["title"] } }
 *
 * parseMap("nested.map((item) => ...)", context)
 * // Возвращает: { path: "[item]/nested", context: {...}, metadata: { params: ["item"] } }
 */

/**
 * Общая функция для обработки атрибутов с template literals.
 * Устраняет дублирование кода между различными типами атрибутов.
 */
export const processTemplateLiteralAttribute = (
  value: string,
  context: ParseContext
): ValueDynamic | ValueVariable | null => {
  const templateResult = parseTemplateLiteral(value, context)
  if (templateResult) {
    if (templateResult.expr === `\${${ARGUMENTS_PREFIX}[0]}` && !Array.isArray(templateResult.data))
      return { data: templateResult.data }
    return { data: templateResult.data, expr: templateResult.expr }
  }
  return null
}

/**
 * Общая функция для обработки базовых атрибутов элемента.
 * Устраняет дублирование кода между createNodeDataElement и createNodeDataMeta.
 */
export const processBasicAttributes = (node: PartAttrElement | PartAttrMeta, context: ParseContext): Attributes => {
  const result: Attributes = {}

  // Обрабатываем базовые атрибуты
  if (node.string) {
    result.string = processStringAttributes(node.string, context)
  }

  if (node.event) {
    const eventAttrs = processEventAttributes(node.event, context)
    if (Object.keys(eventAttrs).length > 0) {
      result.event = eventAttrs
    }
  }

  if (node.array) {
    result.array = processArrayAttributes(node.array, context)
  }

  if (node.boolean) {
    result.boolean = processBooleanAttributes(node.boolean, context)
  }

  if (node.style) {
    const styleResult = processStyleAttributes(node.style, context)
    if (styleResult) {
      result.style = styleResult
    }
  }

  return result
}

/** Парсит путь к данным из условного выражения. */
export const parseCondition = (condText: string, context: ParseContext = { pathStack: [], level: 0 }): ParseResult => {
  const cleanCondText = cleanConditionText(condText)

  // Защищаем строковые литералы от обработки
  const stringLiterals: string[] = []
  let protectedText = cleanCondText
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  const allMatches = protectedText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const pathMatches = allMatches.filter((match) => !match.startsWith("__STRING_"))

  if (pathMatches.length === 0) return { path: "" }

  const expression = extractConditionExpression(cleanCondText, pathMatches)
  const paths =
    pathMatches.length === 1
      ? resolveDataPath(pathMatches[0] || "", context)
      : pathMatches.map((variable) => resolveDataPath(variable, context))

  return { path: paths, metadata: { expression } }
}
const cleanConditionText = (condText: string): string => {
  let cleanText = condText.replace(/html`[^`]*`/g, "")

  if (cleanText.includes("Index")) {
    const indexMatches = cleanText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    return indexMatches.length > 0 ? indexMatches.join(" && ") : cleanText
  }

  return cleanText.includes("?") ? cleanText.split("?")[0]?.trim() || cleanText : cleanText
}
/**
 * Извлекает выражение условия.
 */
export const extractConditionExpression = (condText: string, pathMatches?: string[]): string => {
  // Для условий с индексами, извлекаем только логическое выражение
  if (condText.includes("Index")) {
    // Ищем все логические выражения с индексами
    const indexMatches = condText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    if (indexMatches.length > 0) {
      // Собираем все логические выражения
      let logicalExpression = indexMatches.join(" && ")

      // Ищем переменные в логическом выражении
      const pathMatches = logicalExpression.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      // Заменяем переменные на индексы ${ARGUMENTS_PREFIX}[0]}, ${ARGUMENTS_PREFIX}[1]}, и т.д.
      pathMatches.forEach((path, index) => {
        logicalExpression = logicalExpression.replace(
          new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
          `${ARGUMENTS_PREFIX}[${index}]`
        )
      })

      return logicalExpression.replace(/\s+/g, " ").trim()
    }
  }

  // Ищем все переменные в условии (но не числа)
  const variables = pathMatches || condText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  // Проверяем, есть ли математические операции или другие сложные операции
  const hasComplexOperations = /[%+\-*/===!===!=<>().]/.test(condText)
  const hasLogicalOperators = /[&&||]/.test(condText)

  // Если найдена только одна переменная и нет сложных операций, возвращаем простое выражение
  if (variables.length === 1 && !hasComplexOperations && !hasLogicalOperators) {
    return `${ARGUMENTS_PREFIX}[0]`
  }

  // Если найдена только одна переменная, но есть простые математические операции (например, i % 2)
  if (variables.length === 1 && hasComplexOperations && !hasLogicalOperators) {
    // Заменяем переменную на индекс и оборачиваем в ${}
    let expression = condText
    expression = expression.replace(
      new RegExp(`\\b${variables[0]!.replace(/\./g, "\\.")}\\b`, "g"),
      `${ARGUMENTS_PREFIX}[0]`
    )
    return expression
  }

  // Заменяем переменные на индексы ${${ARGUMENTS_PREFIX}[0]}, ${${ARGUMENTS_PREFIX}[1]}, и т.д.
  // Сортируем переменные по длине (сначала более длинные), чтобы избежать частичной замены
  const sortedVariables = [...variables].sort((a, b) => b.length - a.length)

  let expression = condText
  sortedVariables.forEach((path) => {
    const index = variables.indexOf(path)
    expression = expression.replace(
      new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
      `${ARGUMENTS_PREFIX}[${index}]`
    )
  })

  return expression.replace(/\s+/g, " ").trim()
}

/**
 * Общая функция для обработки template literals.
 * Используется как для text узлов, так и для атрибутов.
 */
export const parseTemplateLiteral = (
  value: string,
  context: ParseContext = { pathStack: [], level: 0 }
): ValueDynamic | null => {
  // Если значение не содержит ${}, возвращаем null (статическое значение)
  if (!value.includes("${")) return null

  // Извлекаем все переменные из выражения, включая вложенные ${...}
  const variables: string[] = []

  // Функция для извлечения переменных из строки с учетом вложенных ${...}
  const extractVariables = (str: string) => {
    // Извлекаем все переменные в порядке их появления в строке
    const allVariableMatches = str.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
    allVariableMatches.forEach((variable) => {
      if (
        variable.length > 1 &&
        variable.includes(".") && // Только переменные с точками
        variable !== "true" &&
        variable !== "false" &&
        variable !== "null" &&
        variable !== "undefined" &&
        !variables.includes(variable)
      ) {
        // Проверяем, не является ли переменная частью метода
        const variableIndex = str.indexOf(variable)
        const afterVariable = str.slice(variableIndex + variable.length)
        const isMethodCall = afterVariable.match(/^\s*\(/)

        if (!isMethodCall) {
          variables.push(variable)
        }
      }
    })

    // Защищаем строковые литералы
    const stringLiterals: string[] = []
    let protectedStr = str
      .replace(/"[^"]*"/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })
      .replace(/'[^']*'/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })
      .replace(/`[^`]*`/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })

    // Рекурсивно извлекаем переменные из всех ${...} выражений
    const extractFromTemplate = (content: string) => {
      // Находим переменные в текущем содержимом, исключая защищенные строковые литералы
      const variableMatches = content.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      variableMatches.forEach((variable) => {
        if (
          variable.length > 1 &&
          !variable.startsWith("__STRING_") &&
          !variable.startsWith("STRING") &&
          variable !== "true" &&
          variable !== "false" &&
          variable !== "null" &&
          variable !== "undefined" &&
          !variables.includes(variable)
        ) {
          variables.push(variable)
        }
      })

      // Рекурсивно обрабатываем вложенные ${...}
      const nestedMatches = content.match(/\$\{([^}]+)\}/g) || []
      nestedMatches.forEach((nestedMatch) => {
        const nestedContent = nestedMatch.slice(2, -1)
        extractFromTemplate(nestedContent)
      })
    }

    // Если строка содержит ${...}, извлекаем переменные из всего содержимого
    if (protectedStr.includes("${")) {
      // Находим все ${...} выражения
      const templateMatches = protectedStr.match(/\$\{([^}]+)\}/g) || []

      templateMatches.forEach((match) => {
        // Извлекаем содержимое ${...} из защищенной строки
        const content = match.slice(2, -1) // убираем ${ и }
        extractFromTemplate(content)
      })
    }
  }

  // Извлекаем переменные из всего выражения
  extractVariables(value)

  if (variables.length === 0) {
    return null
  }

  // Разрешаем пути к данным для каждой переменной
  const paths = variables.map((variable: string) => resolveDataPath(variable, context))

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = value

  // Защищаем строковые литералы от замены
  const { stringLiterals } = protectStringLiterals(expr)

  variables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    // Используем регулярное выражение с границами слов для точной замены
    const variableRegex = new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}

export const enrichWithData = (hierarchy: PartsAttr, context: ParseContext = { pathStack: [], level: 0 }): Node[] => {
  return hierarchy.map((node) => createNode(node, context))
}
// ============================================================================
// HELPER FUNCTIONS FOR CODE REUSE
// ============================================================================
/**
 * Защищает строковые литералы от замены переменных.
 * Переиспользуемая функция для устранения дублирования.
 */
const protectStringLiterals = (expr: string): { protectedExpr: string; stringLiterals: string[] } => {
  const stringLiterals: string[] = []
  const protectedExpr = expr
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  return { protectedExpr, stringLiterals }
}
/**
 * Восстанавливает строковые литералы после обработки.
 */
const restoreStringLiterals = (expr: string, stringLiterals: string[]): string => {
  let result = expr
  stringLiterals.forEach((literal, index) => {
    result = result.replace(`__STRING_${index}__`, literal)
  })
  return result
}
