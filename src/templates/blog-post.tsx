import * as React from "react"
import { useEffect, useState } from "react"
import { Link, graphql } from "gatsby"
import type { PageProps, HeadProps } from "gatsby"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

interface BlogPostData {
  markdownRemark: {
    html: string
    fields: { slug: string }
    frontmatter: {
      title: string
      date: string
      rawDate: string
      description: string | null
      thumbnail: { publicURL: string } | null
    }
    excerpt: string
    tableOfContents: string
  }
}

const BlogPostTemplate = ({ data }: PageProps<BlogPostData>) => {
  const post = data.markdownRemark
  const { title, description, date, rawDate } = post.frontmatter
  const [tocVisible, setTocVisible] = useState(false)

  const hasToc = (post.tableOfContents ?? "").trim().length > 0

  useEffect(() => {
    if (!hasToc) return undefined

    let frameId: number | null = null
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
      <div className={styles.darkPage}>
        {hasToc && (
          <aside
            className={`${styles.toc} ${tocVisible ? styles.tocVisible : ""}`}
            dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
          />
        )}
        <nav className={styles.pageNav} aria-label="브레드크럼">
          <Link to="/" className={styles.navHome}>
            김창환
          </Link>
          <span className={styles.navSep}>/</span>
          <Link to="/blog" className={styles.navHome}>
            Post
          </Link>
        </nav>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {description && <h2 className={styles.subtitle}>{description}</h2>}

            <div className={styles.meta}>
              <time className={styles.date} dateTime={rawDate}>
                {date}
              </time>
            </div>
          </header>

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <footer className={styles.footer}>
            <Link to="/blog">← posts</Link>
          </footer>
        </article>
      </div>
    </Layout>
  )
}

export const Head = ({ data }: HeadProps<BlogPostData>) => {
  const post = data.markdownRemark
  const image = post.frontmatter.thumbnail?.publicURL
  return (
    <>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
        image={image}
        pathname={post.fields.slug}
        ogType="article"
      />
    </>
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
