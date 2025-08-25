import type { ValueType, AttributeEvent, AttributeArray, AttributeString, AttributeBoolean } from "./attributes.t"

/**
 * Определяет, является ли значение полностью динамическим (только ${...})
 */
const isFullyDynamic = (value: string): boolean => {
  return /^\$\{.*\}$/.test(value.trim())
}

/**
 * Определяет, содержит ли значение динамическую часть (${...})
 */
const hasDynamicPart = (value: string): boolean => {
  return /\$\{.*\}/.test(value)
}

/**
 * Определяет тип значения: static, dynamic или mixed
 */
const getValueType = (value: string): ValueType => {
  if (isFullyDynamic(value)) {
    return "dynamic"
  } else if (hasDynamicPart(value)) {
    return "mixed"
  } else {
    return "static"
  }
}

/**
 * Извлекает содержимое динамического выражения (убирает ${ и })
 */
const extractDynamicContent = (value: string): string => {
  if (isFullyDynamic(value)) {
    return value.slice(2, -1) // убираем ${ и }
  }
  return value
}

/**
 * Разбивает значение атрибута class на отдельные части
 */
const splitClassValue = (value: string): { value: string; type: ValueType }[] => {
  const result: { value: string; type: ValueType }[] = []
  let currentPart = ""
  let i = 0
  let inDynamic = false
  let braceCount = 0

  while (i < value.length) {
    const char = value[i]

    if (char === "$" && i + 1 < value.length && value[i + 1] === "{") {
      inDynamic = true
      braceCount = 1
      currentPart += char
      i++
      currentPart += value[i]
    } else if (inDynamic) {
      currentPart += char
      if (char === "{") braceCount++
      if (char === "}") {
        braceCount--
        if (braceCount === 0) {
          inDynamic = false
        }
      }
    } else if (char === " " || char === "\t" || char === "\n") {
      // Пробельный символ - завершаем текущую часть
      if (currentPart.trim()) {
        const trimmedPart = currentPart.trim()
        result.push({
          type: getValueType(trimmedPart),
          value: extractDynamicContent(trimmedPart),
        })
        currentPart = ""
      }
    } else {
      currentPart += char
    }

    i++
  }

  // Добавляем последнюю часть
  if (currentPart.trim()) {
    const trimmedPart = currentPart.trim()
    result.push({
      type: getValueType(trimmedPart),
      value: extractDynamicContent(trimmedPart),
    })
  }

  return result
}

/**
 * Извлекает атрибуты из HTML-строки посимвольно
 */
const extractAttributes = (tagContent: string): Array<{ name: string; value: string }> => {
  const attributes: Array<{ name: string; value: string }> = []
  let i = 0

  while (i < tagContent.length) {
    // Ищем начало атрибута (пробел + имя атрибута + =)
    const attrMatch = tagContent.slice(i).match(/\s+(\w+)=["']?/)
    if (!attrMatch) break

    const attrStart = i + (attrMatch.index || 0) + attrMatch[0].length
    const attrName = attrMatch[1] || ""

    // Определяем тип кавычки или отсутствие кавычек
    const quote = tagContent[attrStart - 1]
    let value = ""
    let j = attrStart
    let braceCount = 0

    // Читаем значение до закрывающей кавычки или пробела/закрывающего тега
    while (j < tagContent.length) {
      const char = tagContent[j]

      // Отслеживаем скобки внутри ${...}
      if (char === "{") braceCount++
      if (char === "}") braceCount--

      if (quote === '"' || quote === "'") {
        // Атрибут в кавычках
        if (char === quote && braceCount === 0) {
          // Проверяем, не экранирована ли кавычка
          if (j > 0 && tagContent[j - 1] !== "\\") {
            break
          }
        }
      } else {
        // Атрибут без кавычек - читаем до пробела или закрывающего тега
        if ((char === " " || char === "\t" || char === "\n" || char === ">") && braceCount === 0) {
          break
        }
      }

      value += char
      j++
    }

    attributes.push({ name: attrName, value })
    i = j + 1
  }

  return attributes
}

/**
 * Извлекает атрибуты из HTML-строки и разделяет их по типам
 */
export const parseAttributes = (
  htmlText: string
): {
  boolean?: AttributeBoolean
  array?: AttributeArray
  event?: AttributeEvent
  string?: AttributeString
} => {
  const result: {
    boolean?: AttributeBoolean
    array?: AttributeArray
    event?: AttributeEvent
    string?: AttributeString
  } = {}

  // Извлекаем атрибуты из HTML-строки
  const attrMatch = htmlText.match(/<[^>]*>/)
  if (!attrMatch) return result

  const tagContent = attrMatch[0]
  const attributes = extractAttributes(tagContent)

  for (const { name, value } of attributes) {
    // Определяем тип атрибута
    if (name.startsWith("on") && name.length > 2) {
      // События (onclick, onchange, etc.)
      if (!result.event) result.event = {}
      result.event[name] = value || ""
    } else if (name === "class" || name === "style") {
      // Массивы (class может содержать несколько значений)
      if (!result.array) result.array = {}
      result.array[name] = splitClassValue(value || "")
    } else if (value === "" || value === "true" || value === "false") {
      // Булевые атрибуты
      if (!result.boolean) result.boolean = {}
      result.boolean[name] = value || "true"
    } else {
      // Строковые атрибуты
      if (!result.string) result.string = {}
      result.string[name] = value || ""
    }
  }

  return result
}
