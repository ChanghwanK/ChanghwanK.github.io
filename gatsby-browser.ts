import "./src/styles/theme.css"
import { defineCustomElements } from "@deckdeckgo/highlight-code/dist/loader"

defineCustomElements()

export const onClientEntry = () => {
  const saved =
    typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null
  const theme = saved || "dark"
  document.documentElement.setAttribute("data-theme", theme)
}
