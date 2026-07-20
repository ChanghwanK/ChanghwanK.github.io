import "./src/styles/theme.css"
import "./src/styles/global.css"
import { defineCustomElements } from "@deckdeckgo/highlight-code/dist/loader"
import { applyTheme, getStoredTheme } from "./src/utils/theme"

defineCustomElements()

export const onClientEntry = () => {
  applyTheme(getStoredTheme())
}
