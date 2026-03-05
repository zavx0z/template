# Роль: Генератор Commit-сообщений

Ты анализируешь изменения кода (diff) и генерируешь commit-сообщение в Markdown.

## ⚙️ Алгоритм и Правила

### 0. КРИТИЧЕСКИЙ ПРИНЦИП: DIFF — ЕДИНСТВЕННАЯ ИСТИНА

* **ИСТОЧНИК ПРАВДЫ:** Анализируй **ТОЛЬКО** строки, начинающиеся с `+` (добавлено) или `-` (удалено).
* **КОНТЕКСТ:** Полный код файла дан **только** для понимания, куда внесены правки.
* **ЗАПРЕТ:** Никогда не описывай методы/классы как "добавленные" или "измененные", если они просто присутствуют в файле, но **не затрагиваются в diff** (нет `+`/`-`).

### 1. Анализ и Типизация

Определи типы изменений **строго по diff**:

* **feat**: Новая функциональность (если не тест/конфиг).
* **fix**: Исправление багов.
* **refactor**: Оптимизация, стиль, упрощение без смены логики.
* **type**: Типизация.
* **test**: Тесты.
* **docs**: Документация.

### 2. Формирование заголовка

* Формат: `[тип/тип] область - описание` (макс 72 символа).
* **ПРИОРИТЕТ ТИПОВ (Строго):** `feat` → `fix` → `refactor` → `type` → `test` → `docs`.
* **СЕМАНТИЧЕСКАЯ СИНХРОНИЗАЦИЯ (Важно):** Порядок слов в описании **обязан** совпадать с порядком типов.
  * *Плохо:* `[feat/fix] ... - исправлена ошибка и добавлена кнопка` (Нарушен порядок).
  * *Хорошо:* `[feat/fix] ... - добавлена кнопка и исправлена ошибка` (Совпадает с тегами).

### 3. Классификация контента (Секции)

**А. Секция "### Основные изменения:"**

* Включает: `feat`, `fix` (логика), `type` (API), безопасность.

**Б. Секция "### Улучшения кода:"**

* Включает: `refactor`, конфиги (`package.json`, `tsconfig`), скрипты, зависимости.
* **Package.json:** Всегда здесь (даже если меняются скрипты тестов).

**В. Секция "### Исправления в тестах:"**

* **ТРИГГЕР:** Создается **ТОЛЬКО** при наличии в diff строк `+`/`-` внутри файлов `*.test.*` или `*.spec.*`.
* **ЗАПРЕТ:** Если таких файлов нет в diff — секция **ФИЗИЧЕСКИ ОТСУТСТВУЕТ**.

## 📝 Формат ответа

Возвращай **только** код:

```markdown
[<типы по приоритету>] <область> - <сначала описание для 1-го типа, затем для 2-го>

### Основные изменения:
- <Суть изменений строго из diff>

### Улучшения кода:
- <Рефакторинг, конфиги>

### Исправления в тестах:
- <Только если изменены test/spec файлы>
```

## ❌ Строгие запреты

1. **Ловушка контекста:** Запрещено писать о коде, который виден в файле, но не имеет метки `+` или `-` в патче.
2. **Заголовок:** Не нарушать порядок (feat всегда первый, описание синхронизировано с типами).
3. **Пустые секции:** Запрещено создавать секцию, если в ней нет пунктов.
4. **Ложные тесты:** Не считать правки в `package.json` за "Исправления в тестах".

---

## Примеры (Patterns)

**Пример 1: Feat + Fix (Синхронизация описания)**

```markdown
[feat/fix] core - реализован логгер и исправлен краш при старте
# (Сначала про feat, потом про fix — как в тегах)

### Основные изменения:
- Добавлен класс Logger
- Исправлена проверка null в init()
```

**Пример 2: Refactor + Config (Без Feat)**

```markdown
[refactor] utils - упрощение функции парсинга

### Улучшения кода:
- Удален дублирующийся код в parser.ts
- Обновлен package.json (скрипт lint)
```

**Пример 3: Чистый тест (Только test файлы)**

```markdown
[test] api - добавлены тесты авторизации

### Исправления в тестах:
- Создан auth.spec.ts
- Обновлены снапшоты
```

# Проект

├── attribute/
│   ├── test/
│   │   ├── data/
│   │   │   ├── attrs.spec.ts
│   │   │   ├── boolean.spec.ts
│   │   │   ├── class.spec.ts
│   │   │   ├── cond.spec.ts
│   │   │   ├── events.spec.ts
│   │   │   ├── style.spec.ts
│   │   │   └── update.spec.ts
│   │   ├── context.core.test.ts
│   │   └── event.test.ts
│   ├── array.t.ts
│   ├── array.ts
│   ├── boolean.t.ts
│   ├── boolean.ts
│   ├── event.t.ts
│   ├── event.ts
│   ├── index.ts
│   ├── string.t.ts
│   ├── string.ts
│   └── style.t.ts
├── node/
│   ├── test/
│   │   ├── cond/
│   │   │   ├── conditions.test.ts
│   │   │   ├── formatting.test.ts
│   │   │   ├── logical.test.ts
│   │   │   ├── nested.test.ts
│   │   │   └── sibling.test.ts
│   │   ├── logical/
│   │   │   └── logical.test.ts
│   │   ├── map/
│   │   │   ├── logical.test.ts
│   │   │   ├── map.cond.test.ts
│   │   │   ├── map.test.ts
│   │   │   ├── sibling.test.ts
│   │   │   └── text.test.ts
│   │   ├── meta/
│   │   │   ├── attr.map.cond.test.ts
│   │   │   ├── attr.object.test.ts
│   │   │   └── meta.spec.ts
│   │   ├── data.spec.ts
│   │   ├── text-formatting.test.ts
│   │   └── web-components.test.ts
│   ├── condition.t.ts
│   ├── element.t.ts
│   ├── index.t.ts
│   ├── logical.spec.ts
│   ├── logical.t.ts
│   ├── map.t.ts
│   ├── meta.t.ts
│   ├── meta.ts
│   ├── text.spec.ts
│   └── text.ts
├── script/
│   └── typegen.ts
├── index.spec.ts
├── index.t.ts
├── index.ts
├── package.json
├── parser.t.ts
├── parser.ts
└── README.md

```markdown
/Users/zavx0z/zavx0z/metafor/template/README.md
# @zavx0z/template

[![npm](https://img.shields.io/npm/v/@zavx0z/renderer)](https://www.npmjs.com/package/@zavx0z/renderer)
[![bun](https://img.shields.io/badge/bun-1.0+-black)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![MDN](https://img.shields.io/badge/MDN-HTML-red)](https://developer.mozilla.org/en-US/docs/Web/HTML)

## Шаблонизатор для **MetaFor**. Извлекает структуру, пути к данным и выражения из tagged template literals **без их выполнения**

`@zavx0z/template` статически парсит исходный код render-функции, достаёт блок `html\`...\`\` и строит нормализованное дерево элементов, текстов, атрибутов, условий, итераций и **meta‑элементов акторов** (в рамках MetaFor).

- Работает в **Node**, **Bun**, браузерах и воркерах
- Поддерживает **условия**, **циклы**, **логические выражения**, **meta‑теги акторов**
- Формирует **пути к данным** и **унифицированные выражения**
- Ничего не исполняет, только анализирует

## Установка

```bash
bun i @zavx0z/template
```

🛠 Пример

```typescript
import { parse } from "@zavx0z/template"
import { Fields } from "@zavx0z/fields"

const { fields, update, onUpdate } = new Fields((t) => ({
  cups: t.number.required(0)({ title: "orders" }),
  last: t.string.optional()({ title: "last ordered drink" }),
}))

const mass = {
  menu: [
    { label: "Espresso", size: "30ml" },
    { label: "Cappuccino", size: "200ml" },
    { label: "Latte", size: "250ml" },
  ],
}

let state = "open"

const nodes = parse<typeof fields, typeof mass, "open" | "closed">(
  ({ html, fields, update, mass, state }) => html`
    <h1>☕ Quick Coffee Order</h1>

    <p>
      Status: ${state === "open" ? "🟢 Open" : "🔴 Closed"} · Orders: ${fields.cups}${fields.last &&
      ` · last: ${fields.last}`}
    </p>

    ${state === "open" &&
    html`
      <ul>
        ${mass.menu.map(
          (product) =>
            html`<li>
              ${product.label} (${product.size})
              <button onclick=${() => update({ cups: fields.cups + 1, last: product.label })}>Add</button>
            </li>`
        )}
      </ul>
    `} ${state === "closed" && html`<p>Come back later — we’ll brew something tasty ☺️</p>`}
  `
)
```

## Документация

Полная документация с описанием и примерами доступна здесь: [https://zavx0z.github.io/template/](https://zavx0z.github.io/template/)

## Лицензия

MIT © zavx0z

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/array.t.ts
import type { ValueType } from "./index.t"
import type { ValueStatic } from "../parser.t"
import type { ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Массивы атрибутов.
 * Используется для атрибутов, которые могут содержать несколько значений (class, rel).
 *
 * @group Значения атрибутов
 * @example
 * ```html
 * <div class="container ${fields.theme} ${fields.isActive && 'active'}">
 *   Элемент с несколькими классами
 * </div>
 * ```
 */

export type ValueArray = ValueStatic | ValueVariable | ValueDynamic
export type RawAttrArray = Record<string, { type: ValueType; value: string }[]>

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/array.ts
import { processTemplateLiteralAttribute, resolveDataPath, ARGUMENTS_PREFIX } from "../parser"
import type { ParseContext } from "../parser.t"
import type { RawAttrArray, ValueArray } from "./array.t"

/**
 * Обрабатывает массивные атрибуты и создает соответствующие объекты.
 */
export const processArrayAttributes = (
  arrayAttrs: RawAttrArray,
  ctx: ParseContext
): Record<string, ValueArray[]> => {
  const result: Record<string, ValueArray[]> = {}
  for (const [key, values] of Object.entries(arrayAttrs)) {
    result[key] = values.map((item) => {
      if (item.type === "static") return item.value
      else if (item.type === "dynamic" || item.type === "mixed") {
        // Для динамических и смешанных атрибутов обрабатываем значение
        const processed = processTemplateLiteralAttribute(item.value, ctx)
        if (processed) return processed
        else {
          // Если parseTemplateLiteral вернул null, но это dynamic тип,
          // значит это уже нормализованное значение без ${}
          // Нужно обработать его как динамическое выражение
          const variableMatches = item.value.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []
          if (variableMatches.length > 0) {
            const paths = variableMatches.map((variable) => resolveDataPath(variable, ctx))
            let expr = item.value
            variableMatches.forEach((variable, index) => {
              expr = expr.replace(
                new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"),
                `${ARGUMENTS_PREFIX}[${index}]`
              )
            })
            return { data: paths.length === 1 ? paths[0] || "" : paths, expr: `\${${expr}}` }
          } else {
            return item.value
          }
        }
      } else return item.value // Для неизвестных типов возвращаем как есть
    })
  }

  return result
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/boolean.t.ts
import type { ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Булевые атрибуты.
 * HTML атрибуты, которые присутствуют или отсутствуют (hidden, disabled, checked).
 *
 * @group Значения атрибутов
 * @example
 * ```html
 * <input type="checkbox" ${mass.user.isSubscribed && "checked"} />
 * <button ${!fields.canSubmit && "disabled"}>Отправить</button>
 * <div ${!fields.isVisible && "hidden"}>Скрытый контент</div>
 * ```
 */

export type ValueBoolean = boolean | ValueVariable | ValueDynamic
export type RawAttrBoolean = Record<string, { type: "dynamic" | "static"; value: boolean | string }>

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/boolean.ts
import { processBooleanAttributeWithVariables } from "./event"
import type { ParseContext } from "../parser.t"

/**
 * Обрабатывает булевые атрибуты и создает соответствующие объекты.
 */
export const processBooleanAttributes = (
  booleanAttrs: Record<string, { type: string; value: string | boolean }>,
  ctx: ParseContext
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, attr] of Object.entries(booleanAttrs)) {
    if (attr.type === "static") {
      result[key] = Boolean(attr.value)
    } else if (attr.type === "dynamic" || attr.type === "mixed") {
      // Для булевых атрибутов используем специальную обработку
      const booleanValue = String(attr.value)
      const processed = processBooleanAttributeWithVariables(booleanValue, ctx)

      if (processed) {
        result[key] = processed
      } else {
        result[key] = false
      }
    }
  }

  return result
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/event.t.ts
import type { ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Событийные атрибуты.
 * Содержит обработчики событий (onclick, onchange, onsubmit и т.д.)
 *
 * @group Значения атрибутов
 * @example Простая функция без параметров
 * ```html
 * <button onclick=${mass.handleClick}>Кнопка</button>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "/mass/handleClick"
 *   }
 * }
 * ```
 *
 * @example Функция с параметрами
 * ```html
 * <input onchange=${(e) => update({ value: e.target.value })} />
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onchange": {
 *     "upd": "value",
 *     "expr": "(e) => update({ value: e.target.value })"
 *   }
 * }
 * ```
 *
 * @example Событие в массиве
 * ```html
 * <li onclick=${() => mass.item.onClick()}>${mass.item.name}</li>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "onclick": {
 *     "data": "/mass/item/onClick",
 *     "expr": "() => ${[0]}()"
 *   }
 * }
 * ```
 */
export type ValueEvent =
  | {
      /** Обновляемые ключи контекста в функции Update */
      upd?: string | string[]
      /**
       * Путь(и) к данным для выражения
       *
       * @example
       * ```typescript
       * data: "/fields/value"
       * data: ["/fields/value", "[item]/nested/variable"]
       * ```
       */
      data: string | string[]
      /**
       * Выражение с индексами
       *
       * @example
       * ```typescript
       * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
       * ```
       */
      expr: string
    }
  | {
      /** Обновляемые ключи контекста в функции Update */
      upd?: string | string[]
      /**
       * Выражение с индексами
       *
       * @example
       * ```typescript
       * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
       * ```
       */
      expr: string
    }
  | {
      /**
       * Путь(и) к данным для выражения
       *
       * @example
       * ```typescript
       * data: "/fields/value"
       * data: ["/fields/value", "[item]/nested/variable"]
       * ```
       */
      data: string | string[]
    }

export type RawAttrEvent = Record<string, string>

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/event.ts
import {
  ARGUMENTS_PREFIX,
  CONDITIONAL_OPERATORS_PATTERN,
  OBJECT_KEY_PATTERN,
  resolveDataPath,
  TEMPLATE_WRAPPER_PATTERN,
  UPDATE_OBJECT_PATTERN,
  VARIABLE_WITH_DOTS_PATTERN,
  WHITESPACE_PATTERN,
} from "../parser"
import type { ParseContext } from "../parser.t"
import type { ValueEvent } from "./event.t"

/**
 * Обрабатывает событийные атрибуты и создает соответствующие объекты.
 */
export const processEventAttributes = (
  eventAttrs: Record<string, string>,
  ctx: ParseContext
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(eventAttrs)) {
    const eventResult = parseEventExpression(value, ctx)
    const processed = processSingleEventAttribute(value, eventResult)

    if (processed) {
      result[key] = processed
    }
  }

  // Если секция событий пуста, удаляем её
  if (Object.keys(result).length === 0) {
    return {}
  }

  return result
}

/**
 * Парсит событийные выражения и извлекает пути к данным.
 *
 * Эта функция специально предназначена для обработки событий типа:
 * - () => core.onClick()
 * - (e) => core.onInput(e)
 * - () => item.handleClick(item.id)
 *
 * @param eventValue - Значение события для парсинга
 * @param context - Парсер полей с информацией о текущем map контексте
 * @returns Результат парсинга с путями к данным и унифицированным выражением
 */

export const parseEventExpression = (
  eventValue: string,
  ctx: ParseContext = { pathStack: [], level: 0 }
): ValueEvent | null => {
  // Проверяем, является ли это условным выражением (не событием)
  // Ищем тернарный оператор ? ... : (но не стрелочную функцию =>)
  const hasConditionalOperators = CONDITIONAL_OPERATORS_PATTERN.test(eventValue) && !eventValue.includes("=>")
  if (hasConditionalOperators) {
    return null
  }

  // Проверяем, является ли это template literal (не событием)
  const hasTemplateLiteral = eventValue.includes("${")
  if (hasTemplateLiteral) {
    return null
  }

  // Проверяем, является ли это update выражением
  if (eventValue.includes("update(")) {
    // Ищем объект в update({ ... }) - может быть внутри стрелочной функции
    const objectMatch = eventValue.match(UPDATE_OBJECT_PATTERN)
    if (objectMatch) {
      const objectContent = objectMatch[1] || ""

      // Извлекаем ключи из объекта
      const keyMatches = objectContent.match(OBJECT_KEY_PATTERN) || []
      const keys = keyMatches.map((match) => match.replace(/\s*:$/, "").trim())

      if (keys.length > 0) {
        // Ищем переменные в значениях (например, core.name, ctx.count)
        const variableMatches = objectContent.match(VARIABLE_WITH_DOTS_PATTERN) || []
        const uniqueVariables = [...new Set(variableMatches)].filter((variable) => {
          // Исключаем строковые литералы, короткие идентификаторы и булевые литералы
          return (
            variable.length > 1 &&
            !variable.startsWith('"') &&
            !variable.startsWith("'") &&
            !variable.includes('"') &&
            !variable.includes("'") &&
            variable !== "true" &&
            variable !== "false"
          )
        })

        let result: any = {
          upd: keys.length === 1 ? keys[0] || "" : keys,
        }

        // Если есть переменные, добавляем пути к данным
        if (uniqueVariables.length > 0) {
          const paths = uniqueVariables
            .map((variable) => resolveDataPath(variable, ctx))
            .filter((path) => path && path.length > 0) as string[]
          if (paths.length > 0) {
            result.data = paths.length === 1 ? paths[0]! : paths
          }
        }

        // Обрабатываем выражение напрямую
        let expr = eventValue
        if (uniqueVariables.length > 0) {
          uniqueVariables.forEach((variable, index) => {
            expr = expr.replace(
              new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"),
              `${ARGUMENTS_PREFIX}[${index}]`
            )
          })
        }

        result.expr = expr.replace(TEMPLATE_WRAPPER_PATTERN, "").replace(WHITESPACE_PATTERN, " ").trim()

        return result as ValueEvent
      }
    }
  }

  // Извлекаем переменные из события
  // Ищем все переменные в формате identifier.identifier
  const variableMatches = eventValue.match(VARIABLE_WITH_DOTS_PATTERN) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Проверяем, является ли это стрелочной функцией
  const hasArrowFunction = eventValue.includes("=>")

  // Фильтруем уникальные переменные и исключаем строковые литералы
  const uniqueVariables = [...new Set(variableMatches)].filter((variable) => {
    // Исключаем строковые литералы и короткие идентификаторы
    return (
      variable.length > 1 &&
      !variable.startsWith('"') &&
      !variable.startsWith("'") &&
      !variable.includes('"') &&
      !variable.includes("'")
    )
  })

  if (uniqueVariables.length === 0) {
    return null
  }

  // Разрешаем пути к данным с учетом контекста
  const paths = uniqueVariables.map((variable) => resolveDataPath(variable, ctx))

  // Создаем унифицированное выражение
  let expr = eventValue
  uniqueVariables.forEach((variable, index) => {
    // Заменяем переменные на индексы, учитывая границы слов
    expr = expr.replace(new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"), `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Убираем ${} обертку если она есть, но только если это не template literal
  if (!expr.includes("${")) {
    expr = expr.replace(/^\$\{/, "").replace(/\}$/, "")
  }

  // Применяем форматирование
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Если это простая переменная без стрелочной функции, не возвращаем expr
  if (!hasArrowFunction && uniqueVariables.length === 1 && expr === `${ARGUMENTS_PREFIX}[0]`) {
    return { data: paths[0] || "" }
  }

  return { data: paths.length === 1 ? paths[0] || "" : paths, expr }
}

/**
 * Общая функция для обработки событийных атрибутов.
 * Устраняет дублирование кода в processEventAttributes.
 */

export const processSingleEventAttribute = (value: string, eventResult: any): any => {
  if (eventResult) {
    // Для update выражений может быть пустой массив data, но есть upd
    if (eventResult.upd) {
      // Это update выражение
      const eventObj: any = {
        expr: eventResult.expr || "",
        upd: eventResult.upd,
      }
      // Добавляем data только если оно есть
      if (eventResult.data) {
        eventObj.data = eventResult.data
      }
      return eventObj
    } else if (eventResult.data) {
      // Обычное событие с данными
      if (eventResult.expr && typeof eventResult.expr === "string") {
        // Если есть выражение, создаем AttrDynamic (может быть массив или строка)
        return {
          data: eventResult.data,
          expr: eventResult.expr,
        }
      } else {
        // Если нет выражения, создаем AttrVariable (только строка)
        return {
          data: Array.isArray(eventResult.data) ? eventResult.data[0] || "" : eventResult.data,
        }
      }
    }
  }

  // Если не удалось распарсить событие и value не пустая строка, создаем объект с data
  if (value && value.trim() !== "") {
    return {
      data: value,
    }
  }

  // Иначе возвращаем null для игнорирования пустых событий
  return null
}
/**
 * Общая функция для обработки булевых атрибутов с переменными.
 * Устраняет дублирование кода в processBooleanAttributes.
 */

export const processBooleanAttributeWithVariables = (
  booleanValue: string,
  ctx: ParseContext
): { data: string | string[]; expr?: string } | null => {
  const variableMatches = booleanValue.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Обрабатываем все переменные в выражении
  const paths = variableMatches.map((variable) => resolveDataPath(variable, ctx))

  // Создаем выражение, заменяя переменные на индексы
  let expr = booleanValue
  variableMatches.forEach((variable, index) => {
    expr = expr.replace(new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g"), `${ARGUMENTS_PREFIX}[${index}]`)
  })

  if (paths.length === 1) {
    // Проверяем, есть ли отрицание или другие операции
    const hasNegation = booleanValue.includes("!(") || booleanValue.includes("!")
    const hasComplexOperations = /[%+\-*/===!===!=<>().]/.test(booleanValue)

    // Проверяем, является ли это просто переменной без операций
    const isSimpleVariable = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/.test(booleanValue.trim())

    if ((hasNegation || hasComplexOperations) && !isSimpleVariable) {
      // Для отрицания убираем лишние скобки
      let finalExpr = expr
      if (hasNegation && expr.includes("!(") && expr.includes(")")) {
        finalExpr = expr.replace(/^!\(/, "!").replace(/\)$/, "")
      }

      return {
        data: paths[0] || "",
        expr: finalExpr,
      }
    } else {
      // Простая переменная без операций
      return {
        data: paths[0] || "",
      }
    }
  } else {
    return {
      data: paths,
      expr: expr,
    }
  }
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/index.ts
import type { ValueType, SplitterResolved } from "./index.t"
import type { RawAttrArray } from "./array.t"
import type { RawAttrBoolean } from "./boolean.t"
import type { RawAttrEvent } from "./event.t"
import type { RawAttrString } from "./string.t"

// ============================
// ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
// ============================

/**
 * Форматирует выражение по HTML-правилам схлопывания пробелов.
 * - Схлопывает последовательности пробельных символов в один пробел
 * - Обрезает пробелы по краям
 *
 * @param expr - Исходная строка для форматирования
 * @returns Отформатированная строка с нормализованными пробелами
 */
export function formatExpression(expr: string): string {
  return expr.replace(/\s+/g, " ").trim()
}

/**
 * Найти позицию ПОСЛЕ закрывающей '}' для сбалансированного блока, начиная с индекса после '{' в последовательности `${`
 *
 * @param s - Строка для поиска
 * @param startAfterBraceIndex - Индекс после открывающей '{' в последовательности `${`
 * @returns Индекс после закрывающей '}' или -1 если блок не сбалансирован
 */
export function matchBalancedBraces(s: string, startAfterBraceIndex: number): number {
  let depth = 1
  for (let i = startAfterBraceIndex; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

/**
 * Найти позицию ПОСЛЕ закрывающей '}' для двойных фигурных скобок ${{...}}
 *
 * @param s - Строка для поиска
 * @param startIndex - Индекс начала последовательности `${{`
 * @returns Индекс после закрывающей '}' или -1 если блок не сбалансирован
 */
export function matchDoubleBraces(s: string, startIndex: number): number {
  let depth = 1
  for (let i = startIndex + 2; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

/**
 * Полностью ли токен — одиночный ${...} без префикса/суффикса
 *
 * @param token - Токен для проверки
 * @returns true если токен является полностью динамическим выражением
 */
export function isFullyDynamicToken(token: string): boolean {
  const v = token.trim()
  if (!(v.startsWith("${") && v.endsWith("}"))) return false
  const end = matchBalancedBraces(v, 2)
  return end === v.length
}

/**
 * Классифицировать значение: static / dynamic / mixed
 *
 * @param token - Токен для классификации
 * @returns Тип значения: "static", "dynamic" или "mixed"
 */
export function classifyValue(token: string): ValueType {
  if (isFullyDynamicToken(token)) return "dynamic"
  if (token.includes("${")) return "mixed"
  return "static"
}

/**
 * Нормализует исходное значение атрибута для записи в результат.
 * - Форматирует строку целиком, сохраняя структуру ${...}
 *
 * @param token - Исходное значение атрибута
 * @returns Нормализованное значение
 */
export function normalizeValueForOutput(token: string): string {
  return formatExpression(token)
}

/**
 * Проверить, является ли значение атрибута пустым
 *
 * @param value - Значение атрибута для проверки
 * @returns true если значение пустое или null, false если содержит динамические выражения или непустое значение
 */
export function isEmptyAttributeValue(value: string | null): boolean {
  if (value === null) return false
  // Если значение содержит динамические выражения, не считаем его пустым
  if (value.includes("${")) return false
  const normalized = normalizeValueForOutput(value)
  return normalized === "" || normalized.trim() === ""
}

/**
 * Резка по разделителю на верхнем уровне (вне кавычек и ${...})
 *
 * @param raw - Исходная строка для разбиения
 * @param sep - Разделитель для разбиения
 * @returns Массив подстрок, разбитых по разделителю
 */
export function splitTopLevel(raw: string, sep: string): string[] {
  const out: string[] = []
  let buf = ""
  let inSingle = false
  let inDouble = false

  const push = () => {
    const t = buf.trim()
    if (t) out.push(t)
    buf = ""
  }

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]

    // ${...}
    if (!inSingle && !inDouble && ch === "$" && raw[i + 1] === "{") {
      const end = matchBalancedBraces(raw, i + 2)
      if (end === -1) {
        buf += ch
        continue
      } else {
        buf += raw.slice(i, end)
        i = end - 1
        continue
      }
    }

    // кавычки
    if (!inDouble && ch === "'") {
      inSingle = !inSingle
      buf += ch
      continue
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble
      buf += ch
      continue
    }

    if (!inSingle && !inDouble && ch === sep) {
      push()
      continue
    }

    buf += ch
  }
  push()
  return out
}

/**
 * Резка по пробелам верхнего уровня (как для class), учитывая ${} и кавычки
 *
 * @param raw - Исходная строка для разбиения
 * @returns Массив подстрок, разбитых по пробелам
 */
export function splitBySpace(raw: string): string[] {
  const out: string[] = []
  let buf = ""
  let inSingle = false
  let inDouble = false

  const push = () => {
    const t = buf.trim()
    if (t) out.push(t)
    buf = ""
  }

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]

    if (inSingle || inDouble) {
      buf += ch
      if (inSingle && ch === "'") inSingle = false
      else if (inDouble && ch === '"') inDouble = false
      continue
    }

    if (ch === "$" && raw[i + 1] === "{") {
      const end = matchBalancedBraces(raw, i + 2)
      if (end === -1) {
        buf += raw.slice(i)
        break
      } else {
        buf += raw.slice(i, end)
        i = end - 1
        continue
      }
    }

    if (ch === "'") {
      inSingle = true
      buf += ch
      continue
    }
    if (ch === '"') {
      inDouble = true
      buf += ch
      continue
    }

    if (ch && /\s/.test(ch)) {
      push()
      while (i + 1 < raw.length && /\s/.test(raw[i + 1] || "")) i++
      continue
    }

    buf += ch
  }
  push()
  return out
}

/**
 * Разбивает строку по запятым на верхнем уровне
 *
 * @param raw - Исходная строка для разбиения
 * @returns Массив подстрок, разбитых по запятым
 */
export const splitByComma = (raw: string) => splitTopLevel(raw, ",")

/**
 * Разбивает строку по точкам с запятой на верхнем уровне
 *
 * @param raw - Исходная строка для разбиения
 * @returns Массив подстрок, разбитых по точкам с запятой
 */
export const splitBySemicolon = (raw: string) => splitTopLevel(raw, ";")

export type SplitterFn = (raw: string) => string[]

/**
 * Получить встроенный разделитель для атрибута по имени
 *
 * @param name - Имя атрибута
 * @returns Объект с функцией разделения и разделителем, или null если атрибут не поддерживается
 */
export function getBuiltinResolved(name: string): SplitterResolved | null {
  const lower = name.toLowerCase()
  // aria-hidden является булевым атрибутом, а не списковым
  if (lower.startsWith("aria-") && lower !== "aria-hidden") return { fn: splitBySpace, delim: " " }
  return BUILTIN_LIST_SPLITTERS[lower] || null
}

/**
 * Обрабатывает интерполяцию ${...} и ${{...}} в значениях атрибутов
 *
 * @param inside - Строка содержащая значение атрибута
 * @param cursor - Текущая позиция курсора в строке
 * @returns Объект с извлеченным значением и следующей позицией курсора
 */
function handleInterpolation(inside: string, cursor: number): { value: string; nextIndex: number } {
  if (inside[cursor] === "$" && inside[cursor + 1] === "{") {
    // Проверяем двойные фигурные скобки ${{...}}
    if (inside[cursor + 2] === "{") {
      const end = matchDoubleBraces(inside, cursor)
      if (end === -1) {
        return { value: inside.slice(cursor), nextIndex: inside.length }
      } else {
        return { value: inside.slice(cursor, end), nextIndex: end }
      }
    } else {
      // Обычные фигурные скобки ${...}
      const end = matchBalancedBraces(inside, cursor + 2)
      if (end === -1) {
        return { value: inside.slice(cursor), nextIndex: inside.length }
      } else {
        return { value: inside.slice(cursor, end), nextIndex: end }
      }
    }
  }
  return { value: "", nextIndex: cursor }
}

/**
 * Читает значение атрибута и обновляет позицию курсора
 *
 * @param inside - Строка содержащая HTML-код
 * @param i - Текущая позиция курсора
 * @returns Объект с прочитанным значением и обновленной позицией курсора
 */
function readAttributeValue(
  inside: string,
  i: number
): { value: string | null; nextIndex: number; hasQuotes: boolean } {
  let value: string | null = null
  let hasQuotes = false

  if (inside[i] === "=") {
    i++
    hasQuotes = inside[i] === '"' || inside[i] === "'"
    const r = readAttributeRawValue(inside, i)
    value = r.value
    i = r.nextIndex
  }

  return { value, nextIndex: i, hasQuotes }
}

/**
 * Прочитать "сырое" значение атрибута из строки inside, начиная с позиции cursor
 *
 * @param inside - Строка содержащая HTML-код
 * @param cursor - Начальная позиция для чтения значения
 * @returns Объект с прочитанным значением и следующей позицией курсора
 */
export function readAttributeRawValue(inside: string, cursor: number): { value: string; nextIndex: number } {
  const len = inside.length
  while (cursor < len && /\s/.test(inside[cursor] ?? "")) cursor++
  if (cursor >= len) return { value: "", nextIndex: cursor }

  const first = inside[cursor]
  if (first === '"' || first === "'") {
    const quote = first as '"' | "'"
    cursor++
    let v = ""
    while (cursor < len) {
      const c = inside[cursor]
      if (c === "$" && inside[cursor + 1] === "{") {
        const result = handleInterpolation(inside, cursor)
        v += result.value
        cursor = result.nextIndex
        continue
      }
      if (c === quote) {
        cursor++
        break
      }
      v += c
      cursor++
    }
    return { value: v, nextIndex: cursor }
  }

  let v = ""
  while (cursor < len) {
    const c = inside[cursor]
    if (c === ">" || (c && /\s/.test(c))) break
    if (c === "$" && inside[cursor + 1] === "{") {
      const result = handleInterpolation(inside, cursor)
      v += result.value
      cursor = result.nextIndex
      continue
    }
    v += c
    cursor++
  }
  return { value: v, nextIndex: cursor }
}
/** Преднастройка известных списковых атрибутов */
export const BUILTIN_LIST_SPLITTERS: Record<string, SplitterResolved> = {
  class: { fn: splitBySpace, delim: " " },
  rel: { fn: splitBySpace, delim: " " },
  headers: { fn: splitBySpace, delim: " " },
  itemref: { fn: splitBySpace, delim: " " },
  ping: { fn: splitBySpace, delim: " " },
  sandbox: { fn: splitBySpace, delim: " " },
  sizes: { fn: splitBySpace, delim: " " },
  "accept-charset": { fn: splitBySpace, delim: " " },
  accept: { fn: splitByComma, delim: "," },
  allow: { fn: splitBySemicolon, delim: ";" },
  srcset: {
    fn: (raw) =>
      splitByComma(raw)
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
  coords: {
    fn: (raw) =>
      splitTopLevel(raw, ",")
        .map((s) => s.trim())
        .filter(Boolean),
    delim: ",",
  },
}
export const parseAttributes = (
  inside: string
): {
  event?: RawAttrEvent
  array?: RawAttrArray
  string?: RawAttrString
  boolean?: RawAttrBoolean
  style?: string
  fields?: string
  mass?: string
} => {
  const len = inside.length
  let i = 0

  const result: {
    event?: RawAttrEvent
    array?: RawAttrArray
    string?: RawAttrString
    boolean?: RawAttrBoolean
    style?: string
    fields?: string
    mass?: string
  } = {}

  const ensure = {
    event: () => (result.event ??= {}),
    array: () => (result.array ??= {}),
    string: () => (result.string ??= {}),
    boolean: () => (result.boolean ??= {}),
    style: () => (result.style ??= ""),
    fields: () => (result.fields ??= ""),
    mass: () => (result.mass ??= ""),
  }

  while (i < len) {
    while (i < len && /\s/.test(inside[i] || "")) i++
    if (i >= len) break

    // Обработка условных булевых атрибутов ${condition && 'attribute'}
    if (inside[i] === "$" && inside[i + 1] === "{") {
      const braceStart = i
      const braceEnd = matchBalancedBraces(inside, i + 2)
      if (braceEnd === -1) break

      const braceContent = inside.slice(braceStart + 2, braceEnd - 1)

      // Проверяем, является ли это условным выражением вида condition ? "attr1" : "attr2"
      const ternaryMatch = braceContent.match(/^(.+?)\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']$/)

      if (ternaryMatch) {
        const [, condition, trueAttr, falseAttr] = ternaryMatch

        if (condition && trueAttr && falseAttr) {
          // Создаем два атрибута: один для true случая, другой для false
          ensure.boolean()[trueAttr] = {
            type: "dynamic",
            value: condition.trim(),
          }

          ensure.boolean()[falseAttr] = {
            type: "dynamic",
            value: `!(${condition.trim()})`,
          }
        }

        i = braceEnd
        continue
      }

      // Обработка обычных условных атрибутов ${condition && 'attribute'}
      const parts = braceContent.split("&&").map((s) => s.trim())

      if (parts.length >= 2) {
        // Последняя часть - это имя атрибута в кавычках
        const attributeName = parts[parts.length - 1]?.replace(/['"]/g, "") // убираем кавычки

        if (attributeName) {
          // Все части кроме последней - это условие
          const condition = parts.slice(0, -1).join(" && ")

          ensure.boolean()[attributeName] = {
            type: "dynamic",
            value: condition || "",
          }
        }
      }

      i = braceEnd
      continue
    }

    const nameStart = i
    while (i < len) {
      const ch = inside[i]
      if (!ch || /\s/.test(ch) || ch === "=") break
      i++
    }
    const name = inside.slice(nameStart, i)
    if (!name) break

    // Игнорируем атрибут "/" для самозакрывающихся тегов
    if (name === "/") {
      continue
    }

    // события - обрабатываем в первую очередь
    if (name.startsWith("on")) {
      while (i < len && /\s/.test(inside[i] || "")) i++

      const { value, nextIndex } = readAttributeValue(inside, i)
      i = nextIndex

      ensure.event()[name] = value ? formatExpression(value.slice(2, -1)) : ""
      continue
    }

    // стили - обрабатываем как объекты
    if (name === "style") {
      while (i < len && /\s/.test(inside[i] || "")) i++

      const { value, nextIndex } = readAttributeValue(inside, i)
      i = nextIndex

      if (value && value.startsWith("${{")) {
        // Извлекаем содержимое объекта стилей и возвращаем как строку
        const styleContent = value.slice(3, -2).trim()
        if (styleContent) {
          result.style = `{ ${formatExpression(styleContent)} }`
        } else {
          result.style = "{}"
        }
      }
      continue
    }

    // fields и mass для meta-компонентов - обрабатываем как объекты
    if (name === "fields" || name === "mass") {
      while (i < len && /\s/.test(inside[i] || "")) i++

      const { value, nextIndex } = readAttributeValue(inside, i)
      i = nextIndex

      const objectValue = value
        ? value.startsWith("${{")
          ? value.slice(3, -2).trim()
            ? `{ ${formatExpression(value.slice(3, -2))} }`
            : "{}"
          : formatExpression(value.slice(2, -1))
        : "{}"

      // Не добавляем пустые mass и fields атрибуты
      if (objectValue === "{}") {
        continue
      }

      // Для meta-компонентов fields и mass будут обработаны отдельно
      if (name === "fields") {
        result.fields = objectValue
      } else {
        result.mass = objectValue
      }
      continue
    }

    while (i < len && /\s/.test(inside[i] || "")) i++

    const { value, nextIndex, hasQuotes } = readAttributeValue(inside, i)
    i = nextIndex

    // списковые атрибуты (class и встроенные)
    const isClass = name === "class"
    const resolved = isClass ? null : getBuiltinResolved(name)

    if (isClass || resolved) {
      if (isEmptyAttributeValue(value)) {
        continue
      }

      const tokens = isClass ? splitBySpace(value ?? "") : resolved!.fn(value ?? "")

      // Если только одно значение, обрабатываем как строку
      if (tokens.length === 1) {
        ensure.string()[name] = {
          type: classifyValue(value ?? ""),
          value: normalizeValueForOutput(value ?? ""),
        }
        continue
      }
      ensure.array()[name] = tokens.map((tok) => ({
        type: classifyValue(tok),
        value: normalizeValueForOutput(tok),
      }))
      continue
    }

    if (
      !hasQuotes &&
      !name.startsWith("on") &&
      (value === null ||
        value === "true" ||
        value === "false" ||
        (value && isFullyDynamicToken(value) && !value.includes("?") && !value.includes(":")) ||
        (value &&
          isFullyDynamicToken(value) &&
          value.includes("?") &&
          value.includes(":") &&
          (value.includes("true") || value.includes("false"))))
    ) {
      if (value && isFullyDynamicToken(value)) {
        ensure.boolean()[name] = {
          type: "dynamic",
          value: normalizeValueForOutput(value).replace(/^\${/, "").replace(/}$/, ""),
        }
      } else {
        ensure.boolean()[name] = { type: "static", value: value === "true" || value === null }
      }
      continue
    }

    // string
    if (!isEmptyAttributeValue(value)) {
      ensure.string()[name] = {
        type: classifyValue(value ?? ""),
        value: normalizeValueForOutput(value ?? ""),
      }
    }
  }

  return result
}
export const formatAttributeText = (text: string): string =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/string.t.ts
import type { ValueType } from "./index.t"
import type { ValueStatic, ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Строковые атрибуты.
 * Обычные HTML атрибуты со строковыми значениями.
 *
 * @group Значения атрибутов
 * @example
 * ```html
 * <img src=${fields.url} alt=${fields.alt} title=${fields.title} />
 * <a href="/user/${mass.user.id}">Профиль пользователя</a>
 * ```
 */

export type ValueString = ValueStatic | ValueVariable | ValueDynamic
export type RawAttrString = Record<string, { type: ValueType; value: string }>

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/string.ts
import { processTemplateLiteralAttribute } from "../parser"
import type { ParseContext } from "../parser.t"

/**
 * Обрабатывает строковые атрибуты и создает соответствующие объекты.
 */
export const processStringAttributes = (
  stringAttrs: Record<string, { type: string; value: string }>,
  ctx: ParseContext
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, attr] of Object.entries(stringAttrs)) {
    if (attr.type === "static") {
      result[key] = attr.value
    } else if (attr.type === "dynamic" || attr.type === "mixed") {
      const processed = processTemplateLiteralAttribute(attr.value, ctx)
      result[key] = processed || attr.value
    }
  }

  return result
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/style.t.ts
import type { ValueStatic, ValueVariable, ValueDynamic } from "../parser.t"

/**
 * Объект стилей.
 * CSS стили в виде JavaScript объекта (styled-components подход).
 *
 * @group Значения атрибутов
 * @example Простой объект стилей
 * ```html
 * <div style=${{backgroundColor: "red", color: "white"}}>
 *   Стилизованный элемент
 * </div>
 * ```
 *
 * @example Динамические стили
 * ```html
 * <div style=${{backgroundColor: mass.theme.primary, color: mass.theme.text}}>
 *   Элемент с темой
 * </div>
 * ```
 *
 * @example Условные стили
 * ```html
 * <div style=${{backgroundColor: fields.isActive ? "green" : "red", color: "white"}}>
 *   Условный стиль
 * </div>
 * ```
 */

export type ValueStyle = ValueStatic | ValueVariable | ValueDynamic

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/context.core.test.ts
import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../index.ts"

describe("fields и mass", () => {
  describe("meta-компоненты с fields и mass", () => {
    it("meta-компонент с fields", () => {
      const attrs = parseAttributes("fields=${{user: currentUser, theme: currentTheme}}")
      expect(attrs).toEqual({
        fields: "{ user: currentUser, theme: currentTheme }",
      })
    })

    it("meta-компонент с mass", () => {
      const attrs = parseAttributes("mass=${{state: appState, actions: appActions}}")
      expect(attrs).toEqual({
        mass: "{ state: appState, actions: appActions }",
      })
    })

    it("meta-компонент с fields и mass", () => {
      const attrs = parseAttributes(
        "fields=${{user: currentUser, theme: currentTheme}} mass=${{state: appState, actions: appActions}}"
      )
      expect(attrs).toEqual({
        fields: "{ user: currentUser, theme: currentTheme }",
        mass: "{ state: appState, actions: appActions }",
      })
    })

    it("meta-компонент с динамическим fields", () => {
      const attrs = parseAttributes("fields=${{user: ${getCurrentUser()}, theme: ${getTheme()}}}")
      expect(attrs).toEqual({
        fields: "{ user: ${getCurrentUser()}, theme: ${getTheme()} }",
      })
    })

    it("meta-компонент с условным fields", () => {
      const attrs = parseAttributes(
        "fields=${{user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme}}"
      )
      expect(attrs).toEqual({
        fields: "{ user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme }",
      })
    })

    it("meta-компонент с вложенными объектами в fields", () => {
      const attrs = parseAttributes(
        'fields=${{user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" }}}'
      )
      expect(attrs).toEqual({
        fields: '{ user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" } }',
      })
    })

    it("meta-компонент с функциями в mass", () => {
      const attrs = parseAttributes(
        "mass=${{actions: { save: saveData, delete: deleteData }, utils: { format: formatText }}}"
      )
      expect(attrs).toEqual({
        mass: "{ actions: { save: saveData, delete: deleteData }, utils: { format: formatText } }",
      })
    })

    it("meta-компонент с template literals в fields", () => {
      const attrs = parseAttributes(
        'fields=${{apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws`}}'
      )
      expect(attrs).toEqual({
        fields: '{ apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws` }',
      })
    })

    it("meta-компонент с пустым fields", () => {
      const attrs = parseAttributes("fields=${{}}")
      expect(attrs).toEqual({})
    })

    it("meta-компонент с пустым mass", () => {
      const attrs = parseAttributes("mass=${{}}")
      expect(attrs).toEqual({})
    })

    it("meta-компонент с fields, core и другими атрибутами", () => {
      const attrs = parseAttributes(
        'class="container" fields=${{user: currentUser}} mass=${{state: appState}} data-testid="meta-component"'
      )
      expect(attrs).toEqual({
        fields: "{ user: currentUser }",
        mass: "{ state: appState }",
        string: {
          class: { type: "static", value: "container" },
          "data-testid": { type: "static", value: "meta-component" },
        },
      })
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/attrs.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("атрибуты", () => {
  describe("namespace", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<svg:use xlink:href="#id"></svg:use>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "svg:use",
          type: "el",
          string: {
            "xlink:href": "#id",
          },
        },
      ])
    })
  })
  describe("пустые значения", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<div class="" id="">Content</div>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
  describe("двойные/одинарные кавычки", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<a href="https://e.co" target="_blank">x</a>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "a",
          type: "el",
          string: {
            href: "https://e.co",
            target: "_blank",
          },
          child: [
            {
              type: "text",
              value: "x",
            },
          ],
        },
      ])
    })
  })

  describe("угловые скобки внутри значения", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<div title="a > b, c < d"></div>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: "a > b, c < d",
          },
        },
      ])
    })
  })

  describe("условие в атрибуте", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ flag: boolean }>(
        ({ html, fields }) => html`<div title="${fields.flag ? "a > b" : "c < d"}"></div>`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              data: "/fields/flag",
              expr: '${_[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])  
    })
  })

  describe("условие в аттрибуте без кавычек", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ flag: boolean }>(
        ({ html, fields }) => html`<div title=${fields.flag ? "a > b" : "c < d"}></div>`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              data: "/fields/flag",
              expr: '${_[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])
    })
  })

  describe("условие в аттрибуте с одинарными кавычками", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ flag: boolean }>(
        // prettier-ignore
        ({ html, fields }) => html`<div title='${fields.flag ? "a > b" : "c < d"}'></div>`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            title: {
              data: "/fields/flag",
              expr: '${_[0] ? "a > b" : "c < d"}',
            },
          },
        },
      ])
    })
  })
})

describe("булевы атрибуты", () => {
  let elements: Node[]
  beforeAll(() => {
    elements = parse<{ flag: boolean }>(({ html, fields }) => html`<button ${fields.flag && "disabled"}></button>`)
  })
  it("data", () => {
    expect(elements).toEqual([
      {
        tag: "button",
        type: "el",
        boolean: {
          disabled: {
            data: "/fields/flag",
          },
        },
      },
    ])
  })
})

describe("класс в map", () => {
  let elements: Node[]
  beforeAll(() => {
    elements = parse<any, { items: { type: string; name: string }[] }>(
      ({ html, mass }) => html`
        <ul>
          ${mass.items.map((item) => html`<li class="item-${item.type}" title="${item.name}">${item.name}</li>`)}
        </ul>
      `
    )
  })
  it("data", () => {
    expect(elements).toEqual([
      {
        tag: "ul",
        type: "el",
        child: [
          {
            type: "map",
            data: "/mass/items",
            child: [
              {
                tag: "li",
                type: "el",
                string: {
                  class: {
                    data: "[item]/type",
                    expr: "item-${_[0]}",
                  },
                  title: {
                    data: "[item]/name",
                  },
                },
                child: [
                  {
                    type: "text",
                    data: "[item]/name",
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })
})

describe("сложные условные атрибуты class", () => {
  let elements: Node[]
  beforeAll(() => {
    elements = parse<{ active: boolean }>(
      ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}">Content</div>`
    )
  })
  it("data", () => {
    expect(elements).toEqual([
      {
        tag: "div",
        type: "el",
        string: {
          class: {
            data: "/mass/active",
            expr: 'div-${_[0] ? "active" : "inactive"}',
          },
        },
        child: [
          {
            type: "text",
            value: "Content",
          },
        ],
      },
    ])
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/boolean.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("boolean атрибуты", () => {
  describe("булевы атрибуты с переменными из разных уровней вложенности", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        any,
        {
          companies: {
            id: string
            active: boolean
            departments: {
              id: string
              active: boolean
            }[]
          }[]
        }
      >(
        ({ html, mass }) => html`
          <div>
            ${mass.companies.map(
              (company) => html`
                <section ${company.active && "data-active"}>
                  ${company.departments.map(
                    (dept) => html`
                      <article ${company.active && dept.active && "data-active"}>
                        Dept: ${company.id}-${dept.id}
                      </article>
                    `
                  )}
                </section>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/companies",
              child: [
                {
                  tag: "section",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "[item]/departments",
                      child: [
                        {
                          tag: "article",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: ["../[item]/id", "[item]/id"],
                              expr: "Dept: ${_[0]}-${_[1]}",
                            },
                          ],
                          boolean: {
                            "data-active": {
                              data: ["../[item]/active", "[item]/active"],
                              expr: "_[0] && _[1]",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  boolean: {
                    "data-active": {
                      data: "[item]/active",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
  describe("boolean атрибуты с переменными из разных уровней map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { visible: boolean }>(
        ({ html, fields }) => html`<img src="https://example.com" ${fields.visible ? "visible" : "hidden"} />`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "img",
          type: "el",
          string: {
            src: "https://example.com",
          },
          boolean: {
            visible: {
              data: "/fields/visible",
            },
            hidden: {
              data: "/fields/visible",
              expr: "!_[0]",
            },
          },
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/class.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("class атрибуты в data.ts", () => {
  describe("простые случаи", () => {
    describe("class в элементе с одним статическим значением", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: "div-active",
            },
          },
        ])
      })
    })

    describe("class в элементе с одним статическим значением без кавычек", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: "div-active",
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими статическими значениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse(({ html }) => html`<div class="div-active div-inactive"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: ["div-active", "div-inactive"],
            },
          },
        ])
      })
    })
  })

  describe("динамические значения", () => {
    describe("class в элементе с одним динамическим значением", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="${mass.active ? "active" : "inactive"}"></div>`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: '${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним динамическим значением без кавычек", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class=${mass.active ? "active" : "inactive"}></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: '${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими динамическими значениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`
            <div class="${mass.active ? "active" : "inactive"} ${mass.active ? "active" : "inactive"}"></div>
          `
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами сравнения", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ count: number }>(
          ({ html, mass }) => html`<div class="${mass.count > 5 ? "large" : "small"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/count",
                expr: '${_[0] > 5 ? "large" : "small"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с операторами равенства", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ status: string }>(
          ({ html, mass }) => html`<div class="${mass.status === "loading" ? "loading" : "ready"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/status",
                expr: '${_[0] === "loading" ? "loading" : "ready"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с логическими операторами", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; visible: boolean }>(
          ({ html, mass }) => html`<div class="${mass.active && mass.visible ? "show" : "hide"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/mass/active", "/mass/visible"],
                expr: '${_[0] && _[1] ? "show" : "hide"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором ИЛИ", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ error: boolean; warning: boolean }>(
          ({ html, mass }) => html`<div class="${mass.error || mass.warning ? "alert" : "normal"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/mass/error", "/mass/warning"],
                expr: '${_[0] || _[1] ? "alert" : "normal"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором НЕ", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ disabled: boolean }>(
          ({ html, mass }) => html`<div class="${!mass.disabled ? "enabled" : "disabled"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/disabled",
                expr: '${!_[0] ? "enabled" : "disabled"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с оператором И &&", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(({ html, mass }) => html`<div class="${mass.active && "active"}"></div>`)
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: '${_[0] && "active"}',
              },
            },
          },
        ])
      })
    })
  })

  describe("смешанные значения", () => {
    describe("class в элементе с одним смешанным значением", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: 'div-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с одним смешанным значением без кавычек", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}"></div>`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: 'div-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) =>
            html`<div
              class="div-${mass.active ? "active" : "inactive"} div-${mass.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/mass/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/mass/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
              ],
            },
          },
        ])
      })
    })
  })

  describe("различные варианты", () => {
    describe("class в элементе с смешанным и статическим значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"} visible"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/mass/active",
                  expr: 'div-${_[0] ? "active" : "inactive"}',
                },
                "visible",
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с динамическим и статическим значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="${mass.active ? "active" : "inactive"} visible"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                "visible",
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с тремя различными типами значений", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; type: string }>(
          ({ html, mass }) =>
            html`<div class="static-value ${mass.active ? "active" : "inactive"} mixed-${mass.type}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "static-value",
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/mass/type",
                  expr: "mixed-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с несколькими смешанными значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ variant: string; size: string; theme: string }>(
          ({ html, mass }) => html`<div class="btn-${mass.variant} text-${mass.size} bg-${mass.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                {
                  data: "/mass/variant",
                  expr: "btn-${_[0]}",
                },
                {
                  data: "/mass/size",
                  expr: "text-${_[0]}",
                },
                {
                  data: "/mass/theme",
                  expr: "bg-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с условными классами", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean; disabled: boolean }>(
          ({ html, mass }) =>
            html`<div
              class="base-class ${mass.active ? "active" : "inactive"} ${mass.disabled ? "disabled" : ""}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base-class",
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/mass/disabled",
                  expr: '${_[0] ? "disabled" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с вложенными выражениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ nested: boolean }>(
          ({ html, mass }) => html`<div class="container ${mass.nested ? "nested" : "default"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "container",
                {
                  data: "/mass/nested",
                  expr: '${_[0] ? "nested" : "default"}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с пустыми значениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ hidden: boolean; active: boolean }>(
          ({ html, mass }) =>
            html`<div class="visible ${mass.hidden ? "" : "show"} ${mass.active ? "active" : ""}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "visible",
                {
                  data: "/mass/hidden",
                  expr: '${_[0] ? "" : "show"}',
                },
                {
                  data: "/mass/active",
                  expr: '${_[0] ? "active" : ""}',
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с атрибутом без кавычек", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<{ active: boolean }>(
          ({ html, mass }) => html`<div class="static-value-${mass.active ? "active" : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: "/mass/active",
                expr: 'static-value-${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с несколькими переменными", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, mass }) => html`<div class="user-${mass.user.id}-${mass.user.role}-${mass.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/mass/user/id", "/mass/user/role", "/mass/theme"],
                expr: "user-${_[0]}-${_[1]}-${_[2]}",
              },
            },
          },
        ])
      })
    })

    describe("class в элементе со сложной строкой с условными выражениями", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<
          any,
          {
            user: { id: string; role: string }
            theme: string
            isActive: boolean
          }
        >(
          ({ html, mass }) =>
            html`<div
              class="user-${mass.user.id}-${mass.user.role}-${mass.theme}-${mass.isActive
                ? "active"
                : "inactive"}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            string: {
              class: {
                data: ["/mass/user/id", "/mass/user/role", "/mass/theme", "/mass/isActive"],
                expr: 'user-${_[0]}-${_[1]}-${_[2]}-${_[3] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов со сложной строкой", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<any, { user: { id: string; role: string }; theme: string }>(
          ({ html, mass }) => html`<div class="base user-${mass.user.id}-${mass.user.role} theme-${mass.theme}"></div>`
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base",
                {
                  data: ["/mass/user/id", "/mass/user/role"],
                  expr: "user-${_[0]}-${_[1]}",
                },
                {
                  data: "/mass/theme",
                  expr: "theme-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })

    describe("class в элементе с массивом классов и сложными условными выражениями", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<
          any,
          {
            user: { id: string; role: string }
            theme: string
            isActive: boolean
            isAdmin: boolean
          }
        >(
          ({ html, mass }) =>
            html`
              <div
                class="
              base 
              user-${mass.user.id} 
              ${mass.isActive ? "active" : "inactive"} 
              ${mass.isAdmin ? "admin" : "user"} 
              theme-${mass.theme}
              "></div>
            `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            array: {
              class: [
                "base",
                {
                  data: "/mass/user/id",
                  expr: "user-${_[0]}",
                },
                {
                  data: "/mass/isActive",
                  expr: '${_[0] ? "active" : "inactive"}',
                },
                {
                  data: "/mass/isAdmin",
                  expr: '${_[0] ? "admin" : "user"}',
                },
                {
                  data: "/mass/theme",
                  expr: "theme-${_[0]}",
                },
              ],
            },
          },
        ])
      })
    })
  })
  describe("постфикс с условием и статическими значениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ status: boolean }>(
        ({ html, fields }) => html`<div class="${fields.status ? "active" : "inactive"}-status">Status</div>`
      )
    })
    it("data", () => {
      expect(elements, "суффикс с условием").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: "/fields/status",
              expr: '${_[0] ? "active" : "inactive"}-status',
            },
          },
          child: [
            {
              type: "text",
              value: "Status",
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/cond.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("условные выражения в атрибутах", () => {
  describe("тернарный оператор с числом в качестве условия", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ count: number }>(
        ({ html, fields }) => html`
          <div class="${10 > fields.count && fields.count < 3 ? "active" : "inactive"}">Content</div>
        `
      )
    })
    it("data", () => {
      expect(elements, "одна переменная в нескольких местах").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: "/fields/count",
              expr: '${10 > _[0] && _[0] < 3 ? "active" : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
  describe("тернарный оператор сравнения через === с динамическими результатами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ isActive: boolean; status: "waiting" | "running"; item: string }>(
        ({ html, fields, mass }) => html`
          <div class="${mass.isActive === fields.isActive ? `${fields.item}-active-${fields.status}` : "inactive"}">
            Content
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements, "тернарный оператор сравнения с динамическими результатами").toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: {
              data: ["/mass/isActive", "/fields/isActive", "/fields/item", "/fields/status"],
              expr: '${_[0] === _[1] ? `${_[2]}-active-${_[3]}` : "inactive"}',
            },
          },
          child: [
            {
              type: "text",
              value: "Content",
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/events.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("events", () => {
  describe("onclick с выражением", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html, mass }) => html`<button onclick=${() => mass.onClick()}>OK</button>`)
    })
    it("data", () => {
      expect(elements, "должен распознать onclick и не сериализовать функцию").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              data: "/mass/onClick",
              expr: "() => _[0]()",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("onclick без кавычек со стрелочной функцией", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html, mass }) => html`<button onclick=${mass.onClick}>OK</button>`)
    })
    it("data", () => {
      expect(elements, "onclick без кавычек со стрелочной функцией").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              data: "/mass/onClick",
            },
          },
          child: [{ type: "text", value: "OK" }],
        },
      ])
    })
  })

  describe("onclick без значения (булев)", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(({ html }) => html`<button onclick>OK</button>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("несколько событий в самозакрывающемся теге", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(
        ({ html, mass }) => html`<input onclick=${() => mass.onClick()} oninput="${(e: Event) => mass.onInput(e)}" />`
      )
    })
    it("data", () => {
      expect(elements, "должен поддерживать несколько событий on*").toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            onclick: {
              data: "/mass/onClick",
              expr: "() => _[0]()",
            },
            oninput: {
              data: "/mass/onInput",
              expr: "(e) => _[0](e)",
            },
          },
        },
      ])
    })
  })

  describe("oninput без кавычек со стрелочной функцией (input)", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html, mass }) => html`<input oninput=${(e: Event) => mass.onInput(e)} />`)
    })
    it("data", () => {
      expect(elements, "oninput без кавычек со стрелочной функцией").toEqual([
        {
          tag: "input",
          type: "el",
          event: {
            oninput: {
              data: "/mass/onInput",
              expr: "(e) => _[0](e)",
            },
          },
        },
      ])
    })
  })

  describe("событие внутри массива", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { items: { name: string; onClick: () => void }[] }>(
        ({ html, mass }) => html`
          <ul>
            ${mass.items.map((item) => html`<li onclick=${() => item.onClick()}>${item.name}</li>`)}
          </ul>
        `
      )
    })

    it("data", () => {
      expect(elements, "событие внутри массива").toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: "li",
                  type: "el",
                  event: {
                    onclick: {
                      data: "[item]/onClick",
                      expr: "() => _[0]()",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("событие с параметрами в массиве", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { buttons: { id: string; text: string; handleClick: (e: Event, id: string) => void }[] }>(
        ({ html, mass }) => html`
          <div>
            ${mass.buttons.map(
              (btn) => html` <button onclick=${(e: Event) => btn.handleClick(e, btn.id)}>${btn.text}</button> `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements, "событие с параметрами в массиве").toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/buttons",
              child: [
                {
                  tag: "button",
                  type: "el",
                  event: {
                    onclick: {
                      data: ["[item]/handleClick", "[item]/id"],
                      expr: "(e) => _[0](e, _[1])",
                    },
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]/text",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("смешанные события и обычные атрибуты", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        any,
        { handleSubmit: (e: Event) => void; handleChange: (e: Event) => void; onClick: () => void }
      >(
        ({ html, mass }) => html`
          <form onsubmit=${(e: Event) => mass.handleSubmit(e)} class="form" method="post">
            <input type="text" onchange=${(e: Event) => mass.handleChange(e)} />
            <button type="submit" onclick=${() => mass.onClick()}>Submit</button>
          </form>
        `
      )
    })

    it("data", () => {
      expect(elements, "смешанные события и обычные атрибуты").toEqual([
        {
          tag: "form",
          type: "el",
          event: {
            onsubmit: {
              data: "/mass/handleSubmit",
              expr: "(e) => _[0](e)",
            },
          },
          string: {
            class: "form",
            method: "post",
          },
          child: [
            {
              tag: "input",
              type: "el",
              string: {
                type: "text",
              },
              event: {
                onchange: {
                  data: "/mass/handleChange",
                  expr: "(e) => _[0](e)",
                },
              },
            },
            {
              tag: "button",
              type: "el",
              string: {
                type: "submit",
              },
              event: {
                onclick: {
                  data: "/mass/onClick",
                  expr: "() => _[0]()",
                },
              },
              child: [
                {
                  type: "text",
                  value: "Submit",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("события с условными атрибутами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { onClick: () => void; isDisabled: boolean }>(
        ({ html, mass }) => html`
          <button onclick=${() => mass.onClick()} ${mass.isDisabled && "disabled"}>Click me</button>
        `
      )
    })
    it("data", () => {
      expect(elements, "события с условными атрибутами").toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              data: "/mass/onClick",
              expr: "() => _[0]()",
            },
          },
          boolean: {
            disabled: {
              data: "/mass/isDisabled",
            },
          },
          child: [
            {
              type: "text",
              value: "Click me",
            },
          ],
        },
      ])
    })
  })

  describe("вложенные события с несколькими уровнями map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        any,
        {
          companies: {
            id: string
            name: string
            handleCompanyClick: (id: string) => void
            departments: {
              id: string
              name: string
              handleDeptClick: (companyId: string, deptId: string) => void
              teams: {
                id: string
                name: string
                handleTeamClick: (companyId: string, deptId: string, teamId: string) => void
                members: {
                  id: string
                  name: string
                  handleMemberClick: (companyId: string, deptId: string, teamId: string, memberId: string) => void
                }[]
              }[]
            }[]
          }[]
        }
      >(
        ({ html, mass }) => html`
          <div>
            ${mass.companies.map(
              (company) => html`
                <section onclick=${() => company.handleCompanyClick(company.id)}>
                  <h1>Company: ${company.name}</h1>
                  ${company.departments.map(
                    (dept) => html`
                      <article onclick=${() => dept.handleDeptClick(company.id, dept.id)}>
                        <h2>Dept: ${dept.name}</h2>
                        ${dept.teams.map(
                          (team) => html`
                            <div onclick=${() => team.handleTeamClick(company.id, dept.id, team.id)}>
                              <h3>Team: ${team.name}</h3>
                              ${team.members.map(
                                (member) => html`
                                  <p onclick=${() => member.handleMemberClick(company.id, dept.id, team.id, member.id)}>
                                    Member: ${member.name}
                                  </p>
                                `
                              )}
                            </div>
                          `
                        )}
                      </article>
                    `
                  )}
                </section>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements, "вложенные события с правильными путями").toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/companies",
              child: [
                {
                  tag: "section",
                  type: "el",
                  event: {
                    onclick: {
                      data: ["[item]/handleCompanyClick", "[item]/id"],
                      expr: "() => _[0](_[1])",
                    },
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
                          expr: "Company: ${_[0]}",
                        },
                      ],
                    },
                    {
                      type: "map",
                      data: "[item]/departments",
                      child: [
                        {
                          tag: "article",
                          type: "el",
                          event: {
                            onclick: {
                              data: ["[item]/handleDeptClick", "../[item]/id", "[item]/id"],
                              expr: "() => _[0](_[1], _[2])",
                            },
                          },
                          child: [
                            {
                              tag: "h2",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  data: "[item]/name",
                                  expr: "Dept: ${_[0]}",
                                },
                              ],
                            },
                            {
                              type: "map",
                              data: "[item]/teams",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  event: {
                                    onclick: {
                                      data: ["[item]/handleTeamClick", "../../[item]/id", "../[item]/id", "[item]/id"],
                                      expr: "() => _[0](_[1], _[2], _[3])",
                                    },
                                  },
                                  child: [
                                    {
                                      tag: "h3",
                                      type: "el",
                                      child: [
                                        {
                                          type: "text",
                                          data: "[item]/name",
                                          expr: "Team: ${_[0]}",
                                        },
                                      ],
                                    },
                                    {
                                      type: "map",
                                      data: "[item]/members",
                                      child: [
                                        {
                                          tag: "p",
                                          type: "el",
                                          event: {
                                            onclick: {
                                              data: [
                                                "[item]/handleMemberClick",
                                                "../../../[item]/id",
                                                "../../[item]/id",
                                                "../[item]/id",
                                                "[item]/id",
                                              ],
                                              expr: "() => _[0](_[1], _[2], _[3], _[4])",
                                            },
                                          },
                                          child: [
                                            {
                                              type: "text",
                                              data: "[item]/name",
                                              expr: "Member: ${_[0]}",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/style.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("object атрибуты (стили) с переменными из разных уровней map", () => {
  describe("стили с переменными из разных уровней вложенности", () => {
    let elements: Node[]
    type Core = {
      companies: {
        id: string
        theme: string
        departments: {
          id: string
          color: string
        }[]
      }[]
    }
    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass }) => html`
          <div>
            ${mass.companies.map(
              (company) => html`
                <section style="${{ backgroundColor: company.theme }}">
                  ${company.departments.map(
                    (dept) => html`
                      <article
                        style="${{
                          color: company.theme,
                          borderColor: dept.color,
                        }}">
                        Dept: ${company.id}-${dept.id}
                      </article>
                    `
                  )}
                </section>
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/companies",
              child: [
                {
                  tag: "section",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "[item]/departments",
                      child: [
                        {
                          tag: "article",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: ["../[item]/id", "[item]/id"],
                              expr: "Dept: ${_[0]}-${_[1]}",
                            },
                          ],
                          style: {
                            color: {
                              data: "../[item]/theme",
                            },
                            borderColor: {
                              data: "[item]/color",
                            },
                          },
                        },
                      ],
                    },
                  ],
                  style: {
                    backgroundColor: {
                      data: "[item]/theme",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("стили со смешанными статическими и динамическими значениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<
        any,
        {
          users: {
            id: string
            theme: string
          }[]
        }
      >(
        ({ html, mass }) => html`
          <div>
            ${mass.users.map(
              (user) => html`
                <div
                  style="${{
                    color: "red",
                    backgroundColor: user.theme,
                    border: "1px solid black",
                    fontSize: "14px",
                  }}">
                  User: ${user.id}
                </div>
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/users",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/id",
                      expr: "User: ${_[0]}",
                    },
                  ],
                  style: {
                    color: "red",
                    backgroundColor: {
                      data: "[item]/theme",
                    },
                    border: "1px solid black",
                    fontSize: "14px",
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/data/update.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("update", () => {
  describe("функция обновления контекста в функции рендера", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ name: string }>(
        ({ html, update }) => html` <button onclick=${() => update({ name: "Jane Doe" })}>OK</button> `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: "name",
              expr: `() => update({ name: "Jane Doe" })`,
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления нескольких ключей контекста", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ name: string; age: number; active: boolean }>(
        ({ html, update }) =>
          html` <button onclick=${() => update({ name: "John", age: 25, active: true })}>Update</button> `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: ["name", "age", "active"],
              expr: '() => update({ name: "John", age: 25, active: true })',
            },
          },
          child: [
            {
              type: "text",
              value: "Update",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления контекста данными из контекста", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ count: number }>(
        ({ html, update, fields }) => html` <button onclick=${() => update({ count: fields.count + 1 })}>OK</button> `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: "count",
              data: "/fields/count",
              expr: "() => update({ count: _[0] + 1 })",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления fields данными из mass и fields", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ count: number; iteration: number }>(
        ({ html, update, mass, fields }) =>
          html`
            <button onclick=${() => update({ count: mass.count + fields.count, iteration: fields.iteration + 1 })}>
              OK
            </button>
          `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "button",
          type: "el",
          event: {
            onclick: {
              upd: ["count", "iteration"],
              data: ["/mass/count", "/fields/count", "/fields/iteration"],
              expr: "() => update({ count: _[0] + _[1], iteration: _[2] + 1 })",
            },
          },
          child: [
            {
              type: "text",
              value: "OK",
            },
          ],
        },
      ])
    })
  })

  describe("функция обновления fields данными из mass и fields внутри массива вложенного в массив", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        { count: number; iteration: number },
        { items: { count: number; iteration: number }[]; count: number; iteration: number }
      >(
        ({ html, update, mass }) =>
          html`
            ${mass.items.map(
              (item) => html`
                <button onclick=${() => update({ count: mass.count + item.count, iteration: item.iteration + 1 })}>
                  OK
                </button>
              `
            )}
          `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "map",
          data: "/mass/items",
          child: [
            {
              tag: "button",
              type: "el",
              event: {
                onclick: {
                  upd: ["count", "iteration"],
                  data: ["/mass/count", "[item]/count", "[item]/iteration"],
                  expr: "() => update({ count: _[0] + _[1], iteration: _[2] + 1 })",
                },
              },
              child: [
                {
                  type: "text",
                  value: "OK",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/attribute/test/event.test.ts
import { it, describe, expect } from "bun:test"
import { enrichWithData } from "../../parser"
import type { PartsAttr } from "../../node/index.t"

describe("event", () => {
  it("update в функции", () => {
    const attributes = [
      {
        tag: "meta-${mass.tag}",
        type: "meta",
        event: {
          onclick: "() => update({ selected: mass.id })",
        },
      },
    ] as PartsAttr

    const data = enrichWithData(attributes)
    expect(data).toEqual([
      {
        tag: {
          data: "/mass/tag",
          expr: "meta-${_[0]}",
        },
        type: "meta",
        event: {
          onclick: {
            data: "/mass/id",
            expr: "() => update({ selected: _[0] })",
            upd: "selected",
          },
        },
      },
    ])
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/index.spec.ts
import { describe, it, expect } from "bun:test"
import { parse } from "./index"

describe("parse", () => {
  it("параметры", () => {
    type state = "offline" | "online"
    // #region params
    const result = parse<{ attempt: number }, { ice: { url: string }[] }, state>(
      ({ html, fields, update, mass, state }) => html`
        <h1>Config</h1>
        <ul>
          ${mass.ice.map((server) => html`<li>Url: ${server.url}</li>`)}
        </ul>
        <h1>State</h1>
        <p>${state}</p>
        ${state === "offline" &&
        html` <button onclick=${() => update({ attempt: fields.attempt + 1 })}>Connect</button>`}
      `
    )
    // #endregion params
    expect(result).toBeDefined()
  })
  it("парсит простой HTML с переменными", () => {
    const result = parse(
      ({ html, fields }) => html`
        <div class="${fields.userStatus}">
          <h1>Hello ${fields.userName}!</h1>
          <p>You have ${fields.messageCount} messages</p>
        </div>
      `
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: "el",
      tag: "div",
    })

    const div = result[0] as any
    expect(div.child).toHaveLength(2)

    const h1 = div.child[0]
    expect(h1).toMatchObject({
      type: "el",
      tag: "h1",
    })

    const p = div.child[1]
    expect(p).toMatchObject({
      type: "el",
      tag: "p",
    })
  })

  it("парсит HTML с map операциями", () => {
    const result = parse(
      ({ html, fields }) => html`
        <ul>
          ${fields.usersList}
        </ul>
      `
    )

    expect(result).toHaveLength(1)
    const ul = result[0] as any
    expect(ul.type).toBe("el")
    expect(ul.tag).toBe("ul")

    const textNode = ul.child[0]
    expect(textNode).toMatchObject({
      type: "text",
      data: "/fields/usersList",
    })
  })

  it("парсит HTML с условиями", () => {
    const result = parse(
      ({ html, fields }) => html`
        <div>${fields.isAdmin ? html` <button>Admin Panel</button> ` : html` <span>Access denied</span> `}</div>
      `
    )

    expect(result).toHaveLength(1)
    const div = result[0] as any
    expect(div.type).toBe("el")
    expect(div.tag).toBe("div")

    const conditionNode = div.child[0]
    expect(conditionNode).toMatchObject({
      type: "cond",
      data: "/fields/isAdmin",
    })

    const trueBranch = conditionNode.child[0]
    expect(trueBranch).toMatchObject({
      type: "el",
      tag: "button",
    })

    const falseBranch = conditionNode.child[1]
    expect(falseBranch).toMatchObject({
      type: "el",
      tag: "span",
    })
    expect(falseBranch.child[0]).toMatchObject({
      type: "text",
      value: "Access denied",
    })
  })

  it("парсит HTML с событиями и динамическими атрибутами", () => {
    const result = parse(
      ({ html, fields }) => html`
        <button class="${fields.isActive ? "active" : ""}" disabled="${!fields.canEdit}">
          ${fields.buttonText}
        </button>
      `
    )

    expect(result).toHaveLength(1)
    const button = result[0] as any
    expect(button).toMatchObject({
      type: "el",
      tag: "button",
    })

    expect(button.string.class).toMatchObject({
      data: "/fields/isActive",
      expr: '${_[0] ? "active" : ""}',
    })

    expect(button.string.disabled).toMatchObject({
      data: "/fields/canEdit",
      expr: "${!_[0]}",
    })

    expect(button.child[0]).toMatchObject({
      type: "text",
      data: "/fields/buttonText",
    })
  })

  it("парсит статический HTML без переменных", () => {
    const result = parse(
      ({ html, fields }) => html`
        <div>
          <h1>Static Title</h1>
          <p>Static content</p>
        </div>
      `
    )

    expect(result).toHaveLength(1)
    const div = result[0] as any
    expect(div.type).toBe("el")
    expect(div.tag).toBe("div")
    expect(div.child).toHaveLength(2)

    const h1 = div.child[0]
    expect(h1).toMatchObject({
      type: "el",
      tag: "h1",
    })
    expect(h1.child[0]).toMatchObject({
      type: "text",
      value: "Static Title",
    })

    const p = div.child[1]
    expect(p).toMatchObject({
      type: "el",
      tag: "p",
    })
    expect(p.child[0]).toMatchObject({
      type: "text",
      value: "Static content",
    })
  })

  it("парсит вложенные map операции", () => {
    const result = parse(({ html, fields }) => html` <div class="dashboard">${fields.departmentsList}</div> `)

    expect(result).toHaveLength(1)
    const dashboard = result[0] as any
    expect(dashboard.type).toBe("el")
    expect(dashboard.tag).toBe("div")

    const textNode = dashboard.child[0]
    expect(textNode).toMatchObject({
      type: "text",
      data: "/fields/departmentsList",
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/index.t.ts
import type { NodeType } from "./node/index.t"
export type { NodeType }
export type { NodeMeta } from "./node/meta.t"
export type { NodeCondition } from "./node/condition.t"
export type { NodeLogical } from "./node/logical.t"
export type { NodeMap } from "./node/map.t"
export type { NodeText } from "./node/text.t"
export type { NodeElement } from "./node/element.t"

export type { ValueArray } from "./attribute/array.t"
export type { ValueBoolean } from "./attribute/boolean.t"
export type { ValueString } from "./attribute/string.t"
export type { ValueEvent } from "./attribute/event.t"
export type { ValueStyle } from "./attribute/style.t"
export type { ValueStatic, ValueVariable, ValueDynamic } from "./parser.t"

/**
 * Поля.
 *
 * {@link https://zavx0z.github.io/fields/types/Values | Значения полей}
 * содержат простые данные, доступные в шаблоне для рендеринга.
 * Поддерживает только примитивные типы и массивы примитивных типов.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const fields: Fields = {
 *   framework: "MetaFor",
 *   isActive: true,
 *   tags: ["tag1", "tag2", "tag3"]
 *   count: 4444,
 * }
 * ```
 */
export type Fields = Record<string, string | number | boolean | null | Array<string | number | boolean>>

/**
 * Mass объект.
 * Содержит сложные данные, объекты, функции и утилиты, доступные в шаблоне.
 * Может содержать любые типы данных: объекты, массивы, функции, классы.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const mass: Mass = {
 *   user: {
 *     name: "Иван",
 *     profile: {
 *       avatar: "avatar.jpg",
 *       settings: { theme: "dark", language: "ru" }
 *     }
 *   },
 *   posts: [
 *     { id: 1, title: "Заголовок", content: "Содержимое" },
 *     { id: 2, title: "Другой пост", content: "Еще содержимое" }
 *   ],
 *   api: {
 *     baseUrl: "https://api.example.com",
 *     endpoints: { users: "/users", posts: "/posts" }
 *   },
 *   utils: {
 *     formatDate: (date: Date) => date.toLocaleDateString(),
 *     escapeHtml: (str: string) => str.replace(/</g, "&lt")
 *   }
 * }
 * ```
 */
export type Mass = Record<string, any>

/**
 * Состояние приложения.
 * Строковое представление текущего состояния.
 *
 * @group Шаблонизатор
 * @example
 * ```typescript
 * const state: State = "loading" // "loading" | "ready" | "error"
 * ```
 */
export type State = string

/**
 * Параметры для функции шаблонизатора.
 * Содержит все необходимые данные и функции для шаблонизации.
 * {@includeCode ./index.spec.ts#params}
 *
 * @group Шаблонизатор
 */
export type Params<F extends Fields, M extends Mass = Mass, S extends State = State> = {
  /** Функция для создания HTML из template literals */
  html: (strings: TemplateStringsArray, ...values: any[]) => string
  /**
   * @inheritdoc Mass
   */
  mass: M
  /**
   * @inheritdoc Fields
   */
  fields: F
  /**
   * @inheritdoc State
   */
  state: S
  /**
   * Функция для обновления полей {@link https://zavx0z.github.io/fields/types/Update | Update}.
   * Используется в обработчиках событий для изменения состояния.
   *
   * @example
   * ```typescript
   * // Обновление одного поля
   * update({ count: 5 })
   *
   * // Обновление нескольких полей
   * update({ name: "John", age: 25 })
   *
   * // В обработчике события
   * html`<button onclick=${() => update({ active: !fields.active })}>Toggle</button>`
   * ```
   */
  update: (fields: Partial<F>) => void
}

/**
 * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
 *
 * @param template - Функция шаблонизатора, которая принимает параметры { html, fields, mass, state, update }
 * @returns Массив узлов с полной структурой и метаданными о путях к данным
 */
export declare function parse<F extends Fields = Fields, M extends Mass = Mass, S extends State = State>(
  template: (params: Params<F, M, S>) => void
): NodeType[]

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/index.ts
import { createNode } from "./node"
import type { NodeType } from "./node/index.t"
import type { Params, Fields, Mass, State } from "./index.t"
import { extractHtmlElements } from "./parser"

export type { NodeType as Node }

/**
 * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
 * Поддерживает все возможности парсера:
 * - HTML элементы с атрибутами
 * - Template literals с переменными ${...}
 * - Map операции для итерации по коллекциям
 * - Условные операторы (тернарные)
 * - Вложенные структуры любой сложности
 * - События и динамические атрибуты
 * - Web Components
 *
 * @param template - Template-функция вида ({ html, fields, mass, state }) => html`...`
 * @returns Обогащенная иерархия с метаданными о путях к данным
 */
export const parse = <F extends Fields = Fields, M extends Mass = Mass, S extends State = State>(
  template: (params: Params<F, M, S>) => void
): NodeType[] => {
  const mainHtml = extractMainHtmlBlock(template)
  const hierarchy = extractHtmlElements(mainHtml)
  const context = { pathStack: [], level: 0 }
  return hierarchy.map((node) => createNode(node, context))
}

const extractMainHtmlBlock = (template: (params: Params<any, any, any>) => void): string => {
  const src = Function.prototype.toString.call(template)
  const firstIndex = src.indexOf("html`")
  if (firstIndex === -1) throw new Error("функция template не содержит html`")
  const lastBacktick = src.lastIndexOf("`")
  if (lastBacktick === -1 || lastBacktick <= firstIndex) throw new Error("template function does not contain html`")
  const htmlContent = src.slice(firstIndex + 5, lastBacktick)
  return htmlContent.replace(/!0/g, "true").replace(/!1/g, "false")
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/condition.t.ts
import type { PartAttrMap } from "./map.t"
import type { PartAttrElement } from "./element.t"
import type { NodeType } from "./index.t"
import type { PartAttrMeta } from "./meta.t"

/**
 * Узел условного оператора в AST.
 * Представляет тернарный оператор с ветками true и false.
 *
 * @group Nodes
 * @example Простое условие
 * ```html
 * <div>
 *   ${fields.isLoggedIn ? html`<span>Добро пожаловать, ${fields.name}!</span>` : html`<a href="/login">Войти</a>`}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": "/fields/isLoggedIn",
 *       "child": [
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": "/fields/name",
 *               "expr": "Добро пожаловать, ${[0]}!"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "a",
 *           "type": "el",
 *           "string": {
 *             "href": "/login"
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Войти"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Сложное условие
 * ```html
 * <div>
 *   ${mass.role === 'admin' && mass.permissions.includes('write') ?
 *     html`<button>Редактировать</button>` :
 *     html`<span>Нет прав</span>`
 *   }
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": ["user.role", "user.permissions"],
 *       "expr": "${[0]} === 'admin' && ${[1]}.includes('write')",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Редактировать"
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "span",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Нет прав"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Условие с проверкой массива
 * ```html
 * <div>
 *   ${mass.posts.length > 0 ?
 *     html`<ul>${mass.posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
 *     html`<p>Постов пока нет</p>`
 *   }
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "cond",
 *       "data": "/mass/posts.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "ul",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/mass/posts",
 *               "child": [
 *                 {
 *                   "tag": "li",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/title"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "tag": "p",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Постов пока нет"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "cond" для условных операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - массив из двух элементов: [true-ветка, false-ветка]
 */
export interface NodeCondition {
  /** Тип узла - всегда "cond" для условных операторов */
  type: "cond"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/fields/isLoggedIn"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/fields/isAdmin", "/mass/role"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.length > 0"
   * ```
   */
  expr?: string
  /** Узлы для случая когда условие истинно и ложно
   * - true: первый элемент массива (child[0])
   * - false: второй элемент массива (child[1])
   */
  child: NodeType[]
}
export type TokenCondClose = { kind: "cond-close" }
export type TokenCondElse = { kind: "cond-else" }
export type TokenCondOpen = { kind: "cond-open"; expr: string }
export type PartAttrCondition = {
  /** Тип узла */
  type: "cond"
  /** Исходный текст условия */
  text: string
  /** Элементы, условия
   * - true: первый элемент массива
   * - false: второй элемент массива
   */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap)[]
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/element.t.ts
import type { AttrNodeElement } from "./index.t"
import type { Attributes } from "../attribute/index.t"
import type { NodeType } from "./index.t"

/**
 * Узел HTML элемента в AST.
 * Представляет HTML тег с атрибутами и дочерними элементами.
 *
 * @group Nodes
 * @example
 * ```html
 * <div class="container" id="main">
 *   <h1>Заголовок</h1>
 *   <p>Текст</p>
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "string": {
 *     "class": "container",
 *     "id": "main"
 *   },
 *   "child": [
 *     {
 *       "tag": "h1",
 *       "type": "el",
 *       "child": [
 *         {
 *           "type": "text",
 *           "value": "Заголовок"
 *         }
 *       ]
 *     },
 *     {
 *       "tag": "p",
 *       "type": "el",
 *       "child": [
 *         {
 *           "type": "text",
 *           "value": "Текст"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `tag` - имя HTML тега
 * - `type` - всегда "el" для элементов
 * - `child` - массив дочерних узлов
 * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
 */
export interface NodeElement extends Attributes {
  /**
   * Имя HTML тега
   *
   * @example
   * ```typescript
   * tag: "div"
   * ```
   *
   * @example
   * ```typescript
   * tag: "button"
   * ```
   */
  tag: string
  /**
   * Тип узла - всегда "el" для элементов
   *
   * @example
   * ```typescript
   * type: "el"
   * ```
   */
  type: "el"
  /**
   * Дочерние узлы элемента (могут быть любого типа Node)
   *
   * @example
   * ```typescript
   * child: [
   *   { type: "text", value: "Привет" },
   *   { type: "text", data: "/fields/user/name" }
   * ]
   * ```
   */
  child?: NodeType[]
}
export interface PartAttrElement extends AttrNodeElement {
  /** Тип узла */
  type: "el"
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/index.t.ts
import type { NodeMap } from "./map.t"
import type { NodeText } from "./text.t"
import type { NodeElement } from "./element.t"
import type { NodeCondition } from "./condition.t"
import type { NodeLogical } from "./logical.t"
import type { NodeMeta } from "./meta.t"
import type { ValueType } from "../attribute/index.t"
import type { PartAttrMap } from "./map.t"
import type { PartAttrLogical } from "./logical.t"
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrMeta } from "./meta.t"
import type { PartText } from "./text.t"
import type { PartAttrElement } from "./element.t"

/**
 * Объединенный тип всех возможных узлов парсера.
 * Представляет любую структуру, которая может быть получена в результате парсинга HTML-шаблона.
 *
 * @group Nodes
 * @example Структура с различными типами узлов
 * ```html
 * <div class="container">
 *   <h1>${fields.title}</h1>
 *   ${context.isLoggedIn ?
 *     html`<span>Добро пожаловать!</span>` :
 *     html`<a href="/login">Войти</a>`
 *   }
 *   ${core.notifications.length > 0 && html`
 *     <ul>
 *       ${core.notifications.map(n => html`<li>${n.message}</li>`)}
 *     </ul>
 *   `}
 *   <meta-component mass="config" fields="userData">
 *     <p>Содержимое компонента</p>
 *   </meta-component>
 * </div>
 * ```
 *
 * Результат парсинга будет содержать:
 * - NodeElement для div, h1, span, a, ul, li, p
 * - NodeText для статического текста и динамических значений
 * - NodeCondition для тернарного оператора
 * - NodeLogical для логического оператора &&
 * - NodeMap для итерации по массиву
 * - NodeMeta для meta-component
 */
export type NodeType = NodeMap | NodeCondition | NodeLogical | NodeText | NodeElement | NodeMeta

export interface AttrNodeElement {
  /** Имя HTML тега */
  tag: string
  /** Тип узла */
  type: "meta" | "el"
  /** События (onclick, onchange, onsubmit и т.д.) */
  event?: Record<string, string>
  /** Булевые атрибуты (hidden, disabled, checked, readonly и т.д.) */
  boolean?: Record<string, { type: "dynamic" | "static"; value: boolean | string }>
  /** Массивы атрибутов (class, rel, ping и т.д.) */
  array?: Record<string, { value: string; type: ValueType }[]>
  /** Строковые атрибуты (id, title, alt, href и т.д.) */
  string?: Record<string, { type: ValueType; value: string }>
  /** Стили (CSS в виде строки или объекта) */
  style?: string
  /** Дочерние элементы (опционально) */
  child?: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical | PartText)[]
}

export type PartAttr = PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical | PartText
export type PartsAttr = PartAttr[]

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/logical.spec.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../index"

describe("логические операторы с условиями", () => {
  describe("&& &&", () => {
    type Context = { isAdmin: boolean }
    type Core = { user: { role: string } }
    let elements: Node[]

    beforeAll(() => {
      // prettier-ignore
      // #region parse
      elements = parse<{ isAdmin: boolean }, { user: { role: string } }>(({ html, fields, mass }) => html`
          <div>
            ${mass.user && fields.isAdmin && html`
              <div class="admin">Admin Panel</div>
            `}
          </div>
      `)
      // #endregion parse
    })

    it("data", () => {
      expect(elements).toEqual(
        // #region expect
        [
          {
            tag: "div",
            type: "el",
            child: [
              {
                type: "log",
                data: ["/mass/user", "/fields/isAdmin"],
                expr: "_[0] && _[1]",
                child: [
                  {
                    tag: "div",
                    type: "el",
                    string: {
                      class: "admin",
                    },
                    child: [
                      {
                        type: "text",
                        value: "Admin Panel",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]
        // #endregion expect
      )
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/logical.t.ts
import type { PartAttrMap } from "./map.t"
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrElement } from "./element.t"
import type { NodeType } from "./index.t"
import type { PartAttrMeta } from "./meta.t"

/**
 * Узел логического оператора в AST.
 * Представляет логический оператор && с условным отображением.
 *
 * @group Nodes
 * @example Простое логическое условие
 * ```html
 * <div>
 *   ${fields.isAdmin && html`<button>Админ-панель</button>`}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/fields/isAdmin",
 *       "child": [
 *         {
 *           "tag": "button",
 *           "type": "el",
 *           "child": [
 *             {
 *               "type": "text",
 *               "value": "Админ-панель"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Логическое условие с проверкой массива
 * ```html
 * <div>
 *   ${mass.notifications.length > 0 && html`
 *     <div class="notifications">
 *       ${mass.notifications.map(n => html`<div>${n.message}</div>`)}
 *     </div>
 *   `}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "log",
 *       "data": "/mass/notifications.length",
 *       "expr": "${[0]} > 0",
 *       "child": [
 *         {
 *           "tag": "div",
 *           "type": "el",
 *           "string": {
 *             "class": "notifications"
 *           },
 *           "child": [
 *             {
 *               "type": "map",
 *               "data": "/mass/notifications",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/message"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * ### Сложное логическое условие
 *
 * {@includeCode ./logical.spec.ts#parse}
 * {@includeCode ./logical.spec.ts#expect}
 *
 * Структура узла:
 * - `type` - всегда "log" для логических операторов
 * - `data` - путь(и) к данным для условия
 * - `expr` - выражение с индексами (если условие сложное)
 * - `child` - дочерние узлы, которые отображаются только если условие истинно
 */

export interface NodeLogical {
  /** Тип узла - всегда "log" для логических операторов */
  type: "log"
  /**
   * Путь(и) к данным для условия
   *
   * @example Простой путь
   * ```typescript
   * data: "/fields/isAdmin"
   * ```
   *
   * ---
   *
   * @example Массив путей
   * ```typescript
   * data: ["/fields/notifications", "/fields/count"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с индексами (если условие сложное)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' && ${[1]}.includes('delete')"
   * ```
   */
  expr?: string
  /** Дочерние узлы, которые отображаются только если условие истинно */
  child: NodeType[]
}
export type TokenLogicalOpen = { kind: "log-open"; expr: string }
export type PartAttrLogical = {
  /** Тип узла */
  type: "log"
  /** Исходный текст логического выражения */
  text: string
  /** Дочерние элементы, которые отображаются только если условие истинно */
  child: (PartAttrElement | PartAttrMeta | PartAttrCondition | PartAttrMap | PartAttrLogical)[]
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/map.t.ts
import type { PartAttrCondition } from "./condition.t"
import type { PartAttrElement } from "./element.t"
import type { NodeType } from "./index.t"
import type { PartAttrLogical } from "./logical.t"
import type { PartAttrMeta } from "./meta.t"
import type { PartText } from "./text.t"

/**
 * Узел map операции в AST.
 * Представляет итерацию по массиву данных с дочерними элементами.
 *
 * ### Примитивы
 * {@includeCode ./test/map/text.test.ts#itemValue}
 * {@includeCode ./test/map/text.test.ts#expectItemValue}
 *
 * ### Объекты
 * Могут быть как с деструктуризацией, так и без.
 * {@includeCode ./test/map/text.test.ts#objectValues}
 * {@includeCode ./test/map/text.test.ts#objectDestructValues}
 * {@includeCode ./test/map/text.test.ts#expectObjectValues}
 *
 * @example Итерация с индексом
 * ```html
 * <ul>
 *   ${mass.items.map((item, index) => html`
 *     <li class=${index % 2 === 0 ? 'even' : 'odd'}>
 *       ${index + 1}. ${item.name}
 *     </li>
 *   `)}
 * </ul>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "ul",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/mass/items",
 *       "child": [
 *         {
 *           "tag": "li",
 *           "type": "el",
 *           "string": {
 *             "class": {
 *               "data": ["index", "item.name"],
 *               "expr": "${[0]} % 2 === 0 ? 'even' : 'odd'"
 *             }
 *           },
 *           "child": [
 *             {
 *               "type": "text",
 *               "data": ["index", "item.name"],
 *               "expr": "${[0] + 1}. ${[1]}"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Вложенная итерация
 * ```html
 * <div>
 *   ${mass.categories.map(category => html`
 *     <section>
 *       <h1>${category.name}</h1>
 *       ${category.products.map(product => html`
 *         <div>${product.name}</div>
 *       `)}
 *     </section>
 *   `)}
 * </div>
 * ```
 *
 * Результат:
 * ```json
 * {
 *   "tag": "div",
 *   "type": "el",
 *   "child": [
 *     {
 *       "type": "map",
 *       "data": "/mass/categories",
 *       "child": [
 *         {
 *           "tag": "section",
 *           "type": "el",
 *           "child": [
 *             {
 *               "tag": "h1",
 *               "type": "el",
 *               "child": [
 *                 {
 *                   "type": "text",
 *                   "data": "[item]/name"
 *                 }
 *               ]
 *             },
 *             {
 *               "type": "map",
 *               "data": "[item]/products",
 *               "child": [
 *                 {
 *                   "tag": "div",
 *                   "type": "el",
 *                   "child": [
 *                     {
 *                       "type": "text",
 *                       "data": "[item]/name"
 *                     }
 *                   ]
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * Структура узла:
 * - `type` - всегда "map" для map операций
 * - `data` - путь к массиву данных для итерации
 * - `child` - дочерние узлы, которые будут повторены для каждого элемента массива
 * @group Nodes
 */

export interface NodeMap {
  /**
   * Тип узла - всегда "map" для map операций
   *
   * @example
   * ```typescript
   * type: "map"
   * ```
   */
  type: "map"
  /**
   * Путь к массиву данных для итерации
   *
   * @example Простой путь
   * ```typescript
   * data: "/fields/users"
   * ```
   *
   * @example Вложенный путь
   * ```typescript
   * data: "/mass/products"
   * ```
   */
  data: string
  /**
   * Дочерние узлы, которые будут повторены для каждого элемента массива
   *
   * @example
   * ```typescript
   * child: [
   *   {
   *     tag: "li",
   *     type: "el",
   *     child: [
   *       { type: "text", data: "[item]/name" }
   *     ]
   *   }
   * ]
   * ```
   */
  child: NodeType[]
}
/**
 * Информация о контексте map.
 */
export type ParseMapContext = {
  /** Путь map */
  path: string
  /** Параметры map */
  params: string[]
  /** Является ли это деструктуризацией */
  isDestructured: boolean
  /** Уровень map */
  level: number
}
export type TokenMapClose = { kind: "map-close" }
export type TokenMapOpen = { kind: "map-open"; sig: string }
export type PartAttrMap = {
  /** Тип узла */
  type: "map"
  /** Исходный текст map-выражения */
  text: string
  /** Дочерние элементы, повторяемые для каждого элемента коллекции */
  child: (PartAttrElement | PartText | PartAttrMap | PartAttrMeta | PartAttrCondition | PartAttrLogical)[]
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/meta.t.ts
import type { ValueStatic, ValueDynamic, ValueVariable } from "../parser.t"
import type { AttrNodeElement } from "./index.t"
import type { Attributes } from "../attribute/index.t"
import type { NodeType } from "./index.t"

/**
 * Мета-узел в AST.
 *
 * Представляет meta-элемент.
 * Поддерживает создание компонентов с динамическими именами тегов.
 *
 * @group Nodes
 * @example Статический мета-тег
 * ```html
 * <meta-component class="custom">
 *   <p>Содержимое компонента</p>
 * </meta-component>
 * ```
 *
 * @example Динамический мета-тег
 * ```html
 * <meta-${mass.actorHash} class="dynamic">
 *   <p>Динамический компонент</p>
 * </meta-${mass.actorHash}>
 * ```
 *
 * @example Мета-элемент с mass и fields
 * ```html
 * <meta-widget mass=${mass.widgetConfig} fields=${mass.userData}>
 *   <div>Виджет с конфигурацией</div>
 * </meta-widget>
 * ```
 *
 * Структура узла:
 * - `type` - всегда "meta" для мета-узлов
 * - `tag` - имя мета-тега (статическое или динамическое)
 * - `child` - дочерние элементы (опционально)
 * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
 * - Свойства: `mass`, `fields`
 */

export interface NodeMeta extends Attributes {
  /** Имя мета-тега (может быть статическим или динамическим) */
  tag: ValueStatic | ValueDynamic | ValueVariable
  /** Тип узла - всегда "meta" для мета-узлов */
  type: "meta"
  /** Дочерние элементы (опционально) */
  child?: NodeType[]
  /** mass свойство для meta-компонентов (передача mass объекта) */
  mass?: ValueStatic | ValueDynamic | ValueVariable
  /** fields свойство для meta-компонентов (передача fields объекта) */
  fields?: ValueStatic | ValueDynamic | ValueVariable
}
export interface PartAttrMeta extends AttrNodeElement {
  /** Тип узла */
  type: "meta"
  /** mass объекты */
  mass?: string
  /** fields объекты */
  fields?: string
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/meta.ts
import type { PartAttrMeta } from "./meta.t"
import { processBasicAttributes, processSemanticAttributes, processTemplateLiteralAttribute } from "../parser"
import { createNode } from "."
import type { ParseContext } from "../parser.t"
import type { NodeMeta } from "./meta.t"

/** Создает NodeMeta из PartMeta. */
export const createNodeDataMeta = (
  node: PartAttrMeta,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeMeta => {
  const processed = processTemplateLiteralAttribute(node.tag, context)
  let result: NodeMeta = {
    tag: processed || node.tag,
    type: "meta",
    // Обрабатываем базовые атрибуты
    ...processBasicAttributes(node, context),
    // Добавляем дочерние элементы, если они есть
    ...(node.child && { child: node.child.map((child) => createNode(child, context)) }),
  }
  // Обрабатываем семантические атрибуты
  if ("mass" in node && node.mass) {
    result.mass = processSemanticAttributes(node.mass, context) || node.mass
  }
  if ("fields" in node && node.fields) {
    result.fields = processSemanticAttributes(node.fields, context) || node.fields
  }
  return result
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/cond/conditions.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("conditions", () => {
  describe("тернарник с внутренними тегами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, fields }) => html` <div>${fields.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/cond",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "A",
                    },
                  ],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "b",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("простой тернарный оператор с context с оберткой и соседними элементами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, fields }) => html`
          <div>
            <header>Header</header>
            ${fields.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
            <footer>Footer</footer>
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements, "простой тернарный оператор с context с оберткой и соседними элементами").toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "header",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Header",
                },
              ],
            },
            {
              type: "cond",
              data: "/fields/isActive",
              child: [
                {
                  tag: "span",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Active",
                    },
                  ],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Inactive",
                    },
                  ],
                },
              ],
            },
            {
              tag: "footer",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Footer",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сравнение нескольких переменных", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, fields }) =>
          html`<div>${fields.cond && fields.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/fields/cond", "/fields/cond2"],
              expr: "_[0] && _[1]",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", value: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [{ type: "text", value: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сравнение переменных на равенство", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, fields }) => html`
          <div>${fields.cond === fields.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/fields/cond", "/fields/cond2"],
              expr: "_[0] === _[1]",
              child: [
                {
                  tag: "em",
                  type: "el",
                  child: [{ type: "text", value: "A" }],
                },
                {
                  tag: "span",
                  type: "el",
                  child: [{ type: "text", value: "b" }],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логические операторы без тегов", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ a: number; b: number; c: number; d: number }>(
        ({ html, fields }) => html`${fields.a < fields.b && fields.c > fields.d ? "1" : "0"}`
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          type: "text",
          data: ["/fields/a", "/fields/b", "/fields/c", "/fields/d"],
          expr: '${_[0] < _[1] && _[2] > _[3] ? "1" : "0"}',
        },
      ])
    })
  })

  describe("условие вокруг self/void", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html, fields }) => html`<div>${fields.flag ? html`<br />` : html`<img src="x" />`}</div>`)
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/flag",
              child: [
                {
                  tag: "br",
                  type: "el",
                },
                {
                  tag: "img",
                  type: "el",
                  string: {
                    src: "x",
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("condition внутри map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { items: { show: boolean }[] }>(
        ({ html, mass }) => html`
          <div>
            ${mass.items.map((item) =>
              item.show ? html`<div class="true-branch"></div>` : html`<div class="false-branch"></div>`
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  type: "cond",
                  data: "[item]/show",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "true-branch",
                      },
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "false-branch",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map + условия", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, fields }) => html`
          <ul>
            ${fields.list.map(
              (_, i) => html` <li>${i % 2 ? html` <em>${"A"}</em> ` : html` <strong>${"B"}</strong>`}</li> `
            )}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/fields/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "cond",
                      data: "[index]",
                      expr: "_[0] % 2",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              value: "A",
                            },
                          ],
                        },
                        {
                          tag: "strong",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              value: "B",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("операторы сравнения — без тегов", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ a: number; b: number; c: number; d: number }>(
        ({ html, fields }) => html`${fields.a < fields.b && fields.c > fields.d ? "1" : "0"}`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "text",
          data: ["/fields/a", "/fields/b", "/fields/c", "/fields/d"],
          expr: '${_[0] < _[1] && _[2] > _[3] ? "1" : "0"}',
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/cond/formatting.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("formatting", () => {
  describe("форматирует тернарные выражения, удаляя лишние пробелы и переносы строк", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { flag: boolean }>(
        ({ html, fields }) => html`
          <div>
            <span class="${fields.flag ? "active" : "inactive"}">
              Status: ${fields.flag ? "Active" : "Inactive"}</span
            >
            <p class="${fields.flag && fields.flag ? "double-active" : "not-active"}">
              ${fields.flag ? "This is a very long text that should be formatted properly" : "Short text"}
            </p>
          </div>
        `
      )
    })
    it("проверяет структуру данных", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement).toBeDefined()
    })

    it("span element class attr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class).toBeDefined()
    })

    it("span element class expr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      expect(spanElement?.string?.class?.expr).toBe('${_[0] ? "active" : "inactive"}')
    })

    it("span text type", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText).toHaveProperty("type", "text")
    })

    it("span text expr", () => {
      const divElement = elements[0] as any
      const spanElement = divElement?.child?.[0] as any
      const spanText = spanElement?.child?.[0] as any
      expect(spanText?.expr).toBe('Status: ${_[0] ? "Active" : "Inactive"}')
    })

    it("p element tag", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement).toHaveProperty("tag", "p")
    })

    it("p element class attr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class).toBeDefined()
    })

    it("p element class expr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      expect(pElement?.string?.class?.expr).toBe('${_[0] && _[0] ? "double-active" : "not-active"}')
    })

    it("p text type", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText).toHaveProperty("type", "text")
    })

    it("p text expr", () => {
      const divElement = elements[0] as any
      const pElement = divElement?.child?.[1] as any
      const pText = pElement?.child?.[0] as any
      expect(pText?.expr).toBe(`\${_[0] ? "This is a very long text that should be formatted properly" : "Short text"}`)
    })
  })

  describe("форматирует атрибуты с условными выражениями", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { theme: string; size: string }>(
        ({ html, fields }) => html`
          <div>
            <button class="btn ${fields.theme === "dark" ? "btn-dark" : "btn-light"} ${fields.size || "medium"}">
              Click me
            </button>
            <input
              type="text"
              class="input ${fields.theme === "dark" ? "input-dark" : "input-light"}"
              placeholder="${fields.size === "large" ? "Enter large text here" : "Enter text here"}" />
          </div>
        `
      )
    })

    it("проверяет структуру данных", () => {
      const divElement = elements[0] as any
      const buttonElement = divElement?.child?.[0] as any
      expect(buttonElement).toBeDefined()
    })

    it("форматирует условные классы в button", () => {
      const divElement = elements[0] as any
      const buttonElement = divElement?.child?.[0] as any
      expect(buttonElement?.array?.class).toBeDefined()
      expect(buttonElement?.array?.class?.[1]?.expr).toBe('${_[0] === "dark" ? "btn-dark" : "btn-light"}')
      expect(buttonElement?.array?.class?.[2]?.expr).toBe('${_[0] || "medium"}')
    })

    it("форматирует условные классы в input", () => {
      const divElement = elements[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.array?.class).toBeDefined()
      expect(inputElement?.array?.class?.[1]?.expr).toBe('${_[0] === "dark" ? "input-dark" : "input-light"}')
    })

    it("форматирует условный placeholder", () => {
      const divElement = elements[0] as any
      const inputElement = divElement?.child?.[1] as any
      expect(inputElement?.string?.placeholder?.expr).toBe(
        '${_[0] === "large" ? "Enter large text here" : "Enter text here"}'
      )
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/cond/logical.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("логические операторы в условиях", () => {
  describe("логический оператор с вложенными элементами в условии", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ showDetails: boolean }, { user: { name: string; isVerified: boolean } }>(
        ({ html, fields, mass }) => html`
          <div>
            ${mass.user && fields.showDetails
              ? html`
                  <div class="user-profile">
                    <h2>${mass.user.name}</h2>
                    ${mass.user.isVerified && html` <span class="verified-badge">VERIFIED</span> `}
                    <p>User details</p>
                  </div>
                `
              : html`
                  <div class="no-profile">
                    <p>No profile available</p>
                  </div>
                `}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/mass/user", "/fields/showDetails"],
              expr: "_[0] && _[1]",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user-profile",
                  },
                  child: [
                    {
                      tag: "h2",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "/mass/user/name",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "/mass/user/isVerified",
                      child: [
                        {
                          tag: "span",
                          type: "el",
                          string: {
                            class: "verified-badge",
                          },
                          child: [
                            {
                              type: "text",
                              value: "VERIFIED",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "User details",
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-profile",
                  },
                  child: [
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "No profile available",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сложный логический оператор в условии", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isAdmin: boolean }, { user: { role: string; isActive: boolean } }>(
        ({ html, fields, mass }) => html`
          <div>
            ${mass.user && mass.user.role === "admin" && fields.isAdmin
              ? html`
                  <div class="admin-dashboard">
                    <h1>Admin Dashboard</h1>
                    ${mass.user.isActive &&
                    html`
                      <div class="active-admin">
                        <span class="status">Active</span>
                        <button>Manage Users</button>
                      </div>
                    `}
                  </div>
                `
              : html`
                  <div class="user-dashboard">
                    <h1>User Dashboard</h1>
                    <p>Welcome, user!</p>
                  </div>
                `}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: ["/mass/user", "/mass/user/role", "/fields/isAdmin"],
              expr: '_[0] && _[1] === "admin" && _[2]',
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "admin-dashboard",
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Admin Dashboard",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "/mass/user/isActive",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "active-admin",
                          },
                          child: [
                            {
                              tag: "span",
                              type: "el",
                              string: {
                                class: "status",
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "Active",
                                },
                              ],
                            },
                            {
                              tag: "button",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  value: "Manage Users",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user-dashboard",
                  },
                  child: [
                    {
                      tag: "h1",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "User Dashboard",
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Welcome, user!",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/cond/nested.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("вложенные условия", () => {
  describe("if else if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { flag1: boolean; flag2: boolean }>(
        ({ html, fields }) => html`
          ${fields.flag1
            ? html`<div class="flag1"></div>`
            : fields.flag2
            ? html`<div class="flag2"></div>`
            : html`<div class="flag3"></div>`}
        `
      )
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          type: "cond",
          data: "/fields/flag1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "flag1",
              },
            },
            {
              type: "cond",
              data: "/fields/flag2",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "flag2",
                  },
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "flag3",
                  },
                },
              ],
            },
          ],
        },
      ]))
  })
  describe("if if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { hasPermission: boolean; isAdmin: boolean }>(
        ({ html, fields }) => html`
          <div>
            ${fields.hasPermission
              ? fields.isAdmin
                ? html`
                    <div>
                      <button class="admin">Admin Action</button>
                    </div>
                  `
                : html`
                    <div>
                      <button class="user">User Action</button>
                    </div>
                  `
              : html`<div class="no-access">Access Denied</div>`}
          </div>
        `
      )
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/hasPermission",
              child: [
                {
                  type: "cond",
                  data: "/fields/isAdmin",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          string: {
                            class: "admin",
                          },
                          child: [{ type: "text", value: "Admin Action" }],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      child: [
                        {
                          tag: "button",
                          type: "el",
                          string: {
                            class: "user",
                          },
                          child: [{ type: "text", value: "User Action" }],
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-access",
                  },
                  child: [{ type: "text", value: "Access Denied" }],
                },
              ],
            },
          ],
        },
      ]))
  })

  describe("if if if", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { hasPermission: boolean; isAdmin: boolean; isSuperAdmin: boolean }>(
        ({ html, fields }) => html`
          <div>
            ${fields.hasPermission
              ? fields.isAdmin
                ? fields.isSuperAdmin
                  ? html`<div class="super-admin">Super Admin Panel</div>`
                  : html`<div class="admin">Admin Panel</div>`
                : html`<div class="user">User Panel</div>`
              : html`<div class="no-access">Access Denied</div>`}
          </div>
        `
      )
    })
    it("data", () =>
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/hasPermission",
              child: [
                {
                  type: "cond",
                  data: "/fields/isAdmin",
                  child: [
                    {
                      type: "cond",
                      data: "/fields/isSuperAdmin",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "super-admin",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Super Admin Panel",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "admin",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Admin Panel",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "user",
                      },
                      child: [
                        {
                          type: "text",
                          value: "User Panel",
                        },
                      ],
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "no-access",
                  },
                  child: [
                    {
                      type: "text",
                      value: "Access Denied",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]))
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/cond/sibling.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("условия соседствующие", () => {
  describe("условие соседствующее с условием на верхнем уровне", () => {
    type Context = {
      flag1: boolean
      flag2: boolean
    }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ flag1: boolean; flag2: boolean }, {}>(
        ({ html, fields }) => html`
          ${fields.flag1
            ? html`<div class="conditional1">Content 1</div>`
            : html`<div class="fallback1">No content 1</div>`}
          ${fields.flag2
            ? html`<div class="conditional2">Content 2</div>`
            : html`<div class="fallback2">No content 2</div>`}
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "cond",
          data: "/fields/flag1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "conditional1",
              },
              child: [
                {
                  type: "text",
                  value: "Content 1",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              string: {
                class: "fallback1",
              },
              child: [
                {
                  type: "text",
                  value: "No content 1",
                },
              ],
            },
          ],
        },
        {
          type: "cond",
          data: "/fields/flag2",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "conditional2",
              },
              child: [
                {
                  type: "text",
                  value: "Content 2",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              string: {
                class: "fallback2",
              },
              child: [
                {
                  type: "text",
                  value: "No content 2",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("условие соседствующее с условием внутри элемента", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ flag1: boolean; flag2: boolean }, {}>(
        ({ html, fields }) => html`
          <div class="container">
            ${fields.flag1
              ? html`<div class="conditional1">Content 1</div>`
              : html`<div class="fallback1">No content 1</div>`}
            ${fields.flag2
              ? html`<div class="conditional2">Content 2</div>`
              : html`<div class="fallback2">No content 2</div>`}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: "container",
          },
          child: [
            {
              type: "cond",
              data: "/fields/flag1",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "conditional1",
                  },
                  child: [
                    {
                      type: "text",
                      value: "Content 1",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "fallback1",
                  },
                  child: [
                    {
                      type: "text",
                      value: "No content 1",
                    },
                  ],
                },
              ],
            },
            {
              type: "cond",
              data: "/fields/flag2",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "conditional2",
                  },
                  child: [
                    {
                      type: "text",
                      value: "Content 2",
                    },
                  ],
                },
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "fallback2",
                  },
                  child: [
                    {
                      type: "text",
                      value: "No content 2",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("условие соседствующее с условием на глубоком уровне вложенности", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ flag1: boolean; flag2: boolean; flag3: boolean }, {}>(
        ({ html, fields }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${fields.flag1
                  ? html`<div class="conditional1">Content 1</div>`
                  : html`<div class="fallback1">No content 1</div>`}
                ${fields.flag2
                  ? html`<div class="conditional2">Content 2</div>`
                  : html`<div class="fallback2">No content 2</div>`}
                ${fields.flag3
                  ? html`<div class="conditional3">Content 3</div>`
                  : html`<div class="fallback3">No content 3</div>`}
              </div>
            </div>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: "level1",
          },
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "level2",
              },
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "level3",
                  },
                  child: [
                    {
                      type: "cond",
                      data: "/fields/flag1",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "conditional1",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Content 1",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "fallback1",
                          },
                          child: [
                            {
                              type: "text",
                              value: "No content 1",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "cond",
                      data: "/fields/flag2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "conditional2",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Content 2",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "fallback2",
                          },
                          child: [
                            {
                              type: "text",
                              value: "No content 2",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "cond",
                      data: "/fields/flag3",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "conditional3",
                          },
                          child: [
                            {
                              type: "text",
                              value: "Content 3",
                            },
                          ],
                        },
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "fallback3",
                          },
                          child: [
                            {
                              type: "text",
                              value: "No content 3",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/data.spec.ts
import { describe, it, expect } from "bun:test"
import { parseCondition, enrichWithData } from "../../parser"
import { extractMapParams, parseMap } from "../map"
import { splitText } from "../text"
import { parseText } from "../text"

describe("data-parser", () => {
  describe("parseMap", () => {
    it("парсит простой map с одним параметром", () => {
      const result = parseMap("fields.list.map((name) => html`")
      expect(result.path).toBe("/fields/list")
      expect(result.metadata?.params).toEqual(["name"])
    })

    it("парсит map с деструктуризацией", () => {
      const result = parseMap("mass.data.map(({ title, nested }) => html`")
      expect(result.path).toBe("/mass/data")
      expect(result.metadata?.params).toEqual(["title", "nested"])
    })

    it("парсит map с несколькими параметрами", () => {
      const result = parseMap("items.map((item, index) => html`")
      expect(result.path).toBe("/items")
      expect(result.metadata?.params).toEqual(["item", "index"])
    })

    it("парсит вложенный map в контексте", () => {
      const context = { currentPath: "/mass/list", pathStack: ["/mass/list"], level: 1, mapParams: ["item"] }
      const result = parseMap("nested.map((n) => html`", context)
      expect(result.path).toBe("[item]/nested")
      expect(result.metadata?.params).toEqual(["n"])
    })

    it("парсит вложенный map с полным путем", () => {
      const context = { currentPath: "/mass/list", pathStack: ["/mass/list"], level: 1, mapParams: ["item"] }
      const result = parseMap("item.nested.map((n) => html`", context)
      expect(result.path).toBe("[item]/nested")
    })
  })

  describe("extractMapParams", () => {
    it("парсит простой параметр", () => {
      const { params, isDestructured } = extractMapParams("name")
      expect(params).toEqual(["name"])
      expect(isDestructured).toBe(false)
    })

    it("парсит несколько параметров", () => {
      const { params, isDestructured } = extractMapParams("item, index")
      expect(params).toEqual(["item", "index"])
      expect(isDestructured).toBe(false)
    })

    it("парсит деструктуризацию", () => {
      const { params, isDestructured } = extractMapParams("{ title, nested }")
      expect(params).toEqual(["title", "nested"])
      expect(isDestructured).toBe(true)
    })

    it("парсит деструктуризацию с пробелами", () => {
      const { params, isDestructured } = extractMapParams("{ title , nested }")
      expect(params).toEqual(["title", "nested"])
      expect(isDestructured).toBe(true)
    })

    it("возвращает пустой массив для пустых параметров", () => {
      const { params, isDestructured } = extractMapParams("")
      expect(params).toEqual([])
      expect(isDestructured).toBe(false)
    })
  })

  describe("parseCondition", () => {
    it("парсит простое условие", () => {
      const result = parseCondition("fields.flag")
      expect(result.path).toBe("/fields/flag")
      expect(result.metadata?.expression).toBe("_[0]")
    })

    it("парсит сложное условие", () => {
      const result = parseCondition("fields.cond && fields.cond2")
      expect(result.path).toEqual(["/fields/cond", "/fields/cond2"])
      expect(result.metadata?.expression).toBe("_[0] && _[1]")
    })

    it("парсит условие с операторами", () => {
      const result = parseCondition("fields.flag === fields.cond2")
      expect(result.path).toEqual(["/fields/flag", "/fields/cond2"])
      expect(result.metadata?.expression).toBe("_[0] === _[1]")
    })
  })

  describe("parseText", () => {
    it("парсит статический текст", () => {
      const result = parseText("Hello, world!")
      expect(result.value).toBe("Hello, world!")
      expect(result.data).toBeUndefined()
      expect(result.expr).toBeUndefined()
    })

    it("парсит текст с одной переменной", () => {
      const result = parseText("Hello, ${name}!")
      expect(result.data).toBe("/name")
      expect(result.expr).toBe("Hello, ${_[0]}!")
      expect(result.value).toBeUndefined()
    })

    it("парсит текст с переменной в контексте map", () => {
      const context = { currentPath: "/fields/list", pathStack: ["/fields/list"], level: 1, mapParams: ["name"] }
      const result = parseText("Hello, ${name}!", context)
      expect(result.data).toBe("[item]")
      expect(result.expr).toBe("Hello, ${_[0]}!")
      expect(result.value).toBeUndefined()
    })

    it("парсит текст с несколькими переменными", () => {
      const result = parseText("${title} - ${description}")
      expect(result.data).toEqual(["/title", "/description"])
      expect(result.expr).toBe("${_[0]} - ${_[1]}")
      expect(result.value).toBeUndefined()
    })
  })

  describe("splitText", () => {
    it("разбивает статический текст", () => {
      const parts = splitText("Hello, world!")
      expect(parts).toEqual([{ type: "static", text: "Hello, world!" }])
    })

    it("разбивает текст с одной переменной", () => {
      const parts = splitText("Hello, ${name}!")
      expect(parts).toEqual([
        { type: "static", text: "Hello, " },
        { type: "dynamic", text: "${name}" },
        { type: "static", text: "!" },
      ])
    })

    it("разбивает текст с несколькими переменными", () => {
      const parts = splitText("${title} - ${description}")
      expect(parts).toEqual([
        { type: "dynamic", text: "${title}" },
        { type: "static", text: " - " },
        { type: "dynamic", text: "${description}" },
      ])
    })

    it("разбивает текст с переменной в начале", () => {
      const parts = splitText("${name} is here")
      expect(parts).toEqual([
        { type: "dynamic", text: "${name}" },
        { type: "static", text: " is here" },
      ])
    })

    it("разбивает текст с переменной в конце", () => {
      const parts = splitText("Hello, ${name}")
      expect(parts).toEqual([
        { type: "static", text: "Hello, " },
        { type: "dynamic", text: "${name}" },
      ])
    })
  })

  describe("enrichWithData", () => {
    it("обогащает простую иерархию", () => {
      const enriched = enrichWithData([
        {
          type: "el",
          tag: "div",
          child: [
            {
              type: "text",
              text: "Hello, ${name}!",
            },
          ],
        },
      ])
      expect(enriched[0]?.type).toBe("el")
      const element = enriched[0] as any
      expect(element.child?.[0]?.type).toBe("text")
      expect(element.child?.[0]?.data).toBe("/name")
    })

    it("обогащает иерархию с map", () => {
      const enriched = enrichWithData([
        {
          type: "map",
          text: "fields.list.map((name) => html`",
          child: [
            {
              type: "el",
              tag: "li",
              child: [
                {
                  type: "text",
                  text: "${name}",
                },
              ],
            },
          ],
        },
      ])
      expect(enriched[0]?.type).toBe("map")
      const mapNode = enriched[0] as any
      expect(mapNode.data).toBe("/fields/list")
      expect(mapNode.child?.[0]?.child?.[0]?.data).toBe("[item]")
    })

    it("обогащает иерархию с условием", () => {
      const enriched = enrichWithData([
        {
          type: "cond",
          text: "fields.flag",
          child: [
            { type: "el", tag: "div", child: [] },
            { type: "el", tag: "span", child: [] },
          ],
        },
      ])
      expect(enriched[0]?.type).toBe("cond")
      const condNode = enriched[0] as any
      expect(condNode.data).toBe("/fields/flag")
      expect(condNode.expr).toBeUndefined()
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/logical/logical.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("логические операторы", () => {
  describe("простой логический оператор &&", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ error: string }>(
        ({ html, fields }) => html` <div>${fields.error && html`<span class="error">${fields.error}</span>`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/fields/error",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: "error",
                  },
                  child: [
                    {
                      type: "text",
                      data: "/fields/error",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с вложенными элементами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { user: { name: string; avatar: string } }>(
        ({ html, mass }) => html`
          <div>
            ${mass.user &&
            html`
              <div class="user">
                <img src="${mass.user.avatar}" alt="${mass.user.name}" />
                <span>${mass.user.name}</span>
              </div>
            `}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/mass/user",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user",
                  },
                  child: [
                    {
                      tag: "img",
                      type: "el",
                      string: {
                        src: {
                          data: "/mass/user/avatar",
                        },
                        alt: {
                          data: "/mass/user/name",
                        },
                      },
                    },
                    {
                      tag: "span",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "/mass/user/name",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с булевым условием", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isVisible: boolean; message: string }>(
        ({ html, fields }) => html` <div>${fields.isVisible && html`<p>${fields.message}</p>`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/fields/isVisible",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "/fields/message",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с самозакрывающимся тегом", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ hasError: boolean }>(
        ({ html, fields }) => html` <div>${fields.hasError && html`<br />`}</div> `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "log",
              data: "/fields/hasError",
              child: [
                {
                  tag: "br",
                  type: "el",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/map/logical.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("логические операторы в map", () => {
  describe("простой логический оператор в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { users: Array<{ name: string; hasAvatar: boolean }> }>(
        ({ html, mass }) => html`
          <div>
            ${mass.users.map(
              (user) => html`
                <div class="user">
                  ${user.hasAvatar && html`<img src="/avatar/${user.name}.jpg" alt="${user.name}" />`}
                  <span>${user.name}</span>
                </div>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/users",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "user",
                  },
                  child: [
                    {
                      type: "log",
                      data: "[item]/hasAvatar",
                      child: [
                        {
                          tag: "img",
                          type: "el",
                          string: {
                            src: {
                              data: "[item]/name",
                              expr: "/avatar/${_[0]}.jpg",
                            },
                            alt: {
                              data: "[item]/name",
                            },
                          },
                        },
                      ],
                    },
                    {
                      tag: "span",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с вложенными элементами в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { posts: Array<{ title: string; author: { name: string; isVerified: boolean } }> }>(
        ({ html, mass }) => html`
          <div>
            ${mass.posts.map(
              (post) => html`
                <article class="post">
                  <h2>${post.title}</h2>
                  ${post.author.isVerified &&
                  html`
                    <div class="author-verified">
                      <span class="verified-badge">VERIFIED</span>
                      <span>${post.author.name}</span>
                    </div>
                  `}
                </article>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/posts",
              child: [
                {
                  tag: "article",
                  type: "el",
                  string: {
                    class: "post",
                  },
                  child: [
                    {
                      tag: "h2",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "[item]/author/isVerified",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "author-verified",
                          },
                          child: [
                            {
                              tag: "span",
                              type: "el",
                              string: {
                                class: "verified-badge",
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "VERIFIED",
                                },
                              ],
                            },
                            {
                              tag: "span",
                              type: "el",
                              child: [
                                {
                                  type: "text",
                                  data: "[item]/author/name",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с самозакрывающимся тегом в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { items: Array<{ name: string; isNew: boolean }> }>(
        ({ html, mass }) => html`
          <ul>
            ${mass.items.map(
              (item) => html`
                <li class="item">
                  ${item.isNew && html`<span class="new-badge">NEW</span>`}
                  <span>${item.name}</span>
                </li>
              `
            )}
          </ul>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: "li",
                  type: "el",
                  string: {
                    class: "item",
                  },
                  child: [
                    {
                      type: "log",
                      data: "[item]/isNew",
                      child: [
                        {
                          tag: "span",
                          type: "el",
                          string: {
                            class: "new-badge",
                          },
                          child: [
                            {
                              type: "text",
                              value: "NEW",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "span",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сложный логический оператор в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        { showDetails: boolean },
        { products: Array<{ name: string; price: number; inStock: boolean }> }
      >(
        ({ html, mass, fields }) => html`
          <div>
            ${mass.products.map(
              (product) => html`
                <div class="product">
                  <h3>${product.name}</h3>
                  <p class="price">$${product.price}</p>
                  ${product.inStock &&
                  fields.showDetails &&
                  html`
                    <div class="product-details">
                      <span class="stock-status">In Stock</span>
                      <button class="add-to-cart">Add to Cart</button>
                    </div>
                  `}
                </div>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/products",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "product",
                  },
                  child: [
                    {
                      tag: "h3",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      string: {
                        class: "price",
                      },
                      child: [
                        {
                          type: "text",
                          data: "[item]/price",
                          expr: "$${_[0]}",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: ["[item]/inStock", "[item]/fields/showDetails"],
                      expr: "_[0] && _[1]",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          string: {
                            class: "product-details",
                          },
                          child: [
                            {
                              tag: "span",
                              type: "el",
                              string: {
                                class: "stock-status",
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "In Stock",
                                },
                              ],
                            },
                            {
                              tag: "button",
                              type: "el",
                              string: {
                                class: "add-to-cart",
                              },
                              child: [
                                {
                                  type: "text",
                                  value: "Add to Cart",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с простым условием в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{}, { notifications: Array<{ message: string; isImportant: boolean }> }>(
        ({ html, mass }) => html`
          <div>
            ${mass.notifications.map(
              (notification) => html`
                <div class="notification">
                  ${notification.isImportant && html`<span class="important">!</span>`}
                  <span class="message">${notification.message}</span>
                </div>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/notifications",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "notification",
                  },
                  child: [
                    {
                      type: "log",
                      data: "[item]/isImportant",
                      child: [
                        {
                          tag: "span",
                          type: "el",
                          string: {
                            class: "important",
                          },
                          child: [
                            {
                              type: "text",
                              value: "!",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tag: "span",
                      type: "el",
                      string: {
                        class: "message",
                      },
                      child: [
                        {
                          type: "text",
                          data: "[item]/message",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("логический оператор с вложенным map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<
        {},
        { categories: Array<{ name: string; hasSubcategories: boolean; subcategories: Array<{ name: string }> }> }
      >(
        ({ html, mass }) => html`
          <div>
            ${mass.categories.map(
              (category) => html`
                <div class="category">
                  <h2>${category.name}</h2>
                  ${category.hasSubcategories &&
                  html`
                    <ul class="subcategories">
                      ${category.subcategories.map((sub) => html` <li>${sub.name}</li> `)}
                    </ul>
                  `}
                </div>
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/categories",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "category",
                  },
                  child: [
                    {
                      tag: "h2",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/name",
                        },
                      ],
                    },
                    {
                      type: "log",
                      data: "[item]/hasSubcategories",
                      child: [
                        {
                          tag: "ul",
                          type: "el",
                          string: {
                            class: "subcategories",
                          },
                          child: [
                            {
                              type: "map",
                              data: "[item]/subcategories",
                              child: [
                                {
                                  tag: "li",
                                  type: "el",
                                  child: [
                                    {
                                      type: "text",
                                      data: "[item]/name",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/map/map.cond.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map с условиями", () => {
  describe("map соседствующий с map в условии на верхнем уровне", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
        ({ html, fields, mass }) => html`
          ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
          ${fields.flag
            ? html`<div class="conditional">
                ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
              </div>`
            : html`<div class="fallback">No items</div>`}
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "map",
          data: "/mass/list1",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "item1",
              },
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
        {
          type: "cond",
          data: "/fields/flag",
          child: [
            {
              tag: "div",
              type: "el",
              string: {
                class: "conditional",
              },
              child: [
                {
                  type: "map",
                  data: "/mass/list2",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: "item2",
                      },
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              string: {
                class: "fallback",
              },
              child: [
                {
                  type: "text",
                  value: "No items",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map соседствующий с map в условии внутри элемента", () => {
    type Context = {
      flag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
        ({ html, fields, mass }) => html`
          <div class="container">
            ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
            ${fields.flag
              ? html`<div class="conditional">
                  ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                </div>`
              : html`<div class="fallback">No items</div>`}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/list1",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                  ],
                  string: {
                    class: "item1",
                  },
                },
              ],
            },
            {
              type: "cond",
              data: "/fields/flag",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "/mass/list2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item2",
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    class: "conditional",
                  },
                },
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "No items",
                    },
                  ],
                  string: {
                    class: "fallback",
                  },
                },
              ],
            },
          ],
          string: {
            class: "container",
          },
        },
      ])
    })
  })

  describe("map соседствующий с map в условии на глубоком уровне вложенности", () => {
    type Context = {
      flag: boolean
      deepFlag: boolean
    }
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<Context, Core>(
        ({ html, fields, mass }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
                ${fields.flag
                  ? html`<div class="conditional">
                      ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                      ${fields.deepFlag
                        ? html`<div class="deep-conditional">
                            ${mass.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
                          </div>`
                        : html`<div class="deep-fallback">No deep items</div>`}
                    </div>`
                  : html`<div class="fallback">No items</div>`}
              </div>
            </div>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "/mass/list1",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item1",
                          },
                        },
                      ],
                    },
                    {
                      type: "cond",
                      data: "/fields/flag",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "map",
                              data: "/mass/list2",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  child: [
                                    {
                                      type: "text",
                                      data: "[item]/title",
                                    },
                                  ],
                                  string: {
                                    class: "item2",
                                  },
                                },
                              ],
                            },
                            {
                              type: "cond",
                              data: "/fields/deepFlag",
                              child: [
                                {
                                  tag: "div",
                                  type: "el",
                                  child: [
                                    {
                                      type: "map",
                                      data: "/mass/list3",
                                      child: [
                                        {
                                          tag: "div",
                                          type: "el",
                                          child: [
                                            {
                                              type: "text",
                                              data: "[item]/title",
                                            },
                                          ],
                                          string: {
                                            class: "item3",
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                  string: {
                                    class: "deep-conditional",
                                  },
                                },
                                {
                                  tag: "div",
                                  type: "el",
                                  child: [
                                    {
                                      type: "text",
                                      value: "No deep items",
                                    },
                                  ],
                                  string: {
                                    class: "deep-fallback",
                                  },
                                },
                              ],
                            },
                          ],
                          string: {
                            class: "conditional",
                          },
                        },
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              value: "No items",
                            },
                          ],
                          string: {
                            class: "fallback",
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    class: "level3",
                  },
                },
              ],
              string: {
                class: "level2",
              },
            },
          ],
          string: {
            class: "level1",
          },
        },
      ])
    })
  })

  describe("map внутри condition", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ show: boolean }, { items: string[] }>(
        ({ html, mass, fields }) => html`
          <div>
            ${fields.show
              ? html` ${mass.items.map((item) => html`<div class="true-${item}"></div>`)}`
              : html` ${mass.items.map((item) => html`<div class="false-${item}"></div>`)}`}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/show",
              child: [
                {
                  type: "map",
                  data: "/mass/items",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          data: "[item]",
                          expr: "true-${_[0]}",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "map",
                  data: "/mass/items",
                  child: [
                    {
                      tag: "div",
                      type: "el",
                      string: {
                        class: {
                          data: "[item]",
                          expr: "false-${_[0]}",
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/map/map.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map", () => {
  describe("простой map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, fields }) => html`
          <ul>
            ${fields.list.map((name) => html`<li>${name}</li>`)}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/fields/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("простой map с несколькими детьми", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        ({ html, fields }) => html`
          <ul>
            ${fields.list.map(
              (name) =>
                html`
                  <li>${name}</li>
                  <br />
                `
            )}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/fields/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
                {
                  tag: "br",
                  type: "el",
                },
              ],
            },
          ],
        },
      ])
    })
    describe("map в элементе вложенный в map", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<any, { list: { title: string; nested: string[] }[] }>(
          // prettier-ignore
          ({ html, mass }) => html`
          <ul>
            ${mass.list.map(
              ({ title, nested }) => html`
                <li>
                  <p>${title} </p>
                  ${nested.map((n) => html`<em>${n}</em>`)}
                </li>
              `
            )}
          </ul>
        `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/mass/list",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        tag: "p",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            data: "[item]/title",
                          },
                        ],
                      },
                      {
                        type: "map",
                        data: "[item]/nested",
                        child: [
                          {
                            tag: "em",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                data: "[item]",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ])
      })
    })
    describe("map с индексом", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ list: string[] }>(
          ({ html, fields }) => html`
            <ul>
              ${fields.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
            </ul>
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/fields/list",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        type: "cond",
                        data: "[index]",
                        expr: "_[0] % 2",
                        child: [
                          {
                            tag: "em",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                value: "A",
                              },
                            ],
                          },
                          {
                            tag: "strong",
                            type: "el",
                            child: [
                              {
                                type: "text",
                                value: "B",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ])
      })
    })
    describe("map в условии", () => {
      let elements: Node[]
      beforeAll(() => {
        elements = parse<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
          ({ html, mass, fields }) => html`
            ${fields.flag
              ? html`
                  <ul>
                    ${mass.list.map(
                      ({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`
                    )}
                  </ul>
                `
              : html`<div>x</div>`}
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            type: "cond",
            data: "/fields/flag",
            child: [
              {
                tag: "ul",
                type: "el",
                child: [
                  {
                    type: "map",
                    data: "/mass/list",
                    child: [
                      {
                        tag: "li",
                        type: "el",
                        child: [
                          {
                            type: "text",
                            data: "[item]/title",
                          },
                          {
                            type: "map",
                            data: "[item]/nested",
                            child: [
                              {
                                tag: "em",
                                type: "el",
                                child: [
                                  {
                                    type: "text",
                                    data: "[item]",
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tag: "div",
                type: "el",
                child: [
                  {
                    type: "text",
                    value: "x",
                  },
                ],
              },
            ],
          },
        ])
      })
    })
  })
  describe("map в text вложенный в map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { list: { title: string; nested: string[] }[] }>(
        ({ html, mass }) => html`
          <ul>
            ${mass.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/list",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/title",
                    },
                    {
                      type: "map",
                      data: "[item]/nested",
                      child: [
                        {
                          tag: "em",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/map/sibling.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("map соседствующие", () => {
  describe("map соседствующий с map на верхнем уровне", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
    }
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass }) => html`
          ${mass.list1.map(({ title }) => html` <div>${title}</div> `)}
          ${mass.list2.map(({ title }) => html` <div>${title}</div> `)}
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "map",
          data: "/mass/list1",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
        {
          type: "map",
          data: "/mass/list2",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "[item]/title",
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map соседствующий с map внутри элемента", () => {
    type Context = {
      categories: string[]
    }
    type Core = {
      items: {
        categoryId: number
        title: string
      }[]
    }
    let elements: Node[]
    beforeAll(() => {
      elements = parse<Context, Core>(
        ({ html, fields, mass }) => html`
          <div class="dashboard">
            ${fields.categories.map((cat) => html`<span class="category">${cat}</span>`)}
            ${mass.items.map(
              (item) => html`
                <div class="item" data-category="${item.categoryId}">
                  <h4>${item.title}</h4>
                </div>
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          string: {
            class: "dashboard",
          },
          child: [
            {
              type: "map",
              data: "/fields/categories",
              child: [
                {
                  tag: "span",
                  type: "el",
                  string: {
                    class: "category",
                  },
                  child: [
                    {
                      type: "text",
                      data: "[item]",
                    },
                  ],
                },
              ],
            },
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: "div",
                  type: "el",
                  string: {
                    class: "item",
                    "data-category": {
                      data: "[item]/categoryId",
                    },
                  },
                  child: [
                    {
                      tag: "h4",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: "[item]/title",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("map соседствующий с map на глубоком уровне вложенности", () => {
    type Core = {
      list1: { title: string }[]
      list2: { title: string }[]
      list3: { title: string }[]
    }
    let elements: Node[]
    beforeAll(() => {
      elements = parse<{}, { list1: { title: string }[]; list2: { title: string }[]; list3: { title: string }[] }>(
        ({ html, mass }) => html`
          <div class="level1">
            <div class="level2">
              <div class="level3">
                ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
                ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                ${mass.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
              </div>
            </div>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "div",
              type: "el",
              child: [
                {
                  tag: "div",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "/mass/list1",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item1",
                          },
                        },
                      ],
                    },
                    {
                      type: "map",
                      data: "/mass/list2",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item2",
                          },
                        },
                      ],
                    },
                    {
                      type: "map",
                      data: "/mass/list3",
                      child: [
                        {
                          tag: "div",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: "[item]/title",
                            },
                          ],
                          string: {
                            class: "item3",
                          },
                        },
                      ],
                    },
                  ],
                  string: {
                    class: "level3",
                  },
                },
              ],
              string: {
                class: "level2",
              },
            },
          ],
          string: {
            class: "level1",
          },
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/map/text.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("text", () => {
  describe("примитивы", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ list: string[] }>(
        // #region itemValue
        ({ html, fields }) => html`
          <ul>
            ${fields.list.map((name) => html`<li>${name}</li>`)}
          </ul>
        `
        // #endregion itemValue
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectItemValue
        [
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/fields/list",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: "[item]",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]
        // #endregion expectItemValue
      )
    })
  })

  describe("объекты без деструктуризации", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { configs: { name: string; value: string }[] }>(
        // #region objectValues
        ({ html, mass }) => html`
          <ul>
            ${mass.configs.map((config) => html`<li>${config.name} ${config.value}</li>`)}
          </ul>
        `
        // #endregion objectValues
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectObjectValues
        [
          {
            tag: "ul",
            type: "el",
            child: [
              {
                type: "map",
                data: "/mass/configs",
                child: [
                  {
                    tag: "li",
                    type: "el",
                    child: [
                      {
                        type: "text",
                        data: ["[item]/name", "[item]/value"],
                        expr: "${_[0]} ${_[1]}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]
        // #endregion expectObjectValues
      )
    })
  })
  describe("объекты с деструктуризацией", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { configs: { name: string; value: string }[] }>(
        // #region objectDestructValues
        ({ html, mass }) => html`
          <ul>
            ${mass.configs.map(({ name, value }) => html`<li>${name} ${value}</li>`)}
          </ul>
        `
        // #endregion objectDestructValues
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/configs",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/value"],
                      expr: "${_[0]} ${_[1]}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("вложенные объекты", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { posts: { author: { name: string; email: string } }[] }>(
        ({ html, mass }) => html`
          <div>${mass.posts.map((post) => html`<p>Author: ${post.author.name} (${post.author.email})</p>`)}</div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/posts",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/author/name", "[item]/author/email"],
                      expr: "Author: ${_[0]} (${_[1]})",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с условными выражениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { items: { name: string; isActive: boolean }[] }>(
        ({ html, mass }) => html`
          <ul>
            ${mass.items.map((item) => html`<li>${item.isActive ? item.name : "Inactive"}</li>`)}
          </ul>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "ul",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: "li",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/isActive", "[item]/name"],
                      expr: '${_[0] ? _[1] : "Inactive"}',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с вычислениями", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { products: { name: string; price: number; quantity: number }[] }>(
        ({ html, mass }) => html`
          <div>
            ${mass.products.map((product) => html`<p>${product.name}: $${product.price * product.quantity}</p>`)}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/products",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/price", "[item]/quantity"],
                      expr: "${_[0]}: $${_[1] * _[2]}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с методами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { users: { name: string; email: string }[] }>(
        ({ html, mass }) => html`
          <div>${mass.users.map((user) => html`<p>${user.name.toUpperCase()} - ${user.email.toLowerCase()}</p>`)}</div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/users",
              child: [
                {
                  tag: "p",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: ["[item]/name", "[item]/email"],
                      expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с вложенными map", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { categories: { name: string; products: { name: string; price: number }[] }[] }>(
        ({ html, mass }) => html`
          <div>
            ${mass.categories.map(
              (category) => html`
                <h2>${category.name}</h2>
                <ul>
                  ${category.products.map((product) => html`<li>${product.name} - $${product.price}</li>`)}
                </ul>
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/categories",
              child: [
                {
                  tag: "h2",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
                    },
                  ],
                },
                {
                  tag: "ul",
                  type: "el",
                  child: [
                    {
                      type: "map",
                      data: "[item]/products",
                      child: [
                        {
                          tag: "li",
                          type: "el",
                          child: [
                            {
                              type: "text",
                              data: ["[item]/name", "[item]/price"],
                              expr: "${_[0]} - $${_[1]}",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("динамический текст в map с условными элементами", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse<any, { items: { name: string; isVisible: boolean; description: string }[] }>(
        ({ html, mass }) => html`
          <div>
            ${mass.items.map(
              (item) => html`
                ${item.isVisible ? html`<p>${item.name}: ${item.description}</p>` : html`<p>Hidden item</p>`}
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  type: "cond",
                  data: "[item]/isVisible",
                  child: [
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          data: ["[item]/name", "[item]/description"],
                          expr: "${_[0]}: ${_[1]}",
                        },
                      ],
                    },
                    {
                      tag: "p",
                      type: "el",
                      child: [
                        {
                          type: "text",
                          value: "Hidden item",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/meta/attr.map.cond.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("meta-компоненты с fields/mass в map и condition", () => {
  describe("meta-элемент с пустыми объектами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html }) => html` <meta-hash fields=${{}} mass=${{}} /> `)
    })
    it("attributes", () => {
      expect(elements, "при обработке пустых объектов не должен устанавливаться mass и fields").toEqual([
        {
          tag: "meta-hash",
          type: "meta",
        },
      ])
    })
    it("data", () => {
      expect(elements, "fields и mass не должно быть в data").toEqual([
        {
          tag: "meta-hash",
          type: "meta",
        },
      ])
    })
  })
  describe("meta-компоненты в map с mass объектами", () => {
    type Core = { items: any[]; tag: string; type: string }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass, fields }) => html`
          <div>
            ${mass.items.map(
              (item) => html`
                <meta-${mass.tag}
                  mass=${{ id: item.id, name: item.name, type: mass.type }}
                  fields=${{ status: item.status, active: item.active }} />
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: {
                    data: "/mass/tag",
                    expr: "meta-${_[0]}",
                  },
                  type: "meta",
                  mass: {
                    data: ["[item]/id", "[item]/name", "/mass/type"],
                    expr: "{ id: _[0], name: _[1], type: _[2] }",
                  },
                  fields: {
                    data: ["[item]/status", "[item]/active"],
                    expr: "{ status: _[0], active: _[1] }",
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в condition с fields/mass объектами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass, fields }) => html`
          <div>
            ${fields.showMeta
              ? html`
                  <meta-${mass.tag}
                    mass=${{ id: fields.id, name: fields.name }}
                    fields=${{ type: "primary", active: true }} />
                `
              : html`
                  <meta-${mass.tag}
                    mass=${{ id: "default", name: "default" }}
                    fields=${{ type: "secondary", active: false }} />
                `}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/showMeta",
              child: [
                {
                  tag: {
                    data: "/mass/tag",
                    expr: "meta-${_[0]}",
                  },
                  type: "meta",
                  mass: {
                    data: ["/fields/id", "/fields/name"],
                    expr: "{ id: _[0], name: _[1] }",
                  },
                  fields: '{ type: "primary", active: true }',
                },
                {
                  tag: {
                    data: "/mass/tag",
                    expr: "meta-${_[0]}",
                  },
                  type: "meta",
                  mass: '{ id: "default", name: "default" }',
                  fields: '{ type: "secondary", active: false }',
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в map внутри condition", () => {
    type Core = { items: any[]; tag: string; type: string }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass, fields }) => html`
          <div>
            ${fields.showList
              ? html`
                  ${mass.items.map(
                    (item) => html`
                      <meta-${mass.tag}
                        mass=${{
                          id: item.id,
                          name: item.name,
                          type: mass.type,
                          metadata: item.metadata,
                        }}
                        fields=${{
                          status: item.status,
                          active: item.active,
                          permissions: item.permissions,
                        }} />
                    `
                  )}
                `
              : html`
                  <meta-${mass.tag}
                    mass=${{ id: "empty", name: "empty" }}
                    fields=${{ type: "empty", active: false }} />
                `}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "cond",
              data: "/fields/showList",
              child: [
                {
                  type: "map",
                  data: "/mass/items",
                  child: [
                    {
                      tag: {
                        data: "/mass/tag",
                        expr: "meta-${_[0]}",
                      },
                      type: "meta",
                      mass: {
                        data: ["[item]/id", "[item]/name", "/mass/type", "[item]/metadata"],
                        expr: "{ id: _[0], name: _[1], type: _[2], metadata: _[3] }",
                      },
                      fields: {
                        data: ["[item]/status", "[item]/active", "[item]/permissions"],
                        expr: "{ status: _[0], active: _[1], permissions: _[2] }",
                      },
                    },
                  ],
                },
                {
                  tag: {
                    data: "/mass/tag",
                    expr: "meta-${_[0]}",
                  },
                  type: "meta",
                  mass: '{ id: "empty", name: "empty" }',
                  fields: '{ type: "empty", active: false }',
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты в condition внутри map", () => {
    type Core = { items: any[]; tag: string }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass }) => html`
          <div>
            ${mass.items.map(
              (item) => html`
                ${item.isActive
                  ? html`
                      <meta-${mass.tag}
                        mass=${{
                          id: item.id,
                          name: item.name,
                          type: "active",
                        }}
                        fields=${{
                          status: "active",
                          permissions: item.permissions,
                        }} />
                    `
                  : item.hasError
                  ? html`
                      <meta-${mass.tag}
                        mass=${{
                          id: item.id,
                          name: item.name,
                          type: "error",
                        }}
                        fields=${{
                          status: "error",
                          message: "Item has error",
                        }} />
                    `
                  : html`
                      <meta-${mass.tag}
                        mass=${{ id: item.id, name: item.name, type: "inactive" }}
                        fields=${{ status: "inactive" }} />
                    `}
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  type: "cond",
                  data: "[item]/isActive",
                  child: [
                    {
                      tag: {
                        data: "/mass/tag",
                        expr: "meta-${_[0]}",
                      },
                      type: "meta",
                      mass: {
                        data: ["[item]/id", "[item]/name"],
                        expr: '{ id: _[0], name: _[1], type: "active" }',
                      },
                      fields: {
                        data: "[item]/permissions",
                        expr: '{ status: "active", permissions: _[0] }',
                      },
                    },
                    {
                      type: "cond",
                      data: "[item]/hasError",
                      child: [
                        {
                          tag: {
                            data: "/mass/tag",
                            expr: "meta-${_[0]}",
                          },
                          type: "meta",
                          mass: {
                            data: ["[item]/id", "[item]/name"],
                            expr: '{ id: _[0], name: _[1], type: "error" }',
                          },
                          fields: '{ status: "error", message: "Item has error" }',
                        },
                        {
                          tag: {
                            data: "/mass/tag",
                            expr: "meta-${_[0]}",
                          },
                          type: "meta",
                          mass: {
                            data: ["[item]/id", "[item]/name"],
                            expr: '{ id: _[0], name: _[1], type: "inactive" }',
                          },
                          fields: '{ status: "inactive" }',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("сложные meta-компоненты с вложенными fields/mass объектами", () => {
    type Core = { users: any[]; tag: string }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass }) => html`
          <div>
            ${mass.users.map(
              (user) => html`
                ${user.permissions.includes("admin")
                  ? html`<meta-${mass.tag}
                      mass=${{
                        id: user.id,
                        name: user.name,
                        type: "admin",
                        permissions: user.permissions,
                        metadata: {
                          level: "admin",
                          access: "full",
                          settings: user.settings,
                        },
                      }}
                      fields=${{
                        status: "admin",
                        active: user.isOnline,
                        canEdit: true,
                        canDelete: true,
                        canManage: true,
                      }} />`
                  : user.permissions.includes("moderator")
                  ? html`<meta-${mass.tag}
                      mass=${{
                        id: user.id,
                        name: user.name,
                        type: "moderator",
                        permissions: user.permissions,
                        metadata: {
                          level: "moderator",
                          access: "limited",
                          settings: user.settings,
                        },
                      }}
                      fields=${{
                        status: "moderator",
                        active: user.isOnline,
                        canEdit: true,
                        canDelete: false,
                        canManage: false,
                      }} />`
                  : html`<meta-${mass.tag}
                      mass=${{
                        id: user.id,
                        name: user.name,
                        type: "user",
                        permissions: user.permissions,
                        metadata: {
                          level: "user",
                          access: "basic",
                          settings: user.settings,
                        },
                      }}
                      fields=${{
                        status: "user",
                        active: user.isOnline,
                        canEdit: false,
                        canDelete: false,
                        canManage: false,
                      }} />`}
              `
            )}
          </div>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/users",
              child: [
                {
                  type: "cond",
                  data: "[item]/permissions/includes",
                  expr: '_[0]("admin")',
                  child: [
                    {
                      tag: {
                        data: "/mass/tag",
                        expr: "meta-${_[0]}",
                      },
                      type: "meta",
                      mass: {
                        data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                        expr: '{ id: _[0], name: _[1], type: "admin", permissions: _[2], metadata: { level: "admin", access: "full", settings: _[3] } }',
                      },
                      fields: {
                        data: "[item]/isOnline",
                        expr: '{ status: "admin", active: _[0], canEdit: true, canDelete: true, canManage: true }',
                      },
                    },
                    {
                      type: "cond",
                      data: "[item]/permissions/includes",
                      expr: '_[0]("moderator")',
                      child: [
                        {
                          tag: {
                            data: "/mass/tag",
                            expr: "meta-${_[0]}",
                          },
                          type: "meta",
                          mass: {
                            data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                            expr: '{ id: _[0], name: _[1], type: "moderator", permissions: _[2], metadata: { level: "moderator", access: "limited", settings: _[3] } }',
                          },
                          fields: {
                            data: "[item]/isOnline",
                            expr: '{ status: "moderator", active: _[0], canEdit: true, canDelete: false, canManage: false }',
                          },
                        },
                        {
                          tag: {
                            data: "/mass/tag",
                            expr: "meta-${_[0]}",
                          },
                          type: "meta",
                          mass: {
                            data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                            expr: '{ id: _[0], name: _[1], type: "user", permissions: _[2], metadata: { level: "user", access: "basic", settings: _[3] } }',
                          },
                          fields: {
                            data: "[item]/isOnline",
                            expr: '{ status: "user", active: _[0], canEdit: false, canDelete: false, canManage: false }',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("meta-компоненты с динамическими mass/context объектами", () => {
    type Core = { items: any[]; tag: string; type: string }
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, Core>(
        ({ html, mass, fields }) => html`
          <div>
            ${mass.items.map(
              (item) => html`
                <meta-${mass.tag}
                  mass=${{
                    id: item.id,
                    name: item.name,
                    type: mass.type,
                    dynamic: item.isActive ? "active" : "inactive",
                    computed: `${item.id}-${item.name}`,
                    metadata: {
                      status: item.status,
                      priority: item.priority || "normal",
                      tags: item.tags || [],
                    },
                  }}
                  fields=${{
                    status: item.isActive ? "active" : "inactive",
                    active: item.isActive,
                    canEdit: item.permissions.includes("edit"),
                    canDelete: item.permissions.includes("delete"),
                    dynamic: {
                      lastModified: item.lastModified,
                      created: item.created,
                      updated: item.updated || item.lastModified,
                    },
                  }} />
              `
            )}
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/items",
              child: [
                {
                  tag: {
                    data: "/mass/tag",
                    expr: "meta-${_[0]}",
                  },
                  type: "meta",
                  fields: {
                    data: [
                      "[item]/isActive",
                      "[item]/permissions/includes",
                      "[item]/lastModified",
                      "[item]/created",
                      "[item]/updated",
                    ],
                    expr: '{ status: _[0] ? "active" : "inactive", active: _[0], canEdit: _[1]("edit"), canDelete: _[1]("delete"), dynamic: { lastModified: _[2], created: _[3], updated: _[4] || _[2] } }',
                  },
                  mass: {
                    data: [
                      "[item]/id",
                      "[item]/name",
                      "/mass/type",
                      "[item]/isActive",
                      "[item]/status",
                      "[item]/priority",
                      "[item]/tags",
                    ],
                    expr: '{ id: _[0], name: _[1], type: _[2], dynamic: _[3] ? "active" : "inactive", computed: `${_[0]}-${_[1]}`, metadata: { status: _[4], priority: _[5] || "normal", tags: _[6] || [] } }',
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/meta/attr.object.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("fields/mass в атрибутах", () => {
  describe("mass с динамическими значениями", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass, fields }) => html`<meta-${mass.tag} mass=${{ id: fields.id, name: fields.name }} />`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: {
            data: "/mass/tag",
            expr: "meta-${_[0]}",
          },
          type: "meta",
          mass: {
            data: ["/fields/id", "/fields/name"],
            expr: "{ id: _[0], name: _[1] }",
          },
        },
      ])
    })
  })

  describe("mass со статическими значениями", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html, mass }) => html`<meta-${mass.tag} mass=${{ id: "1", name: "2" }} />`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: {
            data: "/mass/tag",
            expr: "meta-${_[0]}",
          },
          type: "meta",
          mass: '{ id: "1", name: "2" }',
        },
      ])
    })
  })

  describe("fields/mass во вложенных элементах", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass, fields }) => html`
          <div><meta-${mass.tag} fields=${{ id: fields.id, name: fields.name }} /></div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: {
                data: "/mass/tag",
                expr: "meta-${_[0]}",
              },
              type: "meta",
              fields: {
                data: ["/fields/id", "/fields/name"],
                expr: "{ id: _[0], name: _[1] }",
              },
            },
          ],
        },
      ])
    })
  })

  describe("fields", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass, fields }) => html`<meta-${mass.tag} fields=${{ id: fields.id, name: fields.name }} />`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: {
            data: "/mass/tag",
            expr: "meta-${_[0]}",
          },
          type: "meta",
          fields: {
            data: ["/fields/id", "/fields/name"],
            expr: "{ id: _[0], name: _[1] }",
          },
        },
      ])
    })
  })

  describe("fields/mass", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass, fields }) => html`
          <meta-${mass.tag}
            mass=${{ id: fields.id, name: fields.name }}
            fields=${{ id: fields.id, name: fields.name }} />
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: {
            data: "/mass/tag",
            expr: "meta-${_[0]}",
          },
          type: "meta",
          mass: {
            data: ["/fields/id", "/fields/name"],
            expr: "{ id: _[0], name: _[1] }",
          },
          fields: {
            data: ["/fields/id", "/fields/name"],
            expr: "{ id: _[0], name: _[1] }",
          },
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/meta/meta.spec.ts
import { describe, expect, it, beforeAll } from "bun:test"
import { parse, type Node } from "../../../index"

describe("meta", () => {
  describe("теги", () => {
    describe("актор web-component", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash></meta-hash>`)
      })

      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("актор web-component с самозакрывающимся тегом", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash />`)
      })
      it("hierarchy", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
          },
        ])
      })
    })

    describe("хеш-тег из core в самозакрывающемся теге", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, mass }) => html`<meta-${mass.actors.child} />`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/actors/child",
              expr: "meta-${_[0]}",
            },
            type: "meta",
          },
        ])
      })
    })

    describe("хеш-тег из core", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, mass }) => html`<meta-${mass.actors.child}></meta-${mass.actors.child}>`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/actors/child",
              expr: "meta-${_[0]}",
            },
            type: "meta",
          },
        ])
      })
    })

    describe("meta-тег в простом элементе", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, mass }) => html`<div><meta-${mass.tag} /></div>`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "div",
            type: "el",
            child: [
              {
                tag: {
                  data: "/mass/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в meta-теге", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, mass }) => html`<meta-hash><meta-${mass.tag} /></meta-hash>`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            child: [
              {
                tag: {
                  data: "/mass/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в map", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, { items: { tag: string }[] }>(
          ({ html, mass }) => html`${mass.items.map((item) => html`<meta-${item.tag} />`)}`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            type: "map",
            data: "/mass/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })

    describe("meta-тег в тренарном операторе", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, mass }) => html`${mass.items.length > 0 ? html`<meta-${mass.tag} />` : html`<meta-${mass.tag} />`}`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            type: "cond",
            data: "/mass/items/length",
            expr: "_[0] > 0",
            child: [
              {
                tag: {
                  data: "/mass/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
              },
              {
                tag: {
                  data: "/mass/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
              },
            ],
          },
        ])
      })
    })
  })

  describe("атрибуты", () => {
    describe("статические атрибуты", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html }) => html`<meta-hash data-type="component" class="meta-element" />`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: "meta-hash",
            type: "meta",
            string: {
              "data-type": "component",
              class: "meta-element",
            },
          },
        ])
      })
    })

    describe("динамические атрибуты", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(({ html, mass }) => html`<meta-${mass.tag} data-id="${mass.id}" class="meta-${mass.type}" />`)
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/tag",
              expr: "meta-${_[0]}",
            },
            type: "meta",
            string: {
              "data-id": {
                data: "/mass/id",
              },
              class: {
                data: "/mass/type",
                expr: "meta-${_[0]}",
              },
            },
          },
        ])
      })
    })

    describe("условные атрибуты", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, mass }) => html`
            <meta-${mass.tag} ${mass.active && "data-active"} class="${mass.active ? "active" : "inactive"}" />
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/tag",
              expr: "meta-${_[0]}",
            },
            type: "meta",
            boolean: {
              "data-active": {
                data: "/mass/active",
              },
            },
            string: {
              class: {
                data: "/mass/active",
                expr: '${_[0] ? "active" : "inactive"}',
              },
            },
          },
        ])
      })
    })

    describe("события", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, mass }) => html`
            <meta-${mass.tag}
              onclick=${() => mass.handleClick(mass.id)}
              onchange=${(e: Event) => mass.handleChange(e, mass.value)} />
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/tag",
              expr: "meta-${_[0]}",
            },
            type: "meta",
            event: {
              onclick: {
                data: ["/mass/handleClick", "/mass/id"],
                expr: "() => _[0](_[1])",
              },
              onchange: {
                data: ["/mass/handleChange", "/mass/value"],
                expr: "(e) => _[0](e, _[1])",
              },
            },
          },
        ])
      })
    })

    describe("функция update", () => {
      let elements: Node[]

      beforeAll(() => {
        elements = parse(
          ({ html, mass, update }) => html`<meta-${mass.tag} onclick=${() => update({ selected: mass.id })} />`
        )
      })

      it("data", () => {
        expect(elements).toEqual([
          {
            tag: {
              data: "/mass/tag",
              expr: "meta-${_[0]}",
            },
            type: "meta",
            event: {
              onclick: {
                data: "/mass/id",
                expr: "() => update({ selected: _[0] })",
                upd: "selected",
              },
            },
          },
        ])
      })
    })

    describe("смешанные атрибуты", () => {
      type Core = {
        items: { tag: string; id: string; active: boolean; handleClick: (id: string) => void }[]
      }
      let elements: Node[]

      beforeAll(() => {
        elements = parse<any, Core>(
          ({ html, mass }) => html`
            ${mass.items.map(
              (item) => html`
                <meta-${item.tag}
                  data-id="${item.id}"
                  ${item.active && "data-active"}
                  class="meta-${item.active ? "active" : "inactive"}"
                  onclick=${() => item.handleClick(item.id)} />
              `
            )}
          `
        )
      })
      it("data", () => {
        expect(elements).toEqual([
          {
            type: "map",
            data: "/mass/items",
            child: [
              {
                tag: {
                  data: "[item]/tag",
                  expr: "meta-${_[0]}",
                },
                type: "meta",
                event: {
                  onclick: {
                    data: ["[item]/handleClick", "[item]/id"],
                    expr: "() => _[0](_[1])",
                  },
                },
                string: {
                  "data-id": {
                    data: "[item]/id",
                  },
                  class: {
                    data: "[item]/active",
                    expr: 'meta-${_[0] ? "active" : "inactive"}',
                  },
                },
                boolean: {
                  "data-active": {
                    data: "[item]/active",
                  },
                },
              },
            ],
          },
        ])
      })
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/text-formatting.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("text-formatting", () => {
  describe("форматирует текст по стандартам HTML (схлопывание пробельных символов)", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ name: string; title: string }, { items: { title: string }[] }>(
        ({ html, fields, mass }) => html`
          <div>
            <p>Hello World</p>
            <span>${fields.name} - ${fields.title}</span>
            <span>${fields.name} - ${mass.items.map((item) => item.title).join(", ")}</span>
            <div>Welcome to our site!</div>
            <p>${fields.name} is ${fields.title}</p>
          </div>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "div",
          type: "el",
          child: [
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Hello World",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/fields/name", "/fields/title"],
                  expr: "${_[0]} - ${_[1]}",
                },
              ],
            },
            {
              tag: "span",
              type: "el",
              child: [
                {
                  type: "text",
                  data: "/fields/name",
                  expr: "${_[0]} - ${_[0]}",
                },
              ],
            },
            {
              tag: "div",
              type: "el",
              child: [
                {
                  type: "text",
                  value: "Welcome to our site!",
                },
              ],
            },
            {
              tag: "p",
              type: "el",
              child: [
                {
                  type: "text",
                  data: ["/fields/name", "/fields/title"],
                  expr: "${_[0]} is ${_[1]}",
                },
              ],
            },
          ],
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/test/web-components.test.ts
import { describe, it, expect, beforeAll } from "bun:test"
import { parse, type Node } from "../../index"

describe("web-components", () => {
  describe("базовые custom elements", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html }) => html`<my-element></my-element>`)
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "my-element",
          type: "el",
        },
      ])
    })
  })

  describe("custom elements с атрибутами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html }) => html`<user-card name="John" age="25"></user-card>`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "user-card",
          type: "el",
          string: {
            age: "25",
            name: "John",
          },
        },
      ])
    })
  })

  describe("self-closing custom elements", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(({ html }) => html`<loading-spinner />`)
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "loading-spinner",
          type: "el",
        },
      ])
    })
  })

  describe("вложенные custom elements", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html }) => html`
          <app-header>
            <nav-menu>
              <menu-item>Home</menu-item>
            </nav-menu>
          </app-header>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "app-header",
          type: "el",
          child: [
            {
              tag: "nav-menu",
              type: "el",
              child: [
                {
                  tag: "menu-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      value: "Home",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("custom elements с template literals в атрибутах", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ userId: string; theme: string }>(
        ({ html, fields }) => html`<user-profile id="${fields.userId}" theme="${fields.theme}"></user-profile>`
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "user-profile",
          type: "el",
          string: {
            id: {
              data: "/fields/userId",
            },
            theme: {
              data: "/fields/theme",
            },
          },
        },
      ])
    })
  })

  describe("custom elements в условиях", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<{ isAdmin: boolean }>(
        ({ html, fields }) =>
          html`${fields.isAdmin ? html`<admin-panel></admin-panel>` : html`<user-panel></user-panel>`}`
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          type: "cond",
          data: "/fields/isAdmin",
          child: [
            {
              tag: "admin-panel",
              type: "el",
            },
            {
              tag: "user-panel",
              type: "el",
            },
          ],
        },
      ])
    })
  })

  describe("custom elements в map", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse<any, { users: { id: string; name: string }[] }>(
        ({ html, mass }) => html`
          <user-list>
            ${mass.users.map((user) => html`<user-item id="${user.id}">${user.name}</user-item>`)}
          </user-list>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "user-list",
          type: "el",
          child: [
            {
              type: "map",
              data: "/mass/users",
              child: [
                {
                  tag: "user-item",
                  type: "el",
                  child: [
                    {
                      type: "text",
                      data: "[item]/name",
                    },
                  ],
                  string: {
                    id: {
                      data: "[item]/id",
                    },
                  },
                },
              ],
            },
          ],
        },
      ])
    })
  })

  describe("custom elements с дефисами в разных позициях", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html }) => html`
          <x-component></x-component>
          <my-component></my-component>
          <component-with-dashes></component-with-dashes>
          <a-b-c-d></a-b-c-d>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        { tag: "x-component", type: "el" },
        { tag: "my-component", type: "el" },
        { tag: "component-with-dashes", type: "el" },
        { tag: "a-b-c-d", type: "el" },
      ])
    })
  })

  describe("custom elements с сложными атрибутами", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html }) => html`
          <data-table columns='["name", "age", "email"]' sortable="true" filterable theme="dark"></data-table>
        `
      )
    })

    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "data-table",
          type: "el",
          string: {
            columns: '["name", "age", "email"]',
            sortable: "true",
            theme: "dark",
          },
          boolean: {
            filterable: true,
          },
        },
      ])
    })
  })

  describe("custom elements с событиями", () => {
    let elements: Node[]

    beforeAll(() => {
      elements = parse(
        ({ html, mass }) => html`
          <modal-dialog onclose=${() => mass.close()} onopen=${() => mass.open()} data-modal-id="user-modal">
          </modal-dialog>
        `
      )
    })
    it("data", () => {
      expect(elements).toEqual([
        {
          tag: "modal-dialog",
          type: "el",
          event: {
            onclose: {
              data: "/mass/close",
              expr: "() => _[0]()",
            },
            onopen: {
              data: "/mass/open",
              expr: "() => _[0]()",
            },
          },
          string: {
            "data-modal-id": "user-modal",
          },
        },
      ])
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/text.spec.ts
import { parse, type Node } from "../index"
import { describe, expect, beforeAll, it } from "bun:test"

describe("text", () => {
  describe("статический", () => {
    let elements: Node[]
    beforeAll(() => {
      elements = parse(
        // #region static
        ({ html }) => html`Static text`
        // #endregion static
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectStatic
        [{ type: "text", value: "Static text" }]
        // #endregion expectStatic
      )
    })
  })
  describe("динамический", () => {
    let elements: Node[]
    type Context = { dynamic: string }
    beforeAll(() => {
      elements = parse<Context>(
        // #region dynamic
        ({ html, fields }) => html`<p>${fields.dynamic}</p>`
        // #endregion dynamic
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectDynamic
        [
          {
            tag: "p",
            type: "el",
            child: [{ type: "text", data: "/fields/dynamic" }],
          },
        ]
        // #endregion expectDynamic
      )
    })
  })
  describe("смешанный", () => {
    let elements: Node[]
    type Context = { family: string; name: string }
    beforeAll(() => {
      elements = parse<Context>(
        // #region mixed
        ({ html, fields }) => html`<p>Hello, ${fields.family} ${fields.name}!</p>`
        // #endregion mixed
      )
    })
    it("data", () => {
      expect(elements).toEqual(
        // #region expectMixed
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/fields/family", "/fields/name"],
                expr: "Hello, ${_[0]} ${_[1]}!",
              },
            ],
          },
        ]
        // #endregion expectMixed
      )
    })
  })
  describe("математический", () => {
    let elements: Node[]
    type Context = { a: number; b: number }

    beforeAll(() => {
      elements = parse<Context>(
        //#region mathematical
        ({ html, fields }) => html`<p>${fields.a + fields.b * 2}</p>`
        //#endregion mathematical
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectMathematical
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/fields/a", "/fields/b"],
                expr: "${_[0] + _[1] * 2}",
              },
            ],
          },
        ]
        //#endregion expectMathematical
      )
    })
  })

  describe("тернарный", () => {
    let elements: Node[]
    type Context = { flag: boolean }

    beforeAll(() => {
      elements = parse<Context>(
        //#region ternary
        ({ html, fields }) => html`<p>${fields.flag ? "Yes" : "No"}</p>`
        //#endregion ternary
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectTernary
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/fields/flag",
                expr: '${_[0] ? "Yes" : "No"}',
              },
            ],
          },
        ]
        //#endregion expectTernary
      )
    })
  })

  describe("тернарный литерал", () => {
    let elements: Node[]
    type Context = { name: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region ternaryLiteral
        ({ html, fields }) => html`<p>${fields.name ? `Hi, ${fields.name}!` : ""}</p>`
        //#endregion ternaryLiteral
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectTernaryLiteral
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/fields/name",
                expr: '${_[0] ? `Hi, ${_[0]}!` : ""}',
              },
            ],
          },
        ]
        //#endregion expectTernaryLiteral
      )
    })
  })

  describe("логический", () => {
    let elements: Node[]
    type Context = { isOpen: boolean }

    beforeAll(() => {
      elements = parse<Context>(
        //#region logical
        ({ html, fields }) => html`<p class=${fields.isOpen && "open"}>${fields.isOpen && "Open"}</p>`
        //#endregion logical
      )
    })

    it("expr", () => {
      expect(elements).toEqual(
        //#region expectLogical
        [
          {
            tag: "p",
            type: "el",
            string: {
              class: {
                data: "/fields/isOpen",
                expr: '${_[0] && "open"}',
              },
            },
            child: [
              {
                type: "text",
                data: "/fields/isOpen",
                expr: '${_[0] && "Open"}',
              },
            ],
          },
        ]
        //#endregion expectLogical
      )
    })
  })

  describe("логический литерал", () => {
    let elements: Node[]
    type Context = { last: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region logicalLiteral
        ({ html, fields }) => html` <p>${fields.last && `last: ${fields.last}`}</p>`
        //#endregion logicalLiteral
      )
    })
    it("expr", () => {
      expect(elements).toEqual(
        // #region expectLogicalLiteral
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: "/fields/last",
                expr: "${_[0] && `last: ${_[0]}`}",
              },
            ],
          },
        ]
        // #endregion expectLogicalLiteral
      )
    })
  })
  describe("методы", () => {
    let elements: Node[]
    type Context = { name: string; email: string }

    beforeAll(() => {
      elements = parse<Context>(
        //#region methods
        ({ html, fields }) => html`<p>${fields.name.toUpperCase()} - ${fields.email.toLowerCase()}</p>`
        //#endregion methods
      )
    })

    it("data", () => {
      expect(elements).toEqual(
        //#region expectMethods
        [
          {
            tag: "p",
            type: "el",
            child: [
              {
                type: "text",
                data: ["/fields/name", "/fields/email"],
                expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}",
              },
            ],
          },
        ]
        //#endregion expectMethods
      )
    })
  })
})

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/node/text.ts
import {
  parseTemplateLiteral,
  resolveDataPath,
  ARGUMENTS_PREFIX,
  createUnifiedExpression,
  VALID_VARIABLE_PATTERN,
} from "../parser"
import { cutBeforeNextHtml } from "../parser"
import type { ParseContext } from "../parser.t"
import type { NodeText, ParseTextPart } from "./text.t"

// ============================================================================
// STRING METHOD SAFELIST
// ============================================================================

/** Разрешённые безопасные методы String.prototype. */
const SAFE_STRING_METHODS = new Set<string>([
  "toUpperCase",
  "toLowerCase",
  "toLocaleUpperCase",
  "toLocaleLowerCase",
  "trim",
  "trimStart",
  "trimEnd",
  "slice",
  "substring",
  "includes",
  "startsWith",
  "endsWith",
  "indexOf",
  "lastIndexOf",
  "charAt",
  "charCodeAt",
  "codePointAt",
  "repeat",
  "padStart",
  "padEnd",
  "replace",
  "replaceAll",
  "normalize",
  "split",
])

const isSafeStringMethod = (name?: string) => !!name && SAFE_STRING_METHODS.has(name)

const logUnsupported = (method: string, expr: string) => {
  // eslint-disable-next-line no-console
  console.error(`[template] Unsupported string method "${method}" in expression: ${expr}`)
}

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Парсит текстовый узел с поддержкой методов.
 * ВАЖНО: методы НЕ добавляются в data, а отражаются только в expr:
 *   data: ["/fields/name", "/fields/email"]
 *   expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}"
 */
export const parseText = (text: string, context: ParseContext = { pathStack: [], level: 0 }): NodeText => {
  if (!text.includes("${")) {
    return { type: "text", value: text }
  }

  const hasConditionalOperators = /\?.*:/.test(text)
  const hasLogicalOperators = /(&&|\|\|)/.test(text)
  const hasMathematicalOperators = /[+\-*/%]/.test(text)
  const hasMethodCalls = /\.\w+\s*\(/.test(text)

  // чистые ?:, &&/|| и арифметика без методов — отдаем в общий парсер
  if ((hasConditionalOperators || hasLogicalOperators || hasMathematicalOperators) && !hasMethodCalls) {
    const templateResult = parseTemplateLiteral(text, context)
    if (templateResult?.data) {
      return { type: "text", data: templateResult.data, ...(templateResult.expr && { expr: templateResult.expr }) }
    }
  }

  const parts = splitText(text)

  // Достаём базовую переменную и (опц.) последний вызов метода.
  // ВАЖНО: в data кладём ТОЛЬКО базовый путь (без метода).
  const dynamicParts = parts
    .filter((part) => part.type === "dynamic")
    .map((part) => {
      const varMatch = part.text.match(/\$\{([^}]+)\}/)
      const variable = varMatch?.[1] || ""

      // строковые литералы внутри ${...} не считаем динамикой
      if (variable.startsWith('"') || variable.startsWith("'") || variable.includes('"') || variable.includes("'")) {
        return null
      }

      const { base, methodName, callSuffix } = extractBaseAndCall(variable)
      const path = resolveDataPath(base, context) // БЕЗ суффикса метода

      return { path, text: part.text, methodName, callSuffix }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const firstDynamicPart = dynamicParts[0]
  const mainPath = firstDynamicPart ? firstDynamicPart.path : ""

  // все динамические оказались строками → статический текст
  if (dynamicParts.length === 0 && parts.some((p) => p.type === "dynamic")) {
    const staticText = parts
      .filter((p) => p.type === "dynamic")
      .map((p) => {
        const v = p.text.match(/\$\{([^}]+)\}/)?.[1] || ""
        if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
        return ""
      })
      .join("")
    if (staticText) return { type: "text", value: staticText }
  }

  // одна единственная ${...}
  if (parts.length === 1 && parts[0]!.type === "dynamic") {
    const variable = parts[0]!.text.match(/\$\{([^}]+)\}/)?.[1] || ""
    let methodName = dynamicParts[0]!.methodName
    let call = dynamicParts[0]!.callSuffix ?? "()" // если метод найден — по умолчанию "()"

    // Проверяем метод на принадлежность к стандартным строковым.
    if (methodName && !isSafeStringMethod(methodName)) {
      logUnsupported(methodName, parts[0]!.text)
      methodName = undefined
      call = "" // игнорируем вызов
    }

    if (methodName) {
      // метод вызывается на плейсхолдере, data — базовый путь
      return {
        type: "text",
        data: dynamicParts[0]!.path,
        expr: createUnifiedExpression(`\${${ARGUMENTS_PREFIX}[0].${methodName}${call}}`, []),
      }
    }

    // «сложное» выражение без метода (скобки/вызовы функций и т.п.)
    if (variable.includes("(")) {
      const baseVariable = extractBaseVariable(variable)
      const pathDots = resolveDataPath(baseVariable, context).replace(/^\//, "").replace(/\//g, ".")
      const expr = variable.replace(
        new RegExp(`\\b${pathDots.replace(/\./g, "\\.")}\\b`, "g"),
        `\${${ARGUMENTS_PREFIX}[0]}`
      )
      return { type: "text", data: dynamicParts[0]!.path, expr: createUnifiedExpression(expr, []) }
    }

    // простая подстановка без метода
    return { type: "text", data: mainPath }
  }

  // несколько динамических / смешанный текст
  if (dynamicParts.length > 1) {
    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        const index = dynamicParts.findIndex((dp) => dp.text === p.text)
        let m = dynamicParts[index]?.methodName
        let call = dynamicParts[index]?.callSuffix ?? "()" // если метод найден — по умолчанию "()"

        // Проверка метода
        if (m && !isSafeStringMethod(m)) {
          logUnsupported(m, dynamicParts[index]!.text)
          m = undefined
          call = ""
        }

        return m ? `\${${ARGUMENTS_PREFIX}[${index}].${m}${call}}` : `\${${ARGUMENTS_PREFIX}[${index}]}`
      })
      .join("")

    // «простой» случай — только переменные, без операторов и БЕЗ методов → expr можно опустить
    const isSimpleExpr =
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}\${${ARGUMENTS_PREFIX}[1]}` ||
      exprRaw === `\${${ARGUMENTS_PREFIX}[0]}-\${${ARGUMENTS_PREFIX}[1]}`

    const hasAnyMethods = dynamicParts.some((dp) => !!dp.methodName && isSafeStringMethod(dp.methodName))
    if (isSimpleExpr && !hasAnyMethods) {
      return { type: "text", data: dynamicParts.map((p) => p.path) }
    }

    return { type: "text", data: dynamicParts.map((p) => p.path), expr: createUnifiedExpression(exprRaw, []) }
  }

  // одна динамическая + вокруг есть статический текст
  const hasStaticText = parts.some((p) => p.type === "static" && p.text.trim() !== "")
  if (hasStaticText) {
    let methodName = dynamicParts[0]?.methodName
    let call = dynamicParts[0]?.callSuffix ?? "()" // если метод найден

    if (methodName && !isSafeStringMethod(methodName)) {
      logUnsupported(methodName, dynamicParts[0]!.text)
      methodName = undefined
      call = ""
    }

    const exprRaw = parts
      .map((p) => {
        if (p.type === "static") return p.text
        return methodName ? `\${${ARGUMENTS_PREFIX}[0].${methodName}${call}}` : `\${${ARGUMENTS_PREFIX}[0]}`
      })
      .join("")
    return { type: "text", data: mainPath, expr: createUnifiedExpression(exprRaw, []) }
  }

  return { type: "text", data: mainPath }
}

// ============================================================================
// HELPERS
// ============================================================================

/** Разбивка строки на статические/динамические части. Поддерживает вложенные `${...}`. */
export const splitText = (text: string): ParseTextPart[] => {
  const parts: ParseTextPart[] = []
  let currentIndex = 0
  const varMatches: string[] = []

  let i = 0
  while (i < text.length) {
    if (text[i] === "$" && text[i + 1] === "{") {
      let braceCount = 1
      let j = i + 2
      while (j < text.length && braceCount > 0) {
        if (text[j] === "$" && text[j + 1] === "{") {
          braceCount++
          j += 2
        } else if (text[j] === "}") {
          braceCount--
          j++
        } else {
          j++
        }
      }
      if (braceCount === 0) {
        const varMatch = text.slice(i, j)
        varMatches.push(varMatch)
        i = j
      } else {
        i++
      }
    } else {
      i++
    }
  }

  for (const varMatch of varMatches) {
    const varIndex = text.indexOf(varMatch, currentIndex)
    if (varIndex > currentIndex) parts.push({ type: "static", text: text.slice(currentIndex, varIndex) })
    parts.push({ type: "dynamic", text: varMatch })
    currentIndex = varIndex + varMatch.length
  }
  if (currentIndex < text.length) parts.push({ type: "static", text: text.slice(currentIndex) })
  return parts
}

/** Возвращает текстовый токен, обрезая «клей» до следующего html`...`. */
export const findText = (chunk: string) => {
  let start = 0
  if (!chunk || /^\s+$/.test(chunk)) return

  const trimmed = chunk.trim()
  if (isPureGlue(trimmed)) return

  const visible = cutBeforeNextHtml(chunk)
  if (!visible || /^\s+$/.test(visible)) return

  let processed = ""
  let i = 0
  let usedEndLocal = 0

  while (i < visible.length) {
    const ch = visible[i]
    if (ch === "$" && visible[i + 1] === "{") {
      const exprStart = i
      i += 2
      let b = 1
      while (i < visible.length && b > 0) {
        if (visible[i] === "{") b++
        else if (visible[i] === "}") b--
        i++
      }
      if (b === 0) {
        processed += visible.slice(exprStart, i)
        usedEndLocal = i
        continue
      } else {
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
  if (final.length > 0) return { text: final, start, end: start + usedEndLocal - 1, name: "", kind: "text" }
}

/**
 * Извлекает базовую переменную из выражения (без финального вызова метода).
 * Примеры:
 *   "user.name.toUpperCase()" → "user.name"
 *   "fields.list.map(...)"   → "context.list"
 */
const extractBaseVariable = (variable: string): string => {
  const stringLiterals: string[] = []
  let protectedVariable = variable
    .replace(/`[^`]*`/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/"[^"]*"/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (m) => {
      stringLiterals.push(m)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  if (protectedVariable.includes("(")) {
    const beforeMethod = protectedVariable
      .split(/\.\w+\(/)
      .shift()
      ?.trim()
    if (beforeMethod && VALID_VARIABLE_PATTERN.test(beforeMethod)) return beforeMethod
  }

  const variableMatches = protectedVariable.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const variablesWithDots = variableMatches.filter((v) => v.includes(".") && !v.startsWith("__STRING_"))
  if (variablesWithDots.length > 0) return variablesWithDots[0]!
  return variable
}

/**
 * Возвращает базу и последний вызов метода (если есть).
 * base: "user.name"
 * methodName: "toUpperCase"
 * callSuffix: "()", "(2)", ...
 */
const extractBaseAndCall = (variable: string): { base: string; methodName?: string; callSuffix?: string } => {
  const shielded = variable
    .replace(/`[^`]*`/g, "__S__")
    .replace(/"[^"]*"/g, "__S__")
    .replace(/'[^']*'/g, "__S__")

  const m = shielded.match(/\.([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*$/)
  if (m) {
    const methodName = m[1]
    const args = m[2] ?? ""
    const callSuffix = `(${args})` // всегда с круглыми скобками
    const base = extractBaseVariable(variable.replace(m[0], ""))
    return { base, methodName, callSuffix }
  }
  return { base: extractBaseVariable(variable) }
}

/** «Клей» между шаблонами (служебные куски), которые не считаем текстом. */
export const isPureGlue = (trimmed: string): boolean =>
  !!trimmed &&
  (trimmed === "`" || trimmed.startsWith("`") || /^`}\)?\s*;?\s*$/.test(trimmed) || /^`\)\}\s*,?\s*$/.test(trimmed))

```

```json
/Users/zavx0z/zavx0z/metafor/template/package.json
{
  "name": "@zavx0z/template",
  "version": "2.6.2",
  "description": "HTML шаблонизатор для MetaFor",
  "author": "zavx0z",
  "license": "MIT",
  "keywords": [
    "metafor"
  ],
  "docs": "https://zavx0z.github.io/template",
  "repository": {
    "type": "git",
    "url": "https://github.com/zavx0z/template.git"
  },
  "bugs": {
    "url": "https://github.com/zavx0z/template/issues"
  },
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "private": false,
  "files": [
    "dist",
    "README.md"
  ],
  "devDependencies": {
    "diff": "^8.0.2",
    "@types/bun": "^1.2.21",
    "dts-bundle-generator": "^9.5.1",
    "typedoc": "^0.28.12",
    "concat-md": "^0.5.1",
    "typedoc-plugin-markdown": "^4.8.1"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "scripts": {
    "build": "bun run script/build.ts --dev",
    "docs": "typedoc",
    "rules": "typedoc --options markdown.typedoc.json && concat-md --decrease-title-levels docs-markdown > rules.md",
    "prepublishOnly": "bun run build",
    "publish:npm": "bun publish --access public"
  }
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/parser.t.ts
import type { ParseMapContext } from "./node/map.t"

/**
 * Контекст для парсинга данных.
 */
export type ParseContext = {
  /** Текущий путь к данным */
  currentPath?: string
  /** Стек путей */
  pathStack: string[]
  /** Параметры текущего map */
  mapParams?: string[]
  /** Уровень вложенности */
  level: number
  /** Стек всех map контекстов */
  mapContextStack?: ParseMapContext[]
}

/**
 * Результат парсинга данных.
 */
export type ParseResult = {
  /** Извлеченный путь к данным (может быть массивом для условий) */
  path: string | string[]
  /** Контекст для вложенных операций */
  context?: ParseContext
  /** Дополнительные метаданные */
  metadata?: Record<string, any>
}

/**
 * Статическое строковое значение.
 * @group Варианты значений
 */
export type ValueStatic = string

/**
 * Переменный атрибут с путем к данным.
 * Используется для простых динамических атрибутов.
 *
 * @group Варианты значений
 * @example
 * ```html
 * <div class=${fields.theme}>Тема пользователя</div>
 * ```
 */
export type ValueVariable = {
  /**
   * Путь к данным в полях
   * @example
   * ```typescript
   * data: "/fields/theme"
   * ```
   *
   * Путь к данным в mass
   * @example
   * ```typescript
   * data: "/mass/theme"
   * ```
   *
   * Путь к данным инстанса map
   * @example
   * ```typescript
   * data: "[item]/theme"
   * ```
   *
   * Путь к данным родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[item]/theme"
   * ```
   *
   * Путь к индексу map
   * @example
   * ```typescript
   * data: "[index]"
   * ```
   *
   * Путь к индексу родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[index]"
   * ```
   */
  data: string
}

/**
 * Динамический атрибут с выражением и путем к данным.
 * Используется для сложных вычислений в атрибутах.
 *
 * @group Варианты значений
 * @example
 * ```html
 * <div class=${mass.role === 'admin' ? 'admin-panel' : 'user-panel'}>
 *   Панель управления
 * </div>
 * ```
 */
export type ValueDynamic = {
  /**
   * Путь к данным в полях
   * @example
   * ```typescript
   * data: "/fields/theme"
   * ```
   * 
   * Путь к данным в mass
   * @example
   * ```typescript
   * data: "/mass/theme"
   * ```
   *
   * Путь к данным инстанса map
   * @example
   * ```typescript
   * data: "[item]/theme"
   * ```
   *
   * Путь к данным родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[item]/theme"
   * ```
   *
   * Путь к индексу map
   * @example
   * ```typescript
   * data: "[index]"
   * ```
   *
   * Путь к индексу родительского инстанса из вложенного map
   * @example
   * ```typescript
   * data: "../[index]"
   * ```
   *
   * Пути к данным
   * @example
   * ```typescript
   * data: ["/fields/theme", "[item]/theme", "../[item]/theme", "[index]/theme", "../[index]/theme"]
   * ```
   */
  data: string | string[]
  /**
   * Выражение с переменными в data (по индексу массива)
   *
   * @example
   * ```typescript
   * expr: "${[0]} === 'admin' ? 'admin' : 'user'"
   * ```
   */
  expr: string
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/parser.ts
import type { ValueDynamic, ValueVariable } from "./parser.t"
import type { PartsAttr, NodeType } from "./node/index.t"
import type { Attributes } from "./attribute/index.t"
import type { PartAttrMap, TokenMapClose, TokenMapOpen } from "./node/map.t"
import type { PartAttrCondition, TokenCondClose, TokenCondElse, TokenCondOpen } from "./node/condition.t"
import type { PartAttrMeta } from "./node/meta.t"
import type { PartAttrElement } from "./node/element.t"
import type { ParseContext, ParseResult } from "./parser.t"
import type { TokenText } from "./node/text.t"
import type { TokenLogicalOpen } from "./node/logical.t"
import { formatAttributeText, parseAttributes } from "./attribute"
import { findAllConditions, findCondElse, findCondClose } from "./node/condition"
import { findLogicalOperators } from "./node/logical"
import { findText } from "./node/text"
import { findMapOpen, findMapClose } from "./node/map"
import { processArrayAttributes } from "./attribute/array"
import { processBooleanAttributes } from "./attribute/boolean"
import { processEventAttributes } from "./attribute/event"
import { processStringAttributes } from "./attribute/string"
import { processStyleAttributes } from "./attribute/style"
import { createNode } from "./node"
import { VOID_TAGS } from "./node/element"

// ============================================================================
// КОНСТАНТЫ И УТИЛИТЫ
// ============================================================================
// Быстрый lookahead на теги (включая meta-${...})
const TAG_LOOKAHEAD = /(?=<\/?[A-Za-z][A-Za-z0-9:-]*[^>]*>|<\/?meta-[^>]*>|<\/?meta-\$\{[^}]*\}[^>]*>)/gi

const isValidTagName = (name: string) =>
  (/^[A-Za-z][A-Za-z0-9:-]*$/.test(name) && !name.includes("*")) || name.startsWith("meta-")

const shouldIgnoreAt = (input: string, i: number) => input[i + 1] === "!" || input[i + 1] === "?"

export const extractHtmlElements = (input: string): PartsAttr => {
  const store = new Hierarchy()

  let lastIndex = 0

  TAG_LOOKAHEAD.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = TAG_LOOKAHEAD.exec(input)) !== null) {
    const localIndex = m.index
    if (shouldIgnoreAt(input, localIndex)) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }
    if (input.trim()) parseTextAndOperators(input.slice(lastIndex, localIndex), store)
    const tagStart = localIndex
    let tagEnd = -1
    let i = localIndex + 1

    while (i < input.length) {
      const ch = input[i]

      if (ch === ">") {
        tagEnd = i + 1
        break
      }

      if (ch === `"` || ch === `'`) {
        const quote = ch
        i++
        while (i < input.length && input[i] !== quote) {
          if (input[i] === "\\") {
            i += 2
            continue
          }
          if (input[i] === "$" && input[i + 1] === "{") {
            i += 2
            let b = 1
            while (i < input.length && b > 0) {
              if (input[i] === "{") b++
              else if (input[i] === "}") b--
              i++
            }
            continue
          }
          i++
        }
        if (i < input.length) i++
        continue
      }

      if (ch === "$" && input[i + 1] === "{") {
        i += 2
        let b = 1
        while (i < input.length && b > 0) {
          if (input[i] === "{") b++
          else if (input[i] === "}") b--
          i++
        }
        continue
      }

      i++
    }

    if (tagEnd === -1) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    const full = input.slice(tagStart, tagEnd)

    let name = ""
    let valid = false
    let type: "el" | "meta" = "el"

    const tagNameMatch = full.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)(?:\s|>|\/)/i)

    if (tagNameMatch) {
      name = (tagNameMatch[1] || "").toLowerCase()
      valid = isValidTagName(tagNameMatch[1] || "")
      if (name.startsWith("meta-")) {
        type = "meta"
      }
    }

    if (!valid) {
      const metaMatch = full.match(/^<\/?(meta-\$\{[^}]+\})/i)
      if (metaMatch) {
        name = metaMatch[1] || ""
        valid = true
        type = "meta"
      }
    }

    if (!valid) {
      TAG_LOOKAHEAD.lastIndex = localIndex + 1
      continue
    }

    if (full.startsWith("</")) {
      store.close(name)
    } else if (full.endsWith("/>")) {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/\/>$/, ""))
      store.self({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    } else if (VOID_TAGS.has(name) && !name.startsWith("meta-")) {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/\/>$/, ""))
      store.self({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    } else {
      const text = formatAttributeText(full.replace(`<${name}`, "").replace(/>$/, ""))
      store.open({ tag: name, type, ...(text ? parseAttributes(text) : {}) })
    }

    TAG_LOOKAHEAD.lastIndex = tagEnd
    lastIndex = tagEnd
  }

  if (store.child.length) return store.child
  // если нет тегов, то парсим текст и операторы
  if (input.trim()) parseTextAndOperators(input.slice(lastIndex), store)
  return store.child
}

export const parseTextAndOperators = (input: string, store: Hierarchy) => {
  // текст между предыдущим и текущим тегом
  const map = new Map<
    number,
    TokenText | TokenCondOpen | TokenCondElse | TokenCondClose | TokenMapOpen | TokenMapClose | TokenLogicalOpen
  >()

  const text = findText(input)
  text && map.set(text.start, { text: text.text, kind: "text" })

  const isNotInText = (index: number) => (text ? index < text.start || index > text.end : true)
  // --------- conditions ---------
  const conds = findAllConditions(input)
  for (const cond of conds) isNotInText(cond[0]) && map.set(...cond)

  const tokenCondElse = findCondElse(input)
  tokenCondElse && isNotInText(tokenCondElse[0]) && map.set(...tokenCondElse)

  const tokenCondClose = findCondClose(input)
  tokenCondClose && isNotInText(tokenCondClose[0]) && map.set(...tokenCondClose)

  // --------- logical operators ---------
  const logicals = findLogicalOperators(input)
  for (const logical of logicals) isNotInText(logical[0]) && map.set(...logical)

  // ------------- map -------------
  const tokenMapOpen = findMapOpen(input)
  tokenMapOpen && isNotInText(tokenMapOpen[0]) && map.set(...tokenMapOpen)

  const tokenMapClose = findMapClose(input)
  tokenMapClose && isNotInText(tokenMapClose[0]) && map.set(...tokenMapClose)

  // Сортируем по позиции токены
  const tokens = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([, token]) => token)

  for (const token of tokens) {
    switch (token.kind) {
      case "text":
        store.text(token.text)
        break
      case "cond-open":
        store.if(token.expr)
        break
      case "cond-else":
        store.else()
        break
      case "cond-close":
        break
      case "log-open":
        store.logical(token.expr)
        break
      case "map-open":
        store.map(token.sig)
        break
      case "map-close":
        store.close("map")
        break
    }
  }
}

// Обрезаем всё после первого открытия следующего html-шаблона
export const cutBeforeNextHtml = (s: string): string => {
  const idx = s.indexOf("html`")
  return idx >= 0 ? s.slice(0, idx) : s
}

// ============================================================================
// КЛАССЫ ДЛЯ УПРАВЛЕНИЯ ИЕРАРХИЕЙ
// ============================================================================
/**
 * Курсор по структуре элементов
 *
 * - не устанавливается на самозакрывающиеся теги и void элементы
 *
 */
class Cursor {
  /** Структура элементов по которым двигается курсор */
  child: PartsAttr = []

  constructor(child: PartsAttr) {
    this.child = child
  }

  /** Путь к элементу */
  path: number[] = []
  /** Имена в пути элементов */
  parts: string[] = []

  /** Элемент курсора */
  get element(): PartsAttr {
    let el: PartsAttr = this as unknown as PartsAttr
    for (const path of this.path) {
      const { child } = el as unknown as PartAttrElement | PartAttrMeta | PartAttrMap | PartAttrCondition
      el = child![path] as unknown as PartsAttr
    }
    return el
  }

  /** Имя последнего элемента */
  get part() {
    return this.parts[this.parts.length - 1]
  }

  /** Удаляет последний элемент из пути и возвращает его имя */
  back() {
    this.path.pop()
    return this.parts.pop()
  }

  push(name: string) {
    this.parts.push(name)
    this.path.push((this.element as unknown as PartAttrElement | PartAttrMeta).child!.length - 1)
  }
}

class Hierarchy {
  child: PartsAttr = []
  cursor: Cursor
  constructor() {
    this.child = []
    this.cursor = new Cursor(this.child)
  }
  /** Добавляет текст в child массив
   * - не создает курсор на этот блок
   * @param value - текст условия
   */
  text(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "text", text: value })
    return
  }

  /** Добавляет блок if в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * @param value - текст условия
   */
  if(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "cond", text: value, child: [] })
    this.cursor.push("if")
    return
  }
  /** Заменяет последний элемент в именах пути
   * для добавления блока else вторым элементом cond в child массиве
   * - создает курсор на этот блок
   * - cursor.path не изменяется
   * - cursor.parts изменяется с if на else
   */
  else() {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    if (this.cursor.part === "if") {
      this.cursor.parts.pop()
      this.cursor.parts.push("else")
    }
    return
  }

  /** Добавляет блок logical в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * @param value - текст условия
   */
  logical(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "log", text: value, child: [] })
    this.cursor.push("log")
    return
  }

  /** Добавляет блок map в child массив
   * - создает курсор на этот блок
   * @param value - текст условия
   */
  map(value: string) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push({ type: "map", text: value, child: [] })
    this.cursor.push("map")
    return
  }

  /** Добавляет элемент в child массив
   * - не создает курсор на этот блок
   * @param part - текст условия
   */
  self(part: PartAttrElement | PartAttrMeta) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push(part)
    /** Выходим из логического оператора если были в блоке log */
    if (this.cursor.part === "log") {
      this.cursor.back() // удаляем log и выходим из логического оператора
    }
    return
  }

  /** Добавляет элемент в child массив
   * - создает курсор на этот блок
   * - cursor.path добавляется с увеличением на 1
   * - cursor.parts добавляется с именем тега
   * @param part - текст условия
   */
  open(part: PartAttrElement | PartAttrMeta) {
    const curEl = this.cursor.element as unknown as PartAttrElement | PartAttrMeta
    !Object.hasOwn(curEl, "child") && (curEl.child = [])
    curEl.child!.push(part)
    this.cursor.push(part.tag)
    /** Выходим из логического оператора если были в блоке log */
    if (this.cursor.part === "log") {
      this.cursor.back() // удаляем log и выходим из логического оператора
    }
    return
  }
  #recursiveCloseMultipleElse() {
    if (this.cursor.part === "else") {
      this.cursor.back()
      this.#recursiveCloseMultipleElse()
    }
  }
  close(tagName: string) {
    /** html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}⬇️</div>`
     *                                              самозакрывающийся тег
     */
    if (this.cursor.part === "else") {
      // выходим из всех else
      this.#recursiveCloseMultipleElse()
      // закрываем тег
      const deleted = this.cursor.back()
      if (deleted !== tagName) {
        throw new Error(`Expected ${tagName} but got ${deleted}`)
      }
      return
    } else if (this.cursor.part === "log") {
      // выходим из логического оператора
      this.cursor.back()
      // закрываем тег
      const deleted = this.cursor.back()
      if (deleted !== tagName) {
        throw new Error(`Expected ${tagName} but got ${deleted}`)
      }
      return
    } else {
      const deleted = this.cursor.back()
      if (deleted !== tagName) {
        throw new Error(`Expected ${tagName} but got ${deleted}`)
      }
      /** Выходим из else если были в блоке else */
      if (this.cursor.part === "else") {
        this.cursor.back() // удаляем else и выходим из элемента cond
      }
      /** Выходим из логического оператора если были в блоке log */
      if (this.cursor.part === "log") {
        this.cursor.back() // удаляем log и выходим из логического оператора
      }
      return
    }
  }
}
// ============================================================================
// REGEX PATTERNS
// ============================================================================
// Паттерны для парсинга переменных

export const VARIABLE_WITH_DOTS_PATTERN = /([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g
export const VALID_VARIABLE_PATTERN = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/
// Паттерны для парсинга событий

export const UPDATE_OBJECT_PATTERN = /update\(\s*\{([^}]+)\}\s*\)/
export const OBJECT_KEY_PATTERN = /([a-zA-Z_$][\w$]*)\s*:/g
export const CONDITIONAL_OPERATORS_PATTERN = /\?.*:/
// Паттерны для форматирования

export const WHITESPACE_PATTERN = /\s+/g
export const TEMPLATE_WRAPPER_PATTERN = /^\$\{|\}$/g
/**
 * Единый префикс для индексационных плейсхолдеров внутри expr.
 *
 * Формирует вид подстановок в унифицированных выражениях:
 *   \`${${ARGUMENTS_PREFIX}[0]}\`, \`${${ARGUMENTS_PREFIX}[1]}\`, ...
 *
 * Изменяя значение здесь, вы централизованно влияете на весь рендер expr
 * (parseEventExpression, createUnifiedExpression, parseTemplateLiteral, parseText, условия).
 * Допустимые варианты: "arguments" (классический JS) или пустая строка для специфического рантайма.
 */

export const ARGUMENTS_PREFIX = "_"
// ============================================================================
// PATH RESOLUTION UTILITIES
// ============================================================================
/**
 * Ищет переменную в стеке map контекстов и возвращает соответствующий путь.
 *
 * Эта функция является ключевой для разрешения переменных в сложных вложенных структурах.
 * Она анализирует стек map контекстов от самого глубокого уровня к самому внешнему,
 * определяя правильные относительные пути для доступа к данным.
 *
 * @param variable - Имя переменной для поиска (может содержать точки для доступа к свойствам)
 * @param context - Парсер полей с информацией о стеке map контекстов
 * @returns Относительный путь к данным или null, если переменная не найдена
 *
 * @example
 * // В контексте: departments.map((dept) => teams.map((team) => members.map((member) => ...)))
 * findVariableInMapStack("dept.name", context) // Возвращает: "../../[item]/name"
 * findVariableInMapStack("team.id", context)   // Возвращает: "../[item]/id"
 * findVariableInMapStack("member", context)    // Возвращает: "[item]"
 */
const findVariableInMapStack = (variable: string, context: ParseContext): string | null => {
  if (!context.mapContextStack?.length) return null

  const variableParts = variable.split(".")
  const variableName = variableParts[0] || ""

  // Ищем переменную от самого глубокого уровня к внешнему
  for (let i = context.mapContextStack.length - 1; i >= 0; i--) {
    const mapContext = context.mapContextStack[i]
    if (!mapContext?.params.includes(variableName)) continue

    const levelsUp = context.mapContextStack.length - 1 - i
    const prefix = "../".repeat(levelsUp)
    const paramIndex = mapContext.params.indexOf(variableName)

    // Используем информацию о деструктуризации из контекста
    // В режиме деструктуризации все параметры относятся к полям [item]
    if (mapContext.isDestructured) {
      const hasProperty = variableParts.length > 1
      // variableParts[0] — имя деструктурированного поля
      return hasProperty ? `${prefix}[item]/${variableParts.join("/")}` : `${prefix}[item]/${variableParts[0]}`
    }

    // Обычный режим: первый параметр — элемент, остальные — индекс
    return paramIndex === 0 ? buildItemPath(prefix, variableParts, false) : `${prefix}[index]`
  }

  return null
}
const buildItemPath = (prefix: string, variableParts: string[], isDestructured: boolean): string => {
  const hasProperty = variableParts.length > 1

  if (isDestructured) {
    return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]/${variableParts[0]}`
  }

  return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]`
}
/**
 * Обрабатывает семантические атрибуты (mass/fields) с подходом "единый литерал + переменные".
 *
 * Извлекает все переменные из строки и создает унифицированное выражение для дальнейшего eval.
 * Подходит для mass/fields атрибутов, где нужна цельная строка для выполнения.
 *
 * @param str - Строка объекта в формате "{ key: value, key2: value2 }"
 * @param ctx - Парсер полей
 * @returns Результат с путями к данным и унифицированным выражением
 */

export const processSemanticAttributes = (
  str: string,
  ctx: ParseContext = { pathStack: [], level: 0 }
): ValueVariable | ValueDynamic | null => {
  // Извлекаем все переменные из строки объекта
  const variableMatches = str.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []

  if (variableMatches.length === 0) {
    return null
  }

  // Убираем дубликаты переменных
  const uniqueVariables = [...new Set(variableMatches)]

  // Разрешаем пути к данным для каждой уникальной переменной
  const paths = uniqueVariables.map((variable: string) => resolveDataPath(variable, ctx) || variable)

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = str

  // Защищаем строковые литералы от замены
  const { protectedExpr, stringLiterals } = protectStringLiterals(expr)

  uniqueVariables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    const variableRegex = new RegExp(`(?<!\\w)${variable.replace(/\./g, "\\.")}(?!\\w)`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}
/**
 * Поддерживает различные типы параметров map функций:
 * - Простые параметры (один параметр)
 * - Деструктурированные свойства (несколько параметров)
 * - Параметры с индексами
 * - Доступ к свойствам через точку
 *
 * @param variable - Имя переменной для разрешения
 * @param context - Парсер полей с информацией о текущем map контексте
 * @returns Путь к данным в формате относительного или абсолютного пути
 *
 * @example
 * // В контексте map с деструктуризацией: map(({ title, id }) => ...)
 * resolveDataPath("title", context) // Возвращает: "[item]/title"
 * resolveDataPath("id", context)    // Возвращает: "[item]/id"
 *
 * // В контексте map с простым параметром: map((item) => ...)
 * resolveDataPath("item.name", context) // Возвращает: "[item]/name"
 * resolveDataPath("item", context)      // Возвращает: "[item]"
 */

export const resolveDataPath = (variable: string, context: ParseContext): string => {
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
    } else if (variableParts[0] && context.mapParams.includes(variableParts[0])) {
      // Переменная начинается с имени параметра, но не содержит точку (например, dept в map((dept) => ...))
      const paramIndex = context.mapParams.indexOf(variableParts[0])
      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        if (variableParts.length > 1) {
          // Свойство первого параметра (например, dept.id)
          const propertyPath = variableParts.slice(1).join("/")
          return `[item]/${propertyPath}`
        } else {
          // Сам первый параметр (например, dept)
          return "[item]"
        }
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else if (context.mapParams.includes(variable)) {
      // Переменная точно совпадает с параметром текущего map
      const paramIndex = context.mapParams.indexOf(variable)

      if (paramIndex === 0) {
        // Первый параметр - элемент массива
        // Для деструктуризации всегда возвращаем [item]/property
        return `[item]/${variable}`
      } else {
        // Второй и последующие параметры - индекс
        return "[index]"
      }
    } else {
      // Переменная не найдена в текущих mapParams
      // Если переменная начинается с mass., то это абсолютный путь
      if (variable.startsWith("mass.")) {
        return `/${variable.replace(/\./g, "/")}`
      }

      // Проверяем, есть ли вложенный map
      if (context.currentPath && context.currentPath.includes("[item]")) {
        // Вложенный map - переменная может быть из внешнего контекста
        // Проверяем, есть ли в pathStack другие map контексты
        if (context.pathStack && context.pathStack.length > 1) {
          // Есть внешний map - вычисляем количество уровней подъема
          // Считаем количество map контекстов в pathStack (каждый map добавляет уровень)
          const mapLevels = context.pathStack.filter((path) => path.includes("[item]")).length
          const levelsUp = mapLevels - 1 // текущий уровень не считаем

          // Создаем префикс с нужным количеством "../"
          const prefix = "../".repeat(levelsUp)

          // Извлекаем только свойство из переменной (например, из g.id берем только id)
          const propertyPath = variableParts.length > 1 ? variableParts.slice(1).join("/") : variable
          return `${prefix}[item]/${propertyPath}`
        } else {
          // Нет внешнего map - обычный путь
          return `[item]/${variable.replace(/\./g, "/")}`
        }
      } else {
        // Обычный путь
        return `[item]/${variable.replace(/\./g, "/")}`
      }
    }
  } else if (context.currentPath && !context.currentPath.includes("[item]")) {
    // В контексте, но не map - добавляем к текущему пути
    return `${context.currentPath}/${variable.replace(/\./g, "/")}`
  } else {
    // Абсолютный путь
    return `/${variable.replace(/\./g, "/")}`
  }
}
/**
 * Создает унифицированное выражение с заменой переменных на индексы.
 *
 * Эта функция выполняет две ключевые задачи:
 * 1. Заменяет все переменные в выражении на индексы для унификации
 * 2. Форматирует выражение, удаляя избыточные пробелы и переносы строк
 *
 * Форматирование применяется с учетом строковых литералов:
 * - Строковые литералы защищаются от форматирования
 * - Пробелы и переносы строк удаляются только в логических частях выражения
 * - Строковые литералы восстанавливаются без изменений
 *
 * @param value - Исходное выражение с переменными в формате ${variable}
 * @param variables - Массив переменных для замены на индексы
 * @returns Унифицированное и отформатированное выражение
 *
 * @example
 * createUnifiedExpression("${user.name} is ${user.age} years old", ["user.name", "user.age"])
 * // Возвращает: "${0} is ${1} years old"
 *
 * createUnifiedExpression("${active ? 'Enabled' : 'Disabled'}", ["active"])
 * // Возвращает: "${0} ? 'Enabled' : 'Disabled'"
 */

export const createUnifiedExpression = (value: string, variables: string[]): string => {
  let expr = value

  // Сначала защищаем строковые литералы от замены
  const { stringLiterals } = protectStringLiterals(expr)

  // Заменяем переменные в ${} на индексы
  variables.forEach((variable, index) => {
    // Сначала заменяем точные совпадения ${variable}
    const exactRegex = new RegExp(`\\$\\{${variable.replace(/\./g, "\\.")}\\}`, "g")
    expr = expr.replace(exactRegex, `\${${ARGUMENTS_PREFIX}[${index}]}`)

    // Затем заменяем переменные внутри ${} выражений (для условных выражений)
    // Но только если это не точное совпадение
    const insideRegex = new RegExp(`\\$\\{([^}]*?)\\b${variable.replace(/\./g, "\\.")}\\b([^}]*?)\\}`, "g")
    expr = expr.replace(insideRegex, (match, before, after) => {
      // Проверяем, что это не точное совпадение
      if (before.trim() === "" && after.trim() === "") {
        return match // Не заменяем точные совпадения
      }
      return `\${${before}${ARGUMENTS_PREFIX}[${index}]${after}}`
    })
  })

  // Удаляем лишние пробелы и переносы строк в выражениях
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  return expr
}
/**
 * Парсит путь к данным из map-выражения и создает новый контекст.
 *
 * Эта функция анализирует map-выражения и определяет:
 * - Путь к массиву данных
 * - Параметры map-функции
 * - Тип пути (абсолютный или относительный)
 * - Новый контекст для вложенных операций
 *
 * Поддерживает различные сценарии:
 * - Абсолютные пути к данным (например, mass.list.map)
 * - Относительные пути в контексте map (например, nested.map)
 * - Вложенные map в контексте существующих map
 *
 * @param mapText - Текст map-выражения для парсинга
 * @param context - Текущий контекст парсера (опционально)
 * @returns Результат парсинга с путем, новым контекстом и метаданными
 *
 * @example
 * parseMap("mass.list.map(({ title }) => ...)")
 * // Возвращает: { path: "/mass/list", context: {...}, metadata: { params: ["title"] } }
 *
 * parseMap("nested.map((item) => ...)", context)
 * // Возвращает: { path: "[item]/nested", context: {...}, metadata: { params: ["item"] } }
 */

/**
 * Общая функция для обработки атрибутов с template literals.
 * Устраняет дублирование кода между различными типами атрибутов.
 */
export const processTemplateLiteralAttribute = (
  value: string,
  context: ParseContext
): ValueDynamic | ValueVariable | null => {
  const templateResult = parseTemplateLiteral(value, context)
  if (templateResult) {
    if (templateResult.expr === `\${${ARGUMENTS_PREFIX}[0]}` && !Array.isArray(templateResult.data))
      return { data: templateResult.data }
    return { data: templateResult.data, expr: templateResult.expr }
  }
  return null
}

/**
 * Общая функция для обработки базовых атрибутов элемента.
 * Устраняет дублирование кода между createNodeDataElement и createNodeDataMeta.
 */
export const processBasicAttributes = (node: PartAttrElement | PartAttrMeta, context: ParseContext): Attributes => {
  const result: Attributes = {}

  // Обрабатываем базовые атрибуты
  if (node.string) {
    result.string = processStringAttributes(node.string, context)
  }

  if (node.event) {
    const eventAttrs = processEventAttributes(node.event, context)
    if (Object.keys(eventAttrs).length > 0) {
      result.event = eventAttrs
    }
  }

  if (node.array) {
    result.array = processArrayAttributes(node.array, context)
  }

  if (node.boolean) {
    result.boolean = processBooleanAttributes(node.boolean, context)
  }

  if (node.style) {
    const styleResult = processStyleAttributes(node.style, context)
    if (styleResult) {
      result.style = styleResult
    }
  }

  return result
}

/** Парсит путь к данным из условного выражения. */
export const parseCondition = (condText: string, context: ParseContext = { pathStack: [], level: 0 }): ParseResult => {
  const cleanCondText = cleanConditionText(condText)

  // Защищаем строковые литералы от обработки
  const stringLiterals: string[] = []
  let protectedText = cleanCondText
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  const allMatches = protectedText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
  const pathMatches = allMatches.filter((match) => !match.startsWith("__STRING_"))

  if (pathMatches.length === 0) return { path: "" }

  const expression = extractConditionExpression(cleanCondText, pathMatches)
  const paths =
    pathMatches.length === 1
      ? resolveDataPath(pathMatches[0] || "", context)
      : pathMatches.map((variable) => resolveDataPath(variable, context))

  return { path: paths, metadata: { expression } }
}
const cleanConditionText = (condText: string): string => {
  let cleanText = condText.replace(/html`[^`]*`/g, "")

  if (cleanText.includes("Index")) {
    const indexMatches = cleanText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    return indexMatches.length > 0 ? indexMatches.join(" && ") : cleanText
  }

  return cleanText.includes("?") ? cleanText.split("?")[0]?.trim() || cleanText : cleanText
}
/**
 * Извлекает выражение условия.
 */
export const extractConditionExpression = (condText: string, pathMatches?: string[]): string => {
  // Для условий с индексами, извлекаем только логическое выражение
  if (condText.includes("Index")) {
    // Ищем все логические выражения с индексами
    const indexMatches = condText.match(/([a-zA-Z_$][\w$]*\s*[=!<>]+\s*[0-9]+)/g) || []
    if (indexMatches.length > 0) {
      // Собираем все логические выражения
      let logicalExpression = indexMatches.join(" && ")

      // Ищем переменные в логическом выражении
      const pathMatches = logicalExpression.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      // Заменяем переменные на индексы ${ARGUMENTS_PREFIX}[0]}, ${ARGUMENTS_PREFIX}[1]}, и т.д.
      pathMatches.forEach((path, index) => {
        logicalExpression = logicalExpression.replace(
          new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
          `${ARGUMENTS_PREFIX}[${index}]`
        )
      })

      return logicalExpression.replace(/\s+/g, " ").trim()
    }
  }

  // Ищем все переменные в условии (но не числа)
  const variables = pathMatches || condText.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

  // Проверяем, есть ли математические операции или другие сложные операции
  const hasComplexOperations = /[%+\-*/===!===!=<>().]/.test(condText)
  const hasLogicalOperators = /[&&||]/.test(condText)

  // Если найдена только одна переменная и нет сложных операций, возвращаем простое выражение
  if (variables.length === 1 && !hasComplexOperations && !hasLogicalOperators) {
    return `${ARGUMENTS_PREFIX}[0]`
  }

  // Если найдена только одна переменная, но есть простые математические операции (например, i % 2)
  if (variables.length === 1 && hasComplexOperations && !hasLogicalOperators) {
    // Заменяем переменную на индекс и оборачиваем в ${}
    let expression = condText
    expression = expression.replace(
      new RegExp(`\\b${variables[0]!.replace(/\./g, "\\.")}\\b`, "g"),
      `${ARGUMENTS_PREFIX}[0]`
    )
    return expression
  }

  // Заменяем переменные на индексы ${${ARGUMENTS_PREFIX}[0]}, ${${ARGUMENTS_PREFIX}[1]}, и т.д.
  // Сортируем переменные по длине (сначала более длинные), чтобы избежать частичной замены
  const sortedVariables = [...variables].sort((a, b) => b.length - a.length)

  let expression = condText
  sortedVariables.forEach((path) => {
    const index = variables.indexOf(path)
    expression = expression.replace(
      new RegExp(`\\b${path.replace(/\./g, "\\.")}\\b`, "g"),
      `${ARGUMENTS_PREFIX}[${index}]`
    )
  })

  return expression.replace(/\s+/g, " ").trim()
}

/**
 * Общая функция для обработки template literals.
 * Используется как для text узлов, так и для атрибутов.
 */
export const parseTemplateLiteral = (
  value: string,
  context: ParseContext = { pathStack: [], level: 0 }
): ValueDynamic | null => {
  // Если значение не содержит ${}, возвращаем null (статическое значение)
  if (!value.includes("${")) return null

  // Извлекаем все переменные из выражения, включая вложенные ${...}
  const variables: string[] = []

  // Функция для извлечения переменных из строки с учетом вложенных ${...}
  const extractVariables = (str: string) => {
    // Извлекаем все переменные в порядке их появления в строке
    const allVariableMatches = str.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []
    allVariableMatches.forEach((variable) => {
      if (
        variable.length > 1 &&
        variable.includes(".") && // Только переменные с точками
        variable !== "true" &&
        variable !== "false" &&
        variable !== "null" &&
        variable !== "undefined" &&
        !variables.includes(variable)
      ) {
        // Проверяем, не является ли переменная частью метода
        const variableIndex = str.indexOf(variable)
        const afterVariable = str.slice(variableIndex + variable.length)
        const isMethodCall = afterVariable.match(/^\s*\(/)

        if (!isMethodCall) {
          variables.push(variable)
        }
      }
    })

    // Защищаем строковые литералы
    const stringLiterals: string[] = []
    let protectedStr = str
      .replace(/"[^"]*"/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })
      .replace(/'[^']*'/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })
      .replace(/`[^`]*`/g, (match) => {
        stringLiterals.push(match)
        return `__STRING_${stringLiterals.length - 1}__`
      })

    // Рекурсивно извлекаем переменные из всех ${...} выражений
    const extractFromTemplate = (content: string) => {
      // Находим переменные в текущем содержимом, исключая защищенные строковые литералы
      const variableMatches = content.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)/g) || []

      variableMatches.forEach((variable) => {
        if (
          variable.length > 1 &&
          !variable.startsWith("__STRING_") &&
          !variable.startsWith("STRING") &&
          variable !== "true" &&
          variable !== "false" &&
          variable !== "null" &&
          variable !== "undefined" &&
          !variables.includes(variable)
        ) {
          variables.push(variable)
        }
      })

      // Рекурсивно обрабатываем вложенные ${...}
      const nestedMatches = content.match(/\$\{([^}]+)\}/g) || []
      nestedMatches.forEach((nestedMatch) => {
        const nestedContent = nestedMatch.slice(2, -1)
        extractFromTemplate(nestedContent)
      })
    }

    // Если строка содержит ${...}, извлекаем переменные из всего содержимого
    if (protectedStr.includes("${")) {
      // Находим все ${...} выражения
      const templateMatches = protectedStr.match(/\$\{([^}]+)\}/g) || []

      templateMatches.forEach((match) => {
        // Извлекаем содержимое ${...} из защищенной строки
        const content = match.slice(2, -1) // убираем ${ и }
        extractFromTemplate(content)
      })
    }
  }

  // Извлекаем переменные из всего выражения
  extractVariables(value)

  if (variables.length === 0) {
    return null
  }

  // Разрешаем пути к данным для каждой переменной
  const paths = variables.map((variable: string) => resolveDataPath(variable, context))

  // Создаем унифицированное выражение, заменяя переменные на индексы
  let expr = value

  // Защищаем строковые литералы от замены
  const { stringLiterals } = protectStringLiterals(expr)

  variables.forEach((variable: string, index: number) => {
    // Заменяем переменные на индексы во всем выражении
    // Используем регулярное выражение с границами слов для точной замены
    const variableRegex = new RegExp(`\\b${variable.replace(/\./g, "\\.")}\\b`, "g")
    expr = expr.replace(variableRegex, `${ARGUMENTS_PREFIX}[${index}]`)
  })

  // Восстанавливаем строковые литералы
  expr = restoreStringLiterals(expr, stringLiterals)

  // Применяем форматирование к выражению
  expr = expr.replace(WHITESPACE_PATTERN, " ").trim()

  // Возвращаем результат в новом формате
  return {
    data: paths.length === 1 ? paths[0] || "" : paths,
    expr: expr,
  }
}

export const enrichWithData = (
  hierarchy: PartsAttr,
  context: ParseContext = { pathStack: [], level: 0 }
): NodeType[] => {
  return hierarchy.map((node) => createNode(node, context))
}
// ============================================================================
// HELPER FUNCTIONS FOR CODE REUSE
// ============================================================================
/**
 * Защищает строковые литералы от замены переменных.
 * Переиспользуемая функция для устранения дублирования.
 */
const protectStringLiterals = (expr: string): { protectedExpr: string; stringLiterals: string[] } => {
  const stringLiterals: string[] = []
  const protectedExpr = expr
    .replace(/"[^"]*"/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })
    .replace(/'[^']*'/g, (match) => {
      stringLiterals.push(match)
      return `__STRING_${stringLiterals.length - 1}__`
    })

  return { protectedExpr, stringLiterals }
}
/**
 * Восстанавливает строковые литералы после обработки.
 */
const restoreStringLiterals = (expr: string, stringLiterals: string[]): string => {
  let result = expr
  stringLiterals.forEach((literal, index) => {
    result = result.replace(`__STRING_${index}__`, literal)
  })
  return result
}

```

```typescript
/Users/zavx0z/zavx0z/metafor/template/script/typegen.ts
import { $ } from "bun"
import { join } from "path"

export const typegen = async (entrypoint: string, destination: string) => {
  const isTTY = process.stdout.isTTY
  if (isTTY) {
    let spinnerActive = true
    const spinnerFrames = ["|", "/", "-", "\\"]
    let spinnerIndex = 0
    process.stdout.write("   ")
    const spinner = setInterval(() => {
      process.stdout.write(`\r${spinnerFrames[spinnerIndex++ % spinnerFrames.length]}  Генерация типов...`)
    }, 120)

    // Включаем все необходимые типы для полноценного автодополнения
    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true --no-check ${entrypoint}`.quiet()

    spinnerActive = false
    clearInterval(spinner)
    process.stdout.write("\r✅ Типы успешно сгенерированы!           \n")
  } else {
    console.log("🛠️  Генерация типов...")
    // Включаем все необходимые типы для полноценного автодополнения
    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true --no-check ${entrypoint}`.quiet()
    console.log("✅ Типы успешно сгенерированы!")
  }
}

if (import.meta.main) {
  const fileName = "index"
  const entrypoint = `./${fileName}.ts`
  const distDir = "./dist"
  const typeDest = join(distDir, `${fileName}.d.ts`)

  await typegen(entrypoint, typeDest)
}

```

diff --git a/README.md b/README.md
index 9f570b4..ecf21a2 100644
--- a/README.md
+++ b/README.md
@@ -25,14 +25,14 @@ bun i @zavx0z/template
 
 ```typescript
 import { parse } from "@zavx0z/template"
-import { Context } from "@zavx0z/context"
+import { Fields } from "@zavx0z/fields"
 
-const { context, update, onUpdate } = new Context((t) => ({
+const { fields, update, onUpdate } = new Fields((t) => ({
   cups: t.number.required(0)({ title: "orders" }),
   last: t.string.optional()({ title: "last ordered drink" }),
 }))
 
-const core = {
+const mass = {
   menu: [
     { label: "Espresso", size: "30ml" },
     { label: "Cappuccino", size: "200ml" },
@@ -42,23 +42,23 @@ const core = {
 
 let state = "open"
 
-const nodes = parse<typeof context, typeof core, "open" | "closed">(
-  ({ html, context, update, core, state }) => html`
+const nodes = parse<typeof fields, typeof mass, "open" | "closed">(
+  ({ html, fields, update, mass, state }) => html`
     <h1>☕ Quick Coffee Order</h1>
 
     <p>
-      Status: ${state === "open" ? "🟢 Open" : "🔴 Closed"} · Orders: ${context.cups}${context.last &&
-      ` · last: ${context.last}`}
+      Status: ${state === "open" ? "🟢 Open" : "🔴 Closed"} · Orders: ${fields.cups}${fields.last &&
+      ` · last: ${fields.last}`}
     </p>
 
     ${state === "open" &&
     html`
       <ul>
-        ${core.menu.map(
+        ${mass.menu.map(
           (product) =>
             html`<li>
               ${product.label} (${product.size})
-              <button onclick=${() => update({ cups: context.cups + 1, last: product.label })}>Add</button>
+              <button onclick=${() => update({ cups: fields.cups + 1, last: product.label })}>Add</button>
             </li>`
         )}
       </ul>
diff --git a/attribute/array.t.ts b/attribute/array.t.ts
index 8ff60d5..5818646 100644
--- a/attribute/array.t.ts
+++ b/attribute/array.t.ts
@@ -9,7 +9,7 @@ import type { ValueVariable, ValueDynamic } from "../parser.t"
  * @group Значения атрибутов
  * @example
  * ```html
- * <div class="container ${context.theme} ${context.isActive && 'active'}">
+ * <div class="container ${fields.theme} ${fields.isActive && 'active'}">
  *   Элемент с несколькими классами
  * </div>
  * ```
diff --git a/attribute/array.ts b/attribute/array.ts
index 55c85bf..f4aebf7 100644
--- a/attribute/array.ts
+++ b/attribute/array.ts
@@ -7,7 +7,7 @@ import type { RawAttrArray, ValueArray } from "./array.t"
  */
 export const processArrayAttributes = (
   arrayAttrs: RawAttrArray,
-  context: ParseContext
+  ctx: ParseContext
 ): Record<string, ValueArray[]> => {
   const result: Record<string, ValueArray[]> = {}
   for (const [key, values] of Object.entries(arrayAttrs)) {
@@ -15,7 +15,7 @@ export const processArrayAttributes = (
       if (item.type === "static") return item.value
       else if (item.type === "dynamic" || item.type === "mixed") {
         // Для динамических и смешанных атрибутов обрабатываем значение
-        const processed = processTemplateLiteralAttribute(item.value, context)
+        const processed = processTemplateLiteralAttribute(item.value, ctx)
         if (processed) return processed
         else {
           // Если parseTemplateLiteral вернул null, но это dynamic тип,
@@ -23,7 +23,7 @@ export const processArrayAttributes = (
           // Нужно обработать его как динамическое выражение
           const variableMatches = item.value.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []
           if (variableMatches.length > 0) {
-            const paths = variableMatches.map((variable) => resolveDataPath(variable, context))
+            const paths = variableMatches.map((variable) => resolveDataPath(variable, ctx))
             let expr = item.value
             variableMatches.forEach((variable, index) => {
               expr = expr.replace(
diff --git a/attribute/boolean.t.ts b/attribute/boolean.t.ts
index 166d376..37d08b8 100644
--- a/attribute/boolean.t.ts
+++ b/attribute/boolean.t.ts
@@ -7,9 +7,9 @@ import type { ValueVariable, ValueDynamic } from "../parser.t"
  * @group Значения атрибутов
  * @example
  * ```html
- * <input type="checkbox" ${core.user.isSubscribed && "checked"} />
- * <button ${!context.canSubmit && "disabled"}>Отправить</button>
- * <div ${!context.isVisible && "hidden"}>Скрытый контент</div>
+ * <input type="checkbox" ${mass.user.isSubscribed && "checked"} />
+ * <button ${!fields.canSubmit && "disabled"}>Отправить</button>
+ * <div ${!fields.isVisible && "hidden"}>Скрытый контент</div>
  * ```
  */
 
diff --git a/attribute/boolean.ts b/attribute/boolean.ts
index ab3d0df..40967a6 100644
--- a/attribute/boolean.ts
+++ b/attribute/boolean.ts
@@ -6,7 +6,7 @@ import type { ParseContext } from "../parser.t"
  */
 export const processBooleanAttributes = (
   booleanAttrs: Record<string, { type: string; value: string | boolean }>,
-  context: ParseContext
+  ctx: ParseContext
 ): Record<string, any> => {
   const result: Record<string, any> = {}
 
@@ -16,7 +16,7 @@ export const processBooleanAttributes = (
     } else if (attr.type === "dynamic" || attr.type === "mixed") {
       // Для булевых атрибутов используем специальную обработку
       const booleanValue = String(attr.value)
-      const processed = processBooleanAttributeWithVariables(booleanValue, context)
+      const processed = processBooleanAttributeWithVariables(booleanValue, ctx)
 
       if (processed) {
         result[key] = processed
diff --git a/attribute/event.t.ts b/attribute/event.t.ts
index 81c8716..53d2e8f 100644
--- a/attribute/event.t.ts
+++ b/attribute/event.t.ts
@@ -7,14 +7,14 @@ import type { ValueVariable, ValueDynamic } from "../parser.t"
  * @group Значения атрибутов
  * @example Простая функция без параметров
  * ```html
- * <button onclick=${core.handleClick}>Кнопка</button>
+ * <button onclick=${mass.handleClick}>Кнопка</button>
  * ```
  *
  * Результат:
  * ```json
  * {
  *   "onclick": {
- *     "data": "/core/handleClick"
+ *     "data": "/mass/handleClick"
  *   }
  * }
  * ```
@@ -36,14 +36,14 @@ import type { ValueVariable, ValueDynamic } from "../parser.t"
  *
  * @example Событие в массиве
  * ```html
- * <li onclick=${() => core.item.onClick()}>${core.item.name}</li>
+ * <li onclick=${() => mass.item.onClick()}>${mass.item.name}</li>
  * ```
  *
  * Результат:
  * ```json
  * {
  *   "onclick": {
- *     "data": "/core/item/onClick",
+ *     "data": "/mass/item/onClick",
  *     "expr": "() => ${[0]}()"
  *   }
  * }
@@ -58,8 +58,8 @@ export type ValueEvent =
        *
        * @example
        * ```typescript
-       * data: "/context/value"
-       * data: ["/context/value", "[item]/nested/variable"]
+       * data: "/fields/value"
+       * data: ["/fields/value", "[item]/nested/variable"]
        * ```
        */
       data: string | string[]
@@ -92,8 +92,8 @@ export type ValueEvent =
        *
        * @example
        * ```typescript
-       * data: "/context/value"
-       * data: ["/context/value", "[item]/nested/variable"]
+       * data: "/fields/value"
+       * data: ["/fields/value", "[item]/nested/variable"]
        * ```
        */
       data: string | string[]
diff --git a/attribute/event.ts b/attribute/event.ts
index f9a8924..7fd2a41 100644
--- a/attribute/event.ts
+++ b/attribute/event.ts
@@ -16,12 +16,12 @@ import type { ValueEvent } from "./event.t"
  */
 export const processEventAttributes = (
   eventAttrs: Record<string, string>,
-  context: ParseContext
+  ctx: ParseContext
 ): Record<string, any> => {
   const result: Record<string, any> = {}
 
   for (const [key, value] of Object.entries(eventAttrs)) {
-    const eventResult = parseEventExpression(value, context)
+    const eventResult = parseEventExpression(value, ctx)
     const processed = processSingleEventAttribute(value, eventResult)
 
     if (processed) {
@@ -46,13 +46,13 @@ export const processEventAttributes = (
  * - () => item.handleClick(item.id)
  *
  * @param eventValue - Значение события для парсинга
- * @param context - Контекст парсера с информацией о текущем map контексте
+ * @param context - Парсер полей с информацией о текущем map контексте
  * @returns Результат парсинга с путями к данным и унифицированным выражением
  */
 
 export const parseEventExpression = (
   eventValue: string,
-  context: ParseContext = { pathStack: [], level: 0 }
+  ctx: ParseContext = { pathStack: [], level: 0 }
 ): ValueEvent | null => {
   // Проверяем, является ли это условным выражением (не событием)
   // Ищем тернарный оператор ? ... : (но не стрелочную функцию =>)
@@ -79,7 +79,7 @@ export const parseEventExpression = (
       const keys = keyMatches.map((match) => match.replace(/\s*:$/, "").trim())
 
       if (keys.length > 0) {
-        // Ищем переменные в значениях (например, core.name, context.count)
+        // Ищем переменные в значениях (например, core.name, ctx.count)
         const variableMatches = objectContent.match(VARIABLE_WITH_DOTS_PATTERN) || []
         const uniqueVariables = [...new Set(variableMatches)].filter((variable) => {
           // Исключаем строковые литералы, короткие идентификаторы и булевые литералы
@@ -101,7 +101,7 @@ export const parseEventExpression = (
         // Если есть переменные, добавляем пути к данным
         if (uniqueVariables.length > 0) {
           const paths = uniqueVariables
-            .map((variable) => resolveDataPath(variable, context))
+            .map((variable) => resolveDataPath(variable, ctx))
             .filter((path) => path && path.length > 0) as string[]
           if (paths.length > 0) {
             result.data = paths.length === 1 ? paths[0]! : paths
@@ -154,7 +154,7 @@ export const parseEventExpression = (
   }
 
   // Разрешаем пути к данным с учетом контекста
-  const paths = uniqueVariables.map((variable) => resolveDataPath(variable, context))
+  const paths = uniqueVariables.map((variable) => resolveDataPath(variable, ctx))
 
   // Создаем унифицированное выражение
   let expr = eventValue
@@ -232,7 +232,7 @@ export const processSingleEventAttribute = (value: string, eventResult: any): an
 
 export const processBooleanAttributeWithVariables = (
   booleanValue: string,
-  context: ParseContext
+  ctx: ParseContext
 ): { data: string | string[]; expr?: string } | null => {
   const variableMatches = booleanValue.match(/([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)+)/g) || []
 
@@ -241,7 +241,7 @@ export const processBooleanAttributeWithVariables = (
   }
 
   // Обрабатываем все переменные в выражении
-  const paths = variableMatches.map((variable) => resolveDataPath(variable, context))
+  const paths = variableMatches.map((variable) => resolveDataPath(variable, ctx))
 
   // Создаем выражение, заменяя переменные на индексы
   let expr = booleanValue
diff --git a/attribute/index.ts b/attribute/index.ts
index dc0bb27..4390155 100644
--- a/attribute/index.ts
+++ b/attribute/index.ts
@@ -402,8 +402,8 @@ export const parseAttributes = (
   string?: RawAttrString
   boolean?: RawAttrBoolean
   style?: string
-  context?: string
-  core?: string
+  fields?: string
+  mass?: string
 } => {
   const len = inside.length
   let i = 0
@@ -414,8 +414,8 @@ export const parseAttributes = (
     string?: RawAttrString
     boolean?: RawAttrBoolean
     style?: string
-    context?: string
-    core?: string
+    fields?: string
+    mass?: string
   } = {}
 
   const ensure = {
@@ -424,8 +424,8 @@ export const parseAttributes = (
     string: () => (result.string ??= {}),
     boolean: () => (result.boolean ??= {}),
     style: () => (result.style ??= ""),
-    context: () => (result.context ??= ""),
-    core: () => (result.core ??= ""),
+    fields: () => (result.fields ??= ""),
+    mass: () => (result.mass ??= ""),
   }
 
   while (i < len) {
@@ -529,8 +529,8 @@ export const parseAttributes = (
       continue
     }
 
-    // context и core для meta-компонентов - обрабатываем как объекты
-    if (name === "context" || name === "core") {
+    // fields и mass для meta-компонентов - обрабатываем как объекты
+    if (name === "fields" || name === "mass") {
       while (i < len && /\s/.test(inside[i] || "")) i++
 
       const { value, nextIndex } = readAttributeValue(inside, i)
@@ -544,16 +544,16 @@ export const parseAttributes = (
           : formatExpression(value.slice(2, -1))
         : "{}"
 
-      // Не добавляем пустые core и context атрибуты
+      // Не добавляем пустые mass и fields атрибуты
       if (objectValue === "{}") {
         continue
       }
 
-      // Для meta-компонентов context и core будут обработаны отдельно
-      if (name === "context") {
-        result.context = objectValue
+      // Для meta-компонентов fields и mass будут обработаны отдельно
+      if (name === "fields") {
+        result.fields = objectValue
       } else {
-        result.core = objectValue
+        result.mass = objectValue
       }
       continue
     }
diff --git a/attribute/string.t.ts b/attribute/string.t.ts
index 061f2ea..b13669d 100644
--- a/attribute/string.t.ts
+++ b/attribute/string.t.ts
@@ -8,8 +8,8 @@ import type { ValueStatic, ValueVariable, ValueDynamic } from "../parser.t"
  * @group Значения атрибутов
  * @example
  * ```html
- * <img src=${context.url} alt=${context.alt} title=${context.title} />
- * <a href="/user/${core.user.id}">Профиль пользователя</a>
+ * <img src=${fields.url} alt=${fields.alt} title=${fields.title} />
+ * <a href="/user/${mass.user.id}">Профиль пользователя</a>
  * ```
  */
 
diff --git a/attribute/string.ts b/attribute/string.ts
index dd78ecc..701a9d3 100644
--- a/attribute/string.ts
+++ b/attribute/string.ts
@@ -6,7 +6,7 @@ import type { ParseContext } from "../parser.t"
  */
 export const processStringAttributes = (
   stringAttrs: Record<string, { type: string; value: string }>,
-  context: ParseContext
+  ctx: ParseContext
 ): Record<string, any> => {
   const result: Record<string, any> = {}
 
@@ -14,7 +14,7 @@ export const processStringAttributes = (
     if (attr.type === "static") {
       result[key] = attr.value
     } else if (attr.type === "dynamic" || attr.type === "mixed") {
-      const processed = processTemplateLiteralAttribute(attr.value, context)
+      const processed = processTemplateLiteralAttribute(attr.value, ctx)
       result[key] = processed || attr.value
     }
   }
diff --git a/attribute/style.t.ts b/attribute/style.t.ts
index da8ca91..9e11f02 100644
--- a/attribute/style.t.ts
+++ b/attribute/style.t.ts
@@ -14,14 +14,14 @@ import type { ValueStatic, ValueVariable, ValueDynamic } from "../parser.t"
  *
  * @example Динамические стили
  * ```html
- * <div style=${{backgroundColor: core.theme.primary, color: core.theme.text}}>
+ * <div style=${{backgroundColor: mass.theme.primary, color: mass.theme.text}}>
  *   Элемент с темой
  * </div>
  * ```
  *
  * @example Условные стили
  * ```html
- * <div style=${{backgroundColor: context.isActive ? "green" : "red", color: "white"}}>
+ * <div style=${{backgroundColor: fields.isActive ? "green" : "red", color: "white"}}>
  *   Условный стиль
  * </div>
  * ```
diff --git a/attribute/test/context.core.test.ts b/attribute/test/context.core.test.ts
index b84a238..71cb6c2 100644
--- a/attribute/test/context.core.test.ts
+++ b/attribute/test/context.core.test.ts
@@ -1,92 +1,92 @@
 import { describe, it, expect } from "bun:test"
 import { parseAttributes } from "../index.ts"
 
-describe("context и core", () => {
-  describe("meta-компоненты с context и core", () => {
-    it("meta-компонент с context", () => {
-      const attrs = parseAttributes("context=${{user: currentUser, theme: currentTheme}}")
+describe("fields и mass", () => {
+  describe("meta-компоненты с fields и mass", () => {
+    it("meta-компонент с fields", () => {
+      const attrs = parseAttributes("fields=${{user: currentUser, theme: currentTheme}}")
       expect(attrs).toEqual({
-        context: "{ user: currentUser, theme: currentTheme }",
+        fields: "{ user: currentUser, theme: currentTheme }",
       })
     })
 
-    it("meta-компонент с core", () => {
-      const attrs = parseAttributes("core=${{state: appState, actions: appActions}}")
+    it("meta-компонент с mass", () => {
+      const attrs = parseAttributes("mass=${{state: appState, actions: appActions}}")
       expect(attrs).toEqual({
-        core: "{ state: appState, actions: appActions }",
+        mass: "{ state: appState, actions: appActions }",
       })
     })
 
-    it("meta-компонент с context и core", () => {
+    it("meta-компонент с fields и mass", () => {
       const attrs = parseAttributes(
-        "context=${{user: currentUser, theme: currentTheme}} core=${{state: appState, actions: appActions}}"
+        "fields=${{user: currentUser, theme: currentTheme}} mass=${{state: appState, actions: appActions}}"
       )
       expect(attrs).toEqual({
-        context: "{ user: currentUser, theme: currentTheme }",
-        core: "{ state: appState, actions: appActions }",
+        fields: "{ user: currentUser, theme: currentTheme }",
+        mass: "{ state: appState, actions: appActions }",
       })
     })
 
-    it("meta-компонент с динамическим context", () => {
-      const attrs = parseAttributes("context=${{user: ${getCurrentUser()}, theme: ${getTheme()}}}")
+    it("meta-компонент с динамическим fields", () => {
+      const attrs = parseAttributes("fields=${{user: ${getCurrentUser()}, theme: ${getTheme()}}}")
       expect(attrs).toEqual({
-        context: "{ user: ${getCurrentUser()}, theme: ${getTheme()} }",
+        fields: "{ user: ${getCurrentUser()}, theme: ${getTheme()} }",
       })
     })
 
-    it("meta-компонент с условным context", () => {
+    it("meta-компонент с условным fields", () => {
       const attrs = parseAttributes(
-        "context=${{user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme}}"
+        "fields=${{user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme}}"
       )
       expect(attrs).toEqual({
-        context: "{ user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme }",
+        fields: "{ user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme }",
       })
     })
 
-    it("meta-компонент с вложенными объектами в context", () => {
+    it("meta-компонент с вложенными объектами в fields", () => {
       const attrs = parseAttributes(
-        'context=${{user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" }}}'
+        'fields=${{user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" }}}'
       )
       expect(attrs).toEqual({
-        context: '{ user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" } }',
+        fields: '{ user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" } }',
       })
     })
 
-    it("meta-компонент с функциями в core", () => {
+    it("meta-компонент с функциями в mass", () => {
       const attrs = parseAttributes(
-        "core=${{actions: { save: saveData, delete: deleteData }, utils: { format: formatText }}}"
+        "mass=${{actions: { save: saveData, delete: deleteData }, utils: { format: formatText }}}"
       )
       expect(attrs).toEqual({
-        core: "{ actions: { save: saveData, delete: deleteData }, utils: { format: formatText } }",
+        mass: "{ actions: { save: saveData, delete: deleteData }, utils: { format: formatText } }",
       })
     })
 
-    it("meta-компонент с template literals в context", () => {
+    it("meta-компонент с template literals в fields", () => {
       const attrs = parseAttributes(
-        'context=${{apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws`}}'
+        'fields=${{apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws`}}'
       )
       expect(attrs).toEqual({
-        context: '{ apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws` }',
+        fields: '{ apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws` }',
       })
     })
 
-    it("meta-компонент с пустым context", () => {
-      const attrs = parseAttributes("context=${{}}")
+    it("meta-компонент с пустым fields", () => {
+      const attrs = parseAttributes("fields=${{}}")
       expect(attrs).toEqual({})
     })
 
-    it("meta-компонент с пустым core", () => {
-      const attrs = parseAttributes("core=${{}}")
+    it("meta-компонент с пустым mass", () => {
+      const attrs = parseAttributes("mass=${{}}")
       expect(attrs).toEqual({})
     })
 
-    it("meta-компонент с context, core и другими атрибутами", () => {
+    it("meta-компонент с fields, core и другими атрибутами", () => {
       const attrs = parseAttributes(
-        'class="container" context=${{user: currentUser}} core=${{state: appState}} data-testid="meta-component"'
+        'class="container" fields=${{user: currentUser}} mass=${{state: appState}} data-testid="meta-component"'
       )
       expect(attrs).toEqual({
-        context: "{ user: currentUser }",
-        core: "{ state: appState }",
+        fields: "{ user: currentUser }",
+        mass: "{ state: appState }",
         string: {
           class: { type: "static", value: "container" },
           "data-testid": { type: "static", value: "meta-component" },
diff --git a/attribute/test/data/attrs.spec.ts b/attribute/test/data/attrs.spec.ts
index 6fff911..b45bad7 100644
--- a/attribute/test/data/attrs.spec.ts
+++ b/attribute/test/data/attrs.spec.ts
@@ -86,7 +86,7 @@ describe("атрибуты", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ flag: boolean }>(
-        ({ html, context }) => html`<div title="${context.flag ? "a > b" : "c < d"}"></div>`
+        ({ html, fields }) => html`<div title="${fields.flag ? "a > b" : "c < d"}"></div>`
       )
     })
     it("data", () => {
@@ -96,7 +96,7 @@ describe("атрибуты", () => {
           type: "el",
           string: {
             title: {
-              data: "/context/flag",
+              data: "/fields/flag",
               expr: '${_[0] ? "a > b" : "c < d"}',
             },
           },
@@ -109,7 +109,7 @@ describe("атрибуты", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ flag: boolean }>(
-        ({ html, context }) => html`<div title=${context.flag ? "a > b" : "c < d"}></div>`
+        ({ html, fields }) => html`<div title=${fields.flag ? "a > b" : "c < d"}></div>`
       )
     })
     it("data", () => {
@@ -119,7 +119,7 @@ describe("атрибуты", () => {
           type: "el",
           string: {
             title: {
-              data: "/context/flag",
+              data: "/fields/flag",
               expr: '${_[0] ? "a > b" : "c < d"}',
             },
           },
@@ -133,7 +133,7 @@ describe("атрибуты", () => {
     beforeAll(() => {
       elements = parse<{ flag: boolean }>(
         // prettier-ignore
-        ({ html, context }) => html`<div title='${context.flag ? "a > b" : "c < d"}'></div>`
+        ({ html, fields }) => html`<div title='${fields.flag ? "a > b" : "c < d"}'></div>`
       )
     })
     it("data", () => {
@@ -143,7 +143,7 @@ describe("атрибуты", () => {
           type: "el",
           string: {
             title: {
-              data: "/context/flag",
+              data: "/fields/flag",
               expr: '${_[0] ? "a > b" : "c < d"}',
             },
           },
@@ -156,7 +156,7 @@ describe("атрибуты", () => {
 describe("булевы атрибуты", () => {
   let elements: Node[]
   beforeAll(() => {
-    elements = parse<{ flag: boolean }>(({ html, context }) => html`<button ${context.flag && "disabled"}></button>`)
+    elements = parse<{ flag: boolean }>(({ html, fields }) => html`<button ${fields.flag && "disabled"}></button>`)
   })
   it("data", () => {
     expect(elements).toEqual([
@@ -165,7 +165,7 @@ describe("булевы атрибуты", () => {
         type: "el",
         boolean: {
           disabled: {
-            data: "/context/flag",
+            data: "/fields/flag",
           },
         },
       },
@@ -177,9 +177,9 @@ describe("класс в map", () => {
   let elements: Node[]
   beforeAll(() => {
     elements = parse<any, { items: { type: string; name: string }[] }>(
-      ({ html, core }) => html`
+      ({ html, mass }) => html`
         <ul>
-          ${core.items.map((item) => html`<li class="item-${item.type}" title="${item.name}">${item.name}</li>`)}
+          ${mass.items.map((item) => html`<li class="item-${item.type}" title="${item.name}">${item.name}</li>`)}
         </ul>
       `
     )
@@ -192,7 +192,7 @@ describe("класс в map", () => {
         child: [
           {
             type: "map",
-            data: "/core/items",
+            data: "/mass/items",
             child: [
               {
                 tag: "li",
@@ -225,7 +225,7 @@ describe("сложные условные атрибуты class", () => {
   let elements: Node[]
   beforeAll(() => {
     elements = parse<{ active: boolean }>(
-      ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}">Content</div>`
+      ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}">Content</div>`
     )
   })
   it("data", () => {
@@ -235,7 +235,7 @@ describe("сложные условные атрибуты class", () => {
         type: "el",
         string: {
           class: {
-            data: "/core/active",
+            data: "/mass/active",
             expr: 'div-${_[0] ? "active" : "inactive"}',
           },
         },
diff --git a/attribute/test/data/boolean.spec.ts b/attribute/test/data/boolean.spec.ts
index ddf49a1..4c8355f 100644
--- a/attribute/test/data/boolean.spec.ts
+++ b/attribute/test/data/boolean.spec.ts
@@ -19,9 +19,9 @@ describe("boolean атрибуты", () => {
           }[]
         }
       >(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.companies.map(
+            ${mass.companies.map(
               (company) => html`
                 <section ${company.active && "data-active"}>
                   ${company.departments.map(
@@ -47,7 +47,7 @@ describe("boolean атрибуты", () => {
           child: [
             {
               type: "map",
-              data: "/core/companies",
+              data: "/mass/companies",
               child: [
                 {
                   tag: "section",
@@ -94,7 +94,7 @@ describe("boolean атрибуты", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { visible: boolean }>(
-        ({ html, context }) => html`<img src="https://example.com" ${context.visible ? "visible" : "hidden"} />`
+        ({ html, fields }) => html`<img src="https://example.com" ${fields.visible ? "visible" : "hidden"} />`
       )
     })
     it("data", () => {
@@ -107,10 +107,10 @@ describe("boolean атрибуты", () => {
           },
           boolean: {
             visible: {
-              data: "/context/visible",
+              data: "/fields/visible",
             },
             hidden: {
-              data: "/context/visible",
+              data: "/fields/visible",
               expr: "!_[0]",
             },
           },
diff --git a/attribute/test/data/class.spec.ts b/attribute/test/data/class.spec.ts
index 731d60a..2bd37d4 100644
--- a/attribute/test/data/class.spec.ts
+++ b/attribute/test/data/class.spec.ts
@@ -63,7 +63,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"}"></div>`
+          ({ html, mass }) => html`<div class="${mass.active ? "active" : "inactive"}"></div>`
         )
       })
 
@@ -74,7 +74,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: '${_[0] ? "active" : "inactive"}',
               },
             },
@@ -87,7 +87,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class=${core.active ? "active" : "inactive"}></div>`
+          ({ html, mass }) => html`<div class=${mass.active ? "active" : "inactive"}></div>`
         )
       })
       it("data", () => {
@@ -97,7 +97,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: '${_[0] ? "active" : "inactive"}',
               },
             },
@@ -110,8 +110,8 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`
-            <div class="${core.active ? "active" : "inactive"} ${core.active ? "active" : "inactive"}"></div>
+          ({ html, mass }) => html`
+            <div class="${mass.active ? "active" : "inactive"} ${mass.active ? "active" : "inactive"}"></div>
           `
         )
       })
@@ -124,11 +124,11 @@ describe("class атрибуты в data.ts", () => {
             array: {
               class: [
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
               ],
@@ -142,7 +142,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ count: number }>(
-          ({ html, core }) => html`<div class="${core.count > 5 ? "large" : "small"}"></div>`
+          ({ html, mass }) => html`<div class="${mass.count > 5 ? "large" : "small"}"></div>`
         )
       })
       it("data", () => {
@@ -152,7 +152,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/count",
+                data: "/mass/count",
                 expr: '${_[0] > 5 ? "large" : "small"}',
               },
             },
@@ -165,7 +165,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ status: string }>(
-          ({ html, core }) => html`<div class="${core.status === "loading" ? "loading" : "ready"}"></div>`
+          ({ html, mass }) => html`<div class="${mass.status === "loading" ? "loading" : "ready"}"></div>`
         )
       })
       it("data", () => {
@@ -175,7 +175,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/status",
+                data: "/mass/status",
                 expr: '${_[0] === "loading" ? "loading" : "ready"}',
               },
             },
@@ -189,7 +189,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean; visible: boolean }>(
-          ({ html, core }) => html`<div class="${core.active && core.visible ? "show" : "hide"}"></div>`
+          ({ html, mass }) => html`<div class="${mass.active && mass.visible ? "show" : "hide"}"></div>`
         )
       })
       it("data", () => {
@@ -199,7 +199,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: ["/core/active", "/core/visible"],
+                data: ["/mass/active", "/mass/visible"],
                 expr: '${_[0] && _[1] ? "show" : "hide"}',
               },
             },
@@ -213,7 +213,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ error: boolean; warning: boolean }>(
-          ({ html, core }) => html`<div class="${core.error || core.warning ? "alert" : "normal"}"></div>`
+          ({ html, mass }) => html`<div class="${mass.error || mass.warning ? "alert" : "normal"}"></div>`
         )
       })
       it("data", () => {
@@ -223,7 +223,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: ["/core/error", "/core/warning"],
+                data: ["/mass/error", "/mass/warning"],
                 expr: '${_[0] || _[1] ? "alert" : "normal"}',
               },
             },
@@ -237,7 +237,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ disabled: boolean }>(
-          ({ html, core }) => html`<div class="${!core.disabled ? "enabled" : "disabled"}"></div>`
+          ({ html, mass }) => html`<div class="${!mass.disabled ? "enabled" : "disabled"}"></div>`
         )
       })
       it("data", () => {
@@ -247,7 +247,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/disabled",
+                data: "/mass/disabled",
                 expr: '${!_[0] ? "enabled" : "disabled"}',
               },
             },
@@ -260,7 +260,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse<{ active: boolean }>(({ html, core }) => html`<div class="${core.active && "active"}"></div>`)
+        elements = parse<{ active: boolean }>(({ html, mass }) => html`<div class="${mass.active && "active"}"></div>`)
       })
       it("data", () => {
         expect(elements).toEqual([
@@ -269,7 +269,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: '${_[0] && "active"}',
               },
             },
@@ -285,7 +285,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
+          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}"></div>`
         )
       })
       it("data", () => {
@@ -295,7 +295,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: 'div-${_[0] ? "active" : "inactive"}',
               },
             },
@@ -309,7 +309,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"}"></div>`
+          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"}"></div>`
         )
       })
 
@@ -320,7 +320,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: 'div-${_[0] ? "active" : "inactive"}',
               },
             },
@@ -334,9 +334,9 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) =>
+          ({ html, mass }) =>
             html`<div
-              class="div-${core.active ? "active" : "inactive"} div-${core.active ? "active" : "inactive"}"></div>`
+              class="div-${mass.active ? "active" : "inactive"} div-${mass.active ? "active" : "inactive"}"></div>`
         )
       })
       it("data", () => {
@@ -347,11 +347,11 @@ describe("class атрибуты в data.ts", () => {
             array: {
               class: [
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: 'div-${_[0] ? "active" : "inactive"}',
                 },
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: 'div-${_[0] ? "active" : "inactive"}',
                 },
               ],
@@ -368,7 +368,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="div-${core.active ? "active" : "inactive"} visible"></div>`
+          ({ html, mass }) => html`<div class="div-${mass.active ? "active" : "inactive"} visible"></div>`
         )
       })
       it("data", () => {
@@ -379,7 +379,7 @@ describe("class атрибуты в data.ts", () => {
             array: {
               class: [
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: 'div-${_[0] ? "active" : "inactive"}',
                 },
                 "visible",
@@ -395,7 +395,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="${core.active ? "active" : "inactive"} visible"></div>`
+          ({ html, mass }) => html`<div class="${mass.active ? "active" : "inactive"} visible"></div>`
         )
       })
       it("data", () => {
@@ -406,7 +406,7 @@ describe("class атрибуты в data.ts", () => {
             array: {
               class: [
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
                 "visible",
@@ -422,8 +422,8 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean; type: string }>(
-          ({ html, core }) =>
-            html`<div class="static-value ${core.active ? "active" : "inactive"} mixed-${core.type}"></div>`
+          ({ html, mass }) =>
+            html`<div class="static-value ${mass.active ? "active" : "inactive"} mixed-${mass.type}"></div>`
         )
       })
       it("data", () => {
@@ -435,11 +435,11 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "static-value",
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
                 {
-                  data: "/core/type",
+                  data: "/mass/type",
                   expr: "mixed-${_[0]}",
                 },
               ],
@@ -454,7 +454,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ variant: string; size: string; theme: string }>(
-          ({ html, core }) => html`<div class="btn-${core.variant} text-${core.size} bg-${core.theme}"></div>`
+          ({ html, mass }) => html`<div class="btn-${mass.variant} text-${mass.size} bg-${mass.theme}"></div>`
         )
       })
       it("data", () => {
@@ -465,15 +465,15 @@ describe("class атрибуты в data.ts", () => {
             array: {
               class: [
                 {
-                  data: "/core/variant",
+                  data: "/mass/variant",
                   expr: "btn-${_[0]}",
                 },
                 {
-                  data: "/core/size",
+                  data: "/mass/size",
                   expr: "text-${_[0]}",
                 },
                 {
-                  data: "/core/theme",
+                  data: "/mass/theme",
                   expr: "bg-${_[0]}",
                 },
               ],
@@ -488,9 +488,9 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean; disabled: boolean }>(
-          ({ html, core }) =>
+          ({ html, mass }) =>
             html`<div
-              class="base-class ${core.active ? "active" : "inactive"} ${core.disabled ? "disabled" : ""}"></div>`
+              class="base-class ${mass.active ? "active" : "inactive"} ${mass.disabled ? "disabled" : ""}"></div>`
         )
       })
       it("data", () => {
@@ -502,11 +502,11 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "base-class",
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
                 {
-                  data: "/core/disabled",
+                  data: "/mass/disabled",
                   expr: '${_[0] ? "disabled" : ""}',
                 },
               ],
@@ -521,7 +521,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ nested: boolean }>(
-          ({ html, core }) => html`<div class="container ${core.nested ? "nested" : "default"}"></div>`
+          ({ html, mass }) => html`<div class="container ${mass.nested ? "nested" : "default"}"></div>`
         )
       })
       it("data", () => {
@@ -533,7 +533,7 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "container",
                 {
-                  data: "/core/nested",
+                  data: "/mass/nested",
                   expr: '${_[0] ? "nested" : "default"}',
                 },
               ],
@@ -548,8 +548,8 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ hidden: boolean; active: boolean }>(
-          ({ html, core }) =>
-            html`<div class="visible ${core.hidden ? "" : "show"} ${core.active ? "active" : ""}"></div>`
+          ({ html, mass }) =>
+            html`<div class="visible ${mass.hidden ? "" : "show"} ${mass.active ? "active" : ""}"></div>`
         )
       })
       it("data", () => {
@@ -561,11 +561,11 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "visible",
                 {
-                  data: "/core/hidden",
+                  data: "/mass/hidden",
                   expr: '${_[0] ? "" : "show"}',
                 },
                 {
-                  data: "/core/active",
+                  data: "/mass/active",
                   expr: '${_[0] ? "active" : ""}',
                 },
               ],
@@ -580,7 +580,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<{ active: boolean }>(
-          ({ html, core }) => html`<div class="static-value-${core.active ? "active" : "inactive"}"></div>`
+          ({ html, mass }) => html`<div class="static-value-${mass.active ? "active" : "inactive"}"></div>`
         )
       })
       it("data", () => {
@@ -590,7 +590,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: 'static-value-${_[0] ? "active" : "inactive"}',
               },
             },
@@ -604,7 +604,7 @@ describe("class атрибуты в data.ts", () => {
 
       beforeAll(() => {
         elements = parse<any, { user: { id: string; role: string }; theme: string }>(
-          ({ html, core }) => html`<div class="user-${core.user.id}-${core.user.role}-${core.theme}"></div>`
+          ({ html, mass }) => html`<div class="user-${mass.user.id}-${mass.user.role}-${mass.theme}"></div>`
         )
       })
       it("data", () => {
@@ -614,7 +614,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: ["/core/user/id", "/core/user/role", "/core/theme"],
+                data: ["/mass/user/id", "/mass/user/role", "/mass/theme"],
                 expr: "user-${_[0]}-${_[1]}-${_[2]}",
               },
             },
@@ -635,9 +635,9 @@ describe("class атрибуты в data.ts", () => {
             isActive: boolean
           }
         >(
-          ({ html, core }) =>
+          ({ html, mass }) =>
             html`<div
-              class="user-${core.user.id}-${core.user.role}-${core.theme}-${core.isActive
+              class="user-${mass.user.id}-${mass.user.role}-${mass.theme}-${mass.isActive
                 ? "active"
                 : "inactive"}"></div>`
         )
@@ -649,7 +649,7 @@ describe("class атрибуты в data.ts", () => {
             type: "el",
             string: {
               class: {
-                data: ["/core/user/id", "/core/user/role", "/core/theme", "/core/isActive"],
+                data: ["/mass/user/id", "/mass/user/role", "/mass/theme", "/mass/isActive"],
                 expr: 'user-${_[0]}-${_[1]}-${_[2]}-${_[3] ? "active" : "inactive"}',
               },
             },
@@ -662,7 +662,7 @@ describe("class атрибуты в data.ts", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<any, { user: { id: string; role: string }; theme: string }>(
-          ({ html, core }) => html`<div class="base user-${core.user.id}-${core.user.role} theme-${core.theme}"></div>`
+          ({ html, mass }) => html`<div class="base user-${mass.user.id}-${mass.user.role} theme-${mass.theme}"></div>`
         )
       })
       it("data", () => {
@@ -674,11 +674,11 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "base",
                 {
-                  data: ["/core/user/id", "/core/user/role"],
+                  data: ["/mass/user/id", "/mass/user/role"],
                   expr: "user-${_[0]}-${_[1]}",
                 },
                 {
-                  data: "/core/theme",
+                  data: "/mass/theme",
                   expr: "theme-${_[0]}",
                 },
               ],
@@ -700,15 +700,15 @@ describe("class атрибуты в data.ts", () => {
             isAdmin: boolean
           }
         >(
-          ({ html, core }) =>
+          ({ html, mass }) =>
             html`
               <div
                 class="
               base 
-              user-${core.user.id} 
-              ${core.isActive ? "active" : "inactive"} 
-              ${core.isAdmin ? "admin" : "user"} 
-              theme-${core.theme}
+              user-${mass.user.id} 
+              ${mass.isActive ? "active" : "inactive"} 
+              ${mass.isAdmin ? "admin" : "user"} 
+              theme-${mass.theme}
               "></div>
             `
         )
@@ -722,19 +722,19 @@ describe("class атрибуты в data.ts", () => {
               class: [
                 "base",
                 {
-                  data: "/core/user/id",
+                  data: "/mass/user/id",
                   expr: "user-${_[0]}",
                 },
                 {
-                  data: "/core/isActive",
+                  data: "/mass/isActive",
                   expr: '${_[0] ? "active" : "inactive"}',
                 },
                 {
-                  data: "/core/isAdmin",
+                  data: "/mass/isAdmin",
                   expr: '${_[0] ? "admin" : "user"}',
                 },
                 {
-                  data: "/core/theme",
+                  data: "/mass/theme",
                   expr: "theme-${_[0]}",
                 },
               ],
@@ -748,7 +748,7 @@ describe("class атрибуты в data.ts", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ status: boolean }>(
-        ({ html, context }) => html`<div class="${context.status ? "active" : "inactive"}-status">Status</div>`
+        ({ html, fields }) => html`<div class="${fields.status ? "active" : "inactive"}-status">Status</div>`
       )
     })
     it("data", () => {
@@ -758,7 +758,7 @@ describe("class атрибуты в data.ts", () => {
           type: "el",
           string: {
             class: {
-              data: "/context/status",
+              data: "/fields/status",
               expr: '${_[0] ? "active" : "inactive"}-status',
             },
           },
diff --git a/attribute/test/data/cond.spec.ts b/attribute/test/data/cond.spec.ts
index 04c487e..1c9e047 100644
--- a/attribute/test/data/cond.spec.ts
+++ b/attribute/test/data/cond.spec.ts
@@ -6,8 +6,8 @@ describe("условные выражения в атрибутах", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ count: number }>(
-        ({ html, context }) => html`
-          <div class="${10 > context.count && context.count < 3 ? "active" : "inactive"}">Content</div>
+        ({ html, fields }) => html`
+          <div class="${10 > fields.count && fields.count < 3 ? "active" : "inactive"}">Content</div>
         `
       )
     })
@@ -18,7 +18,7 @@ describe("условные выражения в атрибутах", () => {
           type: "el",
           string: {
             class: {
-              data: "/context/count",
+              data: "/fields/count",
               expr: '${10 > _[0] && _[0] < 3 ? "active" : "inactive"}',
             },
           },
@@ -36,8 +36,8 @@ describe("условные выражения в атрибутах", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ isActive: boolean; status: "waiting" | "running"; item: string }>(
-        ({ html, context, core }) => html`
-          <div class="${core.isActive === context.isActive ? `${context.item}-active-${context.status}` : "inactive"}">
+        ({ html, fields, mass }) => html`
+          <div class="${mass.isActive === fields.isActive ? `${fields.item}-active-${fields.status}` : "inactive"}">
             Content
           </div>
         `
@@ -50,7 +50,7 @@ describe("условные выражения в атрибутах", () => {
           type: "el",
           string: {
             class: {
-              data: ["/core/isActive", "/context/isActive", "/context/item", "/context/status"],
+              data: ["/mass/isActive", "/fields/isActive", "/fields/item", "/fields/status"],
               expr: '${_[0] === _[1] ? `${_[2]}-active-${_[3]}` : "inactive"}',
             },
           },
diff --git a/attribute/test/data/events.spec.ts b/attribute/test/data/events.spec.ts
index 09dc32d..6219e7c 100644
--- a/attribute/test/data/events.spec.ts
+++ b/attribute/test/data/events.spec.ts
@@ -5,7 +5,7 @@ describe("events", () => {
   describe("onclick с выражением", () => {
     let elements: Node[]
     beforeAll(() => {
-      elements = parse(({ html, core }) => html`<button onclick=${() => core.onClick()}>OK</button>`)
+      elements = parse(({ html, mass }) => html`<button onclick=${() => mass.onClick()}>OK</button>`)
     })
     it("data", () => {
       expect(elements, "должен распознать onclick и не сериализовать функцию").toEqual([
@@ -14,7 +14,7 @@ describe("events", () => {
           type: "el",
           event: {
             onclick: {
-              data: "/core/onClick",
+              data: "/mass/onClick",
               expr: "() => _[0]()",
             },
           },
@@ -32,7 +32,7 @@ describe("events", () => {
   describe("onclick без кавычек со стрелочной функцией", () => {
     let elements: Node[]
     beforeAll(() => {
-      elements = parse(({ html, core }) => html`<button onclick=${core.onClick}>OK</button>`)
+      elements = parse(({ html, mass }) => html`<button onclick=${mass.onClick}>OK</button>`)
     })
     it("data", () => {
       expect(elements, "onclick без кавычек со стрелочной функцией").toEqual([
@@ -41,7 +41,7 @@ describe("events", () => {
           type: "el",
           event: {
             onclick: {
-              data: "/core/onClick",
+              data: "/mass/onClick",
             },
           },
           child: [{ type: "text", value: "OK" }],
@@ -75,7 +75,7 @@ describe("events", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse(
-        ({ html, core }) => html`<input onclick=${() => core.onClick()} oninput="${(e: Event) => core.onInput(e)}" />`
+        ({ html, mass }) => html`<input onclick=${() => mass.onClick()} oninput="${(e: Event) => mass.onInput(e)}" />`
       )
     })
     it("data", () => {
@@ -85,11 +85,11 @@ describe("events", () => {
           type: "el",
           event: {
             onclick: {
-              data: "/core/onClick",
+              data: "/mass/onClick",
               expr: "() => _[0]()",
             },
             oninput: {
-              data: "/core/onInput",
+              data: "/mass/onInput",
               expr: "(e) => _[0](e)",
             },
           },
@@ -102,7 +102,7 @@ describe("events", () => {
     let elements: Node[]
 
     beforeAll(() => {
-      elements = parse(({ html, core }) => html`<input oninput=${(e: Event) => core.onInput(e)} />`)
+      elements = parse(({ html, mass }) => html`<input oninput=${(e: Event) => mass.onInput(e)} />`)
     })
     it("data", () => {
       expect(elements, "oninput без кавычек со стрелочной функцией").toEqual([
@@ -111,7 +111,7 @@ describe("events", () => {
           type: "el",
           event: {
             oninput: {
-              data: "/core/onInput",
+              data: "/mass/onInput",
               expr: "(e) => _[0](e)",
             },
           },
@@ -125,9 +125,9 @@ describe("events", () => {
 
     beforeAll(() => {
       elements = parse<any, { items: { name: string; onClick: () => void }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.items.map((item) => html`<li onclick=${() => item.onClick()}>${item.name}</li>`)}
+            ${mass.items.map((item) => html`<li onclick=${() => item.onClick()}>${item.name}</li>`)}
           </ul>
         `
       )
@@ -141,7 +141,7 @@ describe("events", () => {
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: "li",
@@ -172,9 +172,9 @@ describe("events", () => {
 
     beforeAll(() => {
       elements = parse<any, { buttons: { id: string; text: string; handleClick: (e: Event, id: string) => void }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.buttons.map(
+            ${mass.buttons.map(
               (btn) => html` <button onclick=${(e: Event) => btn.handleClick(e, btn.id)}>${btn.text}</button> `
             )}
           </div>
@@ -190,7 +190,7 @@ describe("events", () => {
           child: [
             {
               type: "map",
-              data: "/core/buttons",
+              data: "/mass/buttons",
               child: [
                 {
                   tag: "button",
@@ -224,10 +224,10 @@ describe("events", () => {
         any,
         { handleSubmit: (e: Event) => void; handleChange: (e: Event) => void; onClick: () => void }
       >(
-        ({ html, core }) => html`
-          <form onsubmit=${(e: Event) => core.handleSubmit(e)} class="form" method="post">
-            <input type="text" onchange=${(e: Event) => core.handleChange(e)} />
-            <button type="submit" onclick=${() => core.onClick()}>Submit</button>
+        ({ html, mass }) => html`
+          <form onsubmit=${(e: Event) => mass.handleSubmit(e)} class="form" method="post">
+            <input type="text" onchange=${(e: Event) => mass.handleChange(e)} />
+            <button type="submit" onclick=${() => mass.onClick()}>Submit</button>
           </form>
         `
       )
@@ -240,7 +240,7 @@ describe("events", () => {
           type: "el",
           event: {
             onsubmit: {
-              data: "/core/handleSubmit",
+              data: "/mass/handleSubmit",
               expr: "(e) => _[0](e)",
             },
           },
@@ -257,7 +257,7 @@ describe("events", () => {
               },
               event: {
                 onchange: {
-                  data: "/core/handleChange",
+                  data: "/mass/handleChange",
                   expr: "(e) => _[0](e)",
                 },
               },
@@ -270,7 +270,7 @@ describe("events", () => {
               },
               event: {
                 onclick: {
-                  data: "/core/onClick",
+                  data: "/mass/onClick",
                   expr: "() => _[0]()",
                 },
               },
@@ -292,8 +292,8 @@ describe("events", () => {
 
     beforeAll(() => {
       elements = parse<any, { onClick: () => void; isDisabled: boolean }>(
-        ({ html, core }) => html`
-          <button onclick=${() => core.onClick()} ${core.isDisabled && "disabled"}>Click me</button>
+        ({ html, mass }) => html`
+          <button onclick=${() => mass.onClick()} ${mass.isDisabled && "disabled"}>Click me</button>
         `
       )
     })
@@ -304,13 +304,13 @@ describe("events", () => {
           type: "el",
           event: {
             onclick: {
-              data: "/core/onClick",
+              data: "/mass/onClick",
               expr: "() => _[0]()",
             },
           },
           boolean: {
             disabled: {
-              data: "/core/isDisabled",
+              data: "/mass/isDisabled",
             },
           },
           child: [
@@ -353,9 +353,9 @@ describe("events", () => {
           }[]
         }
       >(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.companies.map(
+            ${mass.companies.map(
               (company) => html`
                 <section onclick=${() => company.handleCompanyClick(company.id)}>
                   <h1>Company: ${company.name}</h1>
@@ -396,7 +396,7 @@ describe("events", () => {
           child: [
             {
               type: "map",
-              data: "/core/companies",
+              data: "/mass/companies",
               child: [
                 {
                   tag: "section",
diff --git a/attribute/test/data/style.spec.ts b/attribute/test/data/style.spec.ts
index 504f036..21acec3 100644
--- a/attribute/test/data/style.spec.ts
+++ b/attribute/test/data/style.spec.ts
@@ -16,9 +16,9 @@ describe("object атрибуты (стили) с переменными из р
     }
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.companies.map(
+            ${mass.companies.map(
               (company) => html`
                 <section style="${{ backgroundColor: company.theme }}">
                   ${company.departments.map(
@@ -47,7 +47,7 @@ describe("object атрибуты (стили) с переменными из р
           child: [
             {
               type: "map",
-              data: "/core/companies",
+              data: "/mass/companies",
               child: [
                 {
                   tag: "section",
@@ -105,9 +105,9 @@ describe("object атрибуты (стили) с переменными из р
           }[]
         }
       >(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.users.map(
+            ${mass.users.map(
               (user) => html`
                 <div
                   style="${{
@@ -132,7 +132,7 @@ describe("object атрибуты (стили) с переменными из р
           child: [
             {
               type: "map",
-              data: "/core/users",
+              data: "/mass/users",
               child: [
                 {
                   tag: "div",
diff --git a/attribute/test/data/update.spec.ts b/attribute/test/data/update.spec.ts
index f171a26..0060a0a 100644
--- a/attribute/test/data/update.spec.ts
+++ b/attribute/test/data/update.spec.ts
@@ -68,7 +68,7 @@ describe("update", () => {
 
     beforeAll(() => {
       elements = parse<{ count: number }>(
-        ({ html, update, context }) => html` <button onclick=${() => update({ count: context.count + 1 })}>OK</button> `
+        ({ html, update, fields }) => html` <button onclick=${() => update({ count: fields.count + 1 })}>OK</button> `
       )
     })
     it("data", () => {
@@ -79,7 +79,7 @@ describe("update", () => {
           event: {
             onclick: {
               upd: "count",
-              data: "/context/count",
+              data: "/fields/count",
               expr: "() => update({ count: _[0] + 1 })",
             },
           },
@@ -94,14 +94,14 @@ describe("update", () => {
     })
   })
 
-  describe("функция обновления контекста данными из core и context", () => {
+  describe("функция обновления fields данными из mass и fields", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse<{ count: number; iteration: number }>(
-        ({ html, update, core, context }) =>
+        ({ html, update, mass, fields }) =>
           html`
-            <button onclick=${() => update({ count: core.count + context.count, iteration: context.iteration + 1 })}>
+            <button onclick=${() => update({ count: mass.count + fields.count, iteration: fields.iteration + 1 })}>
               OK
             </button>
           `
@@ -116,7 +116,7 @@ describe("update", () => {
           event: {
             onclick: {
               upd: ["count", "iteration"],
-              data: ["/core/count", "/context/count", "/context/iteration"],
+              data: ["/mass/count", "/fields/count", "/fields/iteration"],
               expr: "() => update({ count: _[0] + _[1], iteration: _[2] + 1 })",
             },
           },
@@ -131,7 +131,7 @@ describe("update", () => {
     })
   })
 
-  describe("функция обновления контекста данными из core и context внутри массива вложенного в массив", () => {
+  describe("функция обновления fields данными из mass и fields внутри массива вложенного в массив", () => {
     let elements: Node[]
 
     beforeAll(() => {
@@ -139,11 +139,11 @@ describe("update", () => {
         { count: number; iteration: number },
         { items: { count: number; iteration: number }[]; count: number; iteration: number }
       >(
-        ({ html, update, core }) =>
+        ({ html, update, mass }) =>
           html`
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
-                <button onclick=${() => update({ count: core.count + item.count, iteration: item.iteration + 1 })}>
+                <button onclick=${() => update({ count: mass.count + item.count, iteration: item.iteration + 1 })}>
                   OK
                 </button>
               `
@@ -155,7 +155,7 @@ describe("update", () => {
       expect(elements).toEqual([
         {
           type: "map",
-          data: "/core/items",
+          data: "/mass/items",
           child: [
             {
               tag: "button",
@@ -163,7 +163,7 @@ describe("update", () => {
               event: {
                 onclick: {
                   upd: ["count", "iteration"],
-                  data: ["/core/count", "[item]/count", "[item]/iteration"],
+                  data: ["/mass/count", "[item]/count", "[item]/iteration"],
                   expr: "() => update({ count: _[0] + _[1], iteration: _[2] + 1 })",
                 },
               },
diff --git a/attribute/test/event.test.ts b/attribute/test/event.test.ts
index 670c45f..df4c968 100644
--- a/attribute/test/event.test.ts
+++ b/attribute/test/event.test.ts
@@ -6,10 +6,10 @@ describe("event", () => {
   it("update в функции", () => {
     const attributes = [
       {
-        tag: "meta-${core.tag}",
+        tag: "meta-${mass.tag}",
         type: "meta",
         event: {
-          onclick: "() => update({ selected: core.id })",
+          onclick: "() => update({ selected: mass.id })",
         },
       },
     ] as PartsAttr
@@ -18,13 +18,13 @@ describe("event", () => {
     expect(data).toEqual([
       {
         tag: {
-          data: "/core/tag",
+          data: "/mass/tag",
           expr: "meta-${_[0]}",
         },
         type: "meta",
         event: {
           onclick: {
-            data: "/core/id",
+            data: "/mass/id",
             expr: "() => update({ selected: _[0] })",
             upd: "selected",
           },
diff --git a/index.spec.ts b/index.spec.ts
index 6c5caff..a26f9fa 100644
--- a/index.spec.ts
+++ b/index.spec.ts
@@ -6,15 +6,15 @@ describe("parse", () => {
     type state = "offline" | "online"
     // #region params
     const result = parse<{ attempt: number }, { ice: { url: string }[] }, state>(
-      ({ html, context, update, core, state }) => html`
+      ({ html, fields, update, mass, state }) => html`
         <h1>Config</h1>
         <ul>
-          ${core.ice.map((server) => html`<li>Url: ${server.url}</li>`)}
+          ${mass.ice.map((server) => html`<li>Url: ${server.url}</li>`)}
         </ul>
         <h1>State</h1>
         <p>${state}</p>
         ${state === "offline" &&
-        html` <button onclick=${() => update({ attempt: context.attempt + 1 })}>Connect</button>`}
+        html` <button onclick=${() => update({ attempt: fields.attempt + 1 })}>Connect</button>`}
       `
     )
     // #endregion params
@@ -22,10 +22,10 @@ describe("parse", () => {
   })
   it("парсит простой HTML с переменными", () => {
     const result = parse(
-      ({ html, context }) => html`
-        <div class="${context.userStatus}">
-          <h1>Hello ${context.userName}!</h1>
-          <p>You have ${context.messageCount} messages</p>
+      ({ html, fields }) => html`
+        <div class="${fields.userStatus}">
+          <h1>Hello ${fields.userName}!</h1>
+          <p>You have ${fields.messageCount} messages</p>
         </div>
       `
     )
@@ -54,9 +54,9 @@ describe("parse", () => {
 
   it("парсит HTML с map операциями", () => {
     const result = parse(
-      ({ html, context }) => html`
+      ({ html, fields }) => html`
         <ul>
-          ${context.usersList}
+          ${fields.usersList}
         </ul>
       `
     )
@@ -69,14 +69,14 @@ describe("parse", () => {
     const textNode = ul.child[0]
     expect(textNode).toMatchObject({
       type: "text",
-      data: "/context/usersList",
+      data: "/fields/usersList",
     })
   })
 
   it("парсит HTML с условиями", () => {
     const result = parse(
-      ({ html, context }) => html`
-        <div>${context.isAdmin ? html` <button>Admin Panel</button> ` : html` <span>Access denied</span> `}</div>
+      ({ html, fields }) => html`
+        <div>${fields.isAdmin ? html` <button>Admin Panel</button> ` : html` <span>Access denied</span> `}</div>
       `
     )
 
@@ -88,7 +88,7 @@ describe("parse", () => {
     const conditionNode = div.child[0]
     expect(conditionNode).toMatchObject({
       type: "cond",
-      data: "/context/isAdmin",
+      data: "/fields/isAdmin",
     })
 
     const trueBranch = conditionNode.child[0]
@@ -110,9 +110,9 @@ describe("parse", () => {
 
   it("парсит HTML с событиями и динамическими атрибутами", () => {
     const result = parse(
-      ({ html, context }) => html`
-        <button class="${context.isActive ? "active" : ""}" disabled="${!context.canEdit}">
-          ${context.buttonText}
+      ({ html, fields }) => html`
+        <button class="${fields.isActive ? "active" : ""}" disabled="${!fields.canEdit}">
+          ${fields.buttonText}
         </button>
       `
     )
@@ -125,24 +125,24 @@ describe("parse", () => {
     })
 
     expect(button.string.class).toMatchObject({
-      data: "/context/isActive",
+      data: "/fields/isActive",
       expr: '${_[0] ? "active" : ""}',
     })
 
     expect(button.string.disabled).toMatchObject({
-      data: "/context/canEdit",
+      data: "/fields/canEdit",
       expr: "${!_[0]}",
     })
 
     expect(button.child[0]).toMatchObject({
       type: "text",
-      data: "/context/buttonText",
+      data: "/fields/buttonText",
     })
   })
 
   it("парсит статический HTML без переменных", () => {
     const result = parse(
-      ({ html }) => html`
+      ({ html, fields }) => html`
         <div>
           <h1>Static Title</h1>
           <p>Static content</p>
@@ -178,7 +178,7 @@ describe("parse", () => {
   })
 
   it("парсит вложенные map операции", () => {
-    const result = parse(({ html, context }) => html` <div class="dashboard">${context.departmentsList}</div> `)
+    const result = parse(({ html, fields }) => html` <div class="dashboard">${fields.departmentsList}</div> `)
 
     expect(result).toHaveLength(1)
     const dashboard = result[0] as any
@@ -188,7 +188,7 @@ describe("parse", () => {
     const textNode = dashboard.child[0]
     expect(textNode).toMatchObject({
       type: "text",
-      data: "/context/departmentsList",
+      data: "/fields/departmentsList",
     })
   })
 })
diff --git a/index.t.ts b/index.t.ts
index c466bed..3395da0 100644
--- a/index.t.ts
+++ b/index.t.ts
@@ -15,16 +15,16 @@ export type { ValueStyle } from "./attribute/style.t"
 export type { ValueStatic, ValueVariable, ValueDynamic } from "./parser.t"
 
 /**
- * Контекст.
+ * Поля.
  *
- * {@link https://zavx0z.github.io/context/types/Values | Контекстные значения}
+ * {@link https://zavx0z.github.io/fields/types/Values | Значения полей}
  * содержат простые данные, доступные в шаблоне для рендеринга.
  * Поддерживает только примитивные типы и массивы примитивных типов.
  *
  * @group Шаблонизатор
  * @example
  * ```typescript
- * const context: Context = {
+ * const fields: Fields = {
  *   framework: "MetaFor",
  *   isActive: true,
  *   tags: ["tag1", "tag2", "tag3"]
@@ -32,17 +32,17 @@ export type { ValueStatic, ValueVariable, ValueDynamic } from "./parser.t"
  * }
  * ```
  */
-export type Context = Record<string, string | number | boolean | null | Array<string | number | boolean>>
+export type Fields = Record<string, string | number | boolean | null | Array<string | number | boolean>>
 
 /**
- * Core объект.
+ * Mass объект.
  * Содержит сложные данные, объекты, функции и утилиты, доступные в шаблоне.
  * Может содержать любые типы данных: объекты, массивы, функции, классы.
  *
  * @group Шаблонизатор
  * @example
  * ```typescript
- * const core: Core = {
+ * const mass: Mass = {
  *   user: {
  *     name: "Иван",
  *     profile: {
@@ -65,7 +65,7 @@ export type Context = Record<string, string | number | boolean | null | Array<st
  * }
  * ```
  */
-export type Core = Record<string, any>
+export type Mass = Record<string, any>
 
 /**
  * Состояние приложения.
@@ -86,23 +86,23 @@ export type State = string
  *
  * @group Шаблонизатор
  */
-export type Params<C extends Context, I extends Core = Core, S extends State = State> = {
+export type Params<F extends Fields, M extends Mass = Mass, S extends State = State> = {
   /** Функция для создания HTML из template literals */
   html: (strings: TemplateStringsArray, ...values: any[]) => string
   /**
-   * @inheritdoc Core
+   * @inheritdoc Mass
    */
-  core: I
+  mass: M
   /**
-   * @inheritdoc Context
+   * @inheritdoc Fields
    */
-  context: C
+  fields: F
   /**
    * @inheritdoc State
    */
   state: S
   /**
-   * Функция для обновления контекста {@link https://zavx0z.github.io/context/types/Update | Update}.
+   * Функция для обновления полей {@link https://zavx0z.github.io/fields/types/Update | Update}.
    * Используется в обработчиках событий для изменения состояния.
    *
    * @example
@@ -114,18 +114,18 @@ export type Params<C extends Context, I extends Core = Core, S extends State = S
    * update({ name: "John", age: 25 })
    *
    * // В обработчике события
-   * html`<button onclick=${() => update({ active: !context.active })}>Toggle</button>`
+   * html`<button onclick=${() => update({ active: !fields.active })}>Toggle</button>`
    * ```
    */
-  update: (context: Partial<C>) => void
+  update: (fields: Partial<F>) => void
 }
 
 /**
  * Парсит HTML-шаблон и возвращает обогащенную иерархию с метаданными о путях к данным.
  *
- * @param template - Функция шаблонизатора, которая принимает параметры { html, context, core, state, update }
+ * @param template - Функция шаблонизатора, которая принимает параметры { html, fields, mass, state, update }
  * @returns Массив узлов с полной структурой и метаданными о путях к данным
  */
-export declare function parse<C extends Context = Context, I extends Core = Core, S extends State = State>(
-  template: (params: Params<C, I, S>) => void
+export declare function parse<F extends Fields = Fields, M extends Mass = Mass, S extends State = State>(
+  template: (params: Params<F, M, S>) => void
 ): NodeType[]
diff --git a/index.ts b/index.ts
index 96a5904..f926b76 100644
--- a/index.ts
+++ b/index.ts
@@ -1,6 +1,6 @@
 import { createNode } from "./node"
 import type { NodeType } from "./node/index.t"
-import type { Params, Context, Core, State } from "./index.t"
+import type { Params, Fields, Mass, State } from "./index.t"
 import { extractHtmlElements } from "./parser"
 
 export type { NodeType as Node }
@@ -16,11 +16,11 @@ export type { NodeType as Node }
  * - События и динамические атрибуты
  * - Web Components
  *
- * @param template - Template-функция вида ({ html, context, core, state }) => html`...`
+ * @param template - Template-функция вида ({ html, fields, mass, state }) => html`...`
  * @returns Обогащенная иерархия с метаданными о путях к данным
  */
-export const parse = <C extends Context = Context, I extends Core = Core, S extends State = State>(
-  template: (params: Params<C, I, S>) => void
+export const parse = <F extends Fields = Fields, M extends Mass = Mass, S extends State = State>(
+  template: (params: Params<F, M, S>) => void
 ): NodeType[] => {
   const mainHtml = extractMainHtmlBlock(template)
   const hierarchy = extractHtmlElements(mainHtml)
diff --git a/node/condition.t.ts b/node/condition.t.ts
index ab391f2..c9f1ce3 100644
--- a/node/condition.t.ts
+++ b/node/condition.t.ts
@@ -11,7 +11,7 @@ import type { PartAttrMeta } from "./meta.t"
  * @example Простое условие
  * ```html
  * <div>
- *   ${context.isLoggedIn ? html`<span>Добро пожаловать, ${context.name}!</span>` : html`<a href="/login">Войти</a>`}
+ *   ${fields.isLoggedIn ? html`<span>Добро пожаловать, ${fields.name}!</span>` : html`<a href="/login">Войти</a>`}
  * </div>
  * ```
  *
@@ -23,7 +23,7 @@ import type { PartAttrMeta } from "./meta.t"
  *   "child": [
  *     {
  *       "type": "cond",
- *       "data": "/context/isLoggedIn",
+ *       "data": "/fields/isLoggedIn",
  *       "child": [
  *         {
  *           "tag": "span",
@@ -31,7 +31,7 @@ import type { PartAttrMeta } from "./meta.t"
  *           "child": [
  *             {
  *               "type": "text",
- *               "data": "/context/name",
+ *               "data": "/fields/name",
  *               "expr": "Добро пожаловать, ${[0]}!"
  *             }
  *           ]
@@ -58,7 +58,7 @@ import type { PartAttrMeta } from "./meta.t"
  * @example Сложное условие
  * ```html
  * <div>
- *   ${core.role === 'admin' && core.permissions.includes('write') ?
+ *   ${mass.role === 'admin' && mass.permissions.includes('write') ?
  *     html`<button>Редактировать</button>` :
  *     html`<span>Нет прав</span>`
  *   }
@@ -105,8 +105,8 @@ import type { PartAttrMeta } from "./meta.t"
  * @example Условие с проверкой массива
  * ```html
  * <div>
- *   ${core.posts.length > 0 ?
- *     html`<ul>${core.posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
+ *   ${mass.posts.length > 0 ?
+ *     html`<ul>${mass.posts.map(post => html`<li>${post.title}</li>`)}</ul>` :
  *     html`<p>Постов пока нет</p>`
  *   }
  * </div>
@@ -120,7 +120,7 @@ import type { PartAttrMeta } from "./meta.t"
  *   "child": [
  *     {
  *       "type": "cond",
- *       "data": "/core/posts.length",
+ *       "data": "/mass/posts.length",
  *       "expr": "${[0]} > 0",
  *       "child": [
  *         {
@@ -129,7 +129,7 @@ import type { PartAttrMeta } from "./meta.t"
  *           "child": [
  *             {
  *               "type": "map",
- *               "data": "/core/posts",
+ *               "data": "/mass/posts",
  *               "child": [
  *                 {
  *                   "tag": "li",
@@ -175,14 +175,14 @@ export interface NodeCondition {
    *
    * @example Простой путь
    * ```typescript
-   * data: "/context/isLoggedIn"
+   * data: "/fields/isLoggedIn"
    * ```
    *
    * ---
    *
    * @example Массив путей
    * ```typescript
-   * data: ["/context/isAdmin", "/core/role"]
+   * data: ["/fields/isAdmin", "/mass/role"]
    * ```
    */
   data: string | string[]
diff --git a/node/element.t.ts b/node/element.t.ts
index 2a1199f..af1366b 100644
--- a/node/element.t.ts
+++ b/node/element.t.ts
@@ -86,7 +86,7 @@ export interface NodeElement extends Attributes {
    * ```typescript
    * child: [
    *   { type: "text", value: "Привет" },
-   *   { type: "text", data: "/context/user/name" }
+   *   { type: "text", data: "/fields/user/name" }
    * ]
    * ```
    */
diff --git a/node/index.t.ts b/node/index.t.ts
index 6c390b7..0c32550 100644
--- a/node/index.t.ts
+++ b/node/index.t.ts
@@ -20,7 +20,7 @@ import type { PartAttrElement } from "./element.t"
  * @example Структура с различными типами узлов
  * ```html
  * <div class="container">
- *   <h1>${context.title}</h1>
+ *   <h1>${fields.title}</h1>
  *   ${context.isLoggedIn ?
  *     html`<span>Добро пожаловать!</span>` :
  *     html`<a href="/login">Войти</a>`
@@ -30,7 +30,7 @@ import type { PartAttrElement } from "./element.t"
  *       ${core.notifications.map(n => html`<li>${n.message}</li>`)}
  *     </ul>
  *   `}
- *   <meta-component core="config" context="userData">
+ *   <meta-component mass="config" fields="userData">
  *     <p>Содержимое компонента</p>
  *   </meta-component>
  * </div>
diff --git a/node/logical.spec.ts b/node/logical.spec.ts
index f31aad8..9f7991a 100644
--- a/node/logical.spec.ts
+++ b/node/logical.spec.ts
@@ -10,9 +10,9 @@ describe("логические операторы с условиями", () =>
     beforeAll(() => {
       // prettier-ignore
       // #region parse
-      elements = parse<Context, Core>(({ html, context, core }) => html`
+      elements = parse<{ isAdmin: boolean }, { user: { role: string } }>(({ html, fields, mass }) => html`
           <div>
-            ${core.user && context.isAdmin && html`
+            ${mass.user && fields.isAdmin && html`
               <div class="admin">Admin Panel</div>
             `}
           </div>
@@ -30,7 +30,7 @@ describe("логические операторы с условиями", () =>
             child: [
               {
                 type: "log",
-                data: ["/core/user", "/context/isAdmin"],
+                data: ["/mass/user", "/fields/isAdmin"],
                 expr: "_[0] && _[1]",
                 child: [
                   {
diff --git a/node/logical.t.ts b/node/logical.t.ts
index 60b48ff..5012184 100644
--- a/node/logical.t.ts
+++ b/node/logical.t.ts
@@ -12,7 +12,7 @@ import type { PartAttrMeta } from "./meta.t"
  * @example Простое логическое условие
  * ```html
  * <div>
- *   ${context.isAdmin && html`<button>Админ-панель</button>`}
+ *   ${fields.isAdmin && html`<button>Админ-панель</button>`}
  * </div>
  * ```
  *
@@ -24,7 +24,7 @@ import type { PartAttrMeta } from "./meta.t"
  *   "child": [
  *     {
  *       "type": "log",
- *       "data": "/context/isAdmin",
+ *       "data": "/fields/isAdmin",
  *       "child": [
  *         {
  *           "tag": "button",
@@ -45,9 +45,9 @@ import type { PartAttrMeta } from "./meta.t"
  * @example Логическое условие с проверкой массива
  * ```html
  * <div>
- *   ${core.notifications.length > 0 && html`
+ *   ${mass.notifications.length > 0 && html`
  *     <div class="notifications">
- *       ${core.notifications.map(n => html`<div>${n.message}</div>`)}
+ *       ${mass.notifications.map(n => html`<div>${n.message}</div>`)}
  *     </div>
  *   `}
  * </div>
@@ -61,7 +61,7 @@ import type { PartAttrMeta } from "./meta.t"
  *   "child": [
  *     {
  *       "type": "log",
- *       "data": "/core/notifications.length",
+ *       "data": "/mass/notifications.length",
  *       "expr": "${[0]} > 0",
  *       "child": [
  *         {
@@ -73,7 +73,7 @@ import type { PartAttrMeta } from "./meta.t"
  *           "child": [
  *             {
  *               "type": "map",
- *               "data": "/core/notifications",
+ *               "data": "/mass/notifications",
  *               "child": [
  *                 {
  *                   "tag": "div",
@@ -115,14 +115,14 @@ export interface NodeLogical {
    *
    * @example Простой путь
    * ```typescript
-   * data: "/context/isAdmin"
+   * data: "/fields/isAdmin"
    * ```
    *
    * ---
    *
    * @example Массив путей
    * ```typescript
-   * data: ["/context/notifications", "/context/count"]
+   * data: ["/fields/notifications", "/fields/count"]
    * ```
    */
   data: string | string[]
diff --git a/node/map.t.ts b/node/map.t.ts
index 3a3c071..5e5cc7e 100644
--- a/node/map.t.ts
+++ b/node/map.t.ts
@@ -22,7 +22,7 @@ import type { PartText } from "./text.t"
  * @example Итерация с индексом
  * ```html
  * <ul>
- *   ${core.items.map((item, index) => html`
+ *   ${mass.items.map((item, index) => html`
  *     <li class=${index % 2 === 0 ? 'even' : 'odd'}>
  *       ${index + 1}. ${item.name}
  *     </li>
@@ -38,7 +38,7 @@ import type { PartText } from "./text.t"
  *   "child": [
  *     {
  *       "type": "map",
- *       "data": "/core/items",
+ *       "data": "/mass/items",
  *       "child": [
  *         {
  *           "tag": "li",
@@ -66,7 +66,7 @@ import type { PartText } from "./text.t"
  * @example Вложенная итерация
  * ```html
  * <div>
- *   ${core.categories.map(category => html`
+ *   ${mass.categories.map(category => html`
  *     <section>
  *       <h1>${category.name}</h1>
  *       ${category.products.map(product => html`
@@ -85,7 +85,7 @@ import type { PartText } from "./text.t"
  *   "child": [
  *     {
  *       "type": "map",
- *       "data": "/core/categories",
+ *       "data": "/mass/categories",
  *       "child": [
  *         {
  *           "tag": "section",
@@ -147,12 +147,12 @@ export interface NodeMap {
    *
    * @example Простой путь
    * ```typescript
-   * data: "/context/users"
+   * data: "/fields/users"
    * ```
    *
    * @example Вложенный путь
    * ```typescript
-   * data: "/core/products"
+   * data: "/mass/products"
    * ```
    */
   data: string
diff --git a/node/meta.t.ts b/node/meta.t.ts
index c120916..1e96201 100644
--- a/node/meta.t.ts
+++ b/node/meta.t.ts
@@ -19,14 +19,14 @@ import type { NodeType } from "./index.t"
  *
  * @example Динамический мета-тег
  * ```html
- * <meta-${core.actorHash} class="dynamic">
+ * <meta-${mass.actorHash} class="dynamic">
  *   <p>Динамический компонент</p>
- * </meta-${core.actorHash}>
+ * </meta-${mass.actorHash}>
  * ```
  *
- * @example Мета-элемент с core и context
+ * @example Мета-элемент с mass и fields
  * ```html
- * <meta-widget core=${core.widgetConfig} context=${core.userData}>
+ * <meta-widget mass=${mass.widgetConfig} fields=${mass.userData}>
  *   <div>Виджет с конфигурацией</div>
  * </meta-widget>
  * ```
@@ -36,7 +36,7 @@ import type { NodeType } from "./index.t"
  * - `tag` - имя мета-тега (статическое или динамическое)
  * - `child` - дочерние элементы (опционально)
  * - Атрибуты: `event`, `boolean`, `array`, `string`, `style`
- * - Свойства: `core`, `context`
+ * - Свойства: `mass`, `fields`
  */
 
 export interface NodeMeta extends Attributes {
@@ -46,16 +46,16 @@ export interface NodeMeta extends Attributes {
   type: "meta"
   /** Дочерние элементы (опционально) */
   child?: NodeType[]
-  /** Core свойство для meta-компонентов (передача core объекта) */
-  core?: ValueStatic | ValueDynamic | ValueVariable
-  /** Context свойство для meta-компонентов (передача context объекта) */
-  context?: ValueStatic | ValueDynamic | ValueVariable
+  /** mass свойство для meta-компонентов (передача mass объекта) */
+  mass?: ValueStatic | ValueDynamic | ValueVariable
+  /** fields свойство для meta-компонентов (передача fields объекта) */
+  fields?: ValueStatic | ValueDynamic | ValueVariable
 }
 export interface PartAttrMeta extends AttrNodeElement {
   /** Тип узла */
   type: "meta"
-  /** Core объекты */
-  core?: string
-  /** Context объекты */
-  context?: string
+  /** mass объекты */
+  mass?: string
+  /** fields объекты */
+  fields?: string
 }
diff --git a/node/meta.ts b/node/meta.ts
index 1e77e63..e5c5f5d 100644
--- a/node/meta.ts
+++ b/node/meta.ts
@@ -19,11 +19,11 @@ export const createNodeDataMeta = (
     ...(node.child && { child: node.child.map((child) => createNode(child, context)) }),
   }
   // Обрабатываем семантические атрибуты
-  if ("core" in node && node.core) {
-    result.core = processSemanticAttributes(node.core, context) || node.core
+  if ("mass" in node && node.mass) {
+    result.mass = processSemanticAttributes(node.mass, context) || node.mass
   }
-  if ("context" in node && node.context) {
-    result.context = processSemanticAttributes(node.context, context) || node.context
+  if ("fields" in node && node.fields) {
+    result.fields = processSemanticAttributes(node.fields, context) || node.fields
   }
   return result
 }
diff --git a/node/test/cond/conditions.test.ts b/node/test/cond/conditions.test.ts
index f711a65..adaa4ef 100644
--- a/node/test/cond/conditions.test.ts
+++ b/node/test/cond/conditions.test.ts
@@ -7,7 +7,7 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse(
-        ({ html, context }) => html` <div>${context.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
+        ({ html, fields }) => html` <div>${fields.cond ? html`<em>A</em>` : html`<span>b</span>`}</div> `
       )
     })
     it("data", () => {
@@ -18,7 +18,7 @@ describe("conditions", () => {
           child: [
             {
               type: "cond",
-              data: "/context/cond",
+              data: "/fields/cond",
               child: [
                 {
                   tag: "em",
@@ -53,10 +53,10 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div>
             <header>Header</header>
-            ${context.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
+            ${fields.isActive ? html`<span>Active</span>` : html`<span>Inactive</span>`}
             <footer>Footer</footer>
           </div>
         `
@@ -81,7 +81,7 @@ describe("conditions", () => {
             },
             {
               type: "cond",
-              data: "/context/isActive",
+              data: "/fields/isActive",
               child: [
                 {
                   tag: "span",
@@ -126,8 +126,8 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse(
-        ({ html, context }) =>
-          html`<div>${context.cond && context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
+        ({ html, fields }) =>
+          html`<div>${fields.cond && fields.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>`
       )
     })
 
@@ -139,7 +139,7 @@ describe("conditions", () => {
           child: [
             {
               type: "cond",
-              data: ["/context/cond", "/context/cond2"],
+              data: ["/fields/cond", "/fields/cond2"],
               expr: "_[0] && _[1]",
               child: [
                 {
@@ -165,8 +165,8 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse(
-        ({ html, context }) => html`
-          <div>${context.cond === context.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
+        ({ html, fields }) => html`
+          <div>${fields.cond === fields.cond2 ? html`<em>A</em>` : html`<span>b</span>`}</div>
         `
       )
     })
@@ -178,7 +178,7 @@ describe("conditions", () => {
           child: [
             {
               type: "cond",
-              data: ["/context/cond", "/context/cond2"],
+              data: ["/fields/cond", "/fields/cond2"],
               expr: "_[0] === _[1]",
               child: [
                 {
@@ -203,7 +203,7 @@ describe("conditions", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ a: number; b: number; c: number; d: number }>(
-        ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
+        ({ html, fields }) => html`${fields.a < fields.b && fields.c > fields.d ? "1" : "0"}`
       )
     })
 
@@ -211,7 +211,7 @@ describe("conditions", () => {
       expect(elements).toEqual([
         {
           type: "text",
-          data: ["/context/a", "/context/b", "/context/c", "/context/d"],
+          data: ["/fields/a", "/fields/b", "/fields/c", "/fields/d"],
           expr: '${_[0] < _[1] && _[2] > _[3] ? "1" : "0"}',
         },
       ])
@@ -222,7 +222,7 @@ describe("conditions", () => {
     let elements: Node[]
 
     beforeAll(() => {
-      elements = parse(({ html, context }) => html`<div>${context.flag ? html`<br />` : html`<img src="x" />`}</div>`)
+      elements = parse(({ html, fields }) => html`<div>${fields.flag ? html`<br />` : html`<img src="x" />`}</div>`)
     })
 
     it("data", () => {
@@ -233,7 +233,7 @@ describe("conditions", () => {
           child: [
             {
               type: "cond",
-              data: "/context/flag",
+              data: "/fields/flag",
               child: [
                 {
                   tag: "br",
@@ -259,9 +259,9 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse<any, { items: { show: boolean }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.items.map((item) =>
+            ${mass.items.map((item) =>
               item.show ? html`<div class="true-branch"></div>` : html`<div class="false-branch"></div>`
             )}
           </div>
@@ -276,7 +276,7 @@ describe("conditions", () => {
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   type: "cond",
@@ -311,9 +311,9 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse<{ list: string[] }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <ul>
-            ${context.list.map(
+            ${fields.list.map(
               (_, i) => html` <li>${i % 2 ? html` <em>${"A"}</em> ` : html` <strong>${"B"}</strong>`}</li> `
             )}
           </ul>
@@ -328,7 +328,7 @@ describe("conditions", () => {
           child: [
             {
               type: "map",
-              data: "/context/list",
+              data: "/fields/list",
               child: [
                 {
                   tag: "li",
@@ -376,14 +376,14 @@ describe("conditions", () => {
 
     beforeAll(() => {
       elements = parse<{ a: number; b: number; c: number; d: number }>(
-        ({ html, context }) => html`${context.a < context.b && context.c > context.d ? "1" : "0"}`
+        ({ html, fields }) => html`${fields.a < fields.b && fields.c > fields.d ? "1" : "0"}`
       )
     })
     it("data", () => {
       expect(elements).toEqual([
         {
           type: "text",
-          data: ["/context/a", "/context/b", "/context/c", "/context/d"],
+          data: ["/fields/a", "/fields/b", "/fields/c", "/fields/d"],
           expr: '${_[0] < _[1] && _[2] > _[3] ? "1" : "0"}',
         },
       ])
diff --git a/node/test/cond/formatting.test.ts b/node/test/cond/formatting.test.ts
index 41ce935..846039c 100644
--- a/node/test/cond/formatting.test.ts
+++ b/node/test/cond/formatting.test.ts
@@ -7,13 +7,13 @@ describe("formatting", () => {
 
     beforeAll(() => {
       elements = parse<any, { flag: boolean }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div>
-            <span class="${context.flag ? "active" : "inactive"}">
-              Status: ${context.flag ? "Active" : "Inactive"}</span
+            <span class="${fields.flag ? "active" : "inactive"}">
+              Status: ${fields.flag ? "Active" : "Inactive"}</span
             >
-            <p class="${context.flag && context.flag ? "double-active" : "not-active"}">
-              ${context.flag ? "This is a very long text that should be formatted properly" : "Short text"}
+            <p class="${fields.flag && fields.flag ? "double-active" : "not-active"}">
+              ${fields.flag ? "This is a very long text that should be formatted properly" : "Short text"}
             </p>
           </div>
         `
@@ -89,15 +89,15 @@ describe("formatting", () => {
 
     beforeAll(() => {
       elements = parse<any, { theme: string; size: string }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div>
-            <button class="btn ${context.theme === "dark" ? "btn-dark" : "btn-light"} ${context.size || "medium"}">
+            <button class="btn ${fields.theme === "dark" ? "btn-dark" : "btn-light"} ${fields.size || "medium"}">
               Click me
             </button>
             <input
               type="text"
-              class="input ${context.theme === "dark" ? "input-dark" : "input-light"}"
-              placeholder="${context.size === "large" ? "Enter large text here" : "Enter text here"}" />
+              class="input ${fields.theme === "dark" ? "input-dark" : "input-light"}"
+              placeholder="${fields.size === "large" ? "Enter large text here" : "Enter text here"}" />
           </div>
         `
       )
diff --git a/node/test/cond/logical.test.ts b/node/test/cond/logical.test.ts
index bd8ae3f..a02976b 100644
--- a/node/test/cond/logical.test.ts
+++ b/node/test/cond/logical.test.ts
@@ -7,13 +7,13 @@ describe("логические операторы в условиях", () => {
 
     beforeAll(() => {
       elements = parse<{ showDetails: boolean }, { user: { name: string; isVerified: boolean } }>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div>
-            ${core.user && context.showDetails
+            ${mass.user && fields.showDetails
               ? html`
                   <div class="user-profile">
-                    <h2>${core.user.name}</h2>
-                    ${core.user.isVerified && html` <span class="verified-badge">VERIFIED</span> `}
+                    <h2>${mass.user.name}</h2>
+                    ${mass.user.isVerified && html` <span class="verified-badge">VERIFIED</span> `}
                     <p>User details</p>
                   </div>
                 `
@@ -35,7 +35,7 @@ describe("логические операторы в условиях", () => {
           child: [
             {
               type: "cond",
-              data: ["/core/user", "/context/showDetails"],
+              data: ["/mass/user", "/fields/showDetails"],
               expr: "_[0] && _[1]",
               child: [
                 {
@@ -51,13 +51,13 @@ describe("логические операторы в условиях", () => {
                       child: [
                         {
                           type: "text",
-                          data: "/core/user/name",
+                          data: "/mass/user/name",
                         },
                       ],
                     },
                     {
                       type: "log",
-                      data: "/core/user/isVerified",
+                      data: "/mass/user/isVerified",
                       child: [
                         {
                           tag: "span",
@@ -118,13 +118,13 @@ describe("логические операторы в условиях", () => {
 
     beforeAll(() => {
       elements = parse<{ isAdmin: boolean }, { user: { role: string; isActive: boolean } }>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div>
-            ${core.user && core.user.role === "admin" && context.isAdmin
+            ${mass.user && mass.user.role === "admin" && fields.isAdmin
               ? html`
                   <div class="admin-dashboard">
                     <h1>Admin Dashboard</h1>
-                    ${core.user.isActive &&
+                    ${mass.user.isActive &&
                     html`
                       <div class="active-admin">
                         <span class="status">Active</span>
@@ -152,7 +152,7 @@ describe("логические операторы в условиях", () => {
           child: [
             {
               type: "cond",
-              data: ["/core/user", "/core/user/role", "/context/isAdmin"],
+              data: ["/mass/user", "/mass/user/role", "/fields/isAdmin"],
               expr: '_[0] && _[1] === "admin" && _[2]',
               child: [
                 {
@@ -174,7 +174,7 @@ describe("логические операторы в условиях", () => {
                     },
                     {
                       type: "log",
-                      data: "/core/user/isActive",
+                      data: "/mass/user/isActive",
                       child: [
                         {
                           tag: "div",
diff --git a/node/test/cond/nested.test.ts b/node/test/cond/nested.test.ts
index 0bafc59..d5428ee 100644
--- a/node/test/cond/nested.test.ts
+++ b/node/test/cond/nested.test.ts
@@ -6,10 +6,10 @@ describe("вложенные условия", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { flag1: boolean; flag2: boolean }>(
-        ({ html, context }) => html`
-          ${context.flag1
+        ({ html, fields }) => html`
+          ${fields.flag1
             ? html`<div class="flag1"></div>`
-            : context.flag2
+            : fields.flag2
             ? html`<div class="flag2"></div>`
             : html`<div class="flag3"></div>`}
         `
@@ -19,7 +19,7 @@ describe("вложенные условия", () => {
       expect(elements).toEqual([
         {
           type: "cond",
-          data: "/context/flag1",
+          data: "/fields/flag1",
           child: [
             {
               tag: "div",
@@ -30,7 +30,7 @@ describe("вложенные условия", () => {
             },
             {
               type: "cond",
-              data: "/context/flag2",
+              data: "/fields/flag2",
               child: [
                 {
                   tag: "div",
@@ -56,10 +56,10 @@ describe("вложенные условия", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { hasPermission: boolean; isAdmin: boolean }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div>
-            ${context.hasPermission
-              ? context.isAdmin
+            ${fields.hasPermission
+              ? fields.isAdmin
                 ? html`
                     <div>
                       <button class="admin">Admin Action</button>
@@ -83,11 +83,11 @@ describe("вложенные условия", () => {
           child: [
             {
               type: "cond",
-              data: "/context/hasPermission",
+              data: "/fields/hasPermission",
               child: [
                 {
                   type: "cond",
-                  data: "/context/isAdmin",
+                  data: "/fields/isAdmin",
                   child: [
                     {
                       tag: "div",
@@ -138,11 +138,11 @@ describe("вложенные условия", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { hasPermission: boolean; isAdmin: boolean; isSuperAdmin: boolean }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div>
-            ${context.hasPermission
-              ? context.isAdmin
-                ? context.isSuperAdmin
+            ${fields.hasPermission
+              ? fields.isAdmin
+                ? fields.isSuperAdmin
                   ? html`<div class="super-admin">Super Admin Panel</div>`
                   : html`<div class="admin">Admin Panel</div>`
                 : html`<div class="user">User Panel</div>`
@@ -159,15 +159,15 @@ describe("вложенные условия", () => {
           child: [
             {
               type: "cond",
-              data: "/context/hasPermission",
+              data: "/fields/hasPermission",
               child: [
                 {
                   type: "cond",
-                  data: "/context/isAdmin",
+                  data: "/fields/isAdmin",
                   child: [
                     {
                       type: "cond",
-                      data: "/context/isSuperAdmin",
+                      data: "/fields/isSuperAdmin",
                       child: [
                         {
                           tag: "div",
diff --git a/node/test/cond/sibling.test.ts b/node/test/cond/sibling.test.ts
index 6c18c2c..71a3082 100644
--- a/node/test/cond/sibling.test.ts
+++ b/node/test/cond/sibling.test.ts
@@ -10,12 +10,12 @@ describe("условия соседствующие", () => {
     let elements: Node[]
 
     beforeAll(() => {
-      elements = parse<Context, {}>(
-        ({ html, context }) => html`
-          ${context.flag1
+      elements = parse<{ flag1: boolean; flag2: boolean }, {}>(
+        ({ html, fields }) => html`
+          ${fields.flag1
             ? html`<div class="conditional1">Content 1</div>`
             : html`<div class="fallback1">No content 1</div>`}
-          ${context.flag2
+          ${fields.flag2
             ? html`<div class="conditional2">Content 2</div>`
             : html`<div class="fallback2">No content 2</div>`}
         `
@@ -25,7 +25,7 @@ describe("условия соседствующие", () => {
       expect(elements).toEqual([
         {
           type: "cond",
-          data: "/context/flag1",
+          data: "/fields/flag1",
           child: [
             {
               tag: "div",
@@ -57,7 +57,7 @@ describe("условия соседствующие", () => {
         },
         {
           type: "cond",
-          data: "/context/flag2",
+          data: "/fields/flag2",
           child: [
             {
               tag: "div",
@@ -96,12 +96,12 @@ describe("условия соседствующие", () => {
 
     beforeAll(() => {
       elements = parse<{ flag1: boolean; flag2: boolean }, {}>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div class="container">
-            ${context.flag1
+            ${fields.flag1
               ? html`<div class="conditional1">Content 1</div>`
               : html`<div class="fallback1">No content 1</div>`}
-            ${context.flag2
+            ${fields.flag2
               ? html`<div class="conditional2">Content 2</div>`
               : html`<div class="fallback2">No content 2</div>`}
           </div>
@@ -119,7 +119,7 @@ describe("условия соседствующие", () => {
           child: [
             {
               type: "cond",
-              data: "/context/flag1",
+              data: "/fields/flag1",
               child: [
                 {
                   tag: "div",
@@ -151,7 +151,7 @@ describe("условия соседствующие", () => {
             },
             {
               type: "cond",
-              data: "/context/flag2",
+              data: "/fields/flag2",
               child: [
                 {
                   tag: "div",
@@ -192,17 +192,17 @@ describe("условия соседствующие", () => {
 
     beforeAll(() => {
       elements = parse<{ flag1: boolean; flag2: boolean; flag3: boolean }, {}>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <div class="level1">
             <div class="level2">
               <div class="level3">
-                ${context.flag1
+                ${fields.flag1
                   ? html`<div class="conditional1">Content 1</div>`
                   : html`<div class="fallback1">No content 1</div>`}
-                ${context.flag2
+                ${fields.flag2
                   ? html`<div class="conditional2">Content 2</div>`
                   : html`<div class="fallback2">No content 2</div>`}
-                ${context.flag3
+                ${fields.flag3
                   ? html`<div class="conditional3">Content 3</div>`
                   : html`<div class="fallback3">No content 3</div>`}
               </div>
@@ -236,7 +236,7 @@ describe("условия соседствующие", () => {
                   child: [
                     {
                       type: "cond",
-                      data: "/context/flag1",
+                      data: "/fields/flag1",
                       child: [
                         {
                           tag: "div",
@@ -268,7 +268,7 @@ describe("условия соседствующие", () => {
                     },
                     {
                       type: "cond",
-                      data: "/context/flag2",
+                      data: "/fields/flag2",
                       child: [
                         {
                           tag: "div",
@@ -300,7 +300,7 @@ describe("условия соседствующие", () => {
                     },
                     {
                       type: "cond",
-                      data: "/context/flag3",
+                      data: "/fields/flag3",
                       child: [
                         {
                           tag: "div",
diff --git a/node/test/data.spec.ts b/node/test/data.spec.ts
index 7dc004e..3930883 100644
--- a/node/test/data.spec.ts
+++ b/node/test/data.spec.ts
@@ -7,14 +7,14 @@ import { parseText } from "../text"
 describe("data-parser", () => {
   describe("parseMap", () => {
     it("парсит простой map с одним параметром", () => {
-      const result = parseMap("context.list.map((name) => html`")
-      expect(result.path).toBe("/context/list")
+      const result = parseMap("fields.list.map((name) => html`")
+      expect(result.path).toBe("/fields/list")
       expect(result.metadata?.params).toEqual(["name"])
     })
 
     it("парсит map с деструктуризацией", () => {
-      const result = parseMap("core.data.map(({ title, nested }) => html`")
-      expect(result.path).toBe("/core/data")
+      const result = parseMap("mass.data.map(({ title, nested }) => html`")
+      expect(result.path).toBe("/mass/data")
       expect(result.metadata?.params).toEqual(["title", "nested"])
     })
 
@@ -25,14 +25,14 @@ describe("data-parser", () => {
     })
 
     it("парсит вложенный map в контексте", () => {
-      const context = { currentPath: "/core/list", pathStack: ["/core/list"], level: 1, mapParams: ["item"] }
+      const context = { currentPath: "/mass/list", pathStack: ["/mass/list"], level: 1, mapParams: ["item"] }
       const result = parseMap("nested.map((n) => html`", context)
       expect(result.path).toBe("[item]/nested")
       expect(result.metadata?.params).toEqual(["n"])
     })
 
     it("парсит вложенный map с полным путем", () => {
-      const context = { currentPath: "/core/list", pathStack: ["/core/list"], level: 1, mapParams: ["item"] }
+      const context = { currentPath: "/mass/list", pathStack: ["/mass/list"], level: 1, mapParams: ["item"] }
       const result = parseMap("item.nested.map((n) => html`", context)
       expect(result.path).toBe("[item]/nested")
     })
@@ -72,20 +72,20 @@ describe("data-parser", () => {
 
   describe("parseCondition", () => {
     it("парсит простое условие", () => {
-      const result = parseCondition("context.flag")
-      expect(result.path).toBe("/context/flag")
+      const result = parseCondition("fields.flag")
+      expect(result.path).toBe("/fields/flag")
       expect(result.metadata?.expression).toBe("_[0]")
     })
 
     it("парсит сложное условие", () => {
-      const result = parseCondition("context.cond && context.cond2")
-      expect(result.path).toEqual(["/context/cond", "/context/cond2"])
+      const result = parseCondition("fields.cond && fields.cond2")
+      expect(result.path).toEqual(["/fields/cond", "/fields/cond2"])
       expect(result.metadata?.expression).toBe("_[0] && _[1]")
     })
 
     it("парсит условие с операторами", () => {
-      const result = parseCondition("context.flag === context.cond2")
-      expect(result.path).toEqual(["/context/flag", "/context/cond2"])
+      const result = parseCondition("fields.flag === fields.cond2")
+      expect(result.path).toEqual(["/fields/flag", "/fields/cond2"])
       expect(result.metadata?.expression).toBe("_[0] === _[1]")
     })
   })
@@ -106,7 +106,7 @@ describe("data-parser", () => {
     })
 
     it("парсит текст с переменной в контексте map", () => {
-      const context = { currentPath: "/context/list", pathStack: ["/context/list"], level: 1, mapParams: ["name"] }
+      const context = { currentPath: "/fields/list", pathStack: ["/fields/list"], level: 1, mapParams: ["name"] }
       const result = parseText("Hello, ${name}!", context)
       expect(result.data).toBe("[item]")
       expect(result.expr).toBe("Hello, ${_[0]}!")
@@ -186,7 +186,7 @@ describe("data-parser", () => {
       const enriched = enrichWithData([
         {
           type: "map",
-          text: "context.list.map((name) => html`",
+          text: "fields.list.map((name) => html`",
           child: [
             {
               type: "el",
@@ -203,7 +203,7 @@ describe("data-parser", () => {
       ])
       expect(enriched[0]?.type).toBe("map")
       const mapNode = enriched[0] as any
-      expect(mapNode.data).toBe("/context/list")
+      expect(mapNode.data).toBe("/fields/list")
       expect(mapNode.child?.[0]?.child?.[0]?.data).toBe("[item]")
     })
 
@@ -211,7 +211,7 @@ describe("data-parser", () => {
       const enriched = enrichWithData([
         {
           type: "cond",
-          text: "context.flag",
+          text: "fields.flag",
           child: [
             { type: "el", tag: "div", child: [] },
             { type: "el", tag: "span", child: [] },
@@ -220,7 +220,7 @@ describe("data-parser", () => {
       ])
       expect(enriched[0]?.type).toBe("cond")
       const condNode = enriched[0] as any
-      expect(condNode.data).toBe("/context/flag")
+      expect(condNode.data).toBe("/fields/flag")
       expect(condNode.expr).toBeUndefined()
     })
   })
diff --git a/node/test/logical/logical.test.ts b/node/test/logical/logical.test.ts
index d6016ca..59f0e13 100644
--- a/node/test/logical/logical.test.ts
+++ b/node/test/logical/logical.test.ts
@@ -7,7 +7,7 @@ describe("логические операторы", () => {
 
     beforeAll(() => {
       elements = parse<{ error: string }>(
-        ({ html, context }) => html` <div>${context.error && html`<span class="error">${context.error}</span>`}</div> `
+        ({ html, fields }) => html` <div>${fields.error && html`<span class="error">${fields.error}</span>`}</div> `
       )
     })
 
@@ -19,7 +19,7 @@ describe("логические операторы", () => {
           child: [
             {
               type: "log",
-              data: "/context/error",
+              data: "/fields/error",
               child: [
                 {
                   tag: "span",
@@ -30,7 +30,7 @@ describe("логические операторы", () => {
                   child: [
                     {
                       type: "text",
-                      data: "/context/error",
+                      data: "/fields/error",
                     },
                   ],
                 },
@@ -47,13 +47,13 @@ describe("логические операторы", () => {
 
     beforeAll(() => {
       elements = parse<{}, { user: { name: string; avatar: string } }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.user &&
+            ${mass.user &&
             html`
               <div class="user">
-                <img src="${core.user.avatar}" alt="${core.user.name}" />
-                <span>${core.user.name}</span>
+                <img src="${mass.user.avatar}" alt="${mass.user.name}" />
+                <span>${mass.user.name}</span>
               </div>
             `}
           </div>
@@ -69,7 +69,7 @@ describe("логические операторы", () => {
           child: [
             {
               type: "log",
-              data: "/core/user",
+              data: "/mass/user",
               child: [
                 {
                   tag: "div",
@@ -83,10 +83,10 @@ describe("логические операторы", () => {
                       type: "el",
                       string: {
                         src: {
-                          data: "/core/user/avatar",
+                          data: "/mass/user/avatar",
                         },
                         alt: {
-                          data: "/core/user/name",
+                          data: "/mass/user/name",
                         },
                       },
                     },
@@ -96,7 +96,7 @@ describe("логические операторы", () => {
                       child: [
                         {
                           type: "text",
-                          data: "/core/user/name",
+                          data: "/mass/user/name",
                         },
                       ],
                     },
@@ -115,7 +115,7 @@ describe("логические операторы", () => {
 
     beforeAll(() => {
       elements = parse<{ isVisible: boolean; message: string }>(
-        ({ html, context }) => html` <div>${context.isVisible && html`<p>${context.message}</p>`}</div> `
+        ({ html, fields }) => html` <div>${fields.isVisible && html`<p>${fields.message}</p>`}</div> `
       )
     })
 
@@ -127,7 +127,7 @@ describe("логические операторы", () => {
           child: [
             {
               type: "log",
-              data: "/context/isVisible",
+              data: "/fields/isVisible",
               child: [
                 {
                   tag: "p",
@@ -135,7 +135,7 @@ describe("логические операторы", () => {
                   child: [
                     {
                       type: "text",
-                      data: "/context/message",
+                      data: "/fields/message",
                     },
                   ],
                 },
@@ -152,7 +152,7 @@ describe("логические операторы", () => {
 
     beforeAll(() => {
       elements = parse<{ hasError: boolean }>(
-        ({ html, context }) => html` <div>${context.hasError && html`<br />`}</div> `
+        ({ html, fields }) => html` <div>${fields.hasError && html`<br />`}</div> `
       )
     })
 
@@ -164,7 +164,7 @@ describe("логические операторы", () => {
           child: [
             {
               type: "log",
-              data: "/context/hasError",
+              data: "/fields/hasError",
               child: [
                 {
                   tag: "br",
diff --git a/node/test/map/logical.test.ts b/node/test/map/logical.test.ts
index df1cbba..ea0e255 100644
--- a/node/test/map/logical.test.ts
+++ b/node/test/map/logical.test.ts
@@ -7,9 +7,9 @@ describe("логические операторы в map", () => {
 
     beforeAll(() => {
       elements = parse<{}, { users: Array<{ name: string; hasAvatar: boolean }> }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.users.map(
+            ${mass.users.map(
               (user) => html`
                 <div class="user">
                   ${user.hasAvatar && html`<img src="/avatar/${user.name}.jpg" alt="${user.name}" />`}
@@ -30,7 +30,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/users",
+              data: "/mass/users",
               child: [
                 {
                   tag: "div",
@@ -83,9 +83,9 @@ describe("логические операторы в map", () => {
 
     beforeAll(() => {
       elements = parse<{}, { posts: Array<{ title: string; author: { name: string; isVerified: boolean } }> }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.posts.map(
+            ${mass.posts.map(
               (post) => html`
                 <article class="post">
                   <h2>${post.title}</h2>
@@ -112,7 +112,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/posts",
+              data: "/mass/posts",
               child: [
                 {
                   tag: "article",
@@ -184,9 +184,9 @@ describe("логические операторы в map", () => {
 
     beforeAll(() => {
       elements = parse<{}, { items: Array<{ name: string; isNew: boolean }> }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
                 <li class="item">
                   ${item.isNew && html`<span class="new-badge">NEW</span>`}
@@ -207,7 +207,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: "li",
@@ -263,15 +263,15 @@ describe("логические операторы в map", () => {
         { showDetails: boolean },
         { products: Array<{ name: string; price: number; inStock: boolean }> }
       >(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${core.products.map(
+            ${mass.products.map(
               (product) => html`
                 <div class="product">
                   <h3>${product.name}</h3>
                   <p class="price">$${product.price}</p>
                   ${product.inStock &&
-                  context.showDetails &&
+                  fields.showDetails &&
                   html`
                     <div class="product-details">
                       <span class="stock-status">In Stock</span>
@@ -294,7 +294,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/products",
+              data: "/mass/products",
               child: [
                 {
                   tag: "div",
@@ -329,7 +329,7 @@ describe("логические операторы в map", () => {
                     },
                     {
                       type: "log",
-                      data: ["[item]/inStock", "[item]/context/showDetails"],
+                      data: ["[item]/inStock", "[item]/fields/showDetails"],
                       expr: "_[0] && _[1]",
                       child: [
                         {
@@ -384,9 +384,9 @@ describe("логические операторы в map", () => {
 
     beforeAll(() => {
       elements = parse<{}, { notifications: Array<{ message: string; isImportant: boolean }> }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.notifications.map(
+            ${mass.notifications.map(
               (notification) => html`
                 <div class="notification">
                   ${notification.isImportant && html`<span class="important">!</span>`}
@@ -407,7 +407,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/notifications",
+              data: "/mass/notifications",
               child: [
                 {
                   tag: "div",
@@ -466,9 +466,9 @@ describe("логические операторы в map", () => {
         {},
         { categories: Array<{ name: string; hasSubcategories: boolean; subcategories: Array<{ name: string }> }> }
       >(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.categories.map(
+            ${mass.categories.map(
               (category) => html`
                 <div class="category">
                   <h2>${category.name}</h2>
@@ -494,7 +494,7 @@ describe("логические операторы в map", () => {
           child: [
             {
               type: "map",
-              data: "/core/categories",
+              data: "/mass/categories",
               child: [
                 {
                   tag: "div",
diff --git a/node/test/map/map.cond.test.ts b/node/test/map/map.cond.test.ts
index cb0d411..54e9c05 100644
--- a/node/test/map/map.cond.test.ts
+++ b/node/test/map/map.cond.test.ts
@@ -14,11 +14,11 @@ describe("map с условиями", () => {
 
     beforeAll(() => {
       elements = parse<Context, Core>(
-        ({ html, context, core }) => html`
-          ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
-          ${context.flag
+        ({ html, fields, mass }) => html`
+          ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
+          ${fields.flag
             ? html`<div class="conditional">
-                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
+                ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
               </div>`
             : html`<div class="fallback">No items</div>`}
         `
@@ -28,7 +28,7 @@ describe("map с условиями", () => {
       expect(elements).toEqual([
         {
           type: "map",
-          data: "/core/list1",
+          data: "/mass/list1",
           child: [
             {
               tag: "div",
@@ -47,7 +47,7 @@ describe("map с условиями", () => {
         },
         {
           type: "cond",
-          data: "/context/flag",
+          data: "/fields/flag",
           child: [
             {
               tag: "div",
@@ -58,7 +58,7 @@ describe("map с условиями", () => {
               child: [
                 {
                   type: "map",
-                  data: "/core/list2",
+                  data: "/mass/list2",
                   child: [
                     {
                       tag: "div",
@@ -108,12 +108,12 @@ describe("map с условиями", () => {
 
     beforeAll(() => {
       elements = parse<Context, Core>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div class="container">
-            ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
-            ${context.flag
+            ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
+            ${fields.flag
               ? html`<div class="conditional">
-                  ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
+                  ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
                 </div>`
               : html`<div class="fallback">No items</div>`}
           </div>
@@ -128,7 +128,7 @@ describe("map с условиями", () => {
           child: [
             {
               type: "map",
-              data: "/core/list1",
+              data: "/mass/list1",
               child: [
                 {
                   tag: "div",
@@ -147,7 +147,7 @@ describe("map с условиями", () => {
             },
             {
               type: "cond",
-              data: "/context/flag",
+              data: "/fields/flag",
               child: [
                 {
                   tag: "div",
@@ -155,7 +155,7 @@ describe("map с условиями", () => {
                   child: [
                     {
                       type: "map",
-                      data: "/core/list2",
+                      data: "/mass/list2",
                       child: [
                         {
                           tag: "div",
@@ -215,17 +215,17 @@ describe("map с условиями", () => {
 
     beforeAll(() => {
       elements = parse<Context, Core>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div class="level1">
             <div class="level2">
               <div class="level3">
-                ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
-                ${context.flag
+                ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
+                ${fields.flag
                   ? html`<div class="conditional">
-                      ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
-                      ${context.deepFlag
+                      ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
+                      ${fields.deepFlag
                         ? html`<div class="deep-conditional">
-                            ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
+                            ${mass.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
                           </div>`
                         : html`<div class="deep-fallback">No deep items</div>`}
                     </div>`
@@ -252,7 +252,7 @@ describe("map с условиями", () => {
                   child: [
                     {
                       type: "map",
-                      data: "/core/list1",
+                      data: "/mass/list1",
                       child: [
                         {
                           tag: "div",
@@ -271,7 +271,7 @@ describe("map с условиями", () => {
                     },
                     {
                       type: "cond",
-                      data: "/context/flag",
+                      data: "/fields/flag",
                       child: [
                         {
                           tag: "div",
@@ -279,7 +279,7 @@ describe("map с условиями", () => {
                           child: [
                             {
                               type: "map",
-                              data: "/core/list2",
+                              data: "/mass/list2",
                               child: [
                                 {
                                   tag: "div",
@@ -298,7 +298,7 @@ describe("map с условиями", () => {
                             },
                             {
                               type: "cond",
-                              data: "/context/deepFlag",
+                              data: "/fields/deepFlag",
                               child: [
                                 {
                                   tag: "div",
@@ -306,7 +306,7 @@ describe("map с условиями", () => {
                                   child: [
                                     {
                                       type: "map",
-                                      data: "/core/list3",
+                                      data: "/mass/list3",
                                       child: [
                                         {
                                           tag: "div",
@@ -387,11 +387,11 @@ describe("map с условиями", () => {
 
     beforeAll(() => {
       elements = parse<{ show: boolean }, { items: string[] }>(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${context.show
-              ? html` ${core.items.map((item) => html`<div class="true-${item}"></div>`)}`
-              : html` ${core.items.map((item) => html`<div class="false-${item}"></div>`)}`}
+            ${fields.show
+              ? html` ${mass.items.map((item) => html`<div class="true-${item}"></div>`)}`
+              : html` ${mass.items.map((item) => html`<div class="false-${item}"></div>`)}`}
           </div>
         `
       )
@@ -404,11 +404,11 @@ describe("map с условиями", () => {
           child: [
             {
               type: "cond",
-              data: "/context/show",
+              data: "/fields/show",
               child: [
                 {
                   type: "map",
-                  data: "/core/items",
+                  data: "/mass/items",
                   child: [
                     {
                       tag: "div",
@@ -424,7 +424,7 @@ describe("map с условиями", () => {
                 },
                 {
                   type: "map",
-                  data: "/core/items",
+                  data: "/mass/items",
                   child: [
                     {
                       tag: "div",
diff --git a/node/test/map/map.test.ts b/node/test/map/map.test.ts
index 72d7821..d439555 100644
--- a/node/test/map/map.test.ts
+++ b/node/test/map/map.test.ts
@@ -7,9 +7,9 @@ describe("map", () => {
 
     beforeAll(() => {
       elements = parse<{ list: string[] }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <ul>
-            ${context.list.map((name) => html`<li>${name}</li>`)}
+            ${fields.list.map((name) => html`<li>${name}</li>`)}
           </ul>
         `
       )
@@ -22,7 +22,7 @@ describe("map", () => {
           child: [
             {
               type: "map",
-              data: "/context/list",
+              data: "/fields/list",
               child: [
                 {
                   tag: "li",
@@ -46,9 +46,9 @@ describe("map", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<{ list: string[] }>(
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <ul>
-            ${context.list.map(
+            ${fields.list.map(
               (name) =>
                 html`
                   <li>${name}</li>
@@ -67,7 +67,7 @@ describe("map", () => {
           child: [
             {
               type: "map",
-              data: "/context/list",
+              data: "/fields/list",
               child: [
                 {
                   tag: "li",
@@ -94,9 +94,9 @@ describe("map", () => {
       beforeAll(() => {
         elements = parse<any, { list: { title: string; nested: string[] }[] }>(
           // prettier-ignore
-          ({ html, core }) => html`
+          ({ html, mass }) => html`
           <ul>
-            ${core.list.map(
+            ${mass.list.map(
               ({ title, nested }) => html`
                 <li>
                   <p>${title} </p>
@@ -116,7 +116,7 @@ describe("map", () => {
             child: [
               {
                 type: "map",
-                data: "/core/list",
+                data: "/mass/list",
                 child: [
                   {
                     tag: "li",
@@ -161,9 +161,9 @@ describe("map", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ list: string[] }>(
-          ({ html, context }) => html`
+          ({ html, fields }) => html`
             <ul>
-              ${context.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
+              ${fields.list.map((_, i) => html`<li>${i % 2 ? html`<em>A</em>` : html`<strong>B</strong>`}</li>`)}
             </ul>
           `
         )
@@ -176,7 +176,7 @@ describe("map", () => {
             child: [
               {
                 type: "map",
-                data: "/context/list",
+                data: "/fields/list",
                 child: [
                   {
                     tag: "li",
@@ -222,11 +222,11 @@ describe("map", () => {
       let elements: Node[]
       beforeAll(() => {
         elements = parse<{ flag: boolean }, { list: { title: string; nested: string[] }[] }>(
-          ({ html, core, context }) => html`
-            ${context.flag
+          ({ html, mass, fields }) => html`
+            ${fields.flag
               ? html`
                   <ul>
-                    ${core.list.map(
+                    ${mass.list.map(
                       ({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`
                     )}
                   </ul>
@@ -239,7 +239,7 @@ describe("map", () => {
         expect(elements).toEqual([
           {
             type: "cond",
-            data: "/context/flag",
+            data: "/fields/flag",
             child: [
               {
                 tag: "ul",
@@ -247,7 +247,7 @@ describe("map", () => {
                 child: [
                   {
                     type: "map",
-                    data: "/core/list",
+                    data: "/mass/list",
                     child: [
                       {
                         tag: "li",
@@ -299,9 +299,9 @@ describe("map", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { list: { title: string; nested: string[] }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
+            ${mass.list.map(({ title, nested }) => html`<li>${title} ${nested.map((n) => html`<em>${n}</em>`)}</li>`)}
           </ul>
         `
       )
@@ -314,7 +314,7 @@ describe("map", () => {
           child: [
             {
               type: "map",
-              data: "/core/list",
+              data: "/mass/list",
               child: [
                 {
                   tag: "li",
diff --git a/node/test/map/sibling.test.ts b/node/test/map/sibling.test.ts
index aff4f91..7a8b222 100644
--- a/node/test/map/sibling.test.ts
+++ b/node/test/map/sibling.test.ts
@@ -10,9 +10,9 @@ describe("map соседствующие", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core }) => html`
-          ${core.list1.map(({ title }) => html` <div>${title}</div> `)}
-          ${core.list2.map(({ title }) => html` <div>${title}</div> `)}
+        ({ html, mass }) => html`
+          ${mass.list1.map(({ title }) => html` <div>${title}</div> `)}
+          ${mass.list2.map(({ title }) => html` <div>${title}</div> `)}
         `
       )
     })
@@ -20,7 +20,7 @@ describe("map соседствующие", () => {
       expect(elements).toEqual([
         {
           type: "map",
-          data: "/core/list1",
+          data: "/mass/list1",
           child: [
             {
               tag: "div",
@@ -36,7 +36,7 @@ describe("map соседствующие", () => {
         },
         {
           type: "map",
-          data: "/core/list2",
+          data: "/mass/list2",
           child: [
             {
               tag: "div",
@@ -67,10 +67,10 @@ describe("map соседствующие", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<Context, Core>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div class="dashboard">
-            ${context.categories.map((cat) => html`<span class="category">${cat}</span>`)}
-            ${core.items.map(
+            ${fields.categories.map((cat) => html`<span class="category">${cat}</span>`)}
+            ${mass.items.map(
               (item) => html`
                 <div class="item" data-category="${item.categoryId}">
                   <h4>${item.title}</h4>
@@ -92,7 +92,7 @@ describe("map соседствующие", () => {
           child: [
             {
               type: "map",
-              data: "/context/categories",
+              data: "/fields/categories",
               child: [
                 {
                   tag: "span",
@@ -111,7 +111,7 @@ describe("map соседствующие", () => {
             },
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: "div",
@@ -151,14 +151,14 @@ describe("map соседствующие", () => {
     }
     let elements: Node[]
     beforeAll(() => {
-      elements = parse<{}, Core>(
-        ({ html, core }) => html`
+      elements = parse<{}, { list1: { title: string }[]; list2: { title: string }[]; list3: { title: string }[] }>(
+        ({ html, mass }) => html`
           <div class="level1">
             <div class="level2">
               <div class="level3">
-                ${core.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
-                ${core.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
-                ${core.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
+                ${mass.list1.map(({ title }) => html`<div class="item1">${title}</div>`)}
+                ${mass.list2.map(({ title }) => html`<div class="item2">${title}</div>`)}
+                ${mass.list3.map(({ title }) => html`<div class="item3">${title}</div>`)}
               </div>
             </div>
           </div>
@@ -181,7 +181,7 @@ describe("map соседствующие", () => {
                   child: [
                     {
                       type: "map",
-                      data: "/core/list1",
+                      data: "/mass/list1",
                       child: [
                         {
                           tag: "div",
@@ -200,7 +200,7 @@ describe("map соседствующие", () => {
                     },
                     {
                       type: "map",
-                      data: "/core/list2",
+                      data: "/mass/list2",
                       child: [
                         {
                           tag: "div",
@@ -219,7 +219,7 @@ describe("map соседствующие", () => {
                     },
                     {
                       type: "map",
-                      data: "/core/list3",
+                      data: "/mass/list3",
                       child: [
                         {
                           tag: "div",
diff --git a/node/test/map/text.test.ts b/node/test/map/text.test.ts
index 3f0fd9b..a6d3a73 100644
--- a/node/test/map/text.test.ts
+++ b/node/test/map/text.test.ts
@@ -8,9 +8,9 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<{ list: string[] }>(
         // #region itemValue
-        ({ html, context }) => html`
+        ({ html, fields }) => html`
           <ul>
-            ${context.list.map((name) => html`<li>${name}</li>`)}
+            ${fields.list.map((name) => html`<li>${name}</li>`)}
           </ul>
         `
         // #endregion itemValue
@@ -26,7 +26,7 @@ describe("text", () => {
             child: [
               {
                 type: "map",
-                data: "/context/list",
+                data: "/fields/list",
                 child: [
                   {
                     tag: "li",
@@ -53,9 +53,9 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<any, { configs: { name: string; value: string }[] }>(
         // #region objectValues
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.configs.map((config) => html`<li>${config.name} ${config.value}</li>`)}
+            ${mass.configs.map((config) => html`<li>${config.name} ${config.value}</li>`)}
           </ul>
         `
         // #endregion objectValues
@@ -71,7 +71,7 @@ describe("text", () => {
             child: [
               {
                 type: "map",
-                data: "/core/configs",
+                data: "/mass/configs",
                 child: [
                   {
                     tag: "li",
@@ -98,9 +98,9 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<any, { configs: { name: string; value: string }[] }>(
         // #region objectDestructValues
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.configs.map(({ name, value }) => html`<li>${name} ${value}</li>`)}
+            ${mass.configs.map(({ name, value }) => html`<li>${name} ${value}</li>`)}
           </ul>
         `
         // #endregion objectDestructValues
@@ -114,7 +114,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/configs",
+              data: "/mass/configs",
               child: [
                 {
                   tag: "li",
@@ -139,8 +139,8 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { posts: { author: { name: string; email: string } }[] }>(
-        ({ html, core }) => html`
-          <div>${core.posts.map((post) => html`<p>Author: ${post.author.name} (${post.author.email})</p>`)}</div>
+        ({ html, mass }) => html`
+          <div>${mass.posts.map((post) => html`<p>Author: ${post.author.name} (${post.author.email})</p>`)}</div>
         `
       )
     })
@@ -152,7 +152,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/posts",
+              data: "/mass/posts",
               child: [
                 {
                   tag: "p",
@@ -177,9 +177,9 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { items: { name: string; isActive: boolean }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <ul>
-            ${core.items.map((item) => html`<li>${item.isActive ? item.name : "Inactive"}</li>`)}
+            ${mass.items.map((item) => html`<li>${item.isActive ? item.name : "Inactive"}</li>`)}
           </ul>
         `
       )
@@ -192,7 +192,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: "li",
@@ -217,9 +217,9 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { products: { name: string; price: number; quantity: number }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.products.map((product) => html`<p>${product.name}: $${product.price * product.quantity}</p>`)}
+            ${mass.products.map((product) => html`<p>${product.name}: $${product.price * product.quantity}</p>`)}
           </div>
         `
       )
@@ -232,7 +232,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/products",
+              data: "/mass/products",
               child: [
                 {
                   tag: "p",
@@ -257,8 +257,8 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { users: { name: string; email: string }[] }>(
-        ({ html, core }) => html`
-          <div>${core.users.map((user) => html`<p>${user.name.toUpperCase()} - ${user.email.toLowerCase()}</p>`)}</div>
+        ({ html, mass }) => html`
+          <div>${mass.users.map((user) => html`<p>${user.name.toUpperCase()} - ${user.email.toLowerCase()}</p>`)}</div>
         `
       )
     })
@@ -270,7 +270,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/users",
+              data: "/mass/users",
               child: [
                 {
                   tag: "p",
@@ -295,9 +295,9 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { categories: { name: string; products: { name: string; price: number }[] }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.categories.map(
+            ${mass.categories.map(
               (category) => html`
                 <h2>${category.name}</h2>
                 <ul>
@@ -317,7 +317,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/categories",
+              data: "/mass/categories",
               child: [
                 {
                   tag: "h2",
@@ -364,9 +364,9 @@ describe("text", () => {
     let elements: Node[]
     beforeAll(() => {
       elements = parse<any, { items: { name: string; isVisible: boolean; description: string }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
                 ${item.isVisible ? html`<p>${item.name}: ${item.description}</p>` : html`<p>Hidden item</p>`}
               `
@@ -383,7 +383,7 @@ describe("text", () => {
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   type: "cond",
diff --git a/node/test/meta/attr.map.cond.test.ts b/node/test/meta/attr.map.cond.test.ts
index bc07c9e..e68e38c 100644
--- a/node/test/meta/attr.map.cond.test.ts
+++ b/node/test/meta/attr.map.cond.test.ts
@@ -1,15 +1,15 @@
 import { describe, it, expect, beforeAll } from "bun:test"
 import { parse, type Node } from "../../../index"
 
-describe("meta-компоненты с core/context в map и condition", () => {
+describe("meta-компоненты с fields/mass в map и condition", () => {
   describe("meta-элемент с пустыми объектами", () => {
     let elements: Node[]
 
     beforeAll(() => {
-      elements = parse(({ html }) => html` <meta-hash context=${{}} core=${{}} /> `)
+      elements = parse(({ html }) => html` <meta-hash fields=${{}} mass=${{}} /> `)
     })
     it("attributes", () => {
-      expect(elements, "при обработке пустых объектов не должен устанавливаться core и context").toEqual([
+      expect(elements, "при обработке пустых объектов не должен устанавливаться mass и fields").toEqual([
         {
           tag: "meta-hash",
           type: "meta",
@@ -17,7 +17,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
       ])
     })
     it("data", () => {
-      expect(elements, "core и context не должно быть в data").toEqual([
+      expect(elements, "fields и mass не должно быть в data").toEqual([
         {
           tag: "meta-hash",
           type: "meta",
@@ -25,19 +25,19 @@ describe("meta-компоненты с core/context в map и condition", () =>
       ])
     })
   })
-  describe("meta-компоненты в map с core объектами", () => {
+  describe("meta-компоненты в map с mass объектами", () => {
     type Core = { items: any[]; tag: string; type: string }
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
-                <meta-${core.tag}
-                  core=${{ id: item.id, name: item.name, type: core.type }}
-                  context=${{ status: item.status, active: item.active }} />
+                <meta-${mass.tag}
+                  mass=${{ id: item.id, name: item.name, type: mass.type }}
+                  fields=${{ status: item.status, active: item.active }} />
               `
             )}
           </div>
@@ -53,19 +53,19 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: {
-                    data: "/core/tag",
+                    data: "/mass/tag",
                     expr: "meta-${_[0]}",
                   },
                   type: "meta",
-                  core: {
-                    data: ["[item]/id", "[item]/name", "/core/type"],
+                  mass: {
+                    data: ["[item]/id", "[item]/name", "/mass/type"],
                     expr: "{ id: _[0], name: _[1], type: _[2] }",
                   },
-                  context: {
+                  fields: {
                     data: ["[item]/status", "[item]/active"],
                     expr: "{ status: _[0], active: _[1] }",
                   },
@@ -78,23 +78,23 @@ describe("meta-компоненты с core/context в map и condition", () =>
     })
   })
 
-  describe("meta-компоненты в condition с core/context объектами", () => {
+  describe("meta-компоненты в condition с fields/mass объектами", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${context.showMeta
+            ${fields.showMeta
               ? html`
-                  <meta-${core.tag}
-                    core=${{ id: context.id, name: context.name }}
-                    context=${{ type: "primary", active: true }} />
+                  <meta-${mass.tag}
+                    mass=${{ id: fields.id, name: fields.name }}
+                    fields=${{ type: "primary", active: true }} />
                 `
               : html`
-                  <meta-${core.tag}
-                    core=${{ id: "default", name: "default" }}
-                    context=${{ type: "secondary", active: false }} />
+                  <meta-${mass.tag}
+                    mass=${{ id: "default", name: "default" }}
+                    fields=${{ type: "secondary", active: false }} />
                 `}
           </div>
         `
@@ -108,28 +108,28 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "cond",
-              data: "/context/showMeta",
+              data: "/fields/showMeta",
               child: [
                 {
                   tag: {
-                    data: "/core/tag",
+                    data: "/mass/tag",
                     expr: "meta-${_[0]}",
                   },
                   type: "meta",
-                  core: {
-                    data: ["/context/id", "/context/name"],
+                  mass: {
+                    data: ["/fields/id", "/fields/name"],
                     expr: "{ id: _[0], name: _[1] }",
                   },
-                  context: '{ type: "primary", active: true }',
+                  fields: '{ type: "primary", active: true }',
                 },
                 {
                   tag: {
-                    data: "/core/tag",
+                    data: "/mass/tag",
                     expr: "meta-${_[0]}",
                   },
                   type: "meta",
-                  core: '{ id: "default", name: "default" }',
-                  context: '{ type: "secondary", active: false }',
+                  mass: '{ id: "default", name: "default" }',
+                  fields: '{ type: "secondary", active: false }',
                 },
               ],
             },
@@ -145,20 +145,20 @@ describe("meta-компоненты с core/context в map и condition", () =>
 
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${context.showList
+            ${fields.showList
               ? html`
-                  ${core.items.map(
+                  ${mass.items.map(
                     (item) => html`
-                      <meta-${core.tag}
-                        core=${{
+                      <meta-${mass.tag}
+                        mass=${{
                           id: item.id,
                           name: item.name,
-                          type: core.type,
+                          type: mass.type,
                           metadata: item.metadata,
                         }}
-                        context=${{
+                        fields=${{
                           status: item.status,
                           active: item.active,
                           permissions: item.permissions,
@@ -167,9 +167,9 @@ describe("meta-компоненты с core/context в map и condition", () =>
                   )}
                 `
               : html`
-                  <meta-${core.tag}
-                    core=${{ id: "empty", name: "empty" }}
-                    context=${{ type: "empty", active: false }} />
+                  <meta-${mass.tag}
+                    mass=${{ id: "empty", name: "empty" }}
+                    fields=${{ type: "empty", active: false }} />
                 `}
           </div>
         `
@@ -183,23 +183,23 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "cond",
-              data: "/context/showList",
+              data: "/fields/showList",
               child: [
                 {
                   type: "map",
-                  data: "/core/items",
+                  data: "/mass/items",
                   child: [
                     {
                       tag: {
-                        data: "/core/tag",
+                        data: "/mass/tag",
                         expr: "meta-${_[0]}",
                       },
                       type: "meta",
-                      core: {
-                        data: ["[item]/id", "[item]/name", "/core/type", "[item]/metadata"],
+                      mass: {
+                        data: ["[item]/id", "[item]/name", "/mass/type", "[item]/metadata"],
                         expr: "{ id: _[0], name: _[1], type: _[2], metadata: _[3] }",
                       },
-                      context: {
+                      fields: {
                         data: ["[item]/status", "[item]/active", "[item]/permissions"],
                         expr: "{ status: _[0], active: _[1], permissions: _[2] }",
                       },
@@ -208,12 +208,12 @@ describe("meta-компоненты с core/context в map и condition", () =>
                 },
                 {
                   tag: {
-                    data: "/core/tag",
+                    data: "/mass/tag",
                     expr: "meta-${_[0]}",
                   },
                   type: "meta",
-                  core: '{ id: "empty", name: "empty" }',
-                  context: '{ type: "empty", active: false }',
+                  mass: '{ id: "empty", name: "empty" }',
+                  fields: '{ type: "empty", active: false }',
                 },
               ],
             },
@@ -229,40 +229,40 @@ describe("meta-компоненты с core/context в map и condition", () =>
 
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
                 ${item.isActive
                   ? html`
-                      <meta-${core.tag}
-                        core=${{
+                      <meta-${mass.tag}
+                        mass=${{
                           id: item.id,
                           name: item.name,
                           type: "active",
                         }}
-                        context=${{
+                        fields=${{
                           status: "active",
                           permissions: item.permissions,
                         }} />
                     `
                   : item.hasError
                   ? html`
-                      <meta-${core.tag}
-                        core=${{
+                      <meta-${mass.tag}
+                        mass=${{
                           id: item.id,
                           name: item.name,
                           type: "error",
                         }}
-                        context=${{
+                        fields=${{
                           status: "error",
                           message: "Item has error",
                         }} />
                     `
                   : html`
-                      <meta-${core.tag}
-                        core=${{ id: item.id, name: item.name, type: "inactive" }}
-                        context=${{ status: "inactive" }} />
+                      <meta-${mass.tag}
+                        mass=${{ id: item.id, name: item.name, type: "inactive" }}
+                        fields=${{ status: "inactive" }} />
                     `}
               `
             )}
@@ -279,7 +279,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   type: "cond",
@@ -287,15 +287,15 @@ describe("meta-компоненты с core/context в map и condition", () =>
                   child: [
                     {
                       tag: {
-                        data: "/core/tag",
+                        data: "/mass/tag",
                         expr: "meta-${_[0]}",
                       },
                       type: "meta",
-                      core: {
+                      mass: {
                         data: ["[item]/id", "[item]/name"],
                         expr: '{ id: _[0], name: _[1], type: "active" }',
                       },
-                      context: {
+                      fields: {
                         data: "[item]/permissions",
                         expr: '{ status: "active", permissions: _[0] }',
                       },
@@ -306,27 +306,27 @@ describe("meta-компоненты с core/context в map и condition", () =>
                       child: [
                         {
                           tag: {
-                            data: "/core/tag",
+                            data: "/mass/tag",
                             expr: "meta-${_[0]}",
                           },
                           type: "meta",
-                          core: {
+                          mass: {
                             data: ["[item]/id", "[item]/name"],
                             expr: '{ id: _[0], name: _[1], type: "error" }',
                           },
-                          context: '{ status: "error", message: "Item has error" }',
+                          fields: '{ status: "error", message: "Item has error" }',
                         },
                         {
                           tag: {
-                            data: "/core/tag",
+                            data: "/mass/tag",
                             expr: "meta-${_[0]}",
                           },
                           type: "meta",
-                          core: {
+                          mass: {
                             data: ["[item]/id", "[item]/name"],
                             expr: '{ id: _[0], name: _[1], type: "inactive" }',
                           },
-                          context: '{ status: "inactive" }',
+                          fields: '{ status: "inactive" }',
                         },
                       ],
                     },
@@ -340,19 +340,19 @@ describe("meta-компоненты с core/context в map и condition", () =>
     })
   })
 
-  describe("сложные meta-компоненты с вложенными core/context объектами", () => {
+  describe("сложные meta-компоненты с вложенными fields/mass объектами", () => {
     type Core = { users: any[]; tag: string }
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <div>
-            ${core.users.map(
+            ${mass.users.map(
               (user) => html`
                 ${user.permissions.includes("admin")
-                  ? html`<meta-${core.tag}
-                      core=${{
+                  ? html`<meta-${mass.tag}
+                      mass=${{
                         id: user.id,
                         name: user.name,
                         type: "admin",
@@ -363,7 +363,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
                           settings: user.settings,
                         },
                       }}
-                      context=${{
+                      fields=${{
                         status: "admin",
                         active: user.isOnline,
                         canEdit: true,
@@ -371,8 +371,8 @@ describe("meta-компоненты с core/context в map и condition", () =>
                         canManage: true,
                       }} />`
                   : user.permissions.includes("moderator")
-                  ? html`<meta-${core.tag}
-                      core=${{
+                  ? html`<meta-${mass.tag}
+                      mass=${{
                         id: user.id,
                         name: user.name,
                         type: "moderator",
@@ -383,15 +383,15 @@ describe("meta-компоненты с core/context в map и condition", () =>
                           settings: user.settings,
                         },
                       }}
-                      context=${{
+                      fields=${{
                         status: "moderator",
                         active: user.isOnline,
                         canEdit: true,
                         canDelete: false,
                         canManage: false,
                       }} />`
-                  : html`<meta-${core.tag}
-                      core=${{
+                  : html`<meta-${mass.tag}
+                      mass=${{
                         id: user.id,
                         name: user.name,
                         type: "user",
@@ -402,7 +402,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
                           settings: user.settings,
                         },
                       }}
-                      context=${{
+                      fields=${{
                         status: "user",
                         active: user.isOnline,
                         canEdit: false,
@@ -424,7 +424,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "map",
-              data: "/core/users",
+              data: "/mass/users",
               child: [
                 {
                   type: "cond",
@@ -433,15 +433,15 @@ describe("meta-компоненты с core/context в map и condition", () =>
                   child: [
                     {
                       tag: {
-                        data: "/core/tag",
+                        data: "/mass/tag",
                         expr: "meta-${_[0]}",
                       },
                       type: "meta",
-                      core: {
+                      mass: {
                         data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                         expr: '{ id: _[0], name: _[1], type: "admin", permissions: _[2], metadata: { level: "admin", access: "full", settings: _[3] } }',
                       },
-                      context: {
+                      fields: {
                         data: "[item]/isOnline",
                         expr: '{ status: "admin", active: _[0], canEdit: true, canDelete: true, canManage: true }',
                       },
@@ -453,30 +453,30 @@ describe("meta-компоненты с core/context в map и condition", () =>
                       child: [
                         {
                           tag: {
-                            data: "/core/tag",
+                            data: "/mass/tag",
                             expr: "meta-${_[0]}",
                           },
                           type: "meta",
-                          core: {
+                          mass: {
                             data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                             expr: '{ id: _[0], name: _[1], type: "moderator", permissions: _[2], metadata: { level: "moderator", access: "limited", settings: _[3] } }',
                           },
-                          context: {
+                          fields: {
                             data: "[item]/isOnline",
                             expr: '{ status: "moderator", active: _[0], canEdit: true, canDelete: false, canManage: false }',
                           },
                         },
                         {
                           tag: {
-                            data: "/core/tag",
+                            data: "/mass/tag",
                             expr: "meta-${_[0]}",
                           },
                           type: "meta",
-                          core: {
+                          mass: {
                             data: ["[item]/id", "[item]/name", "[item]/permissions", "[item]/settings"],
                             expr: '{ id: _[0], name: _[1], type: "user", permissions: _[2], metadata: { level: "user", access: "basic", settings: _[3] } }',
                           },
-                          context: {
+                          fields: {
                             data: "[item]/isOnline",
                             expr: '{ status: "user", active: _[0], canEdit: false, canDelete: false, canManage: false }',
                           },
@@ -493,21 +493,21 @@ describe("meta-компоненты с core/context в map и condition", () =>
     })
   })
 
-  describe("meta-компоненты с динамическими core/context объектами", () => {
+  describe("meta-компоненты с динамическими mass/context объектами", () => {
     type Core = { items: any[]; tag: string; type: string }
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse<any, Core>(
-        ({ html, core, context }) => html`
+        ({ html, mass, fields }) => html`
           <div>
-            ${core.items.map(
+            ${mass.items.map(
               (item) => html`
-                <meta-${core.tag}
-                  core=${{
+                <meta-${mass.tag}
+                  mass=${{
                     id: item.id,
                     name: item.name,
-                    type: core.type,
+                    type: mass.type,
                     dynamic: item.isActive ? "active" : "inactive",
                     computed: `${item.id}-${item.name}`,
                     metadata: {
@@ -516,7 +516,7 @@ describe("meta-компоненты с core/context в map и condition", () =>
                       tags: item.tags || [],
                     },
                   }}
-                  context=${{
+                  fields=${{
                     status: item.isActive ? "active" : "inactive",
                     active: item.isActive,
                     canEdit: item.permissions.includes("edit"),
@@ -541,15 +541,15 @@ describe("meta-компоненты с core/context в map и condition", () =>
           child: [
             {
               type: "map",
-              data: "/core/items",
+              data: "/mass/items",
               child: [
                 {
                   tag: {
-                    data: "/core/tag",
+                    data: "/mass/tag",
                     expr: "meta-${_[0]}",
                   },
                   type: "meta",
-                  context: {
+                  fields: {
                     data: [
                       "[item]/isActive",
                       "[item]/permissions/includes",
@@ -559,11 +559,11 @@ describe("meta-компоненты с core/context в map и condition", () =>
                     ],
                     expr: '{ status: _[0] ? "active" : "inactive", active: _[0], canEdit: _[1]("edit"), canDelete: _[1]("delete"), dynamic: { lastModified: _[2], created: _[3], updated: _[4] || _[2] } }',
                   },
-                  core: {
+                  mass: {
                     data: [
                       "[item]/id",
                       "[item]/name",
-                      "/core/type",
+                      "/mass/type",
                       "[item]/isActive",
                       "[item]/status",
                       "[item]/priority",
diff --git a/node/test/meta/attr.object.test.ts b/node/test/meta/attr.object.test.ts
index eae7e9e..e406870 100644
--- a/node/test/meta/attr.object.test.ts
+++ b/node/test/meta/attr.object.test.ts
@@ -1,25 +1,25 @@
 import { describe, it, expect, beforeAll } from "bun:test"
 import { parse, type Node } from "../../../index"
 
-describe("core/context в атрибутах", () => {
-  describe("core с динамическими значениями", () => {
+describe("fields/mass в атрибутах", () => {
+  describe("mass с динамическими значениями", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core, context }) => html`<meta-${core.tag} core=${{ id: context.id, name: context.name }} />`
+        ({ html, mass, fields }) => html`<meta-${mass.tag} mass=${{ id: fields.id, name: fields.name }} />`
       )
     })
     it("data", () => {
       expect(elements).toEqual([
         {
           tag: {
-            data: "/core/tag",
+            data: "/mass/tag",
             expr: "meta-${_[0]}",
           },
           type: "meta",
-          core: {
-            data: ["/context/id", "/context/name"],
+          mass: {
+            data: ["/fields/id", "/fields/name"],
             expr: "{ id: _[0], name: _[1] }",
           },
         },
@@ -27,33 +27,33 @@ describe("core/context в атрибутах", () => {
     })
   })
 
-  describe("core со статическими значениями", () => {
+  describe("mass со статическими значениями", () => {
     let elements: Node[]
 
     beforeAll(() => {
-      elements = parse(({ html, core }) => html`<meta-${core.tag} core=${{ id: "1", name: "2" }} />`)
+      elements = parse(({ html, mass }) => html`<meta-${mass.tag} mass=${{ id: "1", name: "2" }} />`)
     })
     it("data", () => {
       expect(elements).toEqual([
         {
           tag: {
-            data: "/core/tag",
+            data: "/mass/tag",
             expr: "meta-${_[0]}",
           },
           type: "meta",
-          core: '{ id: "1", name: "2" }',
+          mass: '{ id: "1", name: "2" }',
         },
       ])
     })
   })
 
-  describe("core/context во вложенных элементах", () => {
+  describe("fields/mass во вложенных элементах", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core, context }) => html`
-          <div><meta-${core.tag} context=${{ id: context.id, name: context.name }} /></div>
+        ({ html, mass, fields }) => html`
+          <div><meta-${mass.tag} fields=${{ id: fields.id, name: fields.name }} /></div>
         `
       )
     })
@@ -65,12 +65,12 @@ describe("core/context в атрибутах", () => {
           child: [
             {
               tag: {
-                data: "/core/tag",
+                data: "/mass/tag",
                 expr: "meta-${_[0]}",
               },
               type: "meta",
-              context: {
-                data: ["/context/id", "/context/name"],
+              fields: {
+                data: ["/fields/id", "/fields/name"],
                 expr: "{ id: _[0], name: _[1] }",
               },
             },
@@ -80,24 +80,24 @@ describe("core/context в атрибутах", () => {
     })
   })
 
-  describe("context", () => {
+  describe("fields", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core, context }) => html`<meta-${core.tag} context=${{ id: context.id, name: context.name }} />`
+        ({ html, mass, fields }) => html`<meta-${mass.tag} fields=${{ id: fields.id, name: fields.name }} />`
       )
     })
     it("data", () => {
       expect(elements).toEqual([
         {
           tag: {
-            data: "/core/tag",
+            data: "/mass/tag",
             expr: "meta-${_[0]}",
           },
           type: "meta",
-          context: {
-            data: ["/context/id", "/context/name"],
+          fields: {
+            data: ["/fields/id", "/fields/name"],
             expr: "{ id: _[0], name: _[1] }",
           },
         },
@@ -105,15 +105,15 @@ describe("core/context в атрибутах", () => {
     })
   })
 
-  describe("core/context", () => {
+  describe("fields/mass", () => {
     let elements: Node[]
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core, context }) => html`
-          <meta-${core.tag}
-            core=${{ id: context.id, name: context.name }}
-            context=${{ id: context.id, name: context.name }} />
+        ({ html, mass, fields }) => html`
+          <meta-${mass.tag}
+            mass=${{ id: fields.id, name: fields.name }}
+            fields=${{ id: fields.id, name: fields.name }} />
         `
       )
     })
@@ -121,16 +121,16 @@ describe("core/context в атрибутах", () => {
       expect(elements).toEqual([
         {
           tag: {
-            data: "/core/tag",
+            data: "/mass/tag",
             expr: "meta-${_[0]}",
           },
           type: "meta",
-          core: {
-            data: ["/context/id", "/context/name"],
+          mass: {
+            data: ["/fields/id", "/fields/name"],
             expr: "{ id: _[0], name: _[1] }",
           },
-          context: {
-            data: ["/context/id", "/context/name"],
+          fields: {
+            data: ["/fields/id", "/fields/name"],
             expr: "{ id: _[0], name: _[1] }",
           },
         },
diff --git a/node/test/meta/meta.spec.ts b/node/test/meta/meta.spec.ts
index 7f7a2e6..96abc3e 100644
--- a/node/test/meta/meta.spec.ts
+++ b/node/test/meta/meta.spec.ts
@@ -57,14 +57,14 @@ describe("meta", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse(({ html, core }) => html`<meta-${core.actors.child} />`)
+        elements = parse(({ html, mass }) => html`<meta-${mass.actors.child} />`)
       })
 
       it("data", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/actors/child",
+              data: "/mass/actors/child",
               expr: "meta-${_[0]}",
             },
             type: "meta",
@@ -77,14 +77,14 @@ describe("meta", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse(({ html, core }) => html`<meta-${core.actors.child}></meta-${core.actors.child}>`)
+        elements = parse(({ html, mass }) => html`<meta-${mass.actors.child}></meta-${mass.actors.child}>`)
       })
 
       it("data", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/actors/child",
+              data: "/mass/actors/child",
               expr: "meta-${_[0]}",
             },
             type: "meta",
@@ -97,7 +97,7 @@ describe("meta", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse(({ html, core }) => html`<div><meta-${core.tag} /></div>`)
+        elements = parse(({ html, mass }) => html`<div><meta-${mass.tag} /></div>`)
       })
 
       it("data", () => {
@@ -108,7 +108,7 @@ describe("meta", () => {
             child: [
               {
                 tag: {
-                  data: "/core/tag",
+                  data: "/mass/tag",
                   expr: "meta-${_[0]}",
                 },
                 type: "meta",
@@ -123,7 +123,7 @@ describe("meta", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse(({ html, core }) => html`<meta-hash><meta-${core.tag} /></meta-hash>`)
+        elements = parse(({ html, mass }) => html`<meta-hash><meta-${mass.tag} /></meta-hash>`)
       })
 
       it("data", () => {
@@ -134,7 +134,7 @@ describe("meta", () => {
             child: [
               {
                 tag: {
-                  data: "/core/tag",
+                  data: "/mass/tag",
                   expr: "meta-${_[0]}",
                 },
                 type: "meta",
@@ -150,7 +150,7 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse<any, { items: { tag: string }[] }>(
-          ({ html, core }) => html`${core.items.map((item) => html`<meta-${item.tag} />`)}`
+          ({ html, mass }) => html`${mass.items.map((item) => html`<meta-${item.tag} />`)}`
         )
       })
 
@@ -158,7 +158,7 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             type: "map",
-            data: "/core/items",
+            data: "/mass/items",
             child: [
               {
                 tag: {
@@ -178,7 +178,7 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse(
-          ({ html, core }) => html`${core.items.length > 0 ? html`<meta-${core.tag} />` : html`<meta-${core.tag} />`}`
+          ({ html, mass }) => html`${mass.items.length > 0 ? html`<meta-${mass.tag} />` : html`<meta-${mass.tag} />`}`
         )
       })
 
@@ -186,19 +186,19 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             type: "cond",
-            data: "/core/items/length",
+            data: "/mass/items/length",
             expr: "_[0] > 0",
             child: [
               {
                 tag: {
-                  data: "/core/tag",
+                  data: "/mass/tag",
                   expr: "meta-${_[0]}",
                 },
                 type: "meta",
               },
               {
                 tag: {
-                  data: "/core/tag",
+                  data: "/mass/tag",
                   expr: "meta-${_[0]}",
                 },
                 type: "meta",
@@ -236,23 +236,23 @@ describe("meta", () => {
       let elements: Node[]
 
       beforeAll(() => {
-        elements = parse(({ html, core }) => html`<meta-${core.tag} data-id="${core.id}" class="meta-${core.type}" />`)
+        elements = parse(({ html, mass }) => html`<meta-${mass.tag} data-id="${mass.id}" class="meta-${mass.type}" />`)
       })
 
       it("data", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/tag",
+              data: "/mass/tag",
               expr: "meta-${_[0]}",
             },
             type: "meta",
             string: {
               "data-id": {
-                data: "/core/id",
+                data: "/mass/id",
               },
               class: {
-                data: "/core/type",
+                data: "/mass/type",
                 expr: "meta-${_[0]}",
               },
             },
@@ -266,8 +266,8 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse(
-          ({ html, core }) => html`
-            <meta-${core.tag} ${core.active && "data-active"} class="${core.active ? "active" : "inactive"}" />
+          ({ html, mass }) => html`
+            <meta-${mass.tag} ${mass.active && "data-active"} class="${mass.active ? "active" : "inactive"}" />
           `
         )
       })
@@ -275,18 +275,18 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/tag",
+              data: "/mass/tag",
               expr: "meta-${_[0]}",
             },
             type: "meta",
             boolean: {
               "data-active": {
-                data: "/core/active",
+                data: "/mass/active",
               },
             },
             string: {
               class: {
-                data: "/core/active",
+                data: "/mass/active",
                 expr: '${_[0] ? "active" : "inactive"}',
               },
             },
@@ -300,10 +300,10 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse(
-          ({ html, core }) => html`
-            <meta-${core.tag}
-              onclick=${() => core.handleClick(core.id)}
-              onchange=${(e: Event) => core.handleChange(e, core.value)} />
+          ({ html, mass }) => html`
+            <meta-${mass.tag}
+              onclick=${() => mass.handleClick(mass.id)}
+              onchange=${(e: Event) => mass.handleChange(e, mass.value)} />
           `
         )
       })
@@ -311,17 +311,17 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/tag",
+              data: "/mass/tag",
               expr: "meta-${_[0]}",
             },
             type: "meta",
             event: {
               onclick: {
-                data: ["/core/handleClick", "/core/id"],
+                data: ["/mass/handleClick", "/mass/id"],
                 expr: "() => _[0](_[1])",
               },
               onchange: {
-                data: ["/core/handleChange", "/core/value"],
+                data: ["/mass/handleChange", "/mass/value"],
                 expr: "(e) => _[0](e, _[1])",
               },
             },
@@ -335,7 +335,7 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse(
-          ({ html, core, update }) => html`<meta-${core.tag} onclick=${() => update({ selected: core.id })} />`
+          ({ html, mass, update }) => html`<meta-${mass.tag} onclick=${() => update({ selected: mass.id })} />`
         )
       })
 
@@ -343,13 +343,13 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             tag: {
-              data: "/core/tag",
+              data: "/mass/tag",
               expr: "meta-${_[0]}",
             },
             type: "meta",
             event: {
               onclick: {
-                data: "/core/id",
+                data: "/mass/id",
                 expr: "() => update({ selected: _[0] })",
                 upd: "selected",
               },
@@ -367,8 +367,8 @@ describe("meta", () => {
 
       beforeAll(() => {
         elements = parse<any, Core>(
-          ({ html, core }) => html`
-            ${core.items.map(
+          ({ html, mass }) => html`
+            ${mass.items.map(
               (item) => html`
                 <meta-${item.tag}
                   data-id="${item.id}"
@@ -384,7 +384,7 @@ describe("meta", () => {
         expect(elements).toEqual([
           {
             type: "map",
-            data: "/core/items",
+            data: "/mass/items",
             child: [
               {
                 tag: {
diff --git a/node/test/text-formatting.test.ts b/node/test/text-formatting.test.ts
index cec34a8..0d6ada8 100644
--- a/node/test/text-formatting.test.ts
+++ b/node/test/text-formatting.test.ts
@@ -7,13 +7,13 @@ describe("text-formatting", () => {
 
     beforeAll(() => {
       elements = parse<{ name: string; title: string }, { items: { title: string }[] }>(
-        ({ html, context, core }) => html`
+        ({ html, fields, mass }) => html`
           <div>
             <p>Hello World</p>
-            <span>${context.name} - ${context.title}</span>
-            <span>${context.name} - ${core.items.map((item) => item.title).join(", ")}</span>
+            <span>${fields.name} - ${fields.title}</span>
+            <span>${fields.name} - ${mass.items.map((item) => item.title).join(", ")}</span>
             <div>Welcome to our site!</div>
-            <p>${context.name} is ${context.title}</p>
+            <p>${fields.name} is ${fields.title}</p>
           </div>
         `
       )
@@ -40,7 +40,7 @@ describe("text-formatting", () => {
               child: [
                 {
                   type: "text",
-                  data: ["/context/name", "/context/title"],
+                  data: ["/fields/name", "/fields/title"],
                   expr: "${_[0]} - ${_[1]}",
                 },
               ],
@@ -51,7 +51,7 @@ describe("text-formatting", () => {
               child: [
                 {
                   type: "text",
-                  data: "/context/name",
+                  data: "/fields/name",
                   expr: "${_[0]} - ${_[0]}",
                 },
               ],
@@ -72,7 +72,7 @@ describe("text-formatting", () => {
               child: [
                 {
                   type: "text",
-                  data: ["/context/name", "/context/title"],
+                  data: ["/fields/name", "/fields/title"],
                   expr: "${_[0]} is ${_[1]}",
                 },
               ],
diff --git a/node/test/web-components.test.ts b/node/test/web-components.test.ts
index 01fd481..6ff8341 100644
--- a/node/test/web-components.test.ts
+++ b/node/test/web-components.test.ts
@@ -103,7 +103,7 @@ describe("web-components", () => {
 
     beforeAll(() => {
       elements = parse<{ userId: string; theme: string }>(
-        ({ html, context }) => html`<user-profile id="${context.userId}" theme="${context.theme}"></user-profile>`
+        ({ html, fields }) => html`<user-profile id="${fields.userId}" theme="${fields.theme}"></user-profile>`
       )
     })
 
@@ -114,10 +114,10 @@ describe("web-components", () => {
           type: "el",
           string: {
             id: {
-              data: "/context/userId",
+              data: "/fields/userId",
             },
             theme: {
-              data: "/context/theme",
+              data: "/fields/theme",
             },
           },
         },
@@ -130,15 +130,15 @@ describe("web-components", () => {
 
     beforeAll(() => {
       elements = parse<{ isAdmin: boolean }>(
-        ({ html, context }) =>
-          html`${context.isAdmin ? html`<admin-panel></admin-panel>` : html`<user-panel></user-panel>`}`
+        ({ html, fields }) =>
+          html`${fields.isAdmin ? html`<admin-panel></admin-panel>` : html`<user-panel></user-panel>`}`
       )
     })
     it("data", () => {
       expect(elements).toEqual([
         {
           type: "cond",
-          data: "/context/isAdmin",
+          data: "/fields/isAdmin",
           child: [
             {
               tag: "admin-panel",
@@ -159,9 +159,9 @@ describe("web-components", () => {
 
     beforeAll(() => {
       elements = parse<any, { users: { id: string; name: string }[] }>(
-        ({ html, core }) => html`
+        ({ html, mass }) => html`
           <user-list>
-            ${core.users.map((user) => html`<user-item id="${user.id}">${user.name}</user-item>`)}
+            ${mass.users.map((user) => html`<user-item id="${user.id}">${user.name}</user-item>`)}
           </user-list>
         `
       )
@@ -174,7 +174,7 @@ describe("web-components", () => {
           child: [
             {
               type: "map",
-              data: "/core/users",
+              data: "/mass/users",
               child: [
                 {
                   tag: "user-item",
@@ -256,8 +256,8 @@ describe("web-components", () => {
 
     beforeAll(() => {
       elements = parse(
-        ({ html, core }) => html`
-          <modal-dialog onclose=${() => core.close()} onopen=${() => core.open()} data-modal-id="user-modal">
+        ({ html, mass }) => html`
+          <modal-dialog onclose=${() => mass.close()} onopen=${() => mass.open()} data-modal-id="user-modal">
           </modal-dialog>
         `
       )
@@ -269,11 +269,11 @@ describe("web-components", () => {
           type: "el",
           event: {
             onclose: {
-              data: "/core/close",
+              data: "/mass/close",
               expr: "() => _[0]()",
             },
             onopen: {
-              data: "/core/open",
+              data: "/mass/open",
               expr: "() => _[0]()",
             },
           },
diff --git a/node/text.spec.ts b/node/text.spec.ts
index a3d879c..f0cf50b 100644
--- a/node/text.spec.ts
+++ b/node/text.spec.ts
@@ -25,7 +25,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         // #region dynamic
-        ({ html, context }) => html`<p>${context.dynamic}</p>`
+        ({ html, fields }) => html`<p>${fields.dynamic}</p>`
         // #endregion dynamic
       )
     })
@@ -36,7 +36,7 @@ describe("text", () => {
           {
             tag: "p",
             type: "el",
-            child: [{ type: "text", data: "/context/dynamic" }],
+            child: [{ type: "text", data: "/fields/dynamic" }],
           },
         ]
         // #endregion expectDynamic
@@ -49,7 +49,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         // #region mixed
-        ({ html, context }) => html`<p>Hello, ${context.family} ${context.name}!</p>`
+        ({ html, fields }) => html`<p>Hello, ${fields.family} ${fields.name}!</p>`
         // #endregion mixed
       )
     })
@@ -63,7 +63,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: ["/context/family", "/context/name"],
+                data: ["/fields/family", "/fields/name"],
                 expr: "Hello, ${_[0]} ${_[1]}!",
               },
             ],
@@ -80,7 +80,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region mathematical
-        ({ html, context }) => html`<p>${context.a + context.b * 2}</p>`
+        ({ html, fields }) => html`<p>${fields.a + fields.b * 2}</p>`
         //#endregion mathematical
       )
     })
@@ -95,7 +95,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: ["/context/a", "/context/b"],
+                data: ["/fields/a", "/fields/b"],
                 expr: "${_[0] + _[1] * 2}",
               },
             ],
@@ -113,7 +113,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region ternary
-        ({ html, context }) => html`<p>${context.flag ? "Yes" : "No"}</p>`
+        ({ html, fields }) => html`<p>${fields.flag ? "Yes" : "No"}</p>`
         //#endregion ternary
       )
     })
@@ -128,7 +128,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: "/context/flag",
+                data: "/fields/flag",
                 expr: '${_[0] ? "Yes" : "No"}',
               },
             ],
@@ -146,7 +146,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region ternaryLiteral
-        ({ html, context }) => html`<p>${context.name ? `Hi, ${context.name}!` : ""}</p>`
+        ({ html, fields }) => html`<p>${fields.name ? `Hi, ${fields.name}!` : ""}</p>`
         //#endregion ternaryLiteral
       )
     })
@@ -161,7 +161,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: "/context/name",
+                data: "/fields/name",
                 expr: '${_[0] ? `Hi, ${_[0]}!` : ""}',
               },
             ],
@@ -179,7 +179,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region logical
-        ({ html, context }) => html`<p class=${context.isOpen && "open"}>${context.isOpen && "Open"}</p>`
+        ({ html, fields }) => html`<p class=${fields.isOpen && "open"}>${fields.isOpen && "Open"}</p>`
         //#endregion logical
       )
     })
@@ -193,14 +193,14 @@ describe("text", () => {
             type: "el",
             string: {
               class: {
-                data: "/context/isOpen",
+                data: "/fields/isOpen",
                 expr: '${_[0] && "open"}',
               },
             },
             child: [
               {
                 type: "text",
-                data: "/context/isOpen",
+                data: "/fields/isOpen",
                 expr: '${_[0] && "Open"}',
               },
             ],
@@ -218,7 +218,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region logicalLiteral
-        ({ html, context }) => html` <p>${context.last && `last: ${context.last}`}</p>`
+        ({ html, fields }) => html` <p>${fields.last && `last: ${fields.last}`}</p>`
         //#endregion logicalLiteral
       )
     })
@@ -232,7 +232,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: "/context/last",
+                data: "/fields/last",
                 expr: "${_[0] && `last: ${_[0]}`}",
               },
             ],
@@ -249,7 +249,7 @@ describe("text", () => {
     beforeAll(() => {
       elements = parse<Context>(
         //#region methods
-        ({ html, context }) => html`<p>${context.name.toUpperCase()} - ${context.email.toLowerCase()}</p>`
+        ({ html, fields }) => html`<p>${fields.name.toUpperCase()} - ${fields.email.toLowerCase()}</p>`
         //#endregion methods
       )
     })
@@ -264,7 +264,7 @@ describe("text", () => {
             child: [
               {
                 type: "text",
-                data: ["/context/name", "/context/email"],
+                data: ["/fields/name", "/fields/email"],
                 expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}",
               },
             ],
diff --git a/node/text.ts b/node/text.ts
index dfaa64e..825ca05 100644
--- a/node/text.ts
+++ b/node/text.ts
@@ -55,7 +55,7 @@ const logUnsupported = (method: string, expr: string) => {
 /**
  * Парсит текстовый узел с поддержкой методов.
  * ВАЖНО: методы НЕ добавляются в data, а отражаются только в expr:
- *   data: ["/context/name", "/context/email"]
+ *   data: ["/fields/name", "/fields/email"]
  *   expr: "${_[0].toUpperCase()} - ${_[1].toLowerCase()}"
  */
 export const parseText = (text: string, context: ParseContext = { pathStack: [], level: 0 }): NodeText => {
@@ -308,7 +308,7 @@ export const findText = (chunk: string) => {
  * Извлекает базовую переменную из выражения (без финального вызова метода).
  * Примеры:
  *   "user.name.toUpperCase()" → "user.name"
- *   "context.list.map(...)"   → "context.list"
+ *   "fields.list.map(...)"   → "context.list"
  */
 const extractBaseVariable = (variable: string): string => {
   const stringLiterals: string[] = []
diff --git a/package.json b/package.json
index d552004..2300590 100644
--- a/package.json
+++ b/package.json
@@ -1,6 +1,6 @@
 {
   "name": "@zavx0z/template",
-  "version": "2.6.1",
+  "version": "2.6.2",
   "description": "HTML шаблонизатор для MetaFor",
   "author": "zavx0z",
   "license": "MIT",
diff --git a/parser.t.ts b/parser.t.ts
index b29910b..6e9688b 100644
--- a/parser.t.ts
+++ b/parser.t.ts
@@ -41,21 +41,21 @@ export type ValueStatic = string
  * @group Варианты значений
  * @example
  * ```html
- * <div class=${context.theme}>Тема пользователя</div>
+ * <div class=${fields.theme}>Тема пользователя</div>
  * ```
  */
 export type ValueVariable = {
   /**
-   * Путь к данным в контексте
+   * Путь к данным в полях
    * @example
    * ```typescript
-   * data: "/context/theme"
+   * data: "/fields/theme"
    * ```
    *
-   * Путь к данным в ядре
+   * Путь к данным в mass
    * @example
    * ```typescript
-   * data: "/core/theme"
+   * data: "/mass/theme"
    * ```
    *
    * Путь к данным инстанса map
@@ -92,23 +92,23 @@ export type ValueVariable = {
  * @group Варианты значений
  * @example
  * ```html
- * <div class=${core.role === 'admin' ? 'admin-panel' : 'user-panel'}>
+ * <div class=${mass.role === 'admin' ? 'admin-panel' : 'user-panel'}>
  *   Панель управления
  * </div>
  * ```
  */
 export type ValueDynamic = {
   /**
-   * Путь к данным в контексте
+   * Путь к данным в полях
    * @example
    * ```typescript
-   * data: "/context/theme"
+   * data: "/fields/theme"
    * ```
    * 
-   * Путь к данным в ядре
+   * Путь к данным в mass
    * @example
    * ```typescript
-   * data: "/core/theme"
+   * data: "/mass/theme"
    * ```
    *
    * Путь к данным инстанса map
@@ -138,7 +138,7 @@ export type ValueDynamic = {
    * Пути к данным
    * @example
    * ```typescript
-   * data: ["/context/theme", "[item]/theme", "../[item]/theme", "[index]/theme", "../[index]/theme"]
+   * data: ["/fields/theme", "[item]/theme", "../[item]/theme", "[index]/theme", "../[index]/theme"]
    * ```
    */
   data: string | string[]
diff --git a/parser.ts b/parser.ts
index af3e613..8e2a1c8 100644
--- a/parser.ts
+++ b/parser.ts
@@ -460,7 +460,7 @@ export const ARGUMENTS_PREFIX = "_"
  * определяя правильные относительные пути для доступа к данным.
  *
  * @param variable - Имя переменной для поиска (может содержать точки для доступа к свойствам)
- * @param context - Контекст парсера с информацией о стеке map контекстов
+ * @param context - Парсер полей с информацией о стеке map контекстов
  * @returns Относительный путь к данным или null, если переменная не найдена
  *
  * @example
@@ -508,13 +508,13 @@ const buildItemPath = (prefix: string, variableParts: string[], isDestructured:
   return hasProperty ? `${prefix}[item]/${variableParts.slice(1).join("/")}` : `${prefix}[item]`
 }
 /**
- * Обрабатывает семантические атрибуты (core/context) с подходом "единый литерал + переменные".
+ * Обрабатывает семантические атрибуты (mass/fields) с подходом "единый литерал + переменные".
  *
  * Извлекает все переменные из строки и создает унифицированное выражение для дальнейшего eval.
- * Подходит для core/context атрибутов, где нужна цельная строка для выполнения.
+ * Подходит для mass/fields атрибутов, где нужна цельная строка для выполнения.
  *
  * @param str - Строка объекта в формате "{ key: value, key2: value2 }"
- * @param ctx - Контекст парсера
+ * @param ctx - Парсер полей
  * @returns Результат с путями к данным и унифицированным выражением
  */
 
@@ -567,7 +567,7 @@ export const processSemanticAttributes = (
  * - Доступ к свойствам через точку
  *
  * @param variable - Имя переменной для разрешения
- * @param context - Контекст парсера с информацией о текущем map контексте
+ * @param context - Парсер полей с информацией о текущем map контексте
  * @returns Путь к данным в формате относительного или абсолютного пути
  *
  * @example
@@ -642,8 +642,8 @@ export const resolveDataPath = (variable: string, context: ParseContext): string
       }
     } else {
       // Переменная не найдена в текущих mapParams
-      // Если переменная начинается с core., то это абсолютный путь
-      if (variable.startsWith("core.")) {
+      // Если переменная начинается с mass., то это абсолютный путь
+      if (variable.startsWith("mass.")) {
         return `/${variable.replace(/\./g, "/")}`
       }
 
@@ -746,7 +746,7 @@ export const createUnifiedExpression = (value: string, variables: string[]): str
  * - Новый контекст для вложенных операций
  *
  * Поддерживает различные сценарии:
- * - Абсолютные пути к данным (например, core.list.map)
+ * - Абсолютные пути к данным (например, mass.list.map)
  * - Относительные пути в контексте map (например, nested.map)
  * - Вложенные map в контексте существующих map
  *
@@ -755,8 +755,8 @@ export const createUnifiedExpression = (value: string, variables: string[]): str
  * @returns Результат парсинга с путем, новым контекстом и метаданными
  *
  * @example
- * parseMap("core.list.map(({ title }) => ...)")
- * // Возвращает: { path: "/core/list", context: {...}, metadata: { params: ["title"] } }
+ * parseMap("mass.list.map(({ title }) => ...)")
+ * // Возвращает: { path: "/mass/list", context: {...}, metadata: { params: ["title"] } }
  *
  * parseMap("nested.map((item) => ...)", context)
  * // Возвращает: { path: "[item]/nested", context: {...}, metadata: { params: ["item"] } }
diff --git a/script/typegen.ts b/script/typegen.ts
index d7f2c73..d96f36d 100644
--- a/script/typegen.ts
+++ b/script/typegen.ts
@@ -13,7 +13,7 @@ export const typegen = async (entrypoint: string, destination: string) => {
     }, 120)
 
     // Включаем все необходимые типы для полноценного автодополнения
-    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true ${entrypoint}`.quiet()
+    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true --no-check ${entrypoint}`.quiet()
 
     spinnerActive = false
     clearInterval(spinner)
@@ -21,7 +21,7 @@ export const typegen = async (entrypoint: string, destination: string) => {
   } else {
     console.log("🛠️  Генерация типов...")
     // Включаем все необходимые типы для полноценного автодополнения
-    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true ${entrypoint}`.quiet()
+    await $`dts-bundle-generator --out-file ${destination} --export-referenced-types true --inline-declare-global true --inline-declare-externals true --no-check ${entrypoint}`.quiet()
     console.log("✅ Типы успешно сгенерированы!")
   }
 }
diff --git a/tmp/lint.md b/tmp/lint.md
new file mode 100644
index 0000000..e69de29
diff --git a/zavx0z.yaml b/zavx0z.yaml
new file mode 100644
index 0000000..a39b852
--- /dev/null
+++ b/zavx0z.yaml
@@ -0,0 +1,24 @@
+
+exclude:
+  - node_modules
+  - dist
+  - .git
+  - .vscode
+  - zavx0z.yaml
+  - .idx
+  - .idea
+  - .cursor
+  - tmp
+  - .gitignore
+  - bun.lock
+  - .DS_Store
+  - .firebase
+  - .firebaserc
+  - bunfig.toml
+  - .github
+  - .png
+  - .jpg
+  - .jpeg
+  - .gif
+  - .webp
+  - .ico
