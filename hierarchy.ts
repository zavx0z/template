import type { TagToken, ElementToken } from "./splitter"
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
  ContentFragment,
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
  const ctx = slice.match(/context\.(\w+)\.map\s*\(/)
  if (ctx && ctx[1]) return { src: "context", key: ctx[1] }
  const core = slice.match(/core\.(\w+)\.map\s*\(/)
  if (core && core[1]) return { src: "core", key: core[1] }
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
  const ctx = slice.match(/context\.(\w+)\s*\?/)
  if (ctx && ctx[1]) return { src: "context", key: ctx[1] }

  const core = slice.match(/core\.(\w+)\s*\?/)
  if (core && core[1]) return { src: "core", key: core[1] }

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
      const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
      const textNode = makeNodeText(textInfo, mapContext)
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
        const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
        const textNode = makeNodeText(textInfo, mapContext)
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
      const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
      const textNode = makeNodeText(textInfo, mapContext)
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
            src: condition.conditionInfo.src,
            key: condition.conditionInfo.key,
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
            src: map.mapInfo.src,
            key: map.mapInfo.key,
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
function findOpenTag(tags: ElementToken[], tagName: string): ElementToken | null {
  for (const tag of tags) {
    if (tag.kind === "open" && tag.name === tagName) {
      return tag
    }
  }
  return null
}

function findCloseTag(tags: ElementToken[], tagName: string): ElementToken | null {
  for (const tag of tags) {
    if (tag.kind === "close" && tag.name === tagName) {
      return tag
    }
  }
  return null
}

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
 * Обрабатывает текстовые фрагменты между HTML тегами внутри элемента
 * Вставляет текстовые узлы в правильном порядке между элементами
 */
function processTextFragments(
  html: string,
  parentStackItem: StackItem,
  closingTag: ElementToken,
  tags: ElementToken[],
  mapStack: MapStackItem[]
) {
  const parentOpenTag = parentStackItem.tag
  const contentStart = parentOpenTag.index + parentOpenTag.text.length
  const contentEnd = closingTag.index

  if (contentEnd <= contentStart) return

  // Получаем все теги внутри текущего элемента
  const innerTags: ElementToken[] = []
  for (const tag of tags) {
    if (tag.index > contentStart && tag.index < contentEnd) {
      innerTags.push(tag)
    }
  }

  // Если нет внутренних тегов, обрабатываем весь контент как текст
  if (innerTags.length === 0) {
    const content = html.slice(contentStart, contentEnd)
    const textInfo = checkPresentText(content)
    if (textInfo) {
      const parentMap = mapStack[mapStack.length - 1]
      const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
      const textNode = makeNodeText(textInfo, mapContext)
      if (textNode) {
        // Добавляем текстовый узел к дочерним элементам
        if (!parentStackItem.element.child) parentStackItem.element.child = []
        parentStackItem.element.child.push(textNode)
      }
    }
    return
  }

  // Создаем массив позиций элементов и текстовых фрагментов для правильного порядка
  const fragments: Array<{ position: number; type: "element" | "text"; data: NodeElement | NodeText }> = []

  // Добавляем существующие элементы с их позициями
  if (parentStackItem.element.child) {
    let elementIndex = 0
    for (const innerTag of innerTags) {
      if (innerTag.kind === "open" || innerTag.kind === "self") {
        if (elementIndex < parentStackItem.element.child.length) {
          const child = parentStackItem.element.child[elementIndex]
          if (child && (child.type === "el" || child.type === "text")) {
            fragments.push({
              position: innerTag.index,
              type: "element",
              data: child,
            })
          }
          elementIndex++
        }
      }
    }
  }

  // Добавляем текстовые фрагменты с их позициями
  let lastTagEnd = contentStart

  for (const innerTag of innerTags) {
    // Проверяем текст перед текущим тегом
    if (innerTag.index > lastTagEnd) {
      const textFragment = html.slice(lastTagEnd, innerTag.index)
      const textInfo = checkPresentText(textFragment)
      if (textInfo) {
        const parentMap = mapStack[mapStack.length - 1]
        const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
        const textNode = makeNodeText(textInfo, mapContext)
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

  // Проверяем текст после последнего тега
  if (lastTagEnd < contentEnd) {
    const textFragment = html.slice(lastTagEnd, contentEnd)
    const textInfo = checkPresentText(textFragment)
    if (textInfo) {
      const parentMap = mapStack[mapStack.length - 1]
      const mapContext = parentMap ? { src: parentMap.mapInfo.src, key: parentMap.mapInfo.key } : undefined
      const textNode = makeNodeText(textInfo, mapContext)
      if (textNode) {
        fragments.push({
          position: lastTagEnd,
          type: "text",
          data: textNode,
        })
      }
    }
  }

  // Сортируем по позиции и создаем новый массив дочерних элементов
  fragments.sort((a, b) => a.position - b.position)
  const newChildren = fragments.map((f) => f.data)

  // Заменяем дочерние элементы на новый упорядоченный массив
  if (newChildren.length > 0) {
    parentStackItem.element.child = newChildren
  }
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
