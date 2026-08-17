const visit = require("unist-util-visit")

const THEMES = { light: "github-light", dark: "one-dark-pro" }

const COPY_ICON =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">' +
  '<rect x="5.5" y="5.5" width="9" height="9" rx="1.5"></rect>' +
  '<path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"></path>' +
  "</svg>"

const highlight = async (code, lang) => {
  const { codeToHtml } = await import("shiki")
  try {
    return await codeToHtml(code, { lang, themes: THEMES, defaultColor: false })
  } catch (error) {
    // frontmatter에 오타가 있거나 shiki가 모르는 언어 태그일 때 plaintext로 폴백한다.
    return await codeToHtml(code, {
      lang: "text",
      themes: THEMES,
      defaultColor: false,
    })
  }
}

module.exports = async ({ markdownAST }) => {
  const codeNodes = []
  visit(markdownAST, "code", (node, index, parent) => {
    codeNodes.push({ node, index, parent })
  })

  for (const { node, index, parent } of codeNodes) {
    const html = await highlight(node.value, node.lang || "text")
    const wrapped =
      '<div class="shiki-code-block">' +
      '<button type="button" class="shiki-copy-btn" aria-label="코드 복사">' +
      COPY_ICON +
      "</button>" +
      html +
      "</div>"

    parent.children[index] = { type: "html", value: wrapped }
  }

  return markdownAST
}
