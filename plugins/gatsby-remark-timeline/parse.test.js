const { test } = require("node:test")
const assert = require("node:assert/strict")
const { parseTimeline, TimelineSyntaxError } = require("./parse")

test("한 줄을 시간, 상태, 제목, 설명을 가진 사건 하나로 읽는다", () => {
  const events = parseTimeline(
    "14:32 | danger | kubelet 하트비트 중단 | vmsingle 9.4GB 시점."
  )

  assert.deepEqual(events, [
    {
      timeLines: ["14:32"],
      status: "danger",
      title: "kubelet 하트비트 중단",
      description: "vmsingle 9.4GB 시점.",
    },
  ])
})

test("설명은 생략할 수 있다", () => {
  const [event] = parseTimeline("14:34:44 | danger | 노드 NotReady 판정")

  assert.equal(event.description, "")
})

test("시간의 // 는 줄바꿈으로 읽는다 (KST와 UTC 병기)", () => {
  const [event] = parseTimeline("14:20 // 05:20Z | info | 메모리 84%")

  assert.deepEqual(event.timeLines, ["14:20", "05:20Z"])
})

test("정렬을 위해 넣은 필드 주변 공백은 버린다", () => {
  const [event] = parseTimeline("14:45:18           | ok     | 노드 Ready 복귀")

  assert.deepEqual(
    [event.timeLines, event.status, event.title],
    [["14:45:18"], "ok", "노드 Ready 복귀"]
  )
})

test("\\| 로 쓴 파이프는 필드를 나누지 않고 본문에 남는다", () => {
  const [event] = parseTimeline("14:20 | info | a \\| b | grep x \\| wc -l")

  assert.equal(event.title, "a | b")
  assert.equal(event.description, "grep x | wc -l")
})

test("빈 줄과 # 주석 줄은 사건으로 세지 않는다", () => {
  const events = parseTimeline(
    ["# 장애 전", "14:20 | info | 전조", "", "14:32 | danger | 중단"].join("\n")
  )

  assert.deepEqual(
    events.map(event => event.title),
    ["전조", "중단"]
  )
})

test("알 수 없는 상태는 기본값으로 넘기지 않고 줄 번호와 허용값을 알려준다", () => {
  const source = ["14:20 | info | 전조", "14:32 | dangr | 중단"].join("\n")

  assert.throws(
    () => parseTimeline(source),
    error =>
      error instanceof TimelineSyntaxError &&
      error.lineNumber === 2 &&
      error.message.includes('"dangr"') &&
      error.message.includes("info, danger, ok")
  )
})

test("무시된 줄이 있어도 오류의 줄 번호는 블록 원문 기준이다", () => {
  const source = ["# 주석", "", "14:32 | dangr | 중단"].join("\n")

  assert.throws(
    () => parseTimeline(source),
    error => error.lineNumber === 3
  )
})

test("제목까지 없는 줄은 형식 오류다", () => {
  assert.throws(
    () => parseTimeline("14:32 | danger"),
    error =>
      error instanceof TimelineSyntaxError && error.message.includes("필드가 2개")
  )
})

test("이스케이프하지 않은 파이프로 필드가 남으면 합치지 않고 오류로 알린다", () => {
  assert.throws(
    () => parseTimeline("14:32 | info | a | b | c"),
    error =>
      error instanceof TimelineSyntaxError && error.message.includes("\\|")
  )
})

test("시간이나 제목이 비어 있으면 오류다", () => {
  assert.throws(() => parseTimeline(" | info | 제목"), /시간이 비어/)
  assert.throws(() => parseTimeline("14:32 | info | "), /제목이 비어/)
})
