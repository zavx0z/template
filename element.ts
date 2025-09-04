import { splitBySpace, splitByComma, splitBySemicolon, splitTopLevel } from "./attributes"
import type { SplitterResolved } from "./element.t"

export const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])
/** Преднастройка известных списковых атрибутов */
export const BUILTIN_LIST_SPLITTERS: Record<string, SplitterResolved> = {
  class: { fn: splitBySpace, delim: " " },
  rel: { fn: splitBySpace, delim: " " },
  headers: { fn: splitBySpace, delim: " " },
  itemref: { fn: splitBySpace, delim: " " },
  ping: { fn: splitBySpace, delim: " " },
  sandbox: { fn: splitBySpace, delim: " " },
  sizes: { fn: splitBySpace, delim: " " },
  "accept-charset": { fn: splitBySpace, delim: " " },
  accept: { fn: splitByComma, delim: "," },
  allow: { fn: splitBySemicolon, delim: ";" },
  srcset: {
    fn: (raw) =>
      splitByComma(raw)
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
  coords: {
    fn: (raw) =>
      splitTopLevel(raw, ",")
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
}
