import type { ElementToken } from "./splitter"
import type { PartMap, PartCondition, PartElement, PartMeta, PartsHierarchy, StackItem, PartText } from "./hierarchy.t"

/**
 * Создает PartMap узел
 */
const createMapNode = (text: string, child: (PartElement | PartText | PartMeta)[]): PartMap => ({
  type: "map",
  text,
  child,
})

/**
 * Создает PartCondition узел
 */
const createConditionNode = (
  text: string,
  trueBranch: PartElement | PartMeta,
  falseBranch: PartElement | PartMeta
): PartCondition => ({
  type: "cond",
  text,
  true: trueBranch,
  false: falseBranch,
})

/**
 * Фильтрует элементы, которые могут быть обработаны map/condition
 */
const getProcessableElements = (hierarchy: PartsHierarchy): (PartElement | PartText | PartMeta)[] =>
  hierarchy.filter((item) => item.type === "el" || item.type === "text" || item.type === "meta") as (
    | PartElement
    | PartText
    | PartMeta
  )[]

/**
 * Обрабатывает несколько map-выражений
 */
const processMultipleMaps = (
  mapInfos: { parent: PartElement | PartMeta | null; text: string; startChildIndex: number }[],
  processableElements: (PartElement | PartText | PartMeta)[]
): PartMap[] => {
  const elementsPerMap = Math.ceil(processableElements.length / mapInfos.length)
  const mapNodes: PartMap[] = []

  for (let i = 0; i < mapInfos.length; i++) {
    const mapInfo = mapInfos[i]
    const startIndex = i * elementsPerMap
    const endIndex = Math.min(startIndex + elementsPerMap, processableElements.length)
    const mapElements = processableElements.slice(startIndex, endIndex)

    if (mapElements.length > 0 && mapInfo) {
      mapNodes.push(createMapNode(mapInfo.text, mapElements))
    }
  }

  return mapNodes
}

/**
 * Обрабатывает несколько условий (резерв на случай топ-уровня;
 * при нормальной работе условия схлопываются на встрече '}')
 */
const processMultipleConditions = (
  conditionInfos: { parent: PartElement | PartMeta | null; text: string }[],
  processableElements: (PartElement | PartText | PartMeta)[]
): PartCondition[] => {
  const elementsPerCondition = Math.ceil(processableElements.length / conditionInfos.length)
  const conditionNodes: PartCondition[] = []

  for (let i = 0; i < conditionInfos.length; i++) {
    const condInfo = conditionInfos[i]
    const startIndex = i * elementsPerCondition
    const endIndex = Math.min(startIndex + elementsPerCondition, processableElements.length)
    const conditionElements = processableElements.slice(startIndex, endIndex)

    if (conditionElements.length >= 2 && condInfo) {
      const trueBranch = conditionElements[0]
      const falseBranch = conditionElements[1]
      if (
        trueBranch &&
        falseBranch &&
        (trueBranch.type === "el" || trueBranch.type === "meta") &&
        (falseBranch.type === "el" || falseBranch.type === "meta")
      ) {
        conditionNodes.push(
          createConditionNode(
            condInfo.text,
            trueBranch as PartElement | PartMeta,
            falseBranch as PartElement | PartMeta
          )
        )
      }
    }
  }

  return conditionNodes
}

/**
 * Формирует иерархию элементов на основе последовательности токенов.
 * Ключевое отличие: условия (${cond ? A : B}) схлопываются при встрече парной '}'.
 */
export const makeHierarchy = (html: string, elements: ElementToken[]): PartsHierarchy => {
  const hierarchy: PartsHierarchy = []
  const stack: StackItem[] = []

  // --- Новая модель сбора условий: запоминаем старт и закрываем на '}' ---
  type CondInfo = {
    parent: PartElement | PartMeta | null
    text: string
    startChildIndex: number
  }
  const conditionStack: CondInfo[] = []

  // Для map оставляем прежнюю схему (оборачивание на закрытии родителя)
  const mapStack: { parent: PartElement | PartMeta | null; text: string; startChildIndex: number }[] = []

  const getTargetChildren = (parent: PartElement | PartMeta | null, root: PartsHierarchy) =>
    parent ? (parent.child ||= []) : root

  const closeLastConditionIfPossible = () => {
    const cond = conditionStack.pop()
    if (!cond) return
    const target = getTargetChildren(cond.parent, hierarchy)

    // элементы, добавленные с момента старта условия
    const range = target.slice(cond.startChildIndex)

    // ветками могут быть только el/meta
    const branchables = range.filter((n) => n.type === "el" || n.type === "meta") as (PartElement | PartMeta)[]

    if (branchables.length < 2) return

    const trueBranch = branchables[0]
    const falseBranch = branchables[1]

    const i1 = target.indexOf(trueBranch)
    const i2 = target.indexOf(falseBranch)
    if (i1 === -1 || i2 === -1) return

    const start = Math.min(i1, i2)
    const count = Math.abs(i2 - i1) + 1
    target.splice(start, count, createConditionNode(cond.text, trueBranch, falseBranch))
  }

  // Детект старта/закрытия условий + детект map в одном «межтокенном» слайсе
  const processInterTokenSlice = (slice: string) => {
    // 1) сначала закрываем все '}' (LIFO — закрывает последние открытые условия)
    const closes = (slice.match(/}/g) || []).length
    for (let i = 0; i < closes; i++) closeLastConditionIfPossible()

    // 2) затем детектим старты условий `${ expr ?`
    const reCond = /\$\{([^?]+)\?/g
    let m: RegExpExecArray | null
    while ((m = reCond.exec(slice))) {
      const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
      const target = getTargetChildren(parent, hierarchy)
      conditionStack.push({
        parent,
        text: (m[1] || "").trim(),
        startChildIndex: target.length,
      })
    }

    // 3) детектим map(...) перед очередным узлом
    const mapMatch = slice.match(/(\w+(?:\.\w+)*\.map\([^)]*\))/)
    if (mapMatch) {
      const mapText = mapMatch[1] || ""
      const mapEnd = slice.indexOf(mapText) + mapText.length
      const afterMap = slice.slice(mapEnd)
      let finalMapText = mapText
      if (/^\s*=>\s*html`/.test(afterMap)) finalMapText += "`" // добираем бэктик, если он «прилип» в шаблоне

      const parent = stack.length > 0 ? stack[stack.length - 1]?.element || null : null
      const target = getTargetChildren(parent, hierarchy)
      const startChildIndex = target.length
      mapStack.push({ parent, text: finalMapText, startChildIndex })
    }
  }

  // основной проход
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element) continue

    // межтокенный фрагмент
    const prev = elements[i - 1]
    const sliceStart = i === 0 ? 0 : (prev?.index || 0) + (prev?.text?.length || 0)
    const sliceEnd = element.index || 0
    const slice = html.slice(sliceStart, sliceEnd)

    // СНАЧАЛА обрабатываем '}', старты условий и map
    processInterTokenSlice(slice)

    if (element.kind === "open" || element.kind === "self") {
      // META-элемент
      if (element.name && element.name.startsWith("meta-")) {
        const metaNode: PartMeta = {
          tag: element.name,
          type: "meta",
          text: element.text || "",
        }

        const parent = stack.length > 0 ? stack[stack.length - 1] : null
        if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
          ;(parent.element.child ||= []).push(metaNode)
        } else {
          hierarchy.push(metaNode)
        }

        if (element.kind === "open") {
          stack.push({ tag: element, element: metaNode })
        }
        continue
      }

      // Обычный HTML элемент
      const nodeElement: PartElement = {
        tag: element.name || "",
        type: "el",
        text: element.text || "",
      }

      const parent = stack.length > 0 ? stack[stack.length - 1] : null
      if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
        ;(parent.element.child ||= []).push(nodeElement)
      } else {
        hierarchy.push(nodeElement)
      }

      if (element.kind === "open") {
        stack.push({ tag: element, element: nodeElement })
      }
    } else if (element.kind === "close") {
      // Закрывающий тег
      if (stack.length > 0) {
        const last = stack[stack.length - 1]
        if (last && last.tag.name === (element.name || "")) {
          const parentElement = last.element

          // MAP: схлопываем на закрытии родителя
          const mapInfos = mapStack.filter((m) => m.parent === parentElement)
          if (mapInfos.length > 0 && parentElement.child && parentElement.child.length > 0) {
            if (mapInfos.length > 1) {
              const mapable = parentElement.child.filter(
                (it) => it.type === "el" || it.type === "text" || it.type === "meta"
              ) as (PartElement | PartText | PartMeta)[]

              const elementsPerMap = Math.ceil(mapable.length / mapInfos.length)
              const newChildren: (PartElement | PartText | PartMeta | PartMap | PartCondition)[] = []

              for (let k = 0; k < mapInfos.length; k++) {
                const info = mapInfos[k]
                const startIndex = k * elementsPerMap
                const endIndex = Math.min(startIndex + elementsPerMap, mapable.length)
                const mapElements = mapable.slice(startIndex, endIndex)
                if (mapElements.length > 0) newChildren.push(createMapNode(info.text, mapElements))
              }

              const nonMap = parentElement.child.filter(
                (it) => !(it.type === "el" || it.type === "text" || it.type === "meta")
              )
              newChildren.push(...nonMap)
              parentElement.child = newChildren

              for (const info of mapInfos) {
                const idx = mapStack.indexOf(info)
                if (idx !== -1) mapStack.splice(idx, 1)
              }
            } else {
              const info = mapInfos[0]
              if (info) {
                const startIdx = Math.max(0, info.startChildIndex)
                const before = parentElement.child.slice(0, startIdx)
                const mapChildren = parentElement.child.slice(startIdx) as (PartElement | PartText | PartMeta)[]
                parentElement.child = [...before, createMapNode(info.text, mapChildren)]
                const idx = mapStack.indexOf(info)
                if (idx !== -1) mapStack.splice(idx, 1)
              }
            }
          }

          // ВАЖНО: старую логику формирования условий «по последней паре» удалили.
          stack.pop()
        }
      }
    } else if (element.kind === "text") {
      // Текстовый узел
      const textNode: PartText = { type: "text", text: element.text || "" }
      const parent = stack.length > 0 ? stack[stack.length - 1] : null
      if (parent && parent.element && (parent.element.type === "el" || parent.element.type === "meta")) {
        ;(parent.element.child ||= []).push(textNode)
      } else {
        hierarchy.push(textNode)
      }
    }
  }

  // обработать «хвост» (последний слайс до конца html): может лежать закрывающая '}'
  if (elements.length > 0) {
    const last = elements[elements.length - 1]
    const tailStart = (last?.index || 0) + (last?.text?.length || 0)
    const tail = html.slice(tailStart)
    if (tail) processInterTokenSlice(tail)
  }

  // Если остались незакрытые условия (маловероятно, но на всякий случай) — закрыть их в порядке LIFO
  while (conditionStack.length) closeLastConditionIfPossible()

  // Топ-уровень: MAP/COND на null-родителе
  const topLevelMapInfos = mapStack.filter((m) => m.parent === null)
  const topLevelConditions = [] as { parent: null; text: string }[] // conditionStack к этому моменту пуст

  if (topLevelMapInfos.length > 0 || topLevelConditions.length > 0) {
    const newHierarchy: PartsHierarchy = []
    const processable = getProcessableElements(hierarchy)

    if (topLevelMapInfos.length > 0) {
      if (topLevelMapInfos.length > 1) {
        newHierarchy.push(...processMultipleMaps(topLevelMapInfos, processable))
      } else {
        const mapInfo = topLevelMapInfos[0]
        if (mapInfo && processable.length > 0) {
          newHierarchy.push(createMapNode(mapInfo.text, processable))
        }
      }
    } else if (topLevelConditions.length > 0) {
      if (topLevelConditions.length > 1) {
        newHierarchy.push(...processMultipleConditions(topLevelConditions, processable))
      } else {
        const condInfo = topLevelConditions[0]
        if (processable.length >= 2 && condInfo) {
          const trueBranch = processable[0]
          const falseBranch = processable[1]
          if (
            (trueBranch.type === "el" || trueBranch.type === "meta") &&
            (falseBranch.type === "el" || falseBranch.type === "meta")
          ) {
            newHierarchy.push(
              createConditionNode(
                condInfo.text,
                trueBranch as PartElement | PartMeta,
                falseBranch as PartElement | PartMeta
              )
            )
          }
        }
      }
    }

    // Добавляем «непроцессируемые» элементы, если были
    const nonProcessable = hierarchy.filter((it) => !(it.type === "el" || it.type === "text" || it.type === "meta"))
    newHierarchy.push(...nonProcessable)

    hierarchy.splice(0, hierarchy.length, ...newHierarchy)
  }

  return hierarchy
}
