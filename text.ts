import type { NodeText } from "./text.t"

/**
 * Проверяет наличие текста в HTML-контенте и возвращает информацию о найденном тексте.
 *
 * @param content HTML-контент для анализа
 * @returns Информация о найденном тексте или null, если текст не найден
 */
export function checkPresentText(content: string): {
  kind: "static" | "dynamic" | "mixed" | "condition"
  value?: string
  template?: string
  items?: Array<{ src: "context" | "core" | "state"; key?: string }>
  condition?: { src: "context" | "core" | "state"; key: string; true: string; false: string }
} | null {
  // Проверяем, есть ли сложные выражения (map, condition), HTML теги или template literal синтаксис
  // Но не блокируем условные выражения в тексте вида ${context.key ? "true" : "false"}
  const hasComplexExpressions = /context\.\w+\.map|core\.\w+\.map|<[^>]*>|`\)|html`|`\s*:|`\s*\?|`\}/.test(content)

  if (hasComplexExpressions) {
    return null
  }

  // Пробуем разобрать как условное выражение в тексте
  const conditionText = parseConditionText(content)
  if (conditionText) {
    return {
      kind: "condition",
      condition: conditionText,
    }
  }

  // Пробуем разобрать как смешанный текст
  const mixedText = parseMixedText(content)
  if (mixedText) {
    return {
      kind: "mixed",
      template: mixedText.template,
      items: mixedText.items,
    }
  }

  // Пробуем обычный разбор (статический или простой динамический)
  const textInfo = findTextPattern(content)
  if (textInfo) {
    if (textInfo.kind === "dynamic") {
      return { kind: "dynamic" }
    } else if (textInfo.kind === "static") {
      return { kind: "static", value: textInfo.value }
    }
  }

  return null
}

/**
 * Создает текстовый узел на основе информации о тексте.
 *
 * @param textInfo Информация о тексте из checkPresentText
 * @param mapContext Контекст map-операции (если текст находится внутри map)
 * @returns Текстовый узел или null, если узел не может быть создан
 */
export function makeNodeText(
  textInfo: NonNullable<ReturnType<typeof checkPresentText>>,
  mapContext?: { src: "context" | "core"; key: string }
): NodeText | null {
  if (textInfo.kind === "static") {
    return {
      type: "text",
      value: textInfo.value!,
    }
  }

  if (textInfo.kind === "dynamic") {
    if (mapContext) {
      // Текст внутри map - используем вложенный формат
      if (mapContext.src === "context") {
        return {
          type: "text",
          src: ["context", mapContext.key],
        }
      } else {
        return {
          type: "text",
          src: ["core", mapContext.key],
        }
      }
    } else {
      // Обычный динамический текст
      return {
        type: "text",
        src: "context", // По умолчанию context, можно расширить логику
      }
    }
  }

  if (textInfo.kind === "mixed") {
    if (textInfo.items!.length === 1) {
      // Одна переменная - проверяем, есть ли окружающий текст
      const item = textInfo.items![0]
      if (item) {
        const hasTemplate = textInfo.template!.trim() !== "${0}"

        if (!hasTemplate) {
          // Нет окружающего текста - обрабатываем как простой динамический
          if (mapContext) {
            if (mapContext.src === "context") {
              return {
                type: "text",
                src: ["context", mapContext.key],
                key: item.key,
              }
            } else {
              return {
                type: "text",
                src: ["core", mapContext.key],
                key: item.key,
              }
            }
          } else {
            return {
              type: "text",
              src: item.src,
              key: item.key,
            }
          }
        } else {
          // Есть окружающий текст - используем шаблон
          if (mapContext) {
            if (mapContext.src === "context") {
              return {
                type: "text",
                src: ["context", mapContext.key],
                key: item.key,
                template: textInfo.template!,
              }
            } else {
              return {
                type: "text",
                src: ["core", mapContext.key],
                key: item.key,
                template: textInfo.template!,
              }
            }
          } else {
            return {
              type: "text",
              src: item.src,
              key: item.key,
              template: textInfo.template!,
            }
          }
        }
      }
    } else {
      // Несколько переменных - используем TextMixedMulti
      return {
        type: "text",
        template: textInfo.template!,
        items: textInfo.items!,
      }
    }
  }

  if (textInfo.kind === "condition") {
    return {
      type: "text",
      cond: textInfo.condition!,
    }
  }

  return null
}

/**
 * Ищет паттерны текстовых узлов в подстроке.
 * Возвращает либо статическое значение, либо признак динамического текста `${...}`.
 */
function findTextPattern(slice: string): ({ kind: "static"; value: string } | { kind: "dynamic" }) | null {
  // Динамика: только простой идентификатор без точек/скобок/тегов внутри: ${name}
  const dynamicId = slice.match(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/)
  if (dynamicId) return { kind: "dynamic" }

  // Статика: убираем интерполяции и проверяем, что нет тегов
  const withoutTpl = slice.replace(/\$\{[^}]*\}/g, "")
  // Игнорируем, если строка содержит теги или угловые скобки — это не текстовый узел
  if (/[<>]/.test(withoutTpl)) return null
  // Убираем только лишние переводы строк, сохраняем пробелы
  const normalized = withoutTpl.replace(/\n+/g, " ")
  if (normalized.trim().length > 0) return { kind: "static", value: normalized }

  // Если нет интерполяций и нет тегов, но есть текст - это статический текст
  const trimmed = slice.trim()
  if (trimmed.length > 0 && !/[<>]/.test(trimmed)) {
    return { kind: "static", value: trimmed }
  }

  return null
}

/**
 * Разбирает смешанный текст на шаблон и переменные.
 * Пример: "Hello, ${context.name}!" → { template: "Hello, ${0}!", items: [{ src: "context", key: "name" }] }
 */
function parseMixedText(
  slice: string
): { template: string; items: Array<{ src: "context" | "core" | "state"; key?: string }> } | null {
  const items: Array<{ src: "context" | "core" | "state"; key?: string }> = []
  let template = slice
  let index = 0

  // Сохраняем исходное форматирование

  // Ищем все выражения ${context.key}, ${core.key} или ${identifier.key}
  const regex = /\$\{(context|core)\.(\w+)\}|\$\{(\w+)\.(\w+)\}/g
  let match

  while ((match = regex.exec(slice)) !== null) {
    const [fullMatch, src, key, identifier, prop] = match
    if (src && key) {
      // Выражение вида ${context.key} или ${core.key}
      items.push({ src: src as "context" | "core", key })
    } else if (identifier && prop) {
      // Выражение вида ${identifier.key} - используем context как источник
      items.push({ src: "context" as "context" | "core", key: prop })
    }

    // Заменяем в шаблоне на ${index}
    template = template.replace(fullMatch, `\${${index}}`)
    index++
  }

  if (items.length > 0) {
    return { template, items }
  }

  return null
}

/**
 * Разбирает условное выражение в тексте.
 * Пример: "${context.show ? "Visible" : "Hidden"}" → { src: "context", key: "show", true: "Visible", false: "Hidden" }
 */
function parseConditionText(
  slice: string
): { src: "context" | "core" | "state"; key: string; true: string; false: string } | null {
  // Ищем паттерн: ${context.key ? "true_value" : "false_value"}
  const regex = /\$\{(context|core)\.(\w+)\s*\?\s*["']([^"']*)["']\s*:\s*["']([^"']*)["']\}/g
  const match = regex.exec(slice)

  if (match) {
    const [, src, key, trueValue, falseValue] = match
    if (src && key && trueValue !== undefined && falseValue !== undefined) {
      return {
        src: src as "context" | "core" | "state",
        key,
        true: trueValue,
        false: falseValue,
      }
    }
  }

  return null
}
