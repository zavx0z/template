import type { StreamToken } from "./token.t"
import type { PartMap, PartCondition, PartElement, PartMeta, PartsHierarchy, PartText } from "./hierarchy.t"

// Тип для работы с токенами в стеке
type TokenStackItem = {
  tag: { name: string; text: string }
  element: PartElement | PartMeta
}

/** Создает PartMap узел */
const createMapNode = (text: string, child: (PartElement | PartText | PartMeta)[]): PartMap => ({
  type: "map",
  text,
  child,
})

/** Создает PartCondition узел */
const createConditionNode = (
  text: string,
  trueBranch: PartElement | PartMeta | PartMap,
  falseBranch: PartElement | PartMeta | PartMap | PartCondition
): PartCondition => ({
  type: "cond",
  text,
  true: trueBranch,
  false: falseBranch,
})

/** Что считаем «ветвящимися» элементами для условий */
const isBranchable = (n: any): n is PartElement | PartMeta | PartMap =>
  n && (n.type === "el" || n.type === "meta" || n.type === "map")

/** Возвращает первый ветвящийся элемент из диапазона */
const pickFirstBranchable = (arr: any[]): PartElement | PartMeta | PartMap | undefined => {
  for (const n of arr) if (isBranchable(n)) return n
}

/** Массив элементов, пригодных для map/cond на данном уровне */
const getProcessableElements = (hierarchy: PartsHierarchy): (PartElement | PartText | PartMeta)[] =>
  hierarchy.filter((item) => item.type === "el" || item.type === "text" || item.type === "meta") as (
    | PartElement
    | PartText
    | PartMeta
  )[]

/** Обрабатывает несколько map-выражений на одном уровне */
const processMultipleMaps = (
  mapInfos: { parent: PartElement | PartMeta | null; text: string; startChildIndex: number }[],
  processableElements: (PartElement | PartText | PartMeta)[]
): PartMap[] => {
  const elementsPerMap = Math.ceil(processableElements.length / mapInfos.length)
  const mapNodes: PartMap[] = []
  for (let i = 0; i < mapInfos.length; i++) {
    const startIndex = i * elementsPerMap
    const endIndex = Math.min(startIndex + elementsPerMap, processableElements.length)
    const mapElements = processableElements.slice(startIndex, endIndex)
    if (mapElements.length > 0) mapNodes.push(createMapNode(mapInfos[i]!.text, mapElements))
  }
  return mapNodes
}

/** ===== Новая модель условий: копим границы и собираем цепочку при cond-close ===== */
type CondCtx = {
  // На каком уровне (массиве) открывалось условие:
  target: (PartElement | PartText | PartMeta | PartMap | PartCondition)[]
  // С какого индекса в target началось условие:
  startIdx: number
  // expr для if и каждого else-if по порядку:
  exprs: string[]
  // «Границы» сегментов того же target:
  // boundaries[0] = startIdx,
  // boundaries[i] = индекс начала сегмента для exprs[i] (копим на каждом else-if и else),
  // при close добавляем boundaries[exprs.length + 1] = endIdx
  boundaries: number[]
}

export const makeHierarchy = (tokens: StreamToken[]): PartsHierarchy => {
  const hierarchy: PartsHierarchy = []
  const stack: TokenStackItem[] = []

  // Map: оставляем прежнюю механику «схлопывания» на закрытии родителя
  const mapStack: {
    parent: PartElement | PartMeta | null
    text: string
    startChildIndex: number
    conditionContext: CondCtx | null
  }[] = []

  // Cond: теперь только копим границы и собираем по close
  const condStack: CondCtx[] = []

  // где сейчас нужно пушить детей (root или child последнего открытого элемента)
  const currentChildren = (): (PartElement | PartText | PartMeta | PartMap | PartCondition)[] => {
    const parent = stack[stack.length - 1]?.element
    if (parent) return (parent.child ||= [])
    return hierarchy
  }

  // Хелпер: построить цепочку if / else-if / else и заменить диапазон
  const finalizeCondition = (ctx: CondCtx) => {
    const tgt = ctx.target
    // Закрывающая граница — текущая длина target
    const endIdx = tgt.length
    ctx.boundaries.push(endIdx)

    // Валидация минимального количества сегментов:
    // exprs.length >= 1, boundaries должно быть exprs.length + 2 (start, ...else-if/else, end)
    if (ctx.exprs.length === 0 || ctx.boundaries.length < ctx.exprs.length + 2) {
      return
    }

    // Последний диапазон — это «else»-ветка (может быть пустым, но в тесте он есть)
    const elseStart = ctx.boundaries[ctx.exprs.length]!
    const elseEnd = ctx.boundaries[ctx.exprs.length + 1]!
    const elseRange = tgt.slice(elseStart, elseEnd)
    const elseBranch = pickFirstBranchable(elseRange)

    // Если вдруг нет ветвящегося элемента — ничего не собираем (защитно)
    if (!elseBranch) {
      return
    }

    // Собираем цепочку с конца к началу для правильной вложенности:
    let acc: PartElement | PartMeta | PartMap | PartCondition = elseBranch
    for (let i = ctx.exprs.length - 1; i >= 0; i--) {
      const segStart = ctx.boundaries[i]!
      const segEnd = ctx.boundaries[i + 1]!
      const seg = tgt.slice(segStart, segEnd)
      const trueBranch = pickFirstBranchable(seg)
      if (!trueBranch) {
        return // защитно: без true-ветки собирать нечего
      }
      acc = createConditionNode(ctx.exprs[i]!, trueBranch, acc)
    }

    // Заменяем весь диапазон условием-цепочкой
    tgt.splice(ctx.startIdx, endIdx - ctx.startIdx, acc as unknown as PartCondition)
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue

    if (token.kind === "cond-open") {
      const tgt = currentChildren()
      // Создаем новое условие для каждого cond-open
      condStack.push({
        target: tgt,
        startIdx: tgt.length,
        exprs: [token.expr],
        boundaries: [], // Не добавляем границу сразу, добавим когда встретим первый элемент
      })
      continue
    }

    if (token.kind === "cond-else") {
      const ctx = condStack[condStack.length - 1]
      if (ctx) {
        // Отмечаем границу начала else-сегмента
        ctx.boundaries.push(ctx.target.length)
      }
      continue
    }

    if (token.kind === "cond-close") {
      const ctx = condStack.pop()
      if (ctx) {
        finalizeCondition(ctx)
      }
      continue
    }

    if (token.kind === "map-open") {
      const parent = stack[stack.length - 1]?.element || null
      const tgt = parent ? (parent.child ||= []) : hierarchy
      // Запоминаем, в каком condition контексте был открыт map
      const activeCondition = condStack[condStack.length - 1]
      mapStack.push({
        parent,
        text: token.sig,
        startChildIndex: tgt.length,
        conditionContext: activeCondition || null,
      })
      continue
    }

    if (token.kind === "map-close") {
      // Находим последний открытый map в стеке
      const lastMap = mapStack[mapStack.length - 1]
      if (lastMap) {
        // Определяем правильный target для схлопывания
        // Для вложенных map используем родительский элемент
        // Для map в condition используем condition target
        // Для map на верхнем уровне используем hierarchy
        let tgt: (PartElement | PartText | PartMeta | PartMap | PartCondition)[]

        if (lastMap.parent && lastMap.parent.type === "el") {
          // Если родитель - элемент, используем его child
          tgt = lastMap.parent.child ||= []
        } else if (lastMap.conditionContext) {
          // Если map был открыт в контексте condition, используем его target
          tgt = lastMap.conditionContext.target
        } else {
          // Иначе используем hierarchy
          tgt = hierarchy
        }

        // Схлопываем map
        const startIdx = Math.max(0, lastMap.startChildIndex)
        const before = tgt.slice(0, startIdx)
        const mapChildren = tgt.slice(startIdx) as (PartElement | PartText | PartMeta)[]

        tgt.splice(0, tgt.length, ...before, createMapNode(lastMap.text, mapChildren))

        // Удаляем map из стека
        mapStack.pop()
      }
      continue
    }

    if (token.kind === "tag-open" || token.kind === "tag-self") {
      // Добавляем границу для активного условия, если это первый элемент
      const activeCondition = condStack[condStack.length - 1]
      if (activeCondition && activeCondition.boundaries.length === 0) {
        activeCondition.boundaries.push(activeCondition.target.length)
      }

      // META-элемент
      if (token.name && token.name.startsWith("meta-")) {
        const metaNode: PartMeta = { tag: token.name, type: "meta", text: token.text || "" }
        const tgt = currentChildren()
        tgt.push(metaNode)
        if (token.kind === "tag-open") {
          stack.push({ tag: { name: token.name, text: token.text || "" }, element: metaNode })
        }
        continue
      }

      // Обычный элемент
      const el: PartElement = { tag: token.name || "", type: "el", text: token.text || "" }
      const tgt = currentChildren()
      tgt.push(el)
      if (token.kind === "tag-open") {
        stack.push({ tag: { name: token.name || "", text: token.text || "" }, element: el })
      }
      continue
    }

    if (token.kind === "tag-close") {
      const last = stack[stack.length - 1]
      if (last && last.tag.name === (token.name || "")) {
        const parentElement = last.element

        // Схлопываем все map, открытые ровно под этим родителем
        const mapsHere = mapStack.filter((m) => m.parent === parentElement)
        if (mapsHere.length > 0 && parentElement.child && parentElement.child.length > 0) {
          if (mapsHere.length > 1) {
            const mapable = parentElement.child.filter(isBranchableOrText) as (PartElement | PartText | PartMeta)[]
            const elementsPerMap = Math.ceil(mapable.length / mapsHere.length)
            const newChildren: (PartElement | PartText | PartMeta | PartMap | PartCondition)[] = []

            for (let k = 0; k < mapsHere.length; k++) {
              const info = mapsHere[k]!
              const startIndex = k * elementsPerMap
              const endIndex = Math.min(startIndex + elementsPerMap, mapable.length)
              const mapElements = mapable.slice(startIndex, endIndex)
              if (mapElements.length > 0) newChildren.push(createMapNode(info.text, mapElements))
            }

            const nonMap = parentElement.child.filter(
              (it: any) => !(it.type === "el" || it.type === "text" || it.type === "meta")
            )
            newChildren.push(...nonMap)
            parentElement.child = newChildren

            for (const info of mapsHere) {
              const idx = mapStack.indexOf(info)
              if (idx !== -1) mapStack.splice(idx, 1)
            }
          } else {
            const info = mapsHere[0]!
            const startIdx = Math.max(0, info.startChildIndex)
            const before = parentElement.child.slice(0, startIdx)
            const mapChildren = parentElement.child.slice(startIdx) as (PartElement | PartText | PartMeta)[]
            parentElement.child = [...before, createMapNode(info.text, mapChildren)]
            const idx = mapStack.indexOf(info)
            if (idx !== -1) mapStack.splice(idx, 1)
          }
        }

        stack.pop()
      }
      continue
    }

    if (token.kind === "text") {
      // Добавляем границу для активного условия, если это первый элемент
      const activeCondition = condStack[condStack.length - 1]
      if (activeCondition && activeCondition.boundaries.length === 0) {
        activeCondition.boundaries.push(activeCondition.target.length)
      }

      const tgt = currentChildren()
      const textNode: PartText = { type: "text", text: token.text || "" }
      tgt.push(textNode)
      continue
    }
  }

  // Если остались незакрытые условия — аккуратно финализируем (LIFO)
  while (condStack.length) finalizeCondition(condStack.pop()!)

  // Топ-уровневые map (если вдруг остались)
  const topLevelMaps = mapStack.filter((m) => m.parent === null)
  if (topLevelMaps.length > 0) {
    const newHierarchy: PartsHierarchy = []
    const processable = getProcessableElements(hierarchy)

    if (topLevelMaps.length > 1) {
      newHierarchy.push(...processMultipleMaps(topLevelMaps, processable))
    } else {
      const mapInfo = topLevelMaps[0]!
      if (processable.length > 0) newHierarchy.push(createMapNode(mapInfo.text, processable))
    }

    // Добавляем непреобразованные узлы (если такие есть)
    const nonProcessable = hierarchy.filter(
      (it: any) => !(it.type === "el" || it.type === "text" || it.type === "meta")
    )
    newHierarchy.push(...nonProcessable)

    hierarchy.splice(0, hierarchy.length, ...newHierarchy)
  }

  return hierarchy
}

// Внутренний хелпер для map-схлопывания
const isBranchableOrText = (it: any): it is PartElement | PartText | PartMeta =>
  it && (it.type === "el" || it.type === "text" || it.type === "meta")
