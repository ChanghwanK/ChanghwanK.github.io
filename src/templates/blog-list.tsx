import * as React from "react"
import { Link, graphql } from "gatsby"
import type { HeadProps, PageProps } from "gatsby"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

interface PostNode {
  fields: { slug: string; readingMinutes: number }
  frontmatter: {
    title: string
    date: string
    rawDate: string
    status: string | null
  }
}

interface BlogListData {
  site: {
    siteMetadata: {
      authorName: string
      authorTagline: string
      authorBio: string
      githubUrl: string
      linkedInUrl: string
    }
  }
  allMarkdownRemark: {
    nodes: PostNode[]
  }
}

interface BlogListPageContext {
  validStatuses: string[]
}

// 한 번에 그리는 글 수. 첫 묶음만 정적 HTML에 들어가고, 나머지는 스크롤이 목록 끝에 닿을 때마다 붙인다.
// 검색엔진은 gatsby-plugin-sitemap으로 나머지 글을 찾으므로 첫 묶음 밖의 글도 색인된다.
// 한 줄짜리 목록이라 한 화면에 20개 안팎이 들어간다.
const POSTS_PER_BATCH = 20

// 화면 아래 끝보다 이만큼 먼저 다음 묶음을 붙여, 스크롤이 목록 끝에서 멈칫하지 않게 한다.
const PRELOAD_MARGIN = "400px"

/**
 * 목록 끝의 감시 요소가 화면 근처에 오면 보여줄 글 수를 한 묶음씩 늘린다.
 * 반환하는 ref를 목록 바로 아래 요소에 붙인다. 전부 보여주면 감시를 멈춘다.
 */
const useInfiniteReveal = (total: number) => {
  const [visibleCount, setVisibleCount] = React.useState(POSTS_PER_BATCH)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const hasMore = visibleCount < total

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!hasMore || !sentinel) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(count => Math.min(count + POSTS_PER_BATCH, total))
        }
      },
      { rootMargin: `0px 0px ${PRELOAD_MARGIN} 0px` }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
    // 묶음이 붙을 때마다 다시 연결해야, 붙은 뒤에도 감시 요소가 여전히 화면 안이면 다음 묶음을 이어서 붙인다.
  }, [hasMore, total, visibleCount])

  return { visibleCount, hasMore, sentinelRef }
}

// 목록은 제목·읽는 시간과 날짜만 한 줄로 보여준다. 요약·썸네일·태그를 빼서 글 수가 늘어도 한눈에 훑을 수 있게 한다.
const PostListItem = ({ post }: { post: PostNode }) => {
  const { title, date, rawDate, status } = post.frontmatter
  const { slug, readingMinutes } = post.fields

  return (
    <li>
      <Link to={slug} className={styles.postLink}>
        <span className={styles.postTitle}>
          {title}
          <span className={styles.readingTime}>{readingMinutes}분</span>
          {status === "writing" && (
            <span className={styles.statusBadge}>{status}</span>
          )}
        </span>
        <time className={styles.date} dateTime={rawDate}>
          {date}
        </time>
      </Link>
    </li>
  )
}

const BlogList = ({ data }: PageProps<BlogListData, BlogListPageContext>) => {
  const posts = data.allMarkdownRemark.nodes
  const { authorName, authorTagline, authorBio, githubUrl, linkedInUrl } =
    data.site.siteMetadata
  const { visibleCount, hasMore, sentinelRef } = useInfiniteReveal(posts.length)

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <ProfileHeader
            name={authorName}
            tagline={authorTagline}
            bio={authorBio}
            githubUrl={githubUrl}
            linkedInUrl={linkedInUrl}
          />
          <h2 className={styles.sectionLabel}>Posts</h2>
          <ul className={styles.postList}>
            {posts.length === 0 ? (
              <li className={styles.emptyState}>
                아직 공개된 포스트가 없습니다.
              </li>
            ) : (
              posts
                .slice(0, visibleCount)
                .map(post => (
                  <PostListItem key={post.fields.slug} post={post} />
                ))
            )}
          </ul>
          {hasMore && <div ref={sentinelRef} aria-hidden="true" />}
        </div>
      </div>
    </Layout>
  )
}

// 검색 결과에서 홈이 어떤 글을 모아 둔 곳인지 보이도록 실제 다루는 주제를 적는다.
const HOME_TITLE = "Kubernetes·Istio·AWS 플랫폼 엔지니어링 기록"

// 홈 설명은 화면 상단 소개글(authorBio)을 그대로 쓴다. 본문에 보이는 문장과 같아야 소개글을 고칠 때
// 함께 바뀌고, Google이 meta description 대신 본문 문장으로 바꿔 쓸 이유도 줄어든다.
// siteMetadata.description을 쓰지 않는 이유: RSS 채널 설명과 404 등 설명 없는 페이지의 기본값으로도 쓰여
// 홈 문구를 다듬을 때마다 그쪽까지 함께 바뀌기 때문이다.
// 소개글의 \n은 화면 줄바꿈용이라 meta 태그에서는 공백 하나로 합친다.
const toSingleLine = (text: string) => text.replace(/\s*\n\s*/g, " ").trim()

// /blog 별칭도 canonical과 구조화 데이터(WebSite)는 /로 둬서 검색엔진이 홈 하나로 인식하게 한다.
export const Head = ({ data }: HeadProps<BlogListData>) => (
  <Seo
    title={HOME_TITLE}
    description={toSingleLine(data.site.siteMetadata.authorBio)}
    pathname="/"
    isSiteHome
  />
)

export const query = graphql`
  query blogListQuery($validStatuses: [String]!) {
    site {
      siteMetadata {
        authorName
        authorTagline
        authorBio
        githubUrl
        linkedInUrl
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: {
        frontmatter: { date: { ne: null }, status: { in: $validStatuses } }
      }
    ) {
      nodes {
        fields {
          slug
          readingMinutes
        }
        frontmatter {
          title
          date(formatString: "YY. M. D.")
          rawDate: date
          status
        }
      }
    }
  }
`

export default BlogList
