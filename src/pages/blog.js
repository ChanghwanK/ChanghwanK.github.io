import * as React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog.module.css"

const BlogPage = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout isWide={true}>
      <div className={styles.container}>
        <div className={styles.postList}>
          {posts.map(post => {
            const { title, date, description, tags, subtitle } = post.frontmatter
            const { slug } = post.fields

            return (
              <article key={slug} className={styles.postItem}>
                <Link to={slug} className={styles.postLink}>
                  <h2>{title}</h2>
                  <h3>{description || post.excerpt}</h3>
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
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Blog" />

export const query = graphql`
  query {
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC }}
      filter: { frontmatter: {date: { ne: null }}}
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
        }
        excerpt(pruneLength: 200)
      }
    }
  }
`

export default BlogPage