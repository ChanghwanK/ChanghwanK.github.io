const { test } = require("node:test")
const assert = require("node:assert/strict")
const { renderTimeline } = require("./render")

const createEvent = overrides => ({
  timeLines: ["14:32"],
  status: "danger",
  title: "kubelet 하트비트 중단",
  description: "",
  ...overrides,
})

test("사건마다 상태가 data-status로 붙은 항목 하나를 만든다", () => {
  const html = renderTimeline([
    createEvent({ status: "danger" }),
    createEvent({ status: "ok", title: "노드 Ready 복귀" }),
  ])

  assert.match(html, /^<ol class="timeline">.*<\/ol>$/)
  assert.equal(html.match(/<li class="timeline-item"/g).length, 2)
  assert.ok(html.includes('data-status="danger"'))
  assert.ok(html.includes('data-status="ok"'))
})

test("상태는 색 없이도 읽히도록 라벨 텍스트로도 들어간다", () => {
  const html = renderTimeline([createEvent({ status: "danger" })])

  assert.ok(html.includes('<span class="timeline-sr">장애: </span>'))
})

test("두 줄짜리 시간은 줄마다 span으로 나뉘고, CSS가 없어도 붙지 않게 공백이 들어간다", () => {
  const html = renderTimeline([createEvent({ timeLines: ["14:20", "05:20Z"] })])

  assert.ok(
    html.includes(
      '<div class="timeline-time">' +
        '<span class="timeline-time-line">14:20</span> ' +
        '<span class="timeline-time-line">05:20Z</span>' +
        "</div>"
    )
  )
})

test("설명이 없으면 설명 문단을 만들지 않는다", () => {
  const html = renderTimeline([createEvent({ description: "" })])

  assert.ok(!html.includes("timeline-desc"))
})

test("백틱 구간은 인라인 코드가 된다", () => {
  const html = renderTimeline([
    createEvent({ description: "`vmsingle` 9.4GB 시점." }),
  ])

  assert.ok(
    html.includes('<p class="timeline-desc"><code>vmsingle</code> 9.4GB 시점.</p>')
  )
})

test("본문의 HTML은 실행되지 않도록 이스케이프된다", () => {
  const html = renderTimeline([
    createEvent({
      timeLines: ["<b>14:32</b>"],
      title: "<script>alert(1)</script>",
      description: "limit > request & `a<b`",
    }),
  ])

  assert.ok(!html.includes("<script>"))
  assert.ok(!html.includes("<b>"))
  assert.ok(html.includes("&lt;b&gt;14:32&lt;/b&gt;"))
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"))
  assert.ok(html.includes("limit &gt; request &amp; <code>a&lt;b</code>"))
})
