const fs = require("fs")
const visit = require("unist-util-visit")
const { parseTimeline, TimelineSyntaxError } = require("./parse")
const { renderTimeline } = require("./render")

const TIMELINE_LANG = "timeline"

// remark는 frontmatter를 뗀 본문만 파싱하므로 node.position의 줄 번호는 본문 기준이다.
// 작성자가 에디터에서 바로 찾을 수 있도록 파일 기준 줄 번호로 되돌린다.
// markdownNode.internal.content도 이미 본문뿐이라(실측) 원본 파일을 직접 읽어야 한다. 오류 경로에서만 호출된다.
const countFrontmatterLines = markdownNode => {
  const fileLineCount = fs
    .readFileSync(markdownNode.fileAbsolutePath, "utf8")
    .split("\n").length
  const bodyLineCount = markdownNode.rawMarkdownBody.split("\n").length
  return fileLineCount - bodyLineCount
}

module.exports = ({ markdownAST, markdownNode }) => {
  visit(markdownAST, "code", (node, index, parent) => {
    if (node.lang !== TIMELINE_LANG) return

    try {
      parent.children[index] = {
        type: "html",
        value: renderTimeline(parseTimeline(node.value)),
      }
    } catch (error) {
      if (!(error instanceof TimelineSyntaxError)) throw error

      // 여는 펜스(```timeline)가 node.position.start.line이고, 블록의 첫 줄은 그 다음 줄이다.
      const fileLine =
        countFrontmatterLines(markdownNode) +
        node.position.start.line +
        error.lineNumber

      // 로그만 남기고 넘어가면 안 된다 (reporter.panicOnBuild는 develop에서 중단하지 않는다).
      // 그러면 실패한 변환이 "성공"으로 캐시되어, 캐시를 지우지 않은 다음 build가 오류 없이 통과한다 (실측).
      // 던지면 변환 결과가 캐시되지 않고, develop은 해당 페이지에만 오류를 띄우며, build는 실패한다.
      throw new Error(
        `[gatsby-remark-timeline] ${markdownNode.fileAbsolutePath}:${fileLine} ${error.message}`
      )
    }
  })

  return markdownAST
}
