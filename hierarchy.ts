import type { ElementToken } from "./splitter"
import type {
  NodeHierarchyMap,
  NodeHierarchyCondition,
  NodeHierarchyElement,
  NodeHierarchyMeta,
  NodeHierarchy,
  StackItem,
  NodeHierarchyText,
} from "./hierarchy.t"

/**
 * Формирует иерархию элементов на основе последовательности тегов.
 *
 * ПРОСТОЙ АЛГОРИТМ:
 * 1. Один проход по элементам
 * 2. Строим иерархию сразу при обнаружении map/condition
 * 3. Создаем NodeHierarchyMap/NodeHierarchyCondition на правильном уровне
 *
 * @param html Полный HTML-текст
 * @param elements Токены элементов (теги + текст)
 * @returns Иерархия элементов с исходными подстроками
 */
export const elementsHierarchy = (html: string, elements: ElementToken[]): NodeHierarchy => {
  const hierarchy: NodeHierarchy = []
  const stack: StackItem[] = []
  const conditionStack: { parent: NodeHierarchyElement | NodeHierarchyMeta | null; text: string }[] = []
  // Запоминаем у какого родителя начался map и с какого индекса его дети должны быть обернуты
  const mapStack: { parent: NodeHierarchyElement | NodeHierarchyMeta | null; text: string; startChildIndex: number }[] =
    []

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element) continue

    if (element.kind === "open" || element.kind === "self") {
      // Проверяем, является ли это мета-тегом
      if (element.name && element.name.startsWith("meta-")) {
        // Создаем мета-узел
        const metaNode: NodeHierarchyMeta = {
          tag: element.name,
          type: "meta",
          text: element.text || "",
        }

        // Проверяем map/condition перед этим meta-тегом
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

          // Запоминаем что нужно создать map для родителя и с какого индекса детей
          const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
          const startChildIndex =
            parent && (parent.type === "el" || parent.type === "meta") && parent.child ? parent.child.length : 0
          mapStack.push({ parent, text: finalMapText, startChildIndex })
        }

        // Ищем condition паттерны
        const condMatch = slice.match(/\$\{([^?]+)\?/)
        if (condMatch) {
          // Запоминаем что нужно создать condition для родителя
          const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
          conditionStack.push({ parent, text: (condMatch[1] || "").trim() })
        }

        // Добавляем мета-узел в иерархию
        if (stack.length > 0) {
          const parent = stack[stack.length - 1]
          if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
            if (!parent.element.child) parent.element.child = []
            parent.element.child.push(metaNode)
          }
        } else {
          hierarchy.push(metaNode)
        }

        // Добавляем мета-теги в стек, если это открывающий тег
        if (element.kind === "open") {
          stack.push({ tag: element, element: metaNode })
        }
        continue
      }

      // Создаем HTML элемент
      const nodeElement: NodeHierarchyElement = {
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

        // Запоминаем что нужно создать map для родителя и с какого индекса детей
        const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
        const startChildIndex = parent && parent.type === "el" && parent.child ? parent.child.length : 0
        mapStack.push({ parent, text: finalMapText, startChildIndex })
      }

      // Ищем condition паттерны
      const condMatch = slice.match(/\$\{([^?]+)\?/)
      if (condMatch) {
        // Запоминаем что нужно создать condition для родителя
        const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
        conditionStack.push({ parent, text: (condMatch[1] || "").trim() })
      }

      // Добавляем элемент в иерархию
      if (stack.length > 0) {
        const parent = stack[stack.length - 1]
        if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
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
      // Проверяем, является ли это закрывающим meta-тегом
      if (element.name && element.name.startsWith("meta-")) {
        // Закрывающий meta-тег - создаем map/condition если нужно
        if (stack.length > 0) {
          const lastStackItem = stack[stack.length - 1]
          if (lastStackItem && lastStackItem.tag.name === (element.name || "")) {
            const parentElement = lastStackItem.element

            // Создаем NodeHierarchyMap если нужно (для meta-тегов)
            if (parentElement.type === "meta") {
              const mapInfo = mapStack.find((m) => m.parent === parentElement)
              if (mapInfo && parentElement.child && parentElement.child.length > 0) {
                const startIdx = Math.max(0, mapInfo.startChildIndex)
                const beforeChildren = parentElement.child.slice(0, startIdx)
                const mapChildren = parentElement.child.slice(startIdx) as (
                  | NodeHierarchyElement
                  | NodeHierarchyText
                  | NodeHierarchyMeta
                )[]

                const mapNode: NodeHierarchyMap = {
                  type: "map",
                  text: mapInfo.text,
                  child: mapChildren,
                }

                parentElement.child = [...beforeChildren, mapNode]
                mapStack.splice(mapStack.indexOf(mapInfo), 1)
              }
            }

            stack.pop()
          }
        }
        continue
      }

      // Закрывающий тег - создаем map/condition если нужно
      if (stack.length > 0) {
        const lastStackItem = stack[stack.length - 1]
        if (lastStackItem && lastStackItem.tag.name === (element.name || "")) {
          const parentElement = lastStackItem.element

          // Создаем NodeHierarchyMap если нужно (только для обычных элементов)
          if (parentElement.type === "el") {
            const mapInfo = mapStack.find((m) => m.parent === parentElement)
            if (mapInfo && parentElement.child && parentElement.child.length > 0) {
              const startIdx = Math.max(0, mapInfo.startChildIndex)
              const beforeChildren = parentElement.child.slice(0, startIdx)
              const mapChildren = parentElement.child.slice(startIdx) as (NodeHierarchyElement | NodeHierarchyText)[]

              const mapNode: NodeHierarchyMap = {
                type: "map",
                text: mapInfo.text,
                child: mapChildren,
              }

              parentElement.child = [...beforeChildren, mapNode]
              mapStack.splice(mapStack.indexOf(mapInfo), 1)
            }
          }

          // Создаем NodeHierarchyCondition если нужно - ОБРАБАТЫВАЕМ ВСЕ условия для этого родителя
          if (parentElement.type === "el") {
            const condInfos = conditionStack.filter((c) => c.parent === parentElement)
            for (const condInfo of condInfos) {
              if (parentElement.child && parentElement.child.length >= 2) {
                // Ищем последовательные пары элементов, которые могут быть true/false ветками
                let processedAnyCondition = false
                for (let i = parentElement.child.length - 1; i >= 1; i--) {
                  const trueBranch = parentElement.child[i - 1]
                  const falseBranch = parentElement.child[i]

                  if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
                    const conditionNode: NodeHierarchyCondition = {
                      type: "cond",
                      text: condInfo.text,
                      true: trueBranch as NodeHierarchyElement,
                      false: falseBranch as NodeHierarchyElement,
                    }
                    parentElement.child.splice(i - 1, 2, conditionNode)
                    processedAnyCondition = true
                    break // Обрабатываем только одну пару для этого условия
                  }
                }
                if (processedAnyCondition) {
                  conditionStack.splice(conditionStack.indexOf(condInfo), 1)
                }
              }
            }
          }

          stack.pop()
        }
      }
    } else if (element.kind === "text") {
      // Текстовый элемент - добавляем к текущему родителю
      const textNode: NodeHierarchyText = {
        type: "text",
        text: element.text || "",
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1]
        if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
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
      const mapNode: NodeHierarchyMap = {
        type: "map",
        text: mapInfo.text,
        child: hierarchy.filter((item) => item.type === "el" || item.type === "text" || item.type === "meta") as (
          | NodeHierarchyElement
          | NodeHierarchyText
          | NodeHierarchyMeta
        )[],
      }
      hierarchy.splice(0, hierarchy.length, mapNode)
    }
  }

  // Обрабатываем ВСЕ условия на верхнем уровне
  const topLevelConditions = conditionStack.filter((c) => c.parent === null)
  for (const condInfo of topLevelConditions) {
    if (hierarchy.length >= 2) {
      // Ищем последовательные пары элементов, которые могут быть true/false ветками
      let processedAnyCondition = false
      for (let i = hierarchy.length - 1; i >= 1; i--) {
        const trueBranch = hierarchy[i - 1]
        const falseBranch = hierarchy[i]

        if (trueBranch && falseBranch && trueBranch.type === "el" && falseBranch.type === "el") {
          const conditionNode: NodeHierarchyCondition = {
            type: "cond",
            text: condInfo.text,
            true: trueBranch as NodeHierarchyElement,
            false: falseBranch as NodeHierarchyElement,
          }
          hierarchy.splice(i - 1, 2, conditionNode)
          processedAnyCondition = true
          break // Обрабатываем только одну пару для этого условия
        }
      }
      if (processedAnyCondition) {
        conditionStack.splice(conditionStack.indexOf(condInfo), 1)
      }
    }
  }

  return hierarchy
}
