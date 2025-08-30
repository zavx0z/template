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

export function extractTokens(mainHtml: string, elements: ElementToken[]): StreamToken[] {
  const allTokens: StreamToken[] = []

  // Сначала добавляем текст до первого элемента
  if (elements.length > 0) {
    const string = mainHtml.slice(0, elements[0]!.start).trim()
    if (string) allTokens.push(...extractPatterns(string))
  }

  // Затем обрабатываем все элементы
  elements.reduce((prev: ElementToken | null, curr: ElementToken, index: number) => {
    if (prev) {
      allTokens.push(elementPartToToken(prev))
      // Выводим строку между предыдущим и текущим элементом, если она не пустая
      const string = mainHtml.slice(prev.end, curr.start).trim()
      if (string) allTokens.push(...extractPatterns(string))
    }
    return curr
  }, null)

  // И, наконец, добавляем последний элемент и текст после него
  if (elements.length > 0) {
    allTokens.push(elementPartToToken(elements[elements.length - 1]!))
    const string = mainHtml.slice(elements[elements.length - 1]!.end, mainHtml.length).trim()
    if (string) allTokens.push(...extractPatterns(string))
  }

  return allTokens
}

function extractPatterns(expr: string): StreamToken[] {
  const tokens = new Map<number, StreamToken>()

  // --------- conditions ---------
  const tokenCondOpen = findCondOpen(expr)
  if (tokenCondOpen) tokens.set(...tokenCondOpen)

  const tokenCondElse = findCondElse(expr)
  if (tokenCondElse) tokens.set(...tokenCondElse)

  const tokenCondClose = findCondClose(expr)
  if (tokenCondClose) tokens.set(...tokenCondClose)

  // ------------- map -------------
  const tokenMapOpen = findMapOpen(expr)
  if (tokenMapOpen) tokens.set(...tokenMapOpen)

  const tokenMapClose = findMapClose(expr)
  if (tokenMapClose) tokens.set(...tokenMapClose)

  // Сортируем по позиции и возвращаем токены
  return Array.from(tokens.entries())
    .sort(([a], [b]) => a - b)
    .map(([, token]) => token)
}

const findCondOpen = (expr: string): [number, TokenCondOpen] | undefined => {
  const condOpenRegex = /\$\{([^?]+)\?/g
  let match
  while ((match = condOpenRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-open", expr: match[1]!.trim() }]
  }
}

const findCondElse = (expr: string): [number, TokenCondElse] | undefined => {
  const condElseRegex = /: /g
  let match
  while ((match = condElseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-else" }]
  }
}

const findCondClose = (expr: string): [number, TokenCondClose] | undefined => {
  const condCloseRegex = /}/g
  let match
  while ((match = condCloseRegex.exec(expr)) !== null) {
    return [match.index, { kind: "cond-close" }]
  }
}

const findMapOpen = (expr: string): [number, TokenMapOpen] | undefined => {
  const mapOpenRegex = /\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\.map\([^)]*\))/g
  let match
  while ((match = mapOpenRegex.exec(expr)) !== null) {
    return [match.index, { kind: "map-open", sig: match[1]! }]
  }
}

const findMapClose = (expr: string): [number, TokenMapClose] | undefined => {
  const mapCloseRegex = /`?\)\}/g
  let closeMatch
  while ((closeMatch = mapCloseRegex.exec(expr)) !== null) {
    return [closeMatch.index, { kind: "map-close" }]
  }
}
