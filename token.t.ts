export type StreamToken =
  | { kind: "text"; text: string }
  | { kind: "tag-open" | "tag-close" | "tag-self"; name: string; text: string }
  | { kind: "cond-open"; expr: string }
  | { kind: "cond-else" }
  | { kind: "cond-else-if"; expr: string }
  | { kind: "cond-close" }
  | { kind: "map-open"; sig: string }
  | { kind: "map-close" }
