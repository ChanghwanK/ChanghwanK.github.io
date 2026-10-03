import * as React from "react"
import { Link, graphql } from "gatsby"
import type { HeadProps, PageProps } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import type { IGatsbyImageData } from "gatsby-plugin-image"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import PostTags from "../components/post-tags"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

interface PostNode {
  fields: { slug: string; readingMinutes: number }
  frontmatter: {
    title: string
    date: string
    rawDate: string
    description: string | null
    status: string | null
    tags: string[] | null
    thumbnail: {
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData
      }
    } | null
  }
  excerpt: string
}

interface BlogListData {
  site: {
    siteMetadata: {
      authorName: string
      authorBio: string
      authorHandle: string
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
const POSTS_PER_BATCH = 6

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

const PostListItem = ({ post }: { post: PostNode }) => {
  const { title, date, rawDate, description, status, tags, thumbnail } =
    post.frontmatter
  const { slug, readingMinutes } = post.fields
  const thumbnailImage = getImage(thumbnail)

  return (
    <article className={styles.postItem}>
      <Link to={slug} className={styles.postLink}>
        {/* 썸네일이 없어도 자리는 남겨, 모든 글의 제목·요약 폭이 같은 오른쪽 선에서 끝나게 한다. */}
        <div className={styles.thumbnailWrapper} aria-hidden={!thumbnailImage}>
          {thumbnailImage && (
            <GatsbyImage
              image={thumbnailImage}
              alt={title}
              className={styles.thumbnail}
              style={{ width: "100%", height: "100%" }}
              imgStyle={{
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
          )}
        </div>
        <div className={styles.postContent}>
          <h2 className={styles.postTitle}>{title}</h2>
          <p className={styles.postExcerpt}>{description || post.excerpt}</p>
          <div className={styles.metaContainer}>
            <time className={styles.date} dateTime={rawDate}>
              {date}
            </time>
            <span className={styles.metaSeparator} aria-hidden="true">
              ·
            </span>
            <span className={styles.readingTime}>{readingMinutes}분</span>
            {status === "writing" && (
              <span className={`${styles.statusBadge} ${styles.statusWriting}`}>
                {status}
              </span>
            )}
            <PostTags tags={tags} className={styles.tags} />
          </div>
        </div>
      </Link>
    </article>
  )
}

const BlogList = ({ data }: PageProps<BlogListData, BlogListPageContext>) => {
  const posts = data.allMarkdownRemark.nodes
  const { authorName, authorBio, authorHandle, githubUrl, linkedInUrl } =
    data.site.siteMetadata
  const { visibleCount, hasMore, sentinelRef } = useInfiniteReveal(
    posts.length
  )

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <ProfileHeader
            name={authorName}
            bio={authorBio}
            handle={authorHandle}
            githubUrl={githubUrl}
            linkedInUrl={linkedInUrl}
          />
          <h2 className={styles.sectionLabel}>Posts</h2>
          <div className={styles.postList}>
            {posts.length === 0 ? (
              <p className={styles.emptyState}>
                아직 공개된 포스트가 없습니다.
              </p>
            ) : (
              posts
                .slice(0, visibleCount)
                .map(post => <PostListItem key={post.fields.slug} post={post} />)
            )}
          </div>
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
        authorBio
        authorHandle
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
          date(formatString: "YYYY년 MM월 DD일")
          rawDate: date
          description
          status
          tags
          thumbnail {
            childImageSharp {
              gatsbyImageData(
                width: 200
                height: 200
                placeholder: BLURRED
                formats: [AUTO, WEBP]
              )
            }
          }
        }
        excerpt(pruneLength: 200)
      }
    }
  }
`

export default BlogList
