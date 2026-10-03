import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import {
  buildBlogPostingSchema,
  buildWebSiteSchema,
  serializeJsonLd,
} from "../utils/structured-data"

// 본문이 한국어뿐이라 모든 페이지에 같은 값을 쓴다.
const OG_LOCALE = "ko_KR"

interface ArticleMeta {
  // ISO 8601 문자열이어야 한다 (article:published_time, datePublished 모두 이 형식을 요구한다).
  publishedTime: string
}

interface SeoProps {
  description?: string
  title: string
  image?: string
  pathname?: string
  // 넘기면 글 페이지로 보고 og:type=article, article:published_time, BlogPosting JSON-LD를 함께 낸다.
  // og:type을 따로 받지 않는 이유: article인데 게시일이 빠진 상태를 만들 수 없게 하려는 것이다.
  article?: ArticleMeta
  // Google은 WebSite 구조화 데이터를 홈페이지에서만 사이트 이름 후보로 읽으므로 홈에서만 켠다.
  isSiteHome?: boolean
  children?: React.ReactNode
}

interface SeoQueryData {
  site: {
    siteMetadata: {
      title: string
      description: string
      author: string
      siteUrl: string
      authorName: string
      githubUrl: string
      linkedInUrl: string
    }
  }
}

function Seo({
  description,
  title,
  image,
  pathname,
  article,
  isSiteHome = false,
  children,
}: SeoProps) {
  const { site } = useStaticQuery<SeoQueryData>(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
            siteUrl
            authorName
            githubUrl
            linkedInUrl
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl
  const url = pathname ? `${siteUrl}${pathname}` : siteUrl
  const ogImage = image ? `${siteUrl}${image}` : undefined
  const ogType = article ? "article" : "website"

  const structuredData = article
    ? buildBlogPostingSchema({
        headline: title,
        description: metaDescription,
        canonicalUrl: url,
        publishedTime: article.publishedTime,
        imageUrl: ogImage,
        author: {
          name: site.siteMetadata.authorName,
          // 저자 소개가 홈 상단에 있으므로 저자 URL은 홈으로 둔다.
          url: siteUrl,
          sameAs: [site.siteMetadata.githubUrl, site.siteMetadata.linkedInUrl],
        },
      })
    : isSiteHome
    ? buildWebSiteSchema({ name: defaultTitle, homeUrl: url })
    : undefined

  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={metaDescription} />
      <meta property="og:site_name" content={defaultTitle} />
      <meta property="og:locale" content={OG_LOCALE} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {article && (
        <meta
          property="article:published_time"
          content={article.publishedTime}
        />
      )}
      <meta
        name="twitter:card"
        content={ogImage ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
        />
      )}
      {children}
    </>
  )
}

export default Seo
