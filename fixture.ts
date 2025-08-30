export const print = (arrObj: Record<string, any>[]) => {
  // Собираем все уникальные ключи из всех объектов
  const allKeys = new Set<string>()
  arrObj.forEach((obj) => Object.keys(obj).forEach((key) => allKeys.add(key)))

  // Подсчитываем частоту каждого ключа
  const keyFrequency = new Map<string, number>()
  arrObj.forEach((obj) => Object.keys(obj).forEach((key) => keyFrequency.set(key, (keyFrequency.get(key) || 0) + 1)))

  // Сортируем ключи: сначала по частоте (убывание), потом по алфавиту
  const sortedKeys = Array.from(allKeys).sort((a, b) => {
    const freqA = keyFrequency.get(a) || 0
    const freqB = keyFrequency.get(b) || 0
    if (freqA !== freqB) {
      return freqB - freqA // Сначала более частые ключи
    }
    return a.localeCompare(b) // Потом по алфавиту
  })

  // Создаем функцию сортировки, которая использует общий порядок ключей
  const sortByGlobalOrder = (a: [string, any], b: [string, any]) => {
    const indexA = sortedKeys.indexOf(a[0])
    const indexB = sortedKeys.indexOf(b[0])
    return indexA - indexB
  }

  arrObj.map((element) =>
    console.log(
      "{",
      Object.entries(element)
        .sort(sortByGlobalOrder)
        .map(([key, value], index, array) => `${key}: ${JSON.stringify(value)}${index < array.length - 1 ? "," : ""}`)
        .join(" ") + "},"
    )
  )
}
