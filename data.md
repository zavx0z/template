# Формат данных для обогащенной иерархии

## Обзор

Модуль `data` обогащает HTML иерархию информацией о путях к данным, выражениях и статических значениях.

## Типы узлов

### 1. Map узлы

Представляют итерации по массивам данных.

```typescript
{
  type: "map",
  data: string,  // Путь к массиву данных
  child: Node[]
}
```

**Логика определения путей:**

- **Абсолютные пути**: `core.list.map(...)` → `data: "/core/list"`
- **Относительные пути**: `category.products.map(...)` → `data: "[item]/products"` (в контексте родительского map)

**Примеры:**

```typescript
// core.list.map(({ title, nested }) => ...)
{
  type: "map",
  data: "/core/list",
  child: [...]
}

// nested.map((n) => ...) в контексте map
{
  type: "map",
  data: "[item]/nested",
  child: [...]
}
```

**Логика путей данных в контексте map:**

При обработке переменных внутри map контекста, система различает несколько типов параметров и случаев использования:

#### Простые параметры (один параметр)

Когда map имеет один простой параметр, переменная представляет сам элемент массива:

```typescript
// context.list.map((name) => html`<li>${name}</li>`)
// name - это сам элемент массива (строка)
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}

// nested.map((n) => html`<em>${n}</em>`)
// n - это сам элемент массива (строка)
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}
```

#### Деструктурированные свойства (несколько параметров)

Когда map использует деструктуризацию, переменные представляют свойства объекта:

```typescript
// core.list.map(({ title, nested }) => html`<li>${title}</li>`)
// title - это свойство объекта в массиве
{
  type: "text",
  data: "[item]/title"  // Свойство объекта
}

// nested - это свойство объекта в массиве
{
  type: "map",
  data: "[item]/nested"  // Свойство объекта
}
```

#### Параметры с индексом

Когда map имеет несколько параметров, второй и последующие параметры представляют индекс:

```typescript
// context.list.map((name, index) => html`<li>${name} (${index})</li>`)
// name - это сам элемент массива
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}
// index - это индекс элемента
{
  type: "text",
  data: "[index]"  // Индекс элемента
}
```

#### Доступ к свойствам через точку

Когда переменная начинается с имени параметра и содержит точку, система извлекает только путь к свойству:

```typescript
// company.departments.map((dept, deptIndex) => html`<div>${dept.id}</div>`)
// dept.id - это свойство id объекта dept
{
  type: "text",
  data: "[item]/id"  // Только путь к свойству, без имени параметра
}

// nested.map((team, teamIndex) => html`<span>${team.name}</span>`)
// team.name - это свойство name объекта team
{
  type: "text",
  data: "[item]/name"  // Только путь к свойству, без имени параметра
}
```

**Определение типа параметра:**

Система определяет тип параметра по позиции в `mapParams`:

- **Первый параметр** (`paramIndex === 0`):
  - Если `mapParams.length === 1` → простой параметр → `[item]`
  - Если `mapParams.length > 1` → деструктуризация → `[item]/variable`
- **Второй и последующие параметры** (`paramIndex > 0`) → `[index]`

**Универсальность путей:**

Независимо от того, как обращаемся к данным - через деструктуризацию или по ключу - путь остается одинаковым:

```typescript
// Оба случая генерируют одинаковый путь [item]/id:
// 1. Через деструктуризацию:
${company.departments.map(({ id }) => html`<div>${id}</div>`)}

// 2. Через доступ по ключу:
${company.departments.map((dept) => html`<div>${dept.id}</div>`)}

// Результат в обоих случаях:
{
  type: "text",
  data: "[item]/id"
}
```

Это позволяет корректно обрабатывать как массивы примитивов, так и массивы объектов с единообразными путями.

### 2. Condition узлы

Представляют условные выражения.

```typescript
{
  type: "cond",
  data: string | string[],  // Путь(и) к данным
  expr?: string,            // Выражение с индексами (если несколько переменных)
  true: Node,
  false: Node
}
```

**Логика определения:**

#### Простые условия (одна переменная)

```typescript
// "context.flag"
{
  type: "cond",
  data: "/context/flag",
  // expr отсутствует для простых условий
  true: {...},
  false: {...}
}
```

**Логика определения expr:**

Поле `expr` добавляется только если:

- **Сложное условие** (несколько переменных), ИЛИ
- **Есть операторы/методы** в выражении

**Операторы, требующие expr:**

- Математические: `%`, `+`, `-`, `*`, `/`
- Логические: `&&`, `||`
- Сравнения: `===`, `!==`, `==`, `!=`, `<`, `>`
- Скобки: `(`
- Методы: `.` (точки)

#### Сложные условия (несколько переменных)

```typescript
// "context.cond && context.cond2"
{
  type: "cond",
  data: ["/context/cond", "/context/cond2"],
  expr: "${0} && ${1}",
  true: {...},
  false: {...}
}

// "context.flag === context.cond2"
{
  type: "cond",
  data: ["/context/flag", "/context/cond2"],
  expr: "${0} === ${1}",
  true: {...},
  false: {...}
}

// "i % 2" в контексте map
{
  type: "cond",
  data: ["/i"],
  expr: "${0} % 2",
  true: {...},
  false: {...}
}
```

#### Условия с операторами (одна переменная)

```typescript
// "i % 2" в контексте map
{
  type: "cond",
  data: "[index]",
  expr: "${0} % 2",
  true: {...},
  false: {...}
}

// "context.items.length > 0"
{
  type: "cond",
  data: "/context/items",
  expr: "${0}.length > 0",
  true: {...},
  false: {...}
}

// "(context.flag)"
{
  type: "cond",
  data: "/context/flag",
  expr: "(${0})",
  true: {...},
  false: {...}
}
```

### 3. Text узлы

Представляют текстовые данные.

```typescript
{
  type: "text",
  data?: string | string[],  // Путь(и) к данным (если динамический)
  value?: string,            // Статическое значение (если статический)
  expr?: string              // Выражение с индексами (если смешанный)
}
```

**Логика определения:**

#### Статический текст

```typescript
// "static"
{
  type: "text",
  value: "static"
}
```

#### Только переменная

```typescript
// "${context.name}"
{
  type: "text",
  data: "/context/name"
}
```

#### Переменная с методом

```typescript
// "${context.name.toLowerCase()}"
{
  type: "text",
  data: "/context/name",
  expr: "${0}.toLowerCase()"
}
```

#### Переменная с текстом

```typescript
// "Hello, ${context.name}!"
{
  type: "text",
  data: "/context/name",
  expr: "Hello, ${0}!"
}
```

#### Переменная с пробельными символами

```typescript
// "${context.name} " (с пробелом)
{
  type: "text",
  data: "/context/name",
  expr: "${0} "
}

// "${context.name}\n" (с переносом строки)
{
  type: "text",
  data: "/context/name",
  expr: "${0}\n"
}
```

**Логика определения expr для текста:**

Поле `expr` добавляется если:

- **Несколько переменных** в тексте
- **Есть статический текст** (не только пробелы)
- **Есть пробельные символы** (пробелы, табуляция, переносы строк)

#### Несколько переменных

```typescript
// "Hello, ${context.family} ${context.name}!"
{
  type: "text",
  data: ["/context/family", "/context/name"],
  expr: "Hello, ${0} ${1}!"
}
```

#### В контексте map

```typescript
// Простой параметр: "${name}" в context.list.map((name) => ...)
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}

// Деструктурированное свойство: "${title}" в map(({ title }) => ...)
{
  type: "text",
  data: "[item]/title"  // Свойство объекта
}

// Деструктурированное свойство с текстом: "${title} " в map(({ title }) => ...)
{
  type: "text",
  data: "[item]/title",
  expr: "${0} "
}
```

### 4. Element узлы

Обычные HTML элементы остаются без изменений.

```typescript
{
  tag: string,
  type: "el",
  child: Node[]
}
```

## Унификация выражений (expr)

Для упрощения обработки и кэширования все выражения с переменными унифицируются через систему индексов.

### Принцип работы

1. **Извлечение переменных**: Находим все переменные в выражении
2. **Сохранение путей**: Сохраняем пути к данным в массиве `data`
3. **Замена на индексы**: Заменяем переменные в выражении на `${0}`, `${1}`, etc.

### Примеры унификации

#### Условия

```typescript
// Исходное: "context.cond && context.cond2"
// Результат:
{
  data: ["/context/cond", "/context/cond2"],
  expr: "${0} && ${1}"
}

// Исходное: "i % 2" в контексте map((_, i) => ...)
// Результат:
{
  data: "[index]",
  expr: "${0} % 2"
}
```

#### Текст

```typescript
// Исходное: "Hello, ${context.family} ${context.name}!"
// Результат:
{
  data: ["/context/family", "/context/name"],
  expr: "Hello, ${0} ${1}!"
}

// Исходное: "${context.name.toLowerCase()}"
// Результат:
{
  data: "/context/name",
  expr: "${0}.toLowerCase()"
}
```

### Преимущества унификации

- **Кэширование**: Обезличенные выражения можно кэшировать независимо от конкретных данных
- **Упрощение рендеринга**: Рендеры работают с унифицированным форматом
- **Разделение данных и логики**: Четкое разделение между путями к данным и логикой выражения
- **Переиспользование**: Одинаковые выражения с разными данными используют один шаблон

## Правила относительности путей

### Абсолютные пути

Начинаются с `/core/` или `/context/`:

- `/core/list` - массив из core
- `/context/name` - свойство из context

### Относительные пути

Используют `[item]` и `[index]` для элементов массива:

- `[item]` - текущий элемент массива (для простых параметров)
- `[item]/title` - свойство title текущего элемента (для деструктурированных свойств)
- `[item]/nested` - свойство nested текущего элемента (для деструктурированных свойств)
- `[index]` - индекс текущего элемента в массиве (для второго и последующих параметров map)

### Контекст вложенности

Каждый map создает контекст для относительных путей. Система автоматически определяет правильные пути на основе структуры параметров:

#### Простые параметры (массивы примитивов)

```typescript
// context.list.map((name) => html`<li>${name}</li>`)
// name - это сам элемент массива
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}

// nested.map((n) => html`<em>${n}</em>`)
// n - это сам элемент массива
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}
```

#### Параметры с индексом

```typescript
// context.list.map((name, index) => html`<li>${name} (${index})</li>`)
// name - это сам элемент массива
{
  type: "text",
  data: "[item]"  // Сам элемент массива
}
// index - это индекс элемента
{
  type: "text",
  data: "[index]"  // Индекс элемента
}
```

#### Деструктурированные свойства (массивы объектов)

```typescript
// core.list.map(({ title, nested }) => html`<li>${title}</li>`)
// title - это свойство объекта
{
  type: "text",
  data: "[item]/title"  // Свойство объекта
}

// nested - это свойство объекта
{
  type: "map",
  data: "[item]/nested"  // Свойство объекта
}
```

#### Доступ к свойствам через точку

```typescript
// company.departments.map((dept) => html`<div>${dept.id}</div>`)
// dept.id - это свойство id объекта dept
{
  type: "text",
  data: "[item]/id"  // Только путь к свойству
}

// nested.map((team) => html`<span>${team.name}</span>`)
// team.name - это свойство name объекта team
{
  type: "text",
  data: "[item]/name"  // Только путь к свойству
}
```

### Автоматическое определение типа пути

Система автоматически определяет тип пути по позиции параметра в map:

- **Первый параметр** (`paramIndex === 0`):
  - Если `mapParams.length === 1` → простой параметр → `[item]`
  - Если `mapParams.length > 1` → деструктуризация → `[item]/variable`
- **Второй и последующие параметры** (`paramIndex > 0`) → `[index]`

### Вложенные map контексты

В сложных вложенных структурах система правильно обрабатывает относительные пути, создавая иерархию контекстов:

#### Пример 1: Простая вложенность

```typescript
// company.departments.map((dept, deptIndex) => html`
//   ${dept.teams.map((team, teamIndex) => html`
//     ${team.members.map((member, memberIndex) => html`
//       <p>${member.name} (${memberIndex})</p>
//     `)}
//   `)}
// `)

// Результат:
// member.name → [item]/name (в контексте members map)
// memberIndex → [index] (в контексте members map)
// teamIndex → ../[index] (в контексте teams map)
// deptIndex → ../../[index] (в контексте departments map)
```

#### Пример 2: Доступ к свойствам через точку

```typescript
// company.departments.map((dept, deptIndex) => html`
//   ${dept.teams.map((team, teamIndex) => html`
//     ${team.members.map((member, memberIndex) => html`
//       <p>${member.name} (${memberIndex})</p>
//       <span>${dept.name} - ${team.name}</span>
//     `)}
//   `)}
// `)

// Результат:
// member.name → [item]/name (в контексте members map)
// memberIndex → [index] (в контексте members map)
// dept.name → ../../[item]/name (в контексте departments map)
// team.name → ../[item]/name (в контексте teams map)
```

#### Пример 3: Деструктуризация в вложенных контекстах

```typescript
// company.departments.map(({ id: deptId, name: deptName }, deptIndex) => html`
//   ${dept.teams.map(({ id: teamId, name: teamName }, teamIndex) => html`
//     ${team.members.map(({ id: memberId, name: memberName }, memberIndex) => html`
//       <p>${memberName} (${memberIndex})</p>
//       <span>${deptName} - ${teamName}</span>
//     `)}
//   `)}
// `)

// Результат:
// memberName → [item]/name (в контексте members map)
// memberIndex → [index] (в контексте members map)
// deptName → ../../[item]/name (в контексте departments map)
// teamName → ../[item]/name (в контексте teams map)
```

#### Пример 4: Условия в вложенных контекстах

```typescript
// company.departments.map((dept, deptIndex) => html`
//   ${dept.teams.map((team, teamIndex) => html`
//     ${team.members.map((member, memberIndex) => html`
//       ${dept.active && team.active && member.active
//         ? html`<p class="active">${member.name}</p>`
//         : html`<p class="inactive">${member.name}</p>`
//       }
//     `)}
//   `)}
// `)

// Результат для условия:
// dept.active → ../../[item]/active (в контексте departments map)
// team.active → ../[item]/active (в контексте teams map)
// member.active → [item]/active (в контексте members map)
```

### Алгоритм разрешения путей

Система использует следующий алгоритм для определения правильных путей:

1. **Поиск в стеке map контекстов**: Система ищет переменную в стеке всех map контекстов от самого глубокого к самому внешнему
2. **Определение позиции параметра**: По позиции параметра в `mapParams` определяется тип пути
3. **Вычисление относительности**: Количество уровней подъема вычисляется как разность между текущим уровнем и уровнем найденной переменной
4. **Генерация пути**: Создается путь с правильным количеством `../` префиксов

Это обеспечивает корректную обработку любых уровней вложенности с единообразными путями.

## Технические детали реализации

### Функция `findVariableInMapStack`

Основная функция для поиска переменных в стеке map контекстов:

```typescript
const findVariableInMapStack = (variable: string, context: DataParserContext): string | null => {
  if (!context.mapContextStack || context.mapContextStack.length === 0) {
    return null
  }

  // Проверяем от самого глубокого уровня к самому внешнему
  for (let i = context.mapContextStack.length - 1; i >= 0; i--) {
    const mapContext = context.mapContextStack[i]
    if (!mapContext) continue

    const variableParts = variable.split(".")
    const variableName = variableParts[0]

    if (mapContext.params.includes(variableName || "")) {
      // Переменная найдена на этом уровне map
      const currentLevel = context.mapContextStack.length - 1
      const targetLevel = i
      const levelsUp = currentLevel - targetLevel

      // Создаем префикс с нужным количеством "../"
      const prefix = "../".repeat(levelsUp)

      // Определяем позицию параметра в map
      const paramIndex = mapContext.params.indexOf(variableName || "")

      // Определяем путь в зависимости от позиции параметра
      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (mapContext.params.length === 1) {
          // Простой параметр map
          if (variableParts.length > 1) {
            // Свойство простого параметра (например, user.name)
            const propertyPath = variableParts.slice(1).join("/")
            return `${prefix}[item]/${propertyPath}`
          } else {
            // Сам простой параметр
            return `${prefix}[item]`
          }
        } else {
          // Деструктурированные параметры - первый параметр это элемент
          if (variableParts.length > 1) {
            // Свойство деструктурированного параметра (например, dept.id -> [item]/id)
            const propertyPath = variableParts.slice(1).join("/")
            return `${prefix}[item]/${propertyPath}`
          } else {
            // Само деструктурированное свойство (например, title -> [item]/title)
            return `${prefix}[item]/${variable}`
          }
        }
      } else {
        // Второй и последующие параметры - индекс
        return `${prefix}[index]`
      }
    }
  }

  return null
}
```

### Функция `resolveDataPath`

Универсальная функция для разрешения путей к данным:

```typescript
const resolveDataPath = (variable: string, context: DataParserContext): string => {
  // Сначала пытаемся найти переменную в стеке map контекстов
  const mapStackPath = findVariableInMapStack(variable, context)
  if (mapStackPath !== null) {
    return mapStackPath
  }

  // Если не найдена в стеке map, используем старую логику для обратной совместимости
  if (context.mapParams && context.mapParams.length > 0) {
    // В контексте map - различаем простые параметры и деструктурированные свойства
    const variableParts = variable.split(".")
    const mapParamVariable = variableParts[0] || ""

    // Проверяем, является ли первая часть переменной параметром map
    if (context.mapParams.includes(mapParamVariable)) {
      const paramIndex = context.mapParams.indexOf(mapParamVariable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id -> [item]/id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept -> [item])
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    }
  }

  // Остальная логика для абсолютных путей...
}
```

### Структура MapContext

```typescript
export type MapContext = {
  /** Путь map */
  path: string
  /** Параметры map */
  params: string[]
  /** Уровень map */
  level: number
}
```

### Структура DataParserContext

```typescript
export type DataParserContext = {
  /** Текущий путь к данным */
  currentPath?: string
  /** Стек путей */
  pathStack: string[]
  /** Параметры текущего map */
  mapParams?: string[]
  /** Уровень вложенности */
  level: number
  /** Стек всех map контекстов */
  mapContextStack?: MapContext[]
}
```

## Использование

```typescript
import { enrichHierarchyWithData } from "./data"

// Обогащаем иерархию данными
const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
```

## Форматирование выражений и текста

Система автоматически форматирует выражения и текст по стандартам HTML для улучшения читаемости и производительности.

### Форматирование тернарных выражений

Система удаляет лишние пробелы и переносы строк в тернарных выражениях, сохраняя при этом строковые литералы.

#### Функция `createUnifiedExpression`

```typescript
const createUnifiedExpression = (value: string, variables: string[]): string => {
  let expr = value
  variables.forEach((variable, index) => {
    expr = expr.replace(new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g"), `\${${index}}`)
  })

  // Форматируем выражение: удаляем лишние пробелы и переносы строк, но сохраняем строковые литералы
  const stringLiterals: string[] = []
  let protectedExpr = expr
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  // Удаляем лишние пробелы и переносы строк в выражениях
  protectedExpr = protectedExpr.replace(/\s+/g, " ").trim()

  // Восстанавливаем строковые литералы
  stringLiterals.forEach((literal, index) => {
    protectedExpr = protectedExpr.replace(`__STRING_${index}__`, literal)
  })

  return protectedExpr
}
```

#### Примеры форматирования выражений

**До форматирования:**

```typescript
// Многострочное выражение с лишними пробелами
;`${context.flag ? "active" : "inactive"}`
```

**После форматирования:**

```typescript
// Чистое однострочное выражение
;`${0} ? "active" : "inactive"`
```

**Сохранение строковых литералов:**

```typescript
// Сложное выражение с длинными строками
;`${0} ? "This is a very long text that should be formatted properly" : "Short text"`
```

### Форматирование текста по стандартам HTML

Система применяет стандартные правила HTML для схлопывания пробельных символов в тексте.

#### Функция `formatTextByHtmlStandards`

```typescript
const formatTextByHtmlStandards = (text: string): string => {
  // Схлопываем последовательные пробельные символы в один пробел
  // и удаляем пробелы в начале и конце
  return text.replace(/\s+/g, " ").trim()
}
```

#### Функция `formatStaticText`

```typescript
const formatStaticText = (text: string): string => {
  // Если текст содержит только пробельные символы - удаляем их полностью
  if (text.trim().length === 0) {
    return ""
  }

  // Если текст содержит не-пробельные символы - форматируем по стандартам HTML
  // НО только если это многострочный текст или содержит много пробелов
  if (text.includes("\n") || text.includes("\t") || /\s{3,}/.test(text)) {
    return formatTextByHtmlStandards(text)
  }

  // Иначе оставляем как есть
  return text
}
```

#### Правила форматирования текста

**Схлопывание пробельных символов:**

- Последовательные пробелы → один пробел
- Переносы строк → один пробел
- Табуляции → один пробел
- Комбинации → один пробел

**Удаление пробелов:**

- Пробелы в начале и конце текстового содержимого удаляются

**Сохранение важных пробелов:**

- Пробелы между переменными в выражениях сохраняются
- Строковые литералы остаются нетронутыми

#### Примеры форматирования текста

**До форматирования:**

```html
<p>Hello World</p>
```

**После форматирования:**

```html
<p>Hello World</p>
```

**Сохранение важных пробелов:**

```html
<!-- Пробелы между переменными сохраняются -->
<p>Hello, ${name} ${surname}!</p>
<!-- Результат: "Hello, ${0} ${1}!" -->
```

**Многострочный текст:**

```html
<div>Welcome to our site!</div>
<!-- Результат: "Welcome to our site!" -->
```

### Интеграция с парсингом

Форматирование интегрировано в процесс парсинга и применяется автоматически:

1. **В `parseTextData`** - для статического текста
2. **В `splitTextIntoParts`** - для статических частей смешанного текста
3. **В `createUnifiedExpression`** - для тернарных выражений
4. **В `parseTemplateLiteral`** - для сложных выражений

### Преимущества форматирования

- **Читаемость**: Выражения становятся более компактными и читаемыми
- **Производительность**: Меньше пробельных символов для обработки
- **Стандартность**: Соответствие стандартам HTML
- **Совместимость**: Сохранение важных пробелов и строковых литералов
