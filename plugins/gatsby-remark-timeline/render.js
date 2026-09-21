// 사건 목록을 타임라인 HTML로 바꾼다. 모양은 src/templates/blog-post.module.css의 .timeline 규칙이 입힌다.

// 상태는 색으로만 전달하지 않는다. 스크린 리더와 CSS가 없는 RSS 리더에서도 읽히도록 라벨을 함께 넣는다.
const STATUS_LABELS = {
  info: "기록",
  danger: "장애",
  ok: "복구",
}

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

const escapeHtml = text => text.replace(/[&<>"']/g, char => HTML_ESCAPES[char])

// 지원하는 인라인 마크다운은 백틱 코드뿐이다. 반드시 이스케이프 이후에 적용해야 <code> 태그가 살아남는다.
const renderInline = text =>
  escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>")

const renderEvent = ({ timeLines, status, title, description }) => {
  // <br> 대신 줄마다 span을 쓴다. 좁은 화면에서는 한 줄로 나란히 놓아야 하는데 <br>은 CSS로 공백으로 바꿀 수 없다.
  // span 사이의 공백은 CSS가 없는 RSS 리더에서 두 시간이 붙지 않게 한다.
  const time = timeLines
    .map(line => `<span class="timeline-time-line">${escapeHtml(line)}</span>`)
    .join(" ")
  const descriptionHtml =
    description === ""
      ? ""
      : `<p class="timeline-desc">${renderInline(description)}</p>`

  return (
    `<li class="timeline-item" data-status="${status}">` +
    `<div class="timeline-time">${time}</div>` +
    `<div class="timeline-body">` +
    `<p class="timeline-title"><span class="timeline-sr">${STATUS_LABELS[status]}: </span>${renderInline(title)}</p>` +
    descriptionHtml +
    `</div>` +
    `</li>`
  )
}

const renderTimeline = events =>
  `<ol class="timeline">${events.map(renderEvent).join("")}</ol>`

module.exports = { renderTimeline }
