import type { TagToken } from "./index"

/**
 * Текстовый узел.
 */
export type TextNode =
  | {
      type: "text"
      value: string
    }
  | {
      type: "text"
      src: ["context" | "core", string]
    }
  | {
      type: "text"
      src: "context" | "core"
      key: string
      template: string
    }
  | {
      type: "text"
      template: string
      items: Array<{ src: "context" | "core"; key: string }>
    }

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
          // Проверяем текстовые паттерны в контенте между открывающим и закрывающим тегом
          const openTag = lastStackItem.tag
          const contentStart = openTag.index + openTag.text.length
          const contentEnd = tag.index
          if (contentEnd > contentStart) {
            const content = html.slice(contentStart, contentEnd)

            // Проверяем, есть ли сложные выражения (map, condition) или HTML теги
            const hasComplexExpressions =
              /context\.\w+\.map|core\.\w+\.map|context\.\w+\s*\?|core\.\w+\s*\?|<[^>]*>/.test(content)

            if (!hasComplexExpressions) {
              // Пробуем разобрать как смешанный текст
              const mixedText = parseMixedText(content)
              if (mixedText) {
                const current = lastStackItem.element
                if (!current.child) current.child = []

                if (mixedText.items.length === 1) {
                  // Одна переменная - используем упрощенный формат
                  const item = mixedText.items[0]
                  if (item) {
                    current.child.push({
                      type: "text",
                      src: item.src,
                      key: item.key,
                      template: mixedText.template,
                    })
                  }
                } else {
                  // Несколько переменных - используем полный формат
                  current.child.push({
                    type: "text",
                    template: mixedText.template,
                    items: mixedText.items,
                  })
                }
              } else {
                // Если не смешанный текст, пробуем обычный разбор
                const textInfo = findTextPattern(content)
                if (textInfo) {
                  const current = lastStackItem.element
                  if (!current.child) current.child = []

                  if (textInfo.kind === "dynamic") {
                    // добавляем только динамический текст, и только если нет вложенных элементов
                    const hasElementChildren = Array.isArray(current.child)
                      ? current.child.some((c) => c.type === "el")
                      : false
                    if (!hasElementChildren) {
                      const parentMap = mapStack[mapStack.length - 1]
                      if (parentMap) {
                        current.child.push({ type: "text", src: [parentMap.mapInfo.src, parentMap.mapInfo.key] })
                      }
                    }
                  } else if (textInfo.kind === "static") {
                    // добавляем статический текст
                    current.child.push({ type: "text", value: textInfo.value })
                  }
                }
              }
            }
          }

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
 * Ищет паттерны текстовых узлов в подстроке.
 * Возвращает либо статическое значение, либо признак динамического текста `${...}`.
 */
export function findTextPattern(slice: string): ({ kind: "static"; value: string } | { kind: "dynamic" }) | null {
  // Динамика: только простой идентификатор без точек/скобок/тегов внутри: ${name}
  const dynamicId = slice.match(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/)
  if (dynamicId) return { kind: "dynamic" }

  // Статика: убираем интерполяции и проверяем, что нет тегов
  const withoutTpl = slice.replace(/\$\{[^}]*\}/g, "").trim()
  // Игнорируем, если строка содержит теги или угловые скобки — это не текстовый узел
  if (/[<>]/.test(withoutTpl)) return null
  // Убираем лишние переводы строк
  const normalized = withoutTpl.replace(/\n+/g, " ").trim()
  if (normalized.length > 0) return { kind: "static", value: normalized }

  return null
}

/**
 * Разбирает смешанный текст на шаблон и переменные.
 * Пример: "Hello, ${context.name}!" → { template: "Hello, ${0}!", items: [{ src: "context", key: "name" }] }
 */
export function parseMixedText(
  slice: string
): { template: string; items: Array<{ src: "context" | "core"; key: string }> } | null {
  const items: Array<{ src: "context" | "core"; key: string }> = []
  let template = slice
  let index = 0

  // Ищем все выражения ${context.key} или ${core.key}
  const regex = /\$\{(context|core)\.(\w+)\}/g
  let match

  while ((match = regex.exec(slice)) !== null) {
    const [fullMatch, src, key] = match
    if (src && key) {
      items.push({ src: src as "context" | "core", key })

      // Заменяем в шаблоне на ${index}
      template = template.replace(fullMatch, `\${${index}}`)
      index++
    }
  }

  if (items.length > 0) {
    return { template, items }
  }

  return null
}
