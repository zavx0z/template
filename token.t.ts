export type TokenMapClose = { kind: "map-close"}
export type TokenMapOpen = { kind: "map-open"; sig: string }
export type TokenCondOpen = { kind: "cond-open"; expr: string }
export type TokenCondElse = { kind: "cond-else" }
export type TokenCondElseIf = { kind: "cond-else-if"; expr: string }
export type TokenCondAnd = { kind: "cond-and"; expr: string }
export type TokenCondClose = { kind: "cond-close" }
export type TokenTagOpen = { kind: "tag-open"; name: string; text: string }
export type TokenTagClose = { kind: "tag-close"; name: string; text: string }
export type TokenTagSelf = { kind: "tag-self"; name: string; text: string }
export type TokenText = { kind: "text"; text: string }

export type StreamToken =
  | TokenText
  | TokenTagOpen
  | TokenTagClose
  | TokenTagSelf
  | TokenCondOpen
  | TokenCondElse
  | TokenCondElseIf
  | TokenCondAnd
  | TokenCondClose
  | TokenMapOpen
  | TokenMapClose
