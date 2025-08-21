# Система иерархии элементов HTML парсера

## Обзор

Система **разбирает** HTML шаблоны с динамическими выражениями (полученные от `splitter`) и создает структурированную иерархию элементов с поддержкой:

- Статических и динамических текстовых узлов
- Map-операций (циклы по коллекциям)
- Условных операторов (тернарные выражения)
- Вложенных структур данных

## Архитектура

Система работает **поверх splitter** - принимает готовый HTML-текст и массив токенов тегов, затем анализирует структуру и создает иерархию.

### Входные данные

- `html: string` - сырой HTML-текст из `extractMainHtmlBlock`
- `tags: ElementToken[]` - токены тегов из `extractHtmlElements`

### Основные типы узлов

#### 1. NodeElement - HTML элементы

```typescript
{
  tag: string,                    // Имя HTML тега
  type: "el",                     // Тип узла
  child?: (NodeElement | NodeCondition | NodeMap | NodeText)[]
}
```

#### 2. NodeMap - Циклы по коллекциям

```typescript
{
  type: "map",
  data: string,                   // JSON Pointer путь к коллекции
  child: (NodeElement | NodeText)[]
}
```

#### 3. NodeCondition - Условные операторы

```typescript
{
  type: "cond",
  data: string | string[],        // JSON Pointer путь(и) к данным
  expr?: string,                  // Выражение для вычисления
  true: NodeElement,              // Элемент для истинного случая
  false: NodeElement              // Элемент для ложного случая
}
```

#### 4. NodeText - Текстовые узлы

```typescript
// Статический текст
{
  type: "text",
  value: string
}

// Динамический текст
{
  type: "text",
  data: string | string[],        // Путь(и) к данным
  expr?: string                   // Шаблон с подстановкой
}
```

## Формат путей к данным

Система использует собственный формат путей для доступа к данным:

### Абсолютные пути

```typescript
"/context/list" // Массив из context
"/core/users" // Массив из core
"/context/user/name" // Вложенное свойство
"/core/settings/theme"
```

### Относительные пути в map контексте

```typescript
"[item]" // Текущий элемент коллекции
"[item]/name" // Свойство текущего элемента
"[item]/title" // Другое свойство
"[index]" // Индекс текущего элемента
```

### Специальные пути

```typescript
"[item]" // Текущий элемент в map
"[index]" // Индекс текущего элемента в map
"[item]/nested" // Вложенная коллекция текущего элемента
```

## Примеры использования

### 1. Простой map

```html
${context.list.map(name => html`
<li>${name}</li>
`)}
```

**Результат:**

```typescript
{
  type: "map",
  data: "/context/list",
  child: [
    {
      tag: "li",
      type: "el",
      child: [
        {
          type: "text",
          data: "[item]"
        }
      ]
    }
  ]
}
```

### 2. Map с условиями

```html
${context.list.map((_, i) => html`
<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>
`)}
```

**Результат:**

```typescript
{
  type: "map",
  data: "/context/list",
  child: [
    {
      type: "cond",
      data: "[index]",
      expr: "${0} % 2",
      true: {
        tag: "li",
        type: "el",
        child: [
          {
            tag: "em",
            type: "el",
            child: [{ type: "text", value: "A" }]
          }
        ]
      },
      false: {
        tag: "li",
        type: "el",
        child: [
          {
            tag: "strong",
            type: "el",
            child: [{ type: "text", value: "B" }]
          }
        ]
      }
    }
  ]
}
```

### 3. Вложенные map

```html
${core.users.map(user => html`
<div>
  <h2>${user.name}</h2>
  ${user.posts.map(post => html`
  <article>${post.title}</article>
  `)}
</div>
`)}
```

**Результат:**

```typescript
{
  type: "map",
  data: "/core/users",
  child: [
    {
      tag: "div",
      type: "el",
      child: [
        {
          tag: "h2",
          type: "el",
          child: [
            {
              type: "text",
              data: "[item]/name"
            }
          ]
        },
        {
          type: "map",
          data: "[item]/posts",
          child: [
            {
              tag: "article",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 4. Условия

```html
${context.show ? html`
<div>Visible</div>
` : html`<span>Hidden</span>`}
```

**Результат:**

```typescript
{
  type: "cond",
  data: "/context/show",
  true: {
    tag: "div",
    type: "el",
    child: [{ type: "text", value: "Visible" }]
  },
  false: {
    tag: "span",
    type: "el",
    child: [{ type: "text", value: "Hidden" }]
  }
}
```

### 5. Сложные условия

```html
${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>B</span>`}
```

**Результат:**

```typescript
{
  type: "cond",
  data: ["/context/cond", "/context/cond2"],
  expr: "${0} && ${1}",
  true: {
    tag: "em",
    type: "el",
    child: [{ type: "text", value: "A" }]
  },
  false: {
    tag: "span",
    type: "el",
    child: [{ type: "text", value: "B" }]
  }
}
```

### 6. Смешанный текст

```html
<p>Hello, ${context.name}!</p>
```

**Результат:**

```typescript
{
  tag: "p",
  type: "el",
  child: [
    {
      type: "text",
      data: "/context/name",
      expr: "Hello, ${0}!"
    }
  ]
}
```

## Алгоритм разбора

### 1. Первый проход - Базовая иерархия

- Строится дерево по открывающим/закрывающим тегам из `ElementToken[]`
- Анализируются подстроки между тегами для поиска map и condition паттернов
- Создаются базовые NodeElement узлы

### 2. Второй проход - Текстовые узлы

- Добавляются текстовые узлы в правильном порядке
- Обрабатываются статические и динамические тексты
- Учитывается контекст map-операций

### 3. Третий проход - Специальные узлы

- Создаются NodeMap и NodeCondition узлы
- Преобразуются пути в JSON Pointer формат
- Обрабатываются вложенные структуры

## Преимущества системы

### 1. Единообразие

- Все пути используют единый формат
- Совместимость с будущими JSONPatch операциями
- Стандартизированный формат

### 2. Гибкость

- Поддержка сложных выражений
- Вложенные map и условия
- Доступ к индексам и свойствам

### 3. Расширяемость

- Легко добавлять новые типы узлов
- Поддержка новых выражений
- Модульная архитектура

### 4. Читаемость

- Понятная структура данных
- Декларативное описание
- Легко анализировать и обрабатывать

## Ограничения

### 1. Упрощенный анализ выражений

- Анализ выражений упрощен до поиска известных паттернов
- Нет полноценного AST для JavaScript выражений
- Ограниченная поддержка сложных выражений

### 2. Контекстные зависимости

- Текущий элемент в map обозначается специальными путями
- Относительные пути работают только в определенных контекстах
- Требуется отслеживание контекста вложенности

## Будущие улучшения

### 1. JSONPatch интеграция

- Использование тех же путей для операций изменения данных
- Поддержка add, remove, replace операций
- Инкрементальные обновления

### 2. Расширенная поддержка выражений

- Полноценный анализ JavaScript выражений
- Поддержка функций и методов
- Оптимизация производительности

### 3. Валидация и типизация

- Проверка корректности путей
- TypeScript интеграция
- Автодополнение в IDE
