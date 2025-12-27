import * as React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog.module.css"

const BlogPage = ({ data }) => {
    const posts = data.allMarkdownRemark.nodes

    return (
        <Layout>
            <div className={styles.container}>
                <h1 className={styles.title}>글</h1>

                <div className={styles.postList}>
                    {posts.map(post => {
                        const { title, date, description } = post.frontmatter
                        const { slug } = post.fields

                        return (
                            <article key={slug} className={styles.postItem}>
                                <Link to={slug} className={styles.postLink}>
                                    <h2>{title}</h2>
                                    <time>{date}</time>
                                    <p>{description || post.excerpt}</p>
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