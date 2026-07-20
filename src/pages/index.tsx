import * as React from "react"
import { graphql, Link, PageProps } from "gatsby"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import SocialLinks from "../components/home/social-links"
import Seo from "../components/seo"
import * as styles from "./index.module.css"

interface HomePageQueryData {
  site: {
    siteMetadata: {
      authorName: string
      authorRole: string
      authorBio: string
      authorHandle: string
      githubUrl: string
      linkedInUrl: string
    }
  }
}

const IndexPage = ({ data }: PageProps<HomePageQueryData>) => {
  const {
    authorName,
    authorRole,
    authorBio,
    authorHandle,
    githubUrl,
    linkedInUrl,
  } = data.site.siteMetadata

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <ProfileHeader
            name={authorName}
            role={authorRole}
            handle={authorHandle}
          />

          {/* 탭바 */}
          <div className={styles.tabBar}>
            <div className={styles.tabs}>
              <Link to="/blog" className={`${styles.tab} ${styles.tabActive}`}>
                Post
              </Link>
              {/* About 페이지는 유지하되, 탭에서는 임시로 숨깁니다. */}
              {/*
              <Link to="/about" className={styles.tab}>
                About Me
              </Link>
              */}
            </div>

            <SocialLinks githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
          </div>

          {/* 바이오 */}
          <div className={styles.bio}>
            {authorBio.split("\n").map((para, i) => (
              <p key={i} className={styles.bioParagraph}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Home" />

export const query = graphql`
  query HomePageQuery {
    site {
      siteMetadata {
        authorName
        authorRole
        authorBio
        authorHandle
        githubUrl
        linkedInUrl
      }
    }
  }
`

export default IndexPage
