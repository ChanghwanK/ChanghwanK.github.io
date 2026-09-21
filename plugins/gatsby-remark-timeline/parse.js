// ```timeline 블록의 텍스트를 사건 목록으로 바꾼다.
// 한 줄 = 사건 하나: `시간 | 상태 | 제목 | 설명(생략 가능)`

const TIMELINE_STATUSES = ["info", "danger", "ok"]

const FIELD_SEPARATOR = "|"
const ESCAPED_FIELD_SEPARATOR = "\\|"
const TIME_LINE_BREAK = "//"
const COMMENT_PREFIX = "#"

const REQUIRED_FIELD_COUNT = 3
const MAX_FIELD_COUNT = 4

class TimelineSyntaxError extends Error {
  // lineNumber는 블록 안에서의 1-based 줄 번호다. 파일 기준 줄 번호로의 환산은 호출자(index.js)가 한다.
  constructor(message, lineNumber) {
    super(message)
    this.name = "TimelineSyntaxError"
    this.lineNumber = lineNumber
  }
}

const splitFields = line =>
  line
    .split(/(?<!\\)\|/)
    .map(field => field.replaceAll(ESCAPED_FIELD_SEPARATOR, FIELD_SEPARATOR).trim())

const isIgnoredLine = line => {
  const trimmed = line.trim()
  return trimmed === "" || trimmed.startsWith(COMMENT_PREFIX)
}

const parseEventLine = (line, lineNumber) => {
  const fields = splitFields(line)

  if (fields.length < REQUIRED_FIELD_COUNT) {
    throw new TimelineSyntaxError(
      `필드가 ${fields.length}개입니다. "시간 | 상태 | 제목 | 설명" 형식이어야 합니다 (설명만 생략 가능).`,
      lineNumber
    )
  }
  // 조용히 합치지 않는다. 필드가 남는 경우는 거의 항상 본문의 | 를 이스케이프하지 않은 실수다.
  if (fields.length > MAX_FIELD_COUNT) {
    throw new TimelineSyntaxError(
      `필드가 ${fields.length}개입니다. 본문에 | 문자가 필요하면 \\| 로 쓰세요.`,
      lineNumber
    )
  }

  const [time, status, title, description = ""] = fields

  // 포스트모템에서 상태색은 내용이다. 오타를 기본값(info)으로 넘기면 장애 구간이 회색으로 배포된다.
  if (!TIMELINE_STATUSES.includes(status)) {
    throw new TimelineSyntaxError(
      `알 수 없는 상태 "${status}"입니다. 허용값: ${TIMELINE_STATUSES.join(", ")}`,
      lineNumber
    )
  }

  const timeLines = time
    .split(TIME_LINE_BREAK)
    .map(part => part.trim())
    .filter(part => part !== "")

  if (timeLines.length === 0) {
    throw new TimelineSyntaxError("시간이 비어 있습니다.", lineNumber)
  }
  if (title === "") {
    throw new TimelineSyntaxError("제목이 비어 있습니다.", lineNumber)
  }

  return { timeLines, status, title, description }
}

const parseTimeline = source =>
  source
    .split("\n")
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => !isIgnoredLine(line))
    .map(({ line, lineNumber }) => parseEventLine(line, lineNumber))

module.exports = { parseTimeline, TimelineSyntaxError, TIMELINE_STATUSES }
