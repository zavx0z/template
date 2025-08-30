export type TagKind = "open" | "close" | "self" | "void"

export type TagToken = {
  text: string
  start: number
  end: number
  name: string
  kind: TagKind
}
