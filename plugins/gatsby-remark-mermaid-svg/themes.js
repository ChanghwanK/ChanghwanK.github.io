// mermaid 테마 변수는 CSS 변수(var(--...))를 받지 못한다. 파생 색을 계산하려고 실제 색 값을 파싱하기 때문이다.
// 그래서 src/styles/theme.css의 토큰 값을 여기에 옮겨 적는다. 사이트 팔레트를 바꾸면 이 파일도 함께 바꾼다.

// 측정과 표시 폰트가 다르면 노드 박스보다 글자가 넓어져 잘린다. 사이트 본문과 같은 폰트 목록을 쓴다.
const FONT_FAMILY =
  '"Noto Sans KR", "Apple SD Gothic Neo", "Nanum Barun Gothic", "Nanum Gothic", Verdana, Arial, "Malgun Gothic", Dotum, sans-serif'

const LIGHT_CONFIG = {
  theme: "base",
  fontFamily: FONT_FAMILY,
  themeVariables: {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    background: "#ffffff", // --bg-page
    primaryColor: "#f7f7f7", // --bg-elevated
    primaryBorderColor: "#b0b0b0", // --border-accent
    primaryTextColor: "#222222", // --text-primary
    secondaryColor: "#f2f2f2", // --bg-card
    tertiaryColor: "#ffffff",
    lineColor: "#767676", // --text-muted
    textColor: "#333333", // --text-prose
    clusterBkg: "#fbfbfb",
    clusterBorder: "#d4d4d4", // --border-strong
    edgeLabelBackground: "#ffffff",
    noteBkgColor: "#f2f2f2",
    noteBorderColor: "#d4d4d4",
    noteTextColor: "#333333",
  },
}

const DARK_CONFIG = {
  theme: "base",
  fontFamily: FONT_FAMILY,
  themeVariables: {
    darkMode: true,
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    background: "#17140f", // --bg-page
    primaryColor: "#221d16", // --bg-card
    primaryBorderColor: "#4d4735", // --border-accent
    primaryTextColor: "#e8e3d6", // --text-primary
    secondaryColor: "#1e1a14", // --bg-elevated
    tertiaryColor: "#17140f",
    lineColor: "#857f6b", // --text-dim
    textColor: "#cfc8b6", // --text-h3
    clusterBkg: "#1b1812",
    clusterBorder: "#322c21", // --border-strong
    edgeLabelBackground: "#17140f",
    noteBkgColor: "#221d16",
    noteBorderColor: "#4d4735",
    noteTextColor: "#cfc8b6",
    actorBkg: "#221d16",
    actorBorder: "#4d4735",
    actorTextColor: "#e8e3d6",
    actorLineColor: "#4d4735",
    signalColor: "#a8a08c", // --text-body
    signalTextColor: "#cfc8b6",
    labelBoxBkgColor: "#221d16",
    labelBoxBorderColor: "#4d4735",
    labelTextColor: "#e8e3d6",
    sequenceNumberColor: "#17140f",
  },
}

module.exports = { LIGHT_CONFIG, DARK_CONFIG }
