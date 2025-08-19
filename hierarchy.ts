import type { TagToken } from "./index"

/**
 * Информация о map-паттерне, найденном между родителем и дочерним элементом.
 * Пример: `${context.list.map(...)}` → { src: "context", key: "list" }
 */
export type MapInfo = {
  src: "context" | "core"
  key: string
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
  child?: (ElementHierarchy | ConditionNode)[]
  item?: MapInfo
}

/**
 * Корневая иерархия элементов для переданного HTML.
 */
export type ElementsHierarchy = (ElementHierarchy | ConditionNode)[]

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

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (!tag) continue

    if (tag.kind === "open") {
      const element: ElementHierarchy = {
        tag: tag.name,
        type: "el",
      }

      // Проверяем, является ли этот элемент частью map
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
            const condInfo = findConditionPattern(slice)
            if (condInfo) {
              conditionStack.push({ startIndex: i, conditionInfo: condInfo })
            }
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

      stack.push({ tag, element })
    } else if (tag.kind === "close") {
      // Закрываем элемент, если имя совпадает с верхним элементом стека
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === tag.name) {
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
    // Игнорируем self и void теги для иерархии
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
export function findMapPattern(slice: string): MapInfo | null {
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
