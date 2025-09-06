import { processTemplateLiteralAttribute, resolveDataPath, ARGUMENTS_PREFIX } from "../data"
import type { ParseContext } from "../data.t"

/**
 * Обрабатывает массивные атрибуты и создает соответствующие объекты.
 */
export const processArrayAttributes = (
  arrayAttrs: Record<string, Array<{ type: string; value: string }>>,
  context: ParseContext
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, values] of Object.entries(arrayAttrs)) {
    result[key] = values.map((item) => {
      if (item.type === "static") {
        return { value: item.value }
      } else if (item.type === "dynamic" || item.type === "mixed") {
        // Для динамических и смешанных атрибутов обрабатываем значение
        const processed = processTemplateLiteralAttribute(item.value, context)
        if (processed) {
          return processed
        } else {
          // Если parseTemplateLiteral вернул null, но это dynamic тип,
          // значит это уже нормализованное значение без ${}
          // Нужно обработать его как динамическое выражение
          const variableMatches = item.value.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []
          if (variableMatches.length > 0) {
            const paths = variableMatches.map((variable) => resolveDataPath(variable, context))
            let expr = item.value
            variableMatches.forEach((variable, index) => {
              expr = expr.replace(
                new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"),
                `${ARGUMENTS_PREFIX}[${index}]`
              )
            })
            return {
              data: paths.length === 1 ? paths[0] || "" : paths,
              expr: `\${${expr}}`,
            }
          } else {
            return { value: item.value }
          }
        }
      } else {
        // Для неизвестных типов возвращаем как есть
        return { value: item.value }
      }
    })
  }

  return result
}
