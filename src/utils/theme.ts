export type Theme = "dark" | "light"

const DEFAULT_THEME: Theme = "dark"

const isTheme = (value: string | null): value is Theme =>
  value === "dark" || value === "light"

export const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME
  }

  const storedTheme = window.localStorage.getItem("theme")
  return isTheme(storedTheme) ? storedTheme : DEFAULT_THEME
}

export const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme)
}

export const saveTheme = (theme: Theme) => {
  window.localStorage.setItem("theme", theme)
  applyTheme(theme)
}
