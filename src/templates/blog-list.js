import * as React from "react"
import { Link, graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-list.module.css"

const BlogList = ({ data, pageContext }) => {
    const posts = data.allMarkdownRemark.nodes
    const { currentPage, numPages } = pageContext
    const isFirst = currentPage === 1
    const isLast = currentPage === numPages
    const prevPage = currentPage - 1 === 1 ? "/blog" : `/blog/${currentPage - 1}`
    const nextPage = `/blog/${currentPage + 1}`

    return (
        <Layout isWide={true}>
            <div className={styles.container}>
                <div className={styles.postList}>
                    {posts.map(post => {
                        const { title, date, description, tags, thumbnail } = post.frontmatter
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
                                            />
                                        </div>
                                    )}
                                    <div className={styles.postContent}>
                                        <h3>{title}</h3>
                                        <p>{description || post.excerpt}</p>
                                        <div className={styles.metaContainer}>
                                            <time className={styles.date}>{date}</time>

                                            {tags && tags.length > 0 && (
                                                <div className={styles.tags}>
                                                    {tags.map(tag => (
                                                        <span key={tag} className={styles.tag}>
                                                            #{tag}
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
                <div className={styles.pagination}>
                    {!isFirst && (
                        <Link to={prevPage} className={styles.paginationLink}>
                            ← Prev
                        </Link>
                    )}

                    {Array.from({ length: numPages }, (_, i) => (
                        <Link
                            key={`pagination-number${i + 1}`}
                            to={i === 0 ? "/blog" : `/blog/${i + 1}`}
                            className={`${styles.paginationLink} ${i + 1 === currentPage ? styles.activeLink : ""
                                }`}
                        >
                            {i + 1}
                        </Link>
                    ))}

                    {!isLast && (
                        <Link to={nextPage} className={styles.paginationLink}>
                            Next →
                        </Link>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export const Head = () => <Seo title="Blog" />

export const query = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC }}
      filter: { frontmatter: {date: { ne: null }}}
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
          description
          tags
          thumbnail {
            childImageSharp {
              gatsbyImageData(
                width: 100
                height: 100
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