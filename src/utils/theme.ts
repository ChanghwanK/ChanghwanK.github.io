export type Theme = "dark" | "light"

export const DEFAULT_THEME: Theme = "dark"

// 다크 모드를 잠시 끈다. 다크 토큰(theme.css)과 전환 코드는 남겨 두고, false인 동안에는
// 토글을 숨기고 저장된 선택과 무관하게 항상 라이트로 그린다. 다시 켜려면 true로 바꾼다.
export const DARK_MODE_ENABLED = false

const isTheme = (value: string | null): value is Theme =>
  value === "dark" || value === "light"

export const getStoredTheme = (): Theme => {
  // 예전에 Dark를 골라 localStorage에 "dark"가 남은 방문자도 라이트로 보이게 저장값보다 먼저 확인한다.
  if (!DARK_MODE_ENABLED) {
    return "light"
  }

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
