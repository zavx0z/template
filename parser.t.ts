import type { TokenText } from "./text.t"

export type StreamToken = TokenText | TokenCondOpen | TokenCondElse | TokenCondClose | TokenMapOpen | TokenMapClose
export type TokenMapClose = { kind: "map-close" }
export type TokenMapOpen = { kind: "map-open"; sig: string }
export type TokenCondOpen = { kind: "cond-open"; expr: string }
export type TokenCondElse = { kind: "cond-else" }
export type TokenCondClose = { kind: "cond-close" }
