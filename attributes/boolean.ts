import { processBooleanAttributeWithVariables } from "./event"
import type { ParseContext } from "../data.t"

/**
 * Обрабатывает булевые атрибуты и создает соответствующие объекты.
 */
export const processBooleanAttributes = (
  booleanAttrs: Record<string, { type: string; value: string | boolean }>,
  context: ParseContext
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, attr] of Object.entries(booleanAttrs)) {
    if (attr.type === "static") {
      result[key] = Boolean(attr.value)
    } else if (attr.type === "dynamic" || attr.type === "mixed") {
      // Для булевых атрибутов используем специальную обработку
      const booleanValue = String(attr.value)
      const processed = processBooleanAttributeWithVariables(booleanValue, context)

      if (processed) {
        result[key] = processed
      } else {
        result[key] = false
      }
    }
  }

  return result
}
