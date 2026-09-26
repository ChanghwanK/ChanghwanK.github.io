const fs = require("fs")
const visit = require("unist-util-visit")
const { LIGHT_CONFIG, DARK_CONFIG, FONT_CSS_URL } = require("./themes")

const MERMAID_LANG = "mermaid"

// Playwright 전용 Chromium을 내려받지 않고 로컬에 설치된 Chrome으로 렌더링한다.
// 배포(npm run deploy)가 이 맥에서만 돌기 때문에 가능한 선택이다. CI에서 빌드하게 되면 바꿔야 한다.
const LAUNCH_OPTIONS = { channel: "chrome" }

// mermaid-isomorphic은 ESM 전용이라 require할 수 없다.
// 렌더러는 브라우저 인스턴스를 들고 있으므로 한 번만 만들어 모든 글에서 재사용한다 (유휴 시 스스로 닫힌다).
let rendererPromise
const getRenderer = () => {
  if (!rendererPromise) {
    rendererPromise = import("mermaid-isomorphic").then(
      ({ createMermaidRenderer }) =>
        createMermaidRenderer({ launchOptions: LAUNCH_OPTIONS })
    )
  }
  return rendererPromise
}

// gatsby-remark-timeline과 같은 이유로 파일 기준 줄 번호를 계산한다 (오류 경로에서만 호출).
const countFrontmatterLines = markdownNode => {
  const fileLineCount = fs
    .readFileSync(markdownNode.fileAbsolutePath, "utf8")
    .split("\n").length
  const bodyLineCount = markdownNode.rawMarkdownBody.split("\n").length
  return fileLineCount - bodyLineCount
}

// 사이트는 data-theme 속성으로 라이트/다크를 런타임에 바꾼다. SVG에 색이 박히므로
// 테마별로 한 벌씩 만들고 CSS로 하나만 보인다 (display:none이라 스크린 리더도 하나만 읽는다).
const renderFigure = (lightSvg, darkSvg) =>
  `<figure class="mermaid-diagram">` +
  `<div class="mermaid-diagram-light">${lightSvg}</div>` +
  `<div class="mermaid-diagram-dark">${darkSvg}</div>` +
  `</figure>`

module.exports = async ({ markdownAST, markdownNode }) => {
  const targets = []
  visit(markdownAST, "code", node => {
    if (node.lang === MERMAID_LANG) targets.push(node)
  })
  if (targets.length === 0) return markdownAST

  const render = await getRenderer()
  const diagrams = targets.map(node => node.value)
  // 한 페이지 안에서 SVG id가 겹치면 스타일(#id 선택자)과 마커가 서로 섞인다. 테마별 prefix로 구분한다.
  const [lightResults, darkResults] = await Promise.all([
    render(diagrams, {
      prefix: "mermaid-light",
      mermaidConfig: LIGHT_CONFIG,
      css: FONT_CSS_URL,
    }),
    render(diagrams, {
      prefix: "mermaid-dark",
      mermaidConfig: DARK_CONFIG,
      css: FONT_CSS_URL,
    }),
  ])

  targets.forEach((node, i) => {
    const light = lightResults[i]
    const dark = darkResults[i]
    const failed = [light, dark].find(result => result.status === "rejected")
    if (failed) {
      const fileLine =
        countFrontmatterLines(markdownNode) + node.position.start.line
      // timeline 플러그인과 같은 이유로 로그가 아니라 throw한다: 실패한 변환이 캐시되지 않게.
      throw new Error(
        `[gatsby-remark-mermaid-svg] ${markdownNode.fileAbsolutePath}:${fileLine} ${failed.reason}`
      )
    }

    node.type = "html"
    node.value = renderFigure(light.value.svg, dark.value.svg)
    delete node.lang
    delete node.meta
  })

  return markdownAST
}
