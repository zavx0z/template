import type { TokenCondOpen, TokenCondElse, TokenCondClose } from "./cond.t"
import type { TokenMapOpen, TokenMapClose } from "./map.t"
import type { TokenText } from "./text.t"

export type StreamToken = TokenText | TokenCondOpen | TokenCondElse | TokenCondClose | TokenMapOpen | TokenMapClose
