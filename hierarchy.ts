import type { TagToken } from "./index"
import type { NodeText } from "./text.t"
import { checkPresentText, makeNodeText } from "./text"

/**
 * Текстовый узел.
 */
export type TextNode = NodeText

/**
 * Узел map-операции с шаблоном элемента.
 */
export type MapNode = {
  type: "map"
  src: "context" | "core"
  key: string
  child: (ElementHierarchy | TextNode)[]
}

/**
 * Узел условия (тернарный оператор) с ветками true/false.
 */
export type ConditionNode = {
  type: "cond"
  src: "context" | "core"
  key: string
  true: ElementHierarchy
  false: ElementHierarchy
}

/**
 * Узел иерархии элементов, соответствующий открытому тегу.
 */
export type ElementHierarchy = {
  tag: string
  type: "el"
  child?: (ElementHierarchy | ConditionNode | MapNode | TextNode)[]
}

/**
 * Корневая иерархия элементов для переданного HTML.
 */
export type ElementsHierarchy = (ElementHierarchy | ConditionNode | MapNode | TextNode)[]

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
export const elementsHierarchy = (html: string, tags: TagToken[]): ElementsHierarchy => {
  const hierarchy: ElementsHierarchy = []
  const stack: { tag: TagToken; element: ElementHierarchy }[] = []
  const conditionStack: { startIndex: number; conditionInfo: { src: "context" | "core"; key: string } }[] = []
  const mapStack: { startIndex: number; mapInfo: { src: "context" | "core"; key: string } }[] = []
  // текстовые узлы добавляем сразу при закрытии тега, отдельный стек не нужен

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (!tag) continue

    if (tag.kind === "open" || tag.kind === "self") {
      const element: ElementHierarchy = {
        tag: tag.name,
        type: "el",
      }

      // Проверяем, является ли этот элемент частью map или условия
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

            // Проверяем условные элементы
            const condInfo = findConditionPattern(slice)
            if (condInfo) {
              conditionStack.push({ startIndex: i, conditionInfo: condInfo })
            }

            // Текстовые узлы на этом этапе не определяем (только внутри контента элемента при закрытии)
          }
        }
      }

      if (stack.length > 0) {
        // Добавляем как дочерний элемент к последнему открытому предку
        const parent = stack[stack.length - 1]
        if (parent && parent.element) {
          if (!parent.element.child) parent.element.child = []
          parent.element.child.push(element)
        }
      } else {
        // Корневой элемент (нет родителя на стеке)
        hierarchy.push(element)
      }

      // Добавляем в стек только открывающие теги (не self-closing)
      if (tag.kind === "open") {
        stack.push({ tag, element })
      }
    } else if (tag.kind === "close") {
      // Закрываем элемент, если имя совпадает с верхним элементом стека
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === tag.name) {
          // Обрабатываем текстовые фрагменты между тегами
          processTextFragments(html, lastStackItem, tag, tags, mapStack)

          stack.pop()

          // Проверяем, нужно ли создать ConditionNode
          if (conditionStack.length > 0) {
            const condition = conditionStack[conditionStack.length - 1]
            if (condition && condition.startIndex === i - 1) {
              // Создаем ConditionNode из последних двух элементов
              const parent = stack[stack.length - 1]
              if (parent && parent.element && parent.element.child && parent.element.child.length >= 2) {
                const trueBranch = parent.element.child[parent.element.child.length - 2]
                const falseBranch = parent.element.child[parent.element.child.length - 1]

                if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
                  const conditionNode: ConditionNode = {
                    type: "cond",
                    src: condition.conditionInfo.src,
                    key: condition.conditionInfo.key,
                    true: trueBranch as ElementHierarchy,
                    false: falseBranch as ElementHierarchy,
                  }

                  // Заменяем последние два элемента на ConditionNode
                  parent.element.child.splice(-2, 2, conditionNode)
                  conditionStack.pop()
                }
              }
            }
          }
        }
      }
    }
    // Игнорируем void теги для иерархии
  }

  // Создаем MapNode в конце, когда все элементы обработаны
  if (mapStack.length > 0 && hierarchy.length > 0) {
    const map = mapStack[mapStack.length - 1]
    if (map) {
      const rootElement = hierarchy[hierarchy.length - 1] as ElementHierarchy
      if (rootElement && rootElement.child) {
        const children: (ElementHierarchy | TextNode)[] = []
        for (const child of rootElement.child) {
          if (child.type === "el") children.push(child as ElementHierarchy)
          else if (child.type === "text") children.push(child as TextNode)
        }
        if (children.length > 0) {
          const mapNode: MapNode = {
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
export function findMapPattern(slice: string): { src: "context" | "core"; key: string } | null {
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
export function findConditionPattern(slice: string): { src: "context" | "core"; key: string } | null {
  const ctx = slice.match(/context\.(\w+)\s*\?/)
  if (ctx && ctx[1]) return { src: "context", key: ctx[1] }

  const core = slice.match(/core\.(\w+)\s*\?/)
  if (core && core[1]) return { src: "core", key: core[1] }

  return null
}

/**
 * Обрабатывает текстовые фрагменты между HTML тегами внутри элемента
 * Вставляет текстовые узлы в правильном порядке между элементами
 */
function processTextFragments(
  html: string,
  parentStackItem: { tag: TagToken; element: ElementHierarchy },
  closingTag: TagToken,
  tags: TagToken[],
  mapStack: { startIndex: number; mapInfo: { src: "context" | "core"; key: string } }[]
) {
  const parentOpenTag = parentStackItem.tag
  const contentStart = parentOpenTag.index + parentOpenTag.text.length
  const contentEnd = closingTag.index

  if (contentEnd <= contentStart) return

  // Получаем все теги внутри текущего элемента
  const innerTags: TagToken[] = []
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
  const fragments: Array<{ position: number; type: "element" | "text"; data: any }> = []

  // Добавляем существующие элементы с их позициями
  if (parentStackItem.element.child) {
    let elementIndex = 0
    for (const innerTag of innerTags) {
      if (innerTag.kind === "open" || innerTag.kind === "self") {
        if (elementIndex < parentStackItem.element.child.length) {
          fragments.push({
            position: innerTag.index,
            type: "element",
            data: parentStackItem.element.child[elementIndex],
          })
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
function findClosingTag(tags: TagToken[], openTag: TagToken): TagToken | null {
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
