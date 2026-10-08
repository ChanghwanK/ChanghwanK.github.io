import * as React from "react"
import { graphql } from "gatsby"
import type { PageProps } from "gatsby"
import Layout from "../components/layout"
import PostList from "../components/post-list"
import type { PostListNode } from "../components/post-list"
import SiteNav from "../components/site-nav"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

interface BlogListData {
  allMarkdownRemark: {
    nodes: PostListNode[]
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

const BlogList = ({ data }: PageProps<BlogListData, BlogListPageContext>) => {
  const posts = data.allMarkdownRemark.nodes
  const { visibleCount, hasMore, sentinelRef } = useInfiniteReveal(posts.length)

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <SiteNav />
          <h1 className={styles.sectionLabel}>Posts</h1>
          <PostList posts={posts.slice(0, visibleCount)} />
          {hasMore && <div ref={sentinelRef} aria-hidden="true" />}
        </div>
      </div>
    </Layout>
  )
}

// 프로필은 홈(/)에 있고 이 페이지는 글 목록만 싣는다. 검색 결과에서 무엇을 모아 둔 목록인지 보이도록 주제를 적는다.
export const Head = () => (
  <Seo
    title="Posts"
    description="Kubernetes·Istio·AWS 플랫폼 엔지니어링을 다룬 글 전체 목록."
    pathname="/blog"
  />
)

export const query = graphql`
  query blogListQuery($validStatuses: [String]!) {
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
