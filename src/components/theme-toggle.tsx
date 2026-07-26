import * as React from "react"
import { DEFAULT_THEME, getStoredTheme, saveTheme, type Theme } from "../utils/theme"
import * as styles from "./theme-toggle.module.css"

const ThemeToggle = () => {
  const [theme, setTheme] = React.useState<Theme>(DEFAULT_THEME)

  React.useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  const selectTheme = (next: Theme) => {
    if (next === theme) return
    setTheme(next)
    saveTheme(next)
  }

  return (
    <div className={styles.toggleGroup} role="group" aria-label="테마 선택">
      <button
        type="button"
        className={`${styles.toggleOption} ${
          theme === "light" ? styles.toggleOptionActive : ""
        }`}
        onClick={() => selectTheme("light")}
        aria-pressed={theme === "light"}
      >
        Light
      </button>
      <button
        type="button"
        className={`${styles.toggleOption} ${
          theme === "dark" ? styles.toggleOptionActive : ""
        }`}
        onClick={() => selectTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        Dark
      </button>
    </div>
  )
}

export default ThemeToggle
