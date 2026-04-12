import * as React from "react"
import { Link, graphql } from "gatsby"
import type { PageProps, HeadProps } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import type { IGatsbyImageData } from "gatsby-plugin-image"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

interface PostNode {
  fields: { slug: string }
  frontmatter: {
    title: string
    date: string
    rawDate: string
    description: string | null
    tags: string[] | null
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
  const { currentPage, numPages } = pageContext
  const isFirst = currentPage === 1
  const isLast = currentPage === numPages
  const prevPage = currentPage - 1 === 1 ? "/blog" : `/blog/${currentPage - 1}`
  const nextPage = `/blog/${currentPage + 1}`

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.postList}>
          {posts.map(post => {
            const { title, date, rawDate, description, tags, status, thumbnail } =
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
                        imgStyle={{ objectFit: "contain", objectPosition: "center" }}
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
                      {status && (
                        <span
                          className={`${styles.statusBadge} ${
                            status === "writing" ? styles.statusWriting : styles.statusDeploy
                          }`}
                        >
                          {status}
                        </span>
                      )}
                      {tags && tags.length > 0 && (
                        <div className={styles.tags}>
                          {tags.map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
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
                {...(i + 1 === currentPage ? { "aria-current": "page" as const } : {})}
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
    </Layout>
  )
}

export const Head = ({
  pageContext,
}: HeadProps<BlogListData, BlogListPageContext>) => {
  const pathname =
    pageContext.currentPage === 1 ? "/blog" : `/blog/${pageContext.currentPage}`
  return <Seo title="Blog" pathname={pathname} />
}

export const query = graphql`
  query blogListQuery($skip: Int!, $limit: Int!, $validStatuses: [String]!) {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { date: { ne: null }, status: { in: $validStatuses } } }
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
          tags
          status
          thumbnail {
            childImageSharp {
              gatsbyImageData(
                width: 200
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
