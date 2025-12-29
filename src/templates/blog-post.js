import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Link, graphql } from "gatsby"
import DOMPurify from "isomorphic-dompurify"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

const BlogPostTemplate = ({ data }) => {
    const post = data.markdownRemark
    const { title, description, date, tags } = post.frontmatter
    const [tocVisible, setTocVisible] = useState(false)

    const sanitizedHtml = useMemo(() => DOMPurify.sanitize(post.html ?? ""), [post.html])
    const sanitizedToc = useMemo(
        () => DOMPurify.sanitize(post.tableOfContents ?? ""),
        [post.tableOfContents]
    )
    const hasToc = sanitizedToc.trim().length > 0
    const isBrowser = typeof window !== "undefined"

    useEffect(() => {
        if (!isBrowser || !hasToc) return undefined

        let frameId = null
        const handleScroll = () => {
            if (frameId !== null) return
            frameId = window.requestAnimationFrame(() => {
                setTocVisible(window.scrollY > 300)
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
    }, [hasToc, isBrowser])

    return (
        <Layout>
            {hasToc && (
                <aside
                    className={`${styles.toc} ${tocVisible ? styles.tocVisible : ""}`}
                    dangerouslySetInnerHTML={{ __html: sanitizedToc }}
                />
            )}
            <article className={styles.article}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    {description && <h2 className={styles.subtitle}>{description}</h2>}

                    <div className={styles.meta}>
                        <time className={styles.date}>{date}</time>
                        {tags && (
                            <div className={styles.tags}>
                                {tags.map(tag => (
                                    <span key={tag} className={styles.tag}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
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