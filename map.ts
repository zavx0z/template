import type { TokenMapOpen, TokenMapClose } from "./map.t"

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
