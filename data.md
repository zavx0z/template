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
// "${title}" в контексте map
{
  type: "text",
  data: "[item]/title"
}

// "${title} " в контексте map
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

// Исходное: "i % 2"
// Результат:
{
  data: ["/i"],
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

Используют `[item]` для элементов массива:

- `[item]` - текущий элемент массива
- `[item]/title` - свойство title текущего элемента
- `[item]/nested` - свойство nested текущего элемента

### Контекст вложенности

Каждый map создает контекст для относительных путей:

- В контексте `core.list.map(({ title, nested }) => ...)`:
  - `${title}` → `[item]/title`
  - `${nested}` → `[item]/nested`
- В контексте `nested.map((n) => ...)`:
  - `${n}` → `[item]`

## Использование

```typescript
import { enrichHierarchyWithData } from "./data"

// Обогащаем иерархию данными
const enrichedHierarchy = enrichHierarchyWithData(hierarchy)
```
