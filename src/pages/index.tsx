import * as React from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import ProfileTabs from "../components/home/profile-tabs"
import Seo from "../components/seo"
import * as styles from "./index.module.css"

interface AboutPageQueryData {
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

const AboutPage = ({ data }: PageProps<AboutPageQueryData>) => {
  const { authorName, authorRole, authorBio, authorHandle, githubUrl, linkedInUrl } =
    data.site.siteMetadata

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
            activeTab="about"
            githubUrl={githubUrl}
            linkedInUrl={linkedInUrl}
          />

          <div className={styles.content}>
            {authorBio.split("\n").map(
              (para, i) =>
                para.trim() !== "" && (
                  <p key={i} className={styles.text}>
                    {para}
                  </p>
                )
            )}
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

export default AboutPage
