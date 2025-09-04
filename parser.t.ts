import type { TokenCondOpen, TokenCondElse, TokenCondClose } from "./cond.t"
import type { TokenMapOpen, TokenMapClose } from "./map.t"
import type { TokenText } from "./text.t"

export type StreamToken = TokenText | TokenCondOpen | TokenCondElse | TokenCondClose | TokenMapOpen | TokenMapClose

export type PartHierarchy = PartElement | PartMeta | PartText | PartCondition | PartMap
export type PartsHierarchy = PartHierarchy[]
interface BaseElement {
  tag: string
  type: "el" | "meta"
  text?: string
  child?: PartsHierarchy
}
export interface PartElement extends BaseElement {
  type: "el"
}
export interface PartMeta extends BaseElement {
  type: "meta"
}
export type PartText = {
  type: "text"
  text: string
}
export type PartMap = {
  type: "map"
  text: string
  child: PartsHierarchy
}
export type PartCondition = {
  type: "cond"
  text: string
  child: PartsHierarchy
}
