import * as React from "react"
import { useEffect, useRef } from "react"
import * as styles from "./comments.module.css"

// giscus는 GitHub Discussions에 댓글을 저장한다. 아래 ID는 공개 식별자이고,
// 레포 Discussions의 Comments 카테고리(Announcement 형식)와 giscus 앱 설치가 전제다.
const GISCUS_ORIGIN = "https://giscus.app"
const GISCUS_CONFIG = {
  repo: "ChanghwanK/ChanghwanK.github.io",
  repoId: "R_kgDOQwoOyQ",
  category: "Comments",
  categoryId: "DIC_kwDOQwoOyc4DG7TD",
}

type GiscusTheme = "light" | "dark"

// 블로그 테마는 <html data-theme>에 걸려 있다 (utils/theme.ts). giscus 테마 이름과 값이 같다.
const readSiteTheme = (): GiscusTheme =>
  document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light"

interface CommentsProps {
  // 글과 Discussion을 잇는 키. URL 변형(끝 슬래시, 쿼리)에 흔들리지 않도록
  // pathname 대신 slug를 그대로 넘긴다.
  term: string
}

const Comments = ({ term }: CommentsProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // giscus는 공식 스크립트가 iframe을 그리는 방식이다. 같은 템플릿 안에서 글을 옮겨 다닐 때는
  // 호출 쪽에서 key로 이 컴포넌트를 새로 만들어 이전 글의 iframe이 남지 않게 한다.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const script = document.createElement("script")
    script.src = `${GISCUS_ORIGIN}/client.js`
    script.async = true
    script.crossOrigin = "anonymous"
    const attributes: Record<string, string> = {
      "data-repo": GISCUS_CONFIG.repo,
      "data-repo-id": GISCUS_CONFIG.repoId,
      "data-category": GISCUS_CONFIG.category,
      "data-category-id": GISCUS_CONFIG.categoryId,
      "data-mapping": "specific",
      "data-term": term,
      // 제목이 비슷한 다른 글의 Discussion에 잘못 붙지 않도록 term의 해시로 정확히 일치시킨다.
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "bottom",
      "data-theme": readSiteTheme(),
      "data-lang": "ko",
      "data-loading": "lazy",
    }
    Object.entries(attributes).forEach(([name, value]) =>
      script.setAttribute(name, value)
    )
    container.appendChild(script)

    // 테마 토글로 data-theme이 바뀌면 이미 떠 있는 iframe에도 알린다.
    // iframe은 다른 출처라 CSS 변수가 전달되지 않으므로 giscus의 postMessage API를 쓴다.
    const themeObserver = new MutationObserver(() => {
      const frame = container.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame"
      )
      frame?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: readSiteTheme() } } },
        GISCUS_ORIGIN
      )
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    return () => {
      themeObserver.disconnect()
      container.replaceChildren()
    }
  }, [term])

  return (
    <section className={styles.comments} aria-label="댓글">
      <div ref={containerRef} />
    </section>
  )
}

export default Comments
