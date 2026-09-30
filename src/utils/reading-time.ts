// 예상 읽기 시간은 "사람이 읽는 글"의 분량만으로 계산한다.
// 코드·다이어그램(mermaid, timeline 등 펜스 블록)과 이미지는 훑어보는 시간이 글마다 크게 달라 0분으로 친다.

// 두 속도 모두 근거 문헌이 약한 추정치다. 실제로 글을 읽어 본 시간과 ±30% 넘게 어긋나면 이 값을 조정한다.
// 한글은 띄어쓰기 단위(어절)보다 음절 수가 분량을 더 안정적으로 나타내서 글자 수로 센다.
const KOREAN_CHARS_PER_MINUTE = 500
// 영문은 기술 용어·약어가 대부분이라 일반 산문(분당 250단어 안팎)보다 느리게 잡는다.
const LATIN_WORDS_PER_MINUTE = 200
const MIN_READING_MINUTES = 1

const FENCED_BLOCK = /^(```|~~~)[\s\S]*?^\1[^\S\n]*$/gm
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g
// 링크는 보이는 글자만 남기고 주소는 뺀다. 주소의 영문 조각이 단어로 세어지는 것을 막는다.
const LINK_TARGET = /\]\([^)]*\)/g
const HTML_TAG = /<[^>]+>/g
const HANGUL_SYLLABLE = /[가-힣]/g
const LATIN_WORD = /[A-Za-z0-9]+/g

const stripNonProse = (markdown: string) =>
  markdown
    .replace(FENCED_BLOCK, "")
    .replace(IMAGE, "")
    .replace(LINK_TARGET, "]")
    .replace(HTML_TAG, "")

const countMatches = (text: string, pattern: RegExp) =>
  text.match(pattern)?.length ?? 0

/** frontmatter를 뺀 마크다운 본문으로 예상 읽기 시간(분, 반올림, 최소 1분)을 계산한다. */
export const estimateReadingMinutes = (markdown: string): number => {
  const prose = stripNonProse(markdown)
  const minutes =
    countMatches(prose, HANGUL_SYLLABLE) / KOREAN_CHARS_PER_MINUTE +
    countMatches(prose, LATIN_WORD) / LATIN_WORDS_PER_MINUTE

  return Math.max(MIN_READING_MINUTES, Math.round(minutes))
}
