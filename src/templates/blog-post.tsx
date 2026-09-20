import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Link, graphql } from "gatsby"
import type { PageProps, HeadProps } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

interface BlogPostData {
  markdownRemark: {
    html: string
    fields: { slug: string }
    frontmatter: {
      title: string
      date: string
      rawDate: string
      description: string | null
      thumbnail: { publicURL: string } | null
    }
    excerpt: string
    tableOfContents: string
  }
}

// 목차는 "어디쯤 읽고 있는지"를 보여주는 용도라 섹션 단위(h2)까지만 담는다.
// 깊이를 바꾸려면 하단 GraphQL 쿼리의 tableOfContents(maxDepth)를 수정한다 (쿼리에는 상수 보간이 불가).
const TOC_REVEAL_SCROLL_Y = 300
// 헤딩이 뷰포트 상단에서 이 거리 안으로 들어오면 "읽는 중"으로 본다.
// 앵커 이동 직후 헤딩이 상단에 붙는 위치보다 넉넉해야 클릭한 항목이 바로 active가 된다.
const ACTIVE_HEADING_OFFSET_PX = 120

interface TocSection {
  link: HTMLAnchorElement
  heading: HTMLElement
}

const collectTocSections = (tocList: HTMLElement | null): TocSection[] => {
  if (!tocList) return []

  const sections: TocSection[] = []
  tocList.querySelectorAll<HTMLAnchorElement>("a[href*='#']").forEach(link => {
    // 한글 헤딩은 href에서 percent-encoding 되어 있어 id와 비교하려면 디코딩이 필요하다.
    const headingId = decodeURIComponent(link.hash.slice(1))
    const heading = document.getElementById(headingId)
    if (heading) sections.push({ link, heading })
  })
  return sections
}

// 긴 글은 목차 자체가 스크롤되므로 읽는 위치를 목차 영역 안에 유지한다.
// scrollIntoView는 조상 스크롤 박스를 모두 움직여 본문 스크롤까지 밀어내므로(실측: 목차 top 값만큼 이동)
// 목차 컨테이너의 scrollTop만 직접 조정한다.
const keepVisibleInTocScroll = (link: HTMLAnchorElement) => {
  const tocScrollContainer = link.closest("nav")
  if (!tocScrollContainer) return

  const containerRect = tocScrollContainer.getBoundingClientRect()
  const linkRect = link.getBoundingClientRect()
  if (linkRect.top < containerRect.top) {
    tocScrollContainer.scrollTop -= containerRect.top - linkRect.top
  } else if (linkRect.bottom > containerRect.bottom) {
    tocScrollContainer.scrollTop += linkRect.bottom - containerRect.bottom
  }
}

// 목차 HTML은 dangerouslySetInnerHTML로 들어와 React가 관리하지 않으므로
// active 표시는 state가 아니라 data 속성으로 직접 남긴다.
const markActiveSection = (sections: TocSection[]) => {
  let activeSection: TocSection | null = null
  for (const section of sections) {
    const hasPassedReadingLine =
      section.heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET_PX
    if (!hasPassedReadingLine) break
    activeSection = section
  }

  sections.forEach(section => {
    if (section === activeSection) {
      const isNewlyActive = section.link.dataset.active !== "true"
      section.link.dataset.active = "true"
      if (isNewlyActive) keepVisibleInTocScroll(section.link)
    } else {
      delete section.link.dataset.active
    }
  })
}

const BlogPostTemplate = ({ data }: PageProps<BlogPostData>) => {
  const post = data.markdownRemark
  const { title, description, date, rawDate } = post.frontmatter
  const [tocVisible, setTocVisible] = useState(false)
  const tocListRef = useRef<HTMLElement>(null)

  const hasToc = (post.tableOfContents ?? "").trim().length > 0

  useEffect(() => {
    if (!hasToc) return undefined

    const tocSections = collectTocSections(tocListRef.current)

    let frameId: number | null = null
    const handleScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        setTocVisible(window.scrollY > TOC_REVEAL_SCROLL_Y)
        markActiveSection(tocSections)
        frameId = null
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [hasToc])

  return (
    <Layout>
      <div className={styles.darkPage}>
        {hasToc && (
          <aside
            className={`${styles.toc} ${tocVisible ? styles.tocVisible : ""}`}
          >
            <p className={styles.tocLabel}>목차</p>
            <nav
              ref={tocListRef}
              className={styles.tocList}
              aria-label="목차"
              dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
            />
          </aside>
        )}
        <nav className={styles.pageNav} aria-label="브레드크럼">
          <Link to="/" className={styles.navHome}>
            Aiden_
          </Link>
          <span className={styles.navSep}>/</span>
          <Link to="/blog" className={styles.navHome}>
            Post
          </Link>
        </nav>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {description && <h2 className={styles.subtitle}>{description}</h2>}

            <div className={styles.meta}>
              <time className={styles.date} dateTime={rawDate}>
                {date}
              </time>
            </div>
          </header>

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <footer className={styles.footer}>
            <Link to="/blog">← posts</Link>
          </footer>
        </article>
      </div>
    </Layout>
  )
}

export const Head = ({ data }: HeadProps<BlogPostData>) => {
  const post = data.markdownRemark
  const image = post.frontmatter.thumbnail?.publicURL
  return (
    <>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
        image={image}
        pathname={post.fields.slug}
        ogType="article"
      />
    </>
  )
}

export const query = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "YYYY년 MM월 DD일")
        rawDate: date
        description
        thumbnail {
          publicURL
        }
      }
      excerpt
      tableOfContents(maxDepth: 2)
    }
  }
`

export default BlogPostTemplate
