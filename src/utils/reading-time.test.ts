import { test } from "node:test"
import assert from "node:assert/strict"
import { estimateReadingMinutes } from "./reading-time.ts"

const hangul = (count: number) => "가".repeat(count)
const latinWords = (count: number) => Array(count).fill("pod").join(" ")

test("한글은 분당 500자로 계산한다", () => {
  assert.equal(estimateReadingMinutes(hangul(1000)), 2)
})

test("영문은 분당 200단어로 계산한다", () => {
  assert.equal(estimateReadingMinutes(latinWords(400)), 2)
})

test("한글과 영문이 섞이면 두 시간을 더한 뒤 반올림한다", () => {
  // 한글 750자(1.5분) + 영문 100단어(0.5분) = 2분
  assert.equal(estimateReadingMinutes(`${hangul(750)} ${latinWords(100)}`), 2)
})

test("코드 블록은 분량에 넣지 않는다", () => {
  const prose = hangul(1000)
  const withCode = `${prose}\n\n\`\`\`yaml\n${latinWords(2000)}\n\`\`\`\n`

  assert.equal(estimateReadingMinutes(withCode), estimateReadingMinutes(prose))
})

test("mermaid 같은 다이어그램 블록과 물결표 펜스도 코드 블록처럼 뺀다", () => {
  const withDiagrams = [
    hangul(1000),
    "```mermaid",
    latinWords(500),
    "```",
    "~~~timeline",
    latinWords(500),
    "~~~",
  ].join("\n")

  assert.equal(estimateReadingMinutes(withDiagrams), 2)
})

test("이미지와 링크 주소는 세지 않고 링크 글자만 센다", () => {
  const url = `https://example.com/${latinWords(300).replace(/ /g, "/")}`
  const markdown = `${hangul(1000)} ![diagram](${url}) [문서](${url})`

  assert.equal(estimateReadingMinutes(markdown), 2)
})

test("아주 짧거나 빈 글도 최소 1분으로 표시한다", () => {
  assert.equal(estimateReadingMinutes(""), 1)
  assert.equal(estimateReadingMinutes("```\ncode only\n```"), 1)
})
