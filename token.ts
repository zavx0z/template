import type { StreamToken } from "./token.t"
import type { ElementToken } from "./splitter"

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
      switch (prev.kind) {
        case "open":
          allTokens.push({ text: prev.text, name: prev.name, kind: "tag-open" })
          break
        case "close":
          allTokens.push({ text: prev.text, name: prev.name, kind: "tag-close" })
          break
        case "self":
          allTokens.push({ text: prev.text, name: prev.name, kind: "tag-self" })
          break
        case "text":
          allTokens.push({ text: prev.text, kind: "text" })
          break
      }
      // Выводим строку между предыдущим и текущим элементом, если она не пустая
      const string = mainHtml.slice(prev.end, curr.start).trim()
      if (string) allTokens.push(...extractPatterns(string))
    }
    return curr
  }, null)

  // И, наконец, добавляем текст после последнего элемента
  if (elements.length > 0) {
    const string = mainHtml.slice(elements[elements.length - 1]!.end, mainHtml.length).trim()
    if (string) allTokens.push(...extractPatterns(string))
  }

  return allTokens
}

function extractPatterns(expr: string): StreamToken[] {
  const tokens = new Map<number, StreamToken>()

  // Ищем условие (тернарный оператор)
  const condOpenIndex = expr.indexOf("?")
  if (condOpenIndex !== -1) {
    // Ищем начало условия - обычно это после =>
    const arrowIndex = expr.lastIndexOf("=>", condOpenIndex)
    const startIndex = arrowIndex !== -1 ? arrowIndex + 2 : 0
    let conditionText = expr.slice(startIndex, condOpenIndex).trim()

    // Убираем ${ в начале, если есть
    if (conditionText.startsWith("${")) {
      conditionText = conditionText.slice(2)
    }

    tokens.set(condOpenIndex, { kind: "cond-open", expr: conditionText })
  }

  // Ищем else часть условия
  const condElseIndex = expr.indexOf(" : ")
  if (condElseIndex !== -1) {
    tokens.set(condElseIndex, { kind: "cond-else" })
  }

  // Ищем закрывающую скобку условия (после тернарного оператора)
  // Ищем только если есть условие и это не часть map-close
  if (condOpenIndex !== -1) {
    const condCloseIndex = expr.indexOf("}")
    if (condCloseIndex !== -1 && !expr.includes("`)}")) {
      tokens.set(condCloseIndex, { kind: "cond-close" })
    }
  }

  // Ищем паттерн ${...map(...)} с различными аргументами
  const mapRegex = /\$\{([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\.map\([^)]*\))/g
  let match
  while ((match = mapRegex.exec(expr)) !== null) {
    const mapText = match[1] // core.items.map((item)
    if (mapText) {
      tokens.set(match.index, { kind: "map-open", sig: mapText })
    }
  }

  // Ищем }) с возможными символами перед ним (например, `})
  const mapCloseRegex = /`?\)\}/g
  let closeMatch
  while ((closeMatch = mapCloseRegex.exec(expr)) !== null) {
    tokens.set(closeMatch.index, { kind: "map-close" })
  }

  // Сортируем по позиции и возвращаем токены
  return Array.from(tokens.entries())
    .sort(([a], [b]) => a - b)
    .map(([, token]) => token)
}
