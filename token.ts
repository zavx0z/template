import type { StreamToken, TokenCondClose, TokenCondElse, TokenCondOpen, TokenMapClose, TokenMapOpen } from "./token.t"
import type { ElementToken } from "./splitter"

const elementPartToToken = (element: ElementToken): StreamToken => {
  switch (element.kind) {
    case "open":
      return { text: element.text, name: element.name, kind: "tag-open" }
    case "close":
      return { text: element.text, name: element.name, kind: "tag-close" }
    case "self":
      return { text: element.text, name: element.name, kind: "tag-self" }
    case "text":
      return { text: element.text, kind: "text" }
    default:
      throw new Error(`Unknown element kind: ${element.kind}`)
  }
}
type Signal = {
  value: number
  inc: () => void
  dec: () => void
}

export function extractTokens(mainHtml: string, elements: ElementToken[]): StreamToken[] {
  const allTokens: StreamToken[] = []

  const signal = (value = 0, decCb?: (value: number) => void): Signal => {
    return {
      get value() {
        return value
      },
      inc() {
        value++
      },
      dec() {
        decCb?.(value)
        value--
      },
    }
  }
  const mapConds = new Set<number>()
  const mapLevel = signal(0, (value) => {
    if (mapConds.has(value)) {
      allTokens.push({ kind: "cond-close" })
      mapConds.delete(value)
    }
  })

  function pushTokens(expr: string): void {
    const tokens = new Map<number, StreamToken>()

    // --------- conditions ---------
    const setAllCondsOpen = (expr: string) => {
      const tokenCondOpen = findCondOpen(expr)
      if (tokenCondOpen) {
        tokens.set(...tokenCondOpen)
        const sliced = expr.slice(tokenCondOpen[0] + tokenCondOpen[1].expr.length)
        setAllCondsOpen(sliced)
      }
    }
    // Собираем всю цепочку условий
    setAllCondsOpen(expr)

    const tokenCondElse = findCondElse(expr)
    tokenCondElse && tokens.set(...tokenCondElse)

    const tokenCondClose = findCondClose(expr)
    tokenCondClose && tokens.set(...tokenCondClose)

    // ------------- map -------------
    const tokenMapOpen = findMapOpen(expr)
    // console.log("tokenMapOpen", expr, tokenMapOpen)
    if (tokenMapOpen) {
      tokens.set(...tokenMapOpen)
      mapLevel.inc()
    }

    const tokenMapClose = findMapClose(expr)
    if (tokenMapClose) {
      tokens.set(...tokenMapClose)
      mapLevel.dec()
    }

    // Сортируем по позиции и возвращаем токены
    Array.from(tokens.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([, token]) => {
        if (
          token.kind === "cond-open" &&
          allTokens.length > 0 &&
          allTokens[allTokens.length - 1]!.kind === "map-open"
        ) {
          mapConds.add(mapLevel.value)
        }
        allTokens.push(token)
      })
  }

  // Сначала добавляем текст до первого элемента
  if (elements.length > 0) {
    const string = mainHtml.slice(0, elements[0]!.start).trim()
    if (string) pushTokens(string)
  }

  // Затем обрабатываем все элементы
  elements.reduce((prev: ElementToken | null, curr: ElementToken, index: number) => {
    if (prev) {
      allTokens.push(elementPartToToken(prev))
      // Выводим строку между предыдущим и текущим элементом, если она не пустая
      const string = mainHtml.slice(prev.end, curr.start).trim()
      if (string) pushTokens(string)
    }
    return curr
  }, null)

  // И, наконец, добавляем последний элемент и текст после него
  if (elements.length > 0) {
    allTokens.push(elementPartToToken(elements[elements.length - 1]!))
    const string = mainHtml.slice(elements[elements.length - 1]!.end, mainHtml.length).trim()
    if (string) pushTokens(string)
  }

  return allTokens
}

export const findCondOpen = (expr: string): [number, TokenCondOpen] | undefined => {
  let i = 0
  while (i < expr.length) {
    const d = expr.indexOf("${", i)
    const a = expr.indexOf("=>", i)
    if (d === -1 && a === -1) return

    const useDollar = d !== -1 && (a === -1 || d < a)
    const start = useDollar ? d : a
    let j = start + 2
    while (j < expr.length && /\s/.test(expr[j]!)) j++

    const q = expr.indexOf("?", j)
    if (q === -1) return

    const between = expr.slice(j, q)

    // если это ветка "=>", и до '?' попался backtick, то это тегированный шаблон:
    // переносим курсор на сам backtick и ищем следующий кандидат (внутренний ${ ... ? ... }).
    if (!useDollar) {
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    // если это ветка "${", и до '?' попался .map( — пропускаем внешний map-кандидат
    // и двигаемся внутрь.
    if (useDollar) {
      const m = between.indexOf(".map(")
      if (m !== -1) {
        i = j + m + 1
        continue
      }
      // защитно: если внутри выражения внезапно встретился backtick — тоже двигаемся к нему
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    return [j, { kind: "cond-open", expr: between.trim() }]
  }
}

export const findCondElse = (expr: string): [number, TokenCondElse] | undefined => {
  const condElseRegex = /:\s*/g // допускаем произвольные пробелы/переводы строк
  let match
  while ((match = condElseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-else" }]
  }
}

export const findAllConditions = (expr: string): [number, TokenCondOpen][] => {
  // Ищем все условия (включая вложенные)
  const results: [number, TokenCondOpen][] = []

  // Сначала ищем первое условие (после ${ или =>)
  let i = 0
  while (i < expr.length) {
    const d = expr.indexOf("${", i)
    const a = expr.indexOf("=>", i)
    if (d === -1 && a === -1) break

    const useDollar = d !== -1 && (a === -1 || d < a)
    const start = useDollar ? d : a
    let j = start + 2
    while (j < expr.length && /\s/.test(expr[j]!)) j++

    const q = expr.indexOf("?", j)
    if (q === -1) {
      i = j + 1
      continue
    }

    const between = expr.slice(j, q)

    // если это ветка "=>", и до '?' попался backtick, то это тегированный шаблон:
    // переносим курсор на сам backtick и ищем следующий кандидат (внутренний ${ ... ? ... }).
    if (!useDollar) {
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    // если это ветка "${", и до '?' попался .map( — пропускаем внешний map-кандидат
    // и двигаемся внутрь.
    if (useDollar) {
      const m = between.indexOf(".map(")
      if (m !== -1) {
        i = j + m + 1
        continue
      }
      // защитно: если внутри выражения внезапно встретился backtick — тоже двигаемся к нему
      const bt = between.indexOf("`")
      if (bt !== -1) {
        i = j + bt + 1
        continue
      }
    }

    results.push([j, { kind: "cond-open", expr: between.trim() }])
    i = q + 1
  }

  // Затем ищем все вложенные условия вида: ? ... ?
  i = 0
  while (i < expr.length) {
    const questionMark1 = expr.indexOf("?", i)
    if (questionMark1 === -1) break

    // Ищем следующий ? после первого
    const questionMark2 = expr.indexOf("?", questionMark1 + 1)
    if (questionMark2 === -1) break

    // Извлекаем условие между ? и ?
    const condition = expr.slice(questionMark1 + 1, questionMark2).trim()

    // Проверяем, что это не пустое условие и не содержит html`
    if (condition && !condition.includes("html`")) {
      results.push([questionMark1 + 1, { kind: "cond-open", expr: condition }])
    }

    // Продолжаем поиск с позиции после первого ?
    i = questionMark1 + 1
  }

  return results
}

export const findCondClose = (expr: string): [number, TokenCondClose] | undefined => {
  // Ищем } которая НЕ является частью деструктуризации в параметрах функции
  // Исключаем случаи типа ({ title }) => или (({ title })) =>
  const condCloseRegex = /[^\)]}(?!\s*\)\s*=>)/g
  let match
  while ((match = condCloseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-close" }]
  }
}

export const findMapOpen = (expr: string): [number, TokenMapOpen] | undefined => {
  const mapOpenRegex = /\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\.map\([^)]*\))/g
  let match
  while ((match = mapOpenRegex.exec(expr)) !== null) {
    return [match.index, { kind: "map-open", sig: match[1]! }]
  }
}

export const findMapClose = (expr: string): [number, TokenMapClose] | undefined => {
  const mapCloseRegex = /`?\)\}/g
  let closeMatch
  while ((closeMatch = mapCloseRegex.exec(expr)) !== null) {
    return [closeMatch.index, { kind: "map-close" }]
  }
}
