import * as React from "react"
import { useEffect, useState } from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

const BlogPostTemplate = ({ data }) => {
  const post = data.markdownRemark
  const { title, description, date, rawDate, tags } = post.frontmatter
  const [tocVisible, setTocVisible] = useState(false)

  const hasToc = (post.tableOfContents ?? "").trim().length > 0

  useEffect(() => {
    if (!hasToc) return undefined

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
  }, [hasToc])

  return (
    <Layout>
      {hasToc && (
        <aside
          className={`${styles.toc} ${tocVisible ? styles.tocVisible : ""}`}
          dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
        />
      )}
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {description && <h2 className={styles.subtitle}>{description}</h2>}

          <div className={styles.meta}>
            <time className={styles.date} dateTime={rawDate}>
              {date}
            </time>
            {tags && (
              <ul className={styles.tags}>
                {tags.map(tag => (
                  <li key={tag} className={styles.tag}>
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
  const image = post.frontmatter.thumbnail?.publicURL
  return (
    <Seo
      title={post.frontmatter.title}
      description={post.frontmatter.description || post.excerpt}
      image={image}
      pathname={post.fields.slug}
      ogType="article"
    />
  )
}

export const query = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "YYYY년 MM월 DD일")
        rawDate: date
        description
        tags
        thumbnail {
          publicURL
        }
      }
      excerpt
      tableOfContents
    }
  }
`

export default BlogPostTemplate
