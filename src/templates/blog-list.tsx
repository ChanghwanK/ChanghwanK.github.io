import * as React from "react"
import { Link, graphql } from "gatsby"
import type { PageProps, HeadProps } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import type { IGatsbyImageData } from "gatsby-plugin-image"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import ProfileTabs from "../components/home/profile-tabs"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

interface PostNode {
  fields: { slug: string }
  frontmatter: {
    title: string
    date: string
    rawDate: string
    description: string | null
    status: string | null
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
      authorRole: string
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
  currentPage: number
  numPages: number
  validStatuses: string[]
}

const BlogList = ({
  data,
  pageContext,
}: PageProps<BlogListData, BlogListPageContext>) => {
  const posts = data.allMarkdownRemark.nodes
  const { authorName, authorRole, authorHandle, githubUrl, linkedInUrl } =
    data.site.siteMetadata
  const { currentPage, numPages } = pageContext
  const isFirst = currentPage === 1
  const isLast = currentPage === numPages
  const prevPage = currentPage - 1 === 1 ? "/blog" : `/blog/${currentPage - 1}`
  const nextPage = `/blog/${currentPage + 1}`

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <ProfileHeader
            name={authorName}
            role={authorRole}
            handle={authorHandle}
          />
          <ProfileTabs
            activeTab="post"
            githubUrl={githubUrl}
            linkedInUrl={linkedInUrl}
          />
          <div className={styles.postList}>
            {posts.length === 0 ? (
              <p className={styles.emptyState}>
                아직 공개된 포스트가 없습니다.
              </p>
            ) : (
              posts.map(post => {
                const { title, date, rawDate, description, status, thumbnail } =
                  post.frontmatter
                const { slug } = post.fields
                const thumbnailImage = getImage(thumbnail)

                return (
                  <article key={slug} className={styles.postItem}>
                    <Link to={slug} className={styles.postLink}>
                      {thumbnailImage && (
                        <div className={styles.thumbnailWrapper}>
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
                        </div>
                      )}
                      <div className={styles.postContent}>
                        <h2 className={styles.postTitle}>{title}</h2>
                        <p className={styles.postExcerpt}>
                          {description || post.excerpt}
                        </p>
                        <div className={styles.metaContainer}>
                          <time className={styles.date} dateTime={rawDate}>
                            {date}
                          </time>
                          {status === "writing" && (
                            <span
                              className={`${styles.statusBadge} ${styles.statusWriting}`}
                            >
                              {status}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {numPages > 1 && (
            <nav className={styles.pagination} aria-label="페이지 내비게이션">
              {!isFirst && (
                <Link to={prevPage} className={styles.paginationLink}>
                  ← Prev
                </Link>
              )}

              {Array.from({ length: numPages }, (_, i) => (
                <Link
                  key={`pagination-number${i + 1}`}
                  to={i === 0 ? "/blog" : `/blog/${i + 1}`}
                  className={`${styles.paginationLink} ${
                    i + 1 === currentPage ? styles.activeLink : ""
                  }`}
                  {...(i + 1 === currentPage
                    ? { "aria-current": "page" as const }
                    : {})}
                >
                  {i + 1}
                </Link>
              ))}

              {!isLast && (
                <Link to={nextPage} className={styles.paginationLink}>
                  Next →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </Layout>
  )
}

export const Head = ({
  pageContext,
}: HeadProps<BlogListData, BlogListPageContext>) => {
  const isFirst = pageContext.currentPage === 1
  const pathname = isFirst ? "/blog" : `/blog/${pageContext.currentPage}`
  return <Seo title="Blog" pathname={pathname} />
}

export const query = graphql`
  query blogListQuery($skip: Int!, $limit: Int!, $validStatuses: [String]!) {
    site {
      siteMetadata {
        authorName
        authorRole
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
      limit: $limit
      skip: $skip
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "YYYY년 MM월 DD일")
          rawDate: date
          description
          status
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
