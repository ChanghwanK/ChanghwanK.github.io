const COPY_BUTTON_SELECTOR = ".shiki-copy-btn"
const COPIED_ATTR = "data-copied"
const COPIED_RESET_MS = 1500

export const setupCodeCopyButtons = () => {
  if (typeof document === "undefined") {
    return
  }

  document.addEventListener("click", event => {
    const button = (event.target as HTMLElement).closest(
      COPY_BUTTON_SELECTOR
    ) as HTMLButtonElement | null
    if (!button) return

    const codeEl = button.parentElement?.querySelector("pre.shiki code")
    if (!codeEl?.textContent) return

    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      button.setAttribute(COPIED_ATTR, "true")
      window.setTimeout(
        () => button.removeAttribute(COPIED_ATTR),
        COPIED_RESET_MS
      )
    })
  })
}
