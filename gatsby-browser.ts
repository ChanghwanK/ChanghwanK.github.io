import "./src/styles/theme.css"
import "./src/styles/global.css"
import "katex/dist/katex.min.css"
import { applyTheme, getStoredTheme } from "./src/utils/theme"
import { setupCodeCopyButtons } from "./src/utils/code-copy"

export const onClientEntry = () => {
  applyTheme(getStoredTheme())
  setupCodeCopyButtons()
}
