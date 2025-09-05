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
 * Результат парсинга атрибута.
 * Содержит информацию о динамических атрибутах, извлеченную из template literals.
 *
 * @example Простой динамический атрибут
 * ```html
 * <div class="${context.theme}">Элемент</div>
 * ```
 * Результат: { data: "/context/theme" }
 *
 * @example Сложное выражение в атрибуте
 * ```html
 * <div class="${core.role === 'admin' ? 'admin-panel' : 'user-panel'}">
 *   Панель
 * </div>
 * ```
 * Результат: {
 *   data: ["/core/role"],
 *   expr: "${[0]} === 'admin' ? 'admin-panel' : 'user-panel'"
 * }
 *
 * @example Атрибут с обновлением состояния
 * ```html
 * <input value="${context.email}" onchange=${(e) => update({ email: e.target.value })} />
 * ```
 * Результат: {
 *   data: "/context/email",
 *   upd: "email",
 *   expr: "(e) => update({ email: e.target.value })"
 * }
 *
 * @example Смешанный атрибут
 * ```html
 * <div class="container ${context.theme} ${context.isActive ? 'active' : ''}">
 *   Элемент
 * </div>
 * ```
 * Результат: {
 *   data: ["/context/theme", "/context/isActive"],
 *   expr: "container ${[0]} ${[1] ? 'active' : ''}"
 * }
 *
 * Структура:
 * - `data` - путь(и) к данным в контексте
 * - `expr` - выражение с индексами для сложных вычислений
 * - `upd` - ключи для обновления состояния приложения
 */
export type ParseAttributeResult = {
  /** Путь(и) к данным (например: "/context/name", ["/context/theme", "/core/role"]) */
  data?: string | string[]
  /** Унифицированное выражение с индексами (например: "${[0]} === 'admin' ? 'admin' : 'user'") */
  expr?: string
  /** Ключи для обновления состояния (например: "form.email", ["user", "settings"]) */
  upd?: string | string[]
}

/**
 * Часть текста (статическая или динамическая).
 */
export type ParseTextPart = {
  /** Тип части: "static" для статического текста, "dynamic" для динамического */
  type: "static" | "dynamic"
  /** Содержимое части */
  text: string
}
