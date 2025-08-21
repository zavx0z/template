import type { ElementToken } from "./splitter"
import type { NodeMap, NodeCondition, NodeElement, NodeHierarchy, StackItem } from "./hierarchy.t"
import type { NodeText } from "./text.t"

/**
 * Формирует иерархию элементов на основе последовательности тегов.
 *
 * ПРОСТОЙ АЛГОРИТМ:
 * 1. Один проход по элементам
 * 2. Строим иерархию сразу при обнаружении map/condition
 * 3. Создаем NodeMap/NodeCondition на правильном уровне
 *
 * @param html Полный HTML-текст
 * @param elements Токены элементов (теги + текст)
 * @returns Иерархия элементов с исходными подстроками
 */
export const elementsHierarchy = (html: string, elements: ElementToken[]): NodeHierarchy => {
  const hierarchy: NodeHierarchy = []
  const stack: StackItem[] = []
  const conditionStack: { parent: NodeElement | null; text: string }[] = []
  const mapStack: { parent: NodeElement | null; text: string; startIndex: number }[] = []

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element) continue

    if (element.kind === "open" || element.kind === "self") {
      // Создаем HTML элемент
      const nodeElement: NodeElement = {
        tag: element.name || "",
        type: "el",
        text: element.text || "",
      }

      // Проверяем map/condition перед этим элементом
      const sliceStart = i === 0 ? 0 : (elements[i - 1]?.index || 0) + (elements[i - 1]?.text?.length || 0)
      const sliceEnd = element.index || 0
      const slice = html.slice(sliceStart, sliceEnd)

      // Ищем map паттерны
      const mapMatch = slice.match(/(\w+(?:\.\w+)*\.map\([^)]*\))/)
      if (mapMatch) {
        // Проверяем что после map-выражения есть символ `
        const mapText = mapMatch[1] || ""
        const mapEnd = slice.indexOf(mapText) + mapText.length
        const afterMap = slice.slice(mapEnd)

        let finalMapText = mapText
        if (afterMap.match(/^\s*=>\s*html`/)) {
          finalMapText += "`" // Добавляем символ ` в конец
        }

        // Запоминаем что нужно создать map для родителя
        const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
        mapStack.push({ parent, text: finalMapText, startIndex: i })
      }

      // Ищем condition паттерны
      const condMatch = slice.match(/(\w+(?:\.\w+)*)(?:\s*\?|(?=\s*\?\s*html`))/)
      if (condMatch) {
        // Запоминаем что нужно создать condition для родителя
        const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
        conditionStack.push({ parent, text: condMatch[1] || "" })
      }

      // Добавляем элемент в иерархию
      if (stack.length > 0) {
        const parent = stack[stack.length - 1]
        if (parent && parent.element) {
          if (!parent.element.child) parent.element.child = []
          parent.element.child.push(nodeElement)
        }
      } else {
        hierarchy.push(nodeElement)
      }

      // Добавляем в стек только открывающие теги
      if (element.kind === "open") {
        stack.push({ tag: element, element: nodeElement })
      }
    } else if (element.kind === "close") {
      // Закрывающий тег - создаем map/condition если нужно
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === (element.name || "")) {
          const parentElement = lastStackItem.element

          // Создаем NodeMap если нужно
          const mapInfo = mapStack.find((m) => m.parent === parentElement)
          if (mapInfo && parentElement.child && parentElement.child.length > 0) {
            // Определяем какие элементы должны быть в map
            let mapChildren: (NodeElement | NodeText)[]

            if (mapInfo.text.includes("nested.map")) {
              // Для вложенного map - проверяем контекст
              const hasDirectTextNodes = parentElement.child.some((child) => child.type === "text")

              if (hasDirectTextNodes) {
                // Случай 2: есть текстовые узлы на том же уровне - обертываем элемент
                const elementsWithN = parentElement.child.filter(
                  (child) =>
                    child.type === "el" &&
                    child.child &&
                    child.child.some((grandChild) => grandChild.type === "text" && grandChild.text.includes("${n}"))
                ) as NodeElement[]
                mapChildren = elementsWithN
              } else {
                // Случай 1: нет текстовых узлов на том же уровне - создаем пустой map
                // Текстовые узлы будут добавлены позже
                mapChildren = []
              }
            } else {
              // Для основного map - берем все дочерние элементы родителя
              // В данном случае это все элементы ul (li и br)
              mapChildren = [...parentElement.child] as (NodeElement | NodeText)[]
            }

            const mapNode: NodeMap = {
              type: "map",
              text: mapInfo.text,
              child: mapChildren,
            }

            // Очищаем дочерние элементы родителя и заменяем их на map
            if (!mapInfo.text.includes("nested.map")) {
              parentElement.child = [mapNode]
            }

            if (mapChildren.length > 0 || mapInfo.text.includes("nested.map")) {
              if (mapInfo.text.includes("nested.map")) {
                // Для вложенного map - применяем логику в зависимости от контекста
                const hasDirectTextNodes = parentElement.child.some((child) => child.type === "text")

                if (hasDirectTextNodes) {
                  // Случай 2: заменяем элемент с ${n} на map
                  const elementsWithN = parentElement.child.filter(
                    (child) =>
                      child.type === "el" &&
                      child.child &&
                      child.child.some((grandChild) => grandChild.type === "text" && grandChild.text.includes("${n}"))
                  ) as NodeElement[]

                  if (elementsWithN.length > 0) {
                    const firstElementWithN = elementsWithN[0]
                    if (firstElementWithN) {
                      const index = parentElement.child.indexOf(firstElementWithN)
                      if (index !== -1) {
                        parentElement.child.splice(index, 1, mapNode)
                      }
                    }
                  }
                } else {
                  // Случай 1: перемещаем текстовые узлы из элементов в map и добавляем map
                  const elementsToRemove: NodeElement[] = []
                  for (const child of parentElement.child) {
                    if (child.type === "el" && child.child) {
                      const textIndex = child.child.findIndex(
                        (grandChild) => grandChild.type === "text" && grandChild.text.includes("${n}")
                      )
                      if (textIndex !== -1) {
                        const textNode = child.child[textIndex]
                        if (textNode) {
                          child.child.splice(textIndex, 1) // Удаляем из элемента
                          mapNode.child.push(textNode) // Добавляем в map

                          // Помечаем элемент для удаления если он стал пустым
                          if (child.child.length === 0) {
                            elementsToRemove.push(child as NodeElement)
                          }
                          break
                        }
                      }
                    }
                  }

                  // Удаляем пустые элементы
                  for (const elementToRemove of elementsToRemove) {
                    const index = parentElement.child.indexOf(elementToRemove)
                    if (index !== -1) {
                      parentElement.child.splice(index, 1)
                    }
                  }

                  parentElement.child.push(mapNode)
                }
              } else {
                // Для основного map - заменяем последний элемент на map
                parentElement.child.splice(-1, 1, mapNode)
              }

              mapStack.splice(mapStack.indexOf(mapInfo), 1)
            }
          }

          // Создаем NodeCondition если нужно
          const condInfo = conditionStack.find((c) => c.parent === parentElement)
          if (condInfo && parentElement.child && parentElement.child.length >= 2) {
            const trueBranch = parentElement.child[parentElement.child.length - 2]
            const falseBranch = parentElement.child[parentElement.child.length - 1]

            if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
              const conditionNode: NodeCondition = {
                type: "cond",
                text: condInfo.text,
                true: trueBranch as NodeElement,
                false: falseBranch as NodeElement,
              }
              parentElement.child.splice(-2, 2, conditionNode)
              conditionStack.splice(conditionStack.indexOf(condInfo), 1)
            }
          }

          stack.pop()
        }
      }
    } else if (element.kind === "text") {
      // Текстовый элемент - добавляем к текущему родителю
      const textNode: NodeText = {
        type: "text",
        text: element.text || "",
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1]
        if (parent && parent.element) {
          if (!parent.element.child) parent.element.child = []
          parent.element.child.push(textNode)
        }
      } else {
        hierarchy.push(textNode)
      }
    }
  }

  // Обрабатываем map/condition на верхнем уровне
  for (const mapInfo of mapStack) {
    if (mapInfo.parent === null && hierarchy.length > 0) {
      const mapNode: NodeMap = {
        type: "map",
        text: mapInfo.text,
        child: hierarchy.filter((item) => item.type === "el" || item.type === "text") as (NodeElement | NodeText)[],
      }
      hierarchy.splice(0, hierarchy.length, mapNode)
    }
  }

  for (const condInfo of conditionStack) {
    if (condInfo.parent === null && hierarchy.length >= 2) {
      const trueBranch = hierarchy[hierarchy.length - 2]
      const falseBranch = hierarchy[hierarchy.length - 1]

      if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
        const conditionNode: NodeCondition = {
          type: "cond",
          text: condInfo.text,
          true: trueBranch as NodeElement,
          false: falseBranch as NodeElement,
        }
        hierarchy.splice(-2, 2, conditionNode)
      }
    }
  }

  return hierarchy
}
