# Система обогащения данных

Система обогащения данных предназначена для анализа HTML иерархии и извлечения метаданных о путях к данным, выражениях и статических значениях. Это позволяет эффективно рендерить динамический контент с минимальными пересчетами.

## Основные возможности

- Автоматическое определение путей к данным в map операциях
- Унификация выражений для кэширования
- Поддержка вложенных контекстов
- Обработка условных выражений
- Извлечение путей из атрибутов и событий
- Поддержка деструктуризации параметров
- Правильная обработка различных типов атрибутов (string, array, boolean, event, object)

## Архитектура системы

### Ключевые компоненты

1. **DataParserContext** - контекст парсера с информацией о текущем состоянии
2. **MapContext** - информация о конкретном map контексте
3. **resolveDataPath** - универсальная функция разрешения путей
4. **findVariableInMapStack** - поиск переменных в стеке map контекстов
5. **parseEventExpression** - специальная функция для парсинга событий
6. **parseTemplateLiteral** - функция для парсинга template literals в атрибутах

### Система контекстов

Система создает иерархию контекстов для каждого уровня вложенности map функций:

```typescript
type DataParserContext = {
  currentPath?: string // Текущий путь к данным
  pathStack: string[] // Стек путей
  mapParams?: string[] // Параметры текущего map
  level: number // Уровень вложенности
  mapContextStack?: MapContext[] // Стек всех map контекстов
}
```

## Обработка атрибутов

### Новая структура атрибутов

Система теперь правильно обрабатывает атрибуты и помещает их в соответствующие секции результата:

```typescript
{
  string?: AttributeString,    // Строковые атрибуты
  array?: AttributeArray,      // Массивные атрибуты (class, rel, accept, etc.)
  boolean?: AttributeBoolean,  // Булевые атрибуты
  event?: AttributeEvent,      // Событийные атрибуты
  object?: AttributeObject     // Объектные атрибуты (style, context, core)
}
```

### Типы значений атрибутов

Каждый атрибут может иметь один из трех типов значений:

- **`static`** - статическое значение без интерполяции
- **`dynamic`** - значение с интерполяцией `${...}`
- **`mixed`** - смешанное значение с статическими и динамическими частями

### Обработка строковых атрибутов

Строковые атрибуты обрабатываются в секции `string`:

```typescript
string: {
  src: { type: "static", value: "image.jpg" },
  alt: { type: "dynamic", value: "image.alt" },
  href: { type: "mixed", value: "base/${image.id}.jpg" }
}
```

### Обработка массивных атрибутов

Массивные атрибуты (class, rel, accept, etc.) обрабатываются в секции `array`:

```typescript
array: {
  class: [
    { type: "static", value: "container" },
    { type: "dynamic", value: "isActive ? 'active' : 'inactive'" },
    { type: "mixed", value: "btn-${variant}" }
  ],
  rel: [
    { type: "static", value: "noopener" },
    { type: "static", value: "noreferrer" }
  ]
}
```

### Обработка булевых атрибутов

Булевые атрибуты обрабатываются в секции `boolean`:

```typescript
boolean: {
  disabled: { type: "static", value: true },
  checked: { type: "dynamic", value: "user.isAdmin" },
  required: { type: "dynamic", value: "form.isValid" }
}
```

### Обработка событийных атрибутов

Событийные атрибуты обрабатываются в секции `event`:

```typescript
event: {
  onclick: "() => handleClick()",
  onchange: "(e) => handleChange(e)",
  onsubmit: "() => update({ name: 'John' })"
}
```

### Обработка объектных атрибутов

Объектные атрибуты (style, context, core) обрабатываются в секции `object`:

```typescript
object: {
  style: "{ backgroundColor: 'red', color: 'white' }",
  context: "{ user: currentUser, theme: currentTheme }",
  core: "{ state: appState, actions: appActions }"
}
```

## Единый префикс индексов аргументов (ARGUMENTS_PREFIX)

В `data.ts` используется константа `ARGUMENTS_PREFIX` — единая точка для задания префикса в плейсхолдерах аргументов внутри выражений.

- Формат плейсхолдера всегда `${${ARGUMENTS_PREFIX}[i]}`.
- По умолчанию может быть пустым (например, для специфичного рантайма) или `"arguments"`.
- Используется в: `parseEventExpression`, `createUnifiedExpression`, `extractConditionExpression`, `parseText`, `parseTemplateLiteral` и обработчиках атрибутов, чтобы исключить дублирование строковых литералов.

Примеры:

- `ARGUMENTS_PREFIX = "arguments"` → `${arguments[0]} && ${arguments[1]}`
- `ARGUMENTS_PREFIX = ""` → `${[0]} && ${[1]}`

## HTML-форматирование whitespace

- Для выражений (`expr`) выполняется схлопывание всех последовательностей пробельных символов до одного пробела и `trim()` краев.
- Для статического текста: схлопывание применяется только для многострочных или перегруженных пробелами фрагментов.
- Это поведение согласовано со стандартным HTML whitespace collapsing.

## Извлечение путей в событиях

### Специальная обработка событий

События требуют особого подхода, так как они содержат сложные выражения с функциями. Система использует специальную функцию `parseEventExpression` для корректной обработки событийных атрибутов.

### Поддерживаемые форматы событий

1. **Простые события** - `onclick=${core.onClick}`
2. **События с параметрами** - `onclick=${() => core.onClick()}`
3. **События с аргументами** - `onclick=${(e) => core.onClick(e)}`
4. **События в контексте map** - `onclick=${() => item.handleClick(item.id)}`
5. **Функции обновления контекста** - `onclick=${() => update({ name: "John" })}`

### Алгоритм обработки событий

1. Определение событийного выражения
2. Извлечение переменных
3. Фильтрация и резолв путей
4. Создание выражения c `${${ARGUMENTS_PREFIX}[i]}`

## Унификация выражений

Функция `createUnifiedExpression`:

1. Защищает строковые литералы от форматирования
2. Заменяет переменные на индексы `${${ARGUMENTS_PREFIX}[i]}`
3. Выполняет схлопывание пробелов и `trim()`

## Обработка пустых строк в тернарных операторах

Пустые строки корректно сохраняются (`""`) и отражаются в `expr` после унификации.

## Интеграция с основным API

Полный цикл: `extractMainHtmlBlock` → `extractHtmlElements` → `makeHierarchy` → `extractAttributes` → `enrichWithData`.
