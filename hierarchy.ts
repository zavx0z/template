import type { ElementToken } from "./splitter"
import { checkPresentText, makeNodeText } from "./text"
import type {
  NodeMap,
  NodeCondition,
  NodeElement,
  NodeHierarchy,
  MapPatternInfo,
  ConditionPatternInfo,
  StackItem,
  MapStackItem,
  ConditionStackItem,
} from "./hierarchy.t"
import type { NodeText } from "./text.t"

/**
 * Формирует иерархию элементов на основе последовательности тегов и исходного HTML.
 *
 * Правила:
 * - Строится дерево по открывающим/закрывающим тегам
 * - Для каждого дочернего узла анализируется подстрока между родительским открывающим тегом
 *   и началом дочернего, чтобы определить:
 *   - map-паттерн (`context|core.<key>.map(`) → поле `item`
 *   - условный рендер (тернарный оператор) → поле `cond`
 *
 * Ограничения и упрощения:
 * - Самозакрывающиеся и void-теги в иерархии не добавляются как отдельные узлы
 * - Анализ выражений упрощён до поиска известных паттернов, без полноценного AST
 *
 * @param html Полный HTML-текст (template literal без внешних бэктиков)
 * @param tags Токены тегов, полученные из scanHtmlTags(html)
 * @returns Иерархия элементов
 */
export const elementsHierarchy = (html: string, tags: ElementToken[]): NodeHierarchy => {
  // ПЕРВЫЙ ПРОХОД: Строим базовую иерархию элементов (без текста)
  const hierarchy: NodeHierarchy = []
  const stack: StackItem[] = []
  const conditionStack: ConditionStackItem[] = []
  const mapStack: MapStackItem[] = []

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (!tag) continue

    if (tag.kind === "open" || tag.kind === "self") {
      const element: NodeElement = {
        tag: tag.name,
        type: "el",
      }

      // Проверяем map и condition паттерны
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
              mapStack.push({ startIndex: i, mapInfo: mapInfo })
            }

            const condInfo = findConditionPattern(slice)
            if (condInfo) {
              conditionStack.push({ startIndex: i, conditionInfo: condInfo })
            }
          }
        }
      }

      // Добавляем элемент в иерархию
      if (stack.length > 0) {
        const parent = stack[stack.length - 1]
        if (parent && parent.element) {
          if (!parent.element.child) parent.element.child = []
          parent.element.child.push(element)
        }
      } else {
        hierarchy.push(element)
      }

      // Добавляем в стек только открывающие теги
      if (tag.kind === "open") {
        stack.push({ tag, element })
      }
    } else if (tag.kind === "close") {
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === tag.name) {
          stack.pop()
        }
      }
    }
  }

  // ВТОРОЙ ПРОХОД: Добавляем текстовые узлы в правильном порядке
  addTextNodes(html, tags, hierarchy, mapStack)

  // ТРЕТИЙ ПРОХОД: Создаем NodeMap и NodeCondition
  createSpecialNodes(hierarchy, conditionStack, mapStack)

  return hierarchy
}

/**
 * Ищет паттерны map-операций в указанной подстроке.
 * Пример совпадения: `context.list.map(` или `core.items.map(`.
 * Возвращает источник (`context`/`core`) и ключ коллекции.
 *
 * @param slice Подстрока для поиска (между родителем и дочерним тегом)
 * @returns Информация о найденном map-паттерне или null, если не найдено
 */
export function findMapPattern(slice: string): MapPatternInfo | null {
  // Простые map: context.list.map( или core.list.map(
  const ctx = slice.match(/context\.(\w+)\.map\s*\(/)
  if (ctx && ctx[1]) {
    return { data: `/context/${ctx[1]}` }
  }

  const core = slice.match(/core\.(\w+)\.map\s*\(/)
  if (core && core[1]) {
    return { data: `/core/${core[1]}` }
  }

  // Вложенные map: item.nested.map( или title.nested.map(
  const nested = slice.match(/(\w+)\.(\w+)\.map\s*\(/)
  if (nested && nested[1] && nested[2]) {
    return { data: `[item]/${nested[2]}` }
  }

  // Альтернативный паттерн для вложенных map: nested.map(
  const altNested = slice.match(/(\w+)\.map\s*\(/)
  if (altNested && altNested[1]) {
    return { data: `[item]/${altNested[1]}` }
  }

  return null
}

/**
 * Ищет паттерны условных операторов (тернарников) в подстроке.
 * Примеры совпадений в подстроке: `context.flag ?`, `core.ready ?`.
 *
 * @param slice Подстрока между открывающим родительским тегом и текущим дочерним
 * @returns Информация об условии или null
 */
export function findConditionPattern(slice: string): ConditionPatternInfo | null {
  // Сложные условия: context.cond && context.cond2 ? (внутри ${...})
  const complexCtx = slice.match(/\$\{context\.(\w+)\s*&&\s*context\.(\w+)\s*\?\s*/)
  if (complexCtx && complexCtx[1] && complexCtx[2]) {
    return {
      data: [`/context/${complexCtx[1]}`, `/context/${complexCtx[2]}`],
      expr: "${0} && ${1}",
    }
  }

  // Сравнения: context.cond === context.cond2 ? (внутри ${...})
  const compareCtx = slice.match(/\$\{context\.(\w+)\s*===\s*context\.(\w+)\s*\?\s*/)
  if (compareCtx && compareCtx[1] && compareCtx[2]) {
    return {
      data: [`/context/${compareCtx[1]}`, `/context/${compareCtx[2]}`],
      expr: "${0} === ${1}",
    }
  }

  // Простые условия: context.flag ? или core.flag ?
  const ctx = slice.match(/context\.(\w+)\s*\?/)
  if (ctx && ctx[1]) return { data: `/context/${ctx[1]}` }

  const core = slice.match(/core\.(\w+)\s*\?/)
  if (core && core[1]) return { data: `/core/${core[1]}` }

  // Условия с индексами: i % 2 ?
  const indexCond = slice.match(/(\w+)\s*%\s*(\d+)\s*\?/)
  if (indexCond && indexCond[1] && indexCond[2]) {
    return {
      data: "[index]",
      expr: `${indexCond[1]} % ${indexCond[2]}`,
    }
  }

  return null
}

/**
 * ВТОРОЙ ПРОХОД: Добавляет текстовые узлы в правильном порядке
 */
function addTextNodes(
  html: string,
  tags: ElementToken[],
  hierarchy: NodeHierarchy,
  mapStack: MapStackItem[],
  usedTags: Set<ElementToken> = new Set()
) {
  // Рекурсивно проходим по всем элементам и добавляем текстовые узлы
  for (const element of hierarchy) {
    if (element.type === "el") {
      addTextNodesToElement(html, tags, element, mapStack, usedTags)
      // Рекурсивно обрабатываем дочерние элементы
      if (element.child) {
        addTextNodes(html, tags, element.child, mapStack, usedTags)
      }
    } else if (element.type === "cond") {
      // Обрабатываем ветки условия
      addTextNodes(html, tags, [element.true], mapStack, usedTags)
      addTextNodes(html, tags, [element.false], mapStack, usedTags)
    } else if (element.type === "map") {
      // Обрабатываем дочерние элементы map
      addTextNodes(html, tags, element.child, mapStack, usedTags)
    }
  }
}

/**
 * Добавляет текстовые узлы к конкретному элементу
 */
function addTextNodesToElement(
  html: string,
  tags: ElementToken[],
  element: NodeElement,
  mapStack: MapStackItem[],
  usedTags: Set<ElementToken> = new Set()
) {
  // Находим открывающий и закрывающий теги для этого элемента
  const openTag = findOpenTagForElement(tags, element.tag, usedTags)
  if (!openTag) return

  usedTags.add(openTag)
  const closeTag = findCloseTagForElement(tags, element.tag, openTag)

  if (!closeTag) return

  const contentStart = openTag.index + openTag.text.length
  const contentEnd = closeTag.index

  if (contentEnd <= contentStart) return

  // Получаем все теги внутри элемента
  const innerTags: ElementToken[] = []
  for (const tag of tags) {
    if (tag.index >= contentStart && tag.index < contentEnd) {
      innerTags.push(tag)
    }
  }

  // Если нет внутренних тегов, обрабатываем весь контент как текст
  if (innerTags.length === 0) {
    const content = html.slice(contentStart, contentEnd)
    const textInfo = checkPresentText(content)
    if (textInfo) {
      const parentMap = mapStack[mapStack.length - 1]
      const mapContext = parentMap ? { data: parentMap.mapInfo.data } : undefined
      const textNode = makeNodeText(textInfo, mapContext, content)
      if (textNode) {
        if (!element.child) element.child = []
        element.child.push(textNode)
      }
    }
    return
  }

  // Создаем массив фрагментов с позициями
  const fragments: Array<{ position: number; type: "element" | "text"; data: NodeElement | NodeText }> = []

  // Добавляем существующие элементы
  if (element.child) {
    let elementIndex = 0
    for (const innerTag of innerTags) {
      if ((innerTag.kind === "open" || innerTag.kind === "self") && elementIndex < element.child.length) {
        const child = element.child[elementIndex]
        if (child && (child.type === "el" || child.type === "text")) {
          fragments.push({
            position: innerTag.index,
            type: "element",
            data: child as NodeElement | NodeText,
          })
        }
        elementIndex++
      }
    }
  }

  // Добавляем текстовые фрагменты
  let lastTagEnd = contentStart

  for (const innerTag of innerTags) {
    // Текст перед тегом
    if (innerTag.index > lastTagEnd) {
      const textFragment = html.slice(lastTagEnd, innerTag.index)
      const textInfo = checkPresentText(textFragment)
      if (textInfo) {
        const parentMap = mapStack[mapStack.length - 1]
        const mapContext = parentMap ? { data: parentMap.mapInfo.data } : undefined
        const textNode = makeNodeText(textInfo, mapContext, textFragment)
        if (textNode) {
          fragments.push({
            position: lastTagEnd,
            type: "text",
            data: textNode,
          })
        }
      }
    }

    // Обновляем позицию
    if (innerTag.kind === "open") {
      const closingTagForInner = findClosingTag(innerTags, innerTag)
      if (closingTagForInner) {
        lastTagEnd = closingTagForInner.index + closingTagForInner.text.length
      } else {
        lastTagEnd = innerTag.index + innerTag.text.length
      }
    } else if (innerTag.kind === "self") {
      lastTagEnd = innerTag.index + innerTag.text.length
    } else if (innerTag.kind === "close") {
      lastTagEnd = innerTag.index + innerTag.text.length
    }
  }

  // Текст после последнего тега
  if (lastTagEnd < contentEnd) {
    const textFragment = html.slice(lastTagEnd, contentEnd)
    const textInfo = checkPresentText(textFragment)
    if (textInfo) {
      const parentMap = mapStack[mapStack.length - 1]
      const mapContext = parentMap ? { data: parentMap.mapInfo.data } : undefined
      const textNode = makeNodeText(textInfo, mapContext, textFragment)
      if (textNode) {
        fragments.push({
          position: lastTagEnd,
          type: "text",
          data: textNode,
        })
      }
    }
  }

  // Сортируем по позиции и заменяем дочерние элементы
  fragments.sort((a, b) => a.position - b.position)
  const newChildren = fragments.map((f) => f.data)

  if (newChildren.length > 0) {
    element.child = newChildren
  }
}

/**
 * ТРЕТИЙ ПРОХОД: Создает NodeMap и NodeCondition
 */
function createSpecialNodes(hierarchy: NodeHierarchy, conditionStack: ConditionStackItem[], mapStack: MapStackItem[]) {
  // Создаем NodeCondition
  if (conditionStack.length > 0 && hierarchy.length > 0) {
    const condition = conditionStack[conditionStack.length - 1]
    if (condition) {
      const rootElement = hierarchy[hierarchy.length - 1] as NodeElement
      if (rootElement && rootElement.child && rootElement.child.length >= 2) {
        const trueBranch = rootElement.child[rootElement.child.length - 2]
        const falseBranch = rootElement.child[rootElement.child.length - 1]

        if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
          const conditionNode: NodeCondition = {
            type: "cond",
            data: condition.conditionInfo.data,
            expr: condition.conditionInfo.expr,
            true: trueBranch as NodeElement,
            false: falseBranch as NodeElement,
          }

          rootElement.child.splice(-2, 2, conditionNode)
        }
      }
    }
  }

  // Создаем NodeMap
  if (mapStack.length > 0 && hierarchy.length > 0) {
    const map = mapStack[mapStack.length - 1]
    if (map) {
      const rootElement = hierarchy[hierarchy.length - 1] as NodeElement
      if (rootElement && rootElement.child) {
        const children: (NodeElement | NodeText)[] = []
        for (const child of rootElement.child) {
          if (child.type === "el") children.push(child as NodeElement)
          // Не добавляем текстовые узлы в NodeMap, они уже добавлены в дочерние элементы
        }
        if (children.length > 0) {
          const mapNode: NodeMap = {
            type: "map",
            data: map.mapInfo.data,
            child: children,
          }
          rootElement.child = [mapNode]
        }
      }
    }
  }
}

/**
 * Вспомогательные функции для поиска тегов
 */

/**
 * Находит открывающий тег для конкретного элемента в иерархии
 */
function findOpenTagForElement(
  tags: ElementToken[],
  tagName: string,
  usedTags: Set<ElementToken> = new Set()
): ElementToken | null {
  // Ищем первый неиспользованный открывающий тег с таким именем
  for (const tag of tags) {
    if (tag.kind === "open" && tag.name === tagName && !usedTags.has(tag)) {
      return tag
    }
  }
  return null
}

/**
 * Находит закрывающий тег для конкретного элемента в иерархии
 */
function findCloseTagForElement(tags: ElementToken[], tagName: string, openTag: ElementToken): ElementToken | null {
  // Ищем соответствующий закрывающий тег для данного открывающего тега
  let depth = 0
  let foundOpen = false

  for (const tag of tags) {
    if (tag === openTag) {
      foundOpen = true
      continue
    }

    if (!foundOpen) continue

    if (tag.name === tagName) {
      if (tag.kind === "open") {
        depth++
      } else if (tag.kind === "close") {
        if (depth === 0) {
          return tag
        }
        depth--
      }
    }
  }

  return null
}

/**
 * Находит соответствующий закрывающий тег для открывающего
 */
function findClosingTag(tags: ElementToken[], openTag: ElementToken): ElementToken | null {
  let depth = 0
  for (const tag of tags) {
    if (tag.index <= openTag.index) continue

    if (tag.name === openTag.name) {
      if (tag.kind === "open") {
        depth++
      } else if (tag.kind === "close") {
        if (depth === 0) {
          return tag
        }
        depth--
      }
    }
  }
  return null
}
