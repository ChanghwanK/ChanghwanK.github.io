import * as React from "react"
import { Link, graphql } from "gatsby"
import type { HeadProps, PageProps } from "gatsby"
import Layout from "../components/layout"
import ProfileHeader from "../components/home/profile-header"
import PostList from "../components/post-list"
import type { PostListNode } from "../components/post-list"
import SiteNav from "../components/site-nav"
import Seo from "../components/seo"
import * as styles from "./index.module.css"

interface HomeData {
  site: {
    siteMetadata: {
      authorName: string
      authorTagline: string
      authorBio: string
      authorIntro: string[]
      githubUrl: string
      linkedInUrl: string
    }
  }
  allMarkdownRemark: {
    nodes: PostListNode[]
  }
}

// 홈은 프로필과 최근 글 몇 개만 싣고, 전체 글은 /blog에 둔다.
// 개수는 쿼리의 limit과 같다. 페이지 쿼리는 변수를 받지 않아 상수를 쿼리 안에 넣을 수 없다.
const Home = ({ data }: PageProps<HomeData>) => {
  const { authorName, authorTagline, authorIntro, githubUrl, linkedInUrl } =
    data.site.siteMetadata

  return (
    <Layout>
      <div className={styles.darkPage}>
        <div className={styles.container}>
          <SiteNav />
          <ProfileHeader
            name={authorName}
            tagline={authorTagline}
            intro={authorIntro}
            githubUrl={githubUrl}
            linkedInUrl={linkedInUrl}
          />
          <h2 className={styles.sectionLabel}>Recent Posts</h2>
          <PostList posts={data.allMarkdownRemark.nodes} compact />
          <Link to="/blog" className={styles.moreLink}>
            all posts →
          </Link>
        </div>
      </div>
    </Layout>
  )
}

// 검색 결과에서 홈이 어떤 글을 모아 둔 곳인지 보이도록 실제 다루는 주제를 적는다.
const HOME_TITLE = "Kubernetes·Istio·AWS 플랫폼 엔지니어링 기록"

// 홈 설명은 짧은 소개(authorBio)를 쓴다. 화면의 자기소개(authorIntro)는 세 문단이라
// 검색 결과 설명 길이(약 160자)를 크게 넘겨 잘린다.
// siteMetadata.description을 쓰지 않는 이유: RSS 채널 설명과 404 등 설명 없는 페이지의 기본값으로도 쓰여
// 홈 문구를 다듬을 때마다 그쪽까지 함께 바뀌기 때문이다.
// 소개글의 \n은 화면 줄바꿈용이라 meta 태그에서는 공백 하나로 합친다.
const toSingleLine = (text: string) => text.replace(/\s*\n\s*/g, " ").trim()

export const Head = ({ data }: HeadProps<HomeData>) => (
  <Seo
    title={HOME_TITLE}
    description={toSingleLine(data.site.siteMetadata.authorBio)}
    pathname="/"
    isSiteHome
  />
)

// 최근 글은 배포된 글(deploy)만 고른다. writing 글은 로컬에서 /blog 목록으로만 확인한다.
// gatsby-node.ts처럼 개발 환경에서 writing까지 넣으려면 createPage로 옮겨 context를 넘겨야 해서,
// 홈의 단순함을 위해 이 차이를 받아들인다.
export const query = graphql`
  query homeQuery {
    site {
      siteMetadata {
        authorName
        authorTagline
        authorBio
        authorIntro
        githubUrl
        linkedInUrl
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { date: { ne: null }, status: { eq: "deploy" } } }
      limit: 5
    ) {
      nodes {
        fields {
          slug
          readingMinutes
        }
        frontmatter {
          title
          date(formatString: "YY. M. D.")
          rawDate: date
          status
        }
      }
    }
  }
`

export default Home
