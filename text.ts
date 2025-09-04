export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return

  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  // Сохраняем левую «видимую» часть до html`
  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  // Собираем, оставляя только полностью закрытые ${...}
  let processed = ""
  let i = 0
  let usedEndLocal = 0 // сколько символов исходного куска реально «поглощено»

  while (i < visible.length) {
    const ch = visible[i]
    if (ch === "$" && i + 1 < visible.length && visible[i + 1] === "{") {
      const exprStart = i
      i += 2
      let b = 1
      while (i < visible.length && b > 0) {
        if (visible[i] === "{") b++
        else if (visible[i] === "}") b--
        i++
      }
      if (b === 0) {
        // закрытая интерполяция — целиком сохраняем
        processed += visible.slice(exprStart, i)
        usedEndLocal = i
        continue
      } else {
        // незакрытая — это «клей», остаток отбрасываем начиная с exprStart
        // индексы конца должны соответствовать реально использованной части
        break
      }
    }
    processed += ch
    i++
    usedEndLocal = i
  }

  const collapsed = processed.replace(/\s+/g, " ")
  if (collapsed === " ") return

  const final = /^\s*\n[\s\S]*\n\s*$/.test(chunk) ? collapsed.trim() : collapsed

  if (final.length > 0) {
    return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
  }
} // Чистый «клей» между шаблонами (целиком служебный кусок)

export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" ||
    trimmed.startsWith("`") || // закрытие предыдущего html`
    /^`}\)?\s*;?\s*$/.test(trimmed) || // `} или `}) (+ ;)
    /^`\)\}\s*,?\s*$/.test(trimmed)) // `)} (иногда с запятой)
// Обрезаем всё после первого открытия следующего html-шаблона
export const cutBeforeNextHtml = (s: string): string => {
  const idx = s.indexOf("html`")
  return idx >= 0 ? s.slice(0, idx) : s
}
