import type { ElementToken } from "./splitter"
import type { PartMap, PartCondition, PartElement, PartMeta, PartHierarchy, StackItem, PartText } from "./hierarchy.t"

/**
 * Формирует иерархию элементов на основе последовательности тегов.
 *
 * ПРОСТОЙ АЛГОРИТМ:
 * 1. Один проход по элементам
 * 2. Строим иерархию сразу при обнаружении map/condition
 * 3. Создаем PartMap/PartCondition на правильном уровне
 *
 * @param html Полный HTML-текст
 * @param elements Токены элементов (теги + текст)
 * @returns Иерархия элементов с исходными подстроками
 */
export const makeHierarchy = (html: string, elements: ElementToken[]): PartHierarchy => {
  const hierarchy: PartHierarchy = []
  const stack: StackItem[] = []
  const conditionStack: { parent: PartElement | PartMeta | null; text: string }[] = []
  // Запоминаем у какого родителя начался map и с какого индекса его дети должны быть обернуты
  const mapStack: { parent: PartElement | PartMeta | null; text: string; startChildIndex: number }[] = []

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element) continue

    if (element.kind === "open" || element.kind === "self") {
      // Проверяем, является ли это мета-тегом
      if (element.name && element.name.startsWith("meta-")) {
        // Создаем мета-узел
        const metaNode: PartMeta = {
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
      const nodeElement: PartElement = {
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

            // Создаем PartMap если нужно (для meta-тегов)
            if (parentElement.type === "meta") {
              const mapInfo = mapStack.find((m) => m.parent === parentElement)
              if (mapInfo && parentElement.child && parentElement.child.length > 0) {
                const startIdx = Math.max(0, mapInfo.startChildIndex)
                const beforeChildren = parentElement.child.slice(0, startIdx)
                const mapChildren = parentElement.child.slice(startIdx) as (PartElement | PartText | PartMeta)[]

                const mapNode: PartMap = {
                  type: "map",
                  text: mapInfo.text,
                  child: mapChildren,
                }

                parentElement.child = [...beforeChildren, mapNode]
                mapStack.splice(mapStack.indexOf(mapInfo), 1)
              }
            }

            // Создаем PartCondition если нужно (для meta-тегов)
            const condInfos = conditionStack.filter((c) => c.parent === parentElement)
            for (const condInfo of condInfos) {
              if (parentElement.child && parentElement.child.length >= 2) {
                // Ищем последовательные пары элементов, которые могут быть true/false ветками
                let processedAnyCondition = false
                for (let i = parentElement.child.length - 1; i >= 1; i--) {
                  const trueBranch = parentElement.child[i - 1]
                  const falseBranch = parentElement.child[i]

                  if (trueBranch && falseBranch && trueBranch.type === "meta" && falseBranch.type === "meta") {
                    const conditionNode: PartCondition = {
                      type: "cond",
                      text: condInfo.text,
                      true: trueBranch as PartMeta,
                      false: falseBranch as PartMeta,
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

          // Создаем PartMap если нужно (только для обычных элементов)
          if (parentElement.type === "el") {
            const mapInfos = mapStack.filter((m) => m.parent === parentElement)
            if (mapInfos.length > 0 && parentElement.child && parentElement.child.length > 0) {
              // Если у нас несколько map-выражений, используем новую логику
              if (mapInfos.length > 1) {
                // Обрабатываем все map-выражения для этого родителя
                const mapableElements = parentElement.child.filter(
                  (item) => item.type === "el" || item.type === "text" || item.type === "meta"
                ) as (PartElement | PartText | PartMeta)[]

                // Разделяем элементы между map-выражениями
                const elementsPerMap = Math.ceil(mapableElements.length / mapInfos.length)
                const newChildren: (PartElement | PartText | PartMeta | PartMap | PartCondition)[] = []

                for (let i = 0; i < mapInfos.length; i++) {
                  const mapInfo = mapInfos[i]
                  if (!mapInfo) continue
                  const startIndex = i * elementsPerMap
                  const endIndex = Math.min(startIndex + elementsPerMap, mapableElements.length)
                  const mapElements = mapableElements.slice(startIndex, endIndex)

                  if (mapElements.length > 0) {
                    const mapNode: PartMap = {
                      type: "map",
                      text: mapInfo.text,
                      child: mapElements,
                    }
                    newChildren.push(mapNode)
                  }
                }

                // Добавляем элементы, которые не вошли в map
                const nonMapElements = parentElement.child.filter(
                  (item) => !(item.type === "el" || item.type === "text" || item.type === "meta")
                )
                newChildren.push(...nonMapElements)

                parentElement.child = newChildren

                // Удаляем обработанные map-выражения из стека
                for (const mapInfo of mapInfos) {
                  mapStack.splice(mapStack.indexOf(mapInfo), 1)
                }
              } else {
                // Один map - используем старую логику
                const mapInfo = mapInfos[0]
                if (mapInfo && parentElement.child && parentElement.child.length > 0) {
                  const startIdx = Math.max(0, mapInfo.startChildIndex)
                  const beforeChildren = parentElement.child.slice(0, startIdx)
                  const mapChildren = parentElement.child.slice(startIdx) as (PartElement | PartText)[]

                  const mapNode: PartMap = {
                    type: "map",
                    text: mapInfo.text,
                    child: mapChildren,
                  }

                  parentElement.child = [...beforeChildren, mapNode]
                  mapStack.splice(mapStack.indexOf(mapInfo), 1)
                }
              }
            }
          }

          // Создаем PartCondition если нужно - ОБРАБАТЫВАЕМ ВСЕ условия для этого родителя
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
                    const conditionNode: PartCondition = {
                      type: "cond",
                      text: condInfo.text,
                      true: trueBranch as PartElement,
                      false: falseBranch as PartElement,
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
      const textNode: PartText = {
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
  const topLevelMapInfos = mapStack.filter((m) => m.parent === null)
  const topLevelConditions = conditionStack.filter((c) => c.parent === null)

  if (topLevelMapInfos.length > 0 || topLevelConditions.length > 0) {
    const newHierarchy: PartHierarchy = []

    // Получаем все элементы, которые могут быть в map или condition
    const processableElements = hierarchy.filter(
      (item) => item.type === "el" || item.type === "text" || item.type === "meta"
    ) as (PartElement | PartText | PartMeta)[]

    // Если у нас есть и map и condition, нужно правильно разделить элементы
    if (topLevelMapInfos.length > 0 && topLevelConditions.length > 0) {
      // Для случая map + condition на верхнем уровне
      // Первый элемент идет в map, остальные в condition
      if (processableElements.length > 0) {
        // Первый элемент для map
        const mapInfo = topLevelMapInfos[0]
        const mapElement = processableElements[0]

        if (mapInfo && mapElement) {
          const mapNode: PartMap = {
            type: "map",
            text: mapInfo.text,
            child: [mapElement],
          }
          newHierarchy.push(mapNode)
        }

        // Остальные элементы для condition
        const remainingElements = processableElements.slice(1)
        if (remainingElements.length >= 2) {
          const condInfo = topLevelConditions[0]
          const trueBranch = remainingElements[0]
          const falseBranch = remainingElements[1]

          if (condInfo && trueBranch && falseBranch) {
            const conditionNode: PartCondition = {
              type: "cond",
              text: condInfo.text,
              true: trueBranch as PartElement | PartMeta,
              false: falseBranch as PartElement | PartMeta,
            }
            newHierarchy.push(conditionNode)
          }
        }
      }
    } else if (topLevelMapInfos.length > 1) {
      // Несколько map-выражений на верхнем уровне
      const elementsPerMap = Math.ceil(processableElements.length / topLevelMapInfos.length)

      for (let i = 0; i < topLevelMapInfos.length; i++) {
        const mapInfo = topLevelMapInfos[i]
        const startIndex = i * elementsPerMap
        const endIndex = Math.min(startIndex + elementsPerMap, processableElements.length)
        const mapElements = processableElements.slice(startIndex, endIndex)

        if (mapElements.length > 0 && mapInfo) {
          const mapNode: PartMap = {
            type: "map",
            text: mapInfo.text,
            child: mapElements,
          }
          newHierarchy.push(mapNode)
        }
      }
    } else if (topLevelMapInfos.length === 1) {
      // Один map - все элементы принадлежат ему
      const mapInfo = topLevelMapInfos[0]
      if (mapInfo && processableElements.length > 0) {
        const mapNode: PartMap = {
          type: "map",
          text: mapInfo.text,
          child: processableElements,
        }
        newHierarchy.push(mapNode)
      }
    } else if (topLevelConditions.length > 0) {
      // Только условия на верхнем уровне
      for (const condInfo of topLevelConditions) {
        if (processableElements.length >= 2) {
          const trueBranch = processableElements[0]
          const falseBranch = processableElements[1]

          if (trueBranch && falseBranch) {
            const conditionNode: PartCondition = {
              type: "cond",
              text: condInfo.text,
              true: trueBranch as PartElement | PartMeta,
              false: falseBranch as PartElement | PartMeta,
            }
            newHierarchy.push(conditionNode)
            break // Обрабатываем только одно условие
          }
        }
      }
    }

    // Добавляем элементы, которые не вошли в map или condition
    const nonProcessableElements = hierarchy.filter(
      (item) => !(item.type === "el" || item.type === "text" || item.type === "meta")
    )
    newHierarchy.push(...nonProcessableElements)

    hierarchy.splice(0, hierarchy.length, ...newHierarchy)
  }

  return hierarchy
}
