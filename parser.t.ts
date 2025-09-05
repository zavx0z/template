export type StreamToken =
  | TokenText
  | TokenCondOpen
  | TokenCondElse
  | TokenCondClose
  | TokenMapOpen
  | TokenMapClose
  | TokenLogicalOpen
export type TokenMapClose = { kind: "map-close" }
export type TokenMapOpen = { kind: "map-open"; sig: string }
export type TokenCondOpen = { kind: "cond-open"; expr: string }
export type TokenCondElse = { kind: "cond-else" }
export type TokenCondClose = { kind: "cond-close" }
export type TokenLogicalOpen = { kind: "log-open"; expr: string }
export type TokenText = { kind: "text"; text: string }
