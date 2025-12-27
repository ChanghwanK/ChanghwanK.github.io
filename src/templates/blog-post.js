import * as React from "react"
import { useEffect, useState } from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

const BlogPostTemplate = ({ data }) => {
    const post = data.markdownRemark
    const { title, date, tags } = post.frontmatter
    const [tocVisible, setTocVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setTocVisible(true)
            } else {
                setTocVisible(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <Layout>
            <aside
                className={`${styles.toc} ${tocVisible ? styles.tocVisible : ""}`}
                dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
            />
            <article className={styles.article}>
                <header className={styles.header}>
                    <h1>{title}</h1>
                    <time>{date}</time>
                    {tags && (
                        <div className={styles.tags}>
                            {tags.map(tag => (
                                <span key={tag} className={styles.tag}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: post.html }}
                />

                <footer className={styles.footer}>
                    <Link to="/blog">← 목록으로</Link>
                </footer>
            </article>
        </Layout>
    )
}

export const Head = ({ data }) => {
    const post = data.markdownRemark
    return <Seo title={post.frontmatter.title} description={post.frontmatter.description || post.excerpt} />
}

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug }}) {
      html
      frontmatter {
        title
        date(formatString: "YYYY년 MM월 DD일")
        description
        tags
      }
      excerpt
      tableOfContents
    }
  }
`

export default BlogPostTemplate