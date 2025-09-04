import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe("context и core", () => {
  describe("meta-компоненты с context и core", () => {
    it("meta-компонент с context", () => {
      const attrs = parseAttributes("context=${{user: currentUser, theme: currentTheme}}")
      expect(attrs).toEqual({
        context: "{ user: currentUser, theme: currentTheme }",
      })
    })

    it("meta-компонент с core", () => {
      const attrs = parseAttributes("core=${{state: appState, actions: appActions}}")
      expect(attrs).toEqual({
        core: "{ state: appState, actions: appActions }",
      })
    })

    it("meta-компонент с context и core", () => {
      const attrs = parseAttributes(
        "context=${{user: currentUser, theme: currentTheme}} core=${{state: appState, actions: appActions}}"
      )
      expect(attrs).toEqual({
        context: "{ user: currentUser, theme: currentTheme }",
        core: "{ state: appState, actions: appActions }",
      })
    })

    it("meta-компонент с динамическим context", () => {
      const attrs = parseAttributes("context=${{user: ${getCurrentUser()}, theme: ${getTheme()}}}")
      expect(attrs).toEqual({
        context: "{ user: ${getCurrentUser()}, theme: ${getTheme()} }",
      })
    })

    it("meta-компонент с условным context", () => {
      const attrs = parseAttributes(
        "context=${{user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme}}"
      )
      expect(attrs).toEqual({
        context: "{ user: isLoggedIn ? currentUser : null, theme: isDark ? darkTheme : lightTheme }",
      })
    })

    it("meta-компонент с вложенными объектами в context", () => {
      const attrs = parseAttributes(
        'context=${{user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" }}}'
      )
      expect(attrs).toEqual({
        context: '{ user: { id: currentUser.id, name: currentUser.name }, settings: { theme: "dark", lang: "ru" } }',
      })
    })

    it("meta-компонент с функциями в core", () => {
      const attrs = parseAttributes(
        "core=${{actions: { save: saveData, delete: deleteData }, utils: { format: formatText }}}"
      )
      expect(attrs).toEqual({
        core: "{ actions: { save: saveData, delete: deleteData }, utils: { format: formatText } }",
      })
    })

    it("meta-компонент с template literals в context", () => {
      const attrs = parseAttributes(
        'context=${{apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws`}}'
      )
      expect(attrs).toEqual({
        context: '{ apiUrl: `${baseUrl}/api`, wsUrl: `${baseUrl.replace("http", "ws")}/ws` }',
      })
    })

    it("meta-компонент с пустым context", () => {
      const attrs = parseAttributes("context=${{}}")
      expect(attrs).toEqual({})
    })

    it("meta-компонент с пустым core", () => {
      const attrs = parseAttributes("core=${{}}")
      expect(attrs).toEqual({})
    })

    it("meta-компонент с context, core и другими атрибутами", () => {
      const attrs = parseAttributes(
        'class="container" context=${{user: currentUser}} core=${{state: appState}} data-testid="meta-component"'
      )
      expect(attrs).toEqual({
        context: "{ user: currentUser }",
        core: "{ state: appState }",
        string: {
          class: { type: "static", value: "container" },
          "data-testid": { type: "static", value: "meta-component" },
        },
      })
    })
  })
})
