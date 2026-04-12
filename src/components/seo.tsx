import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface SeoProps {
  description?: string
  title: string
  image?: string
  pathname?: string
  ogType?: string
  children?: React.ReactNode
}

interface SeoQueryData {
  site: {
    siteMetadata: {
      title: string
      description: string
      author: string
      siteUrl: string
    }
  }
}

function Seo({
  description,
  title,
  image,
  pathname,
  ogType = "website",
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

  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta
        name="twitter:card"
        content={ogImage ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {children}
    </>
  )
}

export default Seo
