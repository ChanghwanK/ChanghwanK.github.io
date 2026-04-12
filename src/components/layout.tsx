import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import "./layout.css"

interface LayoutProps {
  children: React.ReactNode
}

interface SiteTitleQueryData {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const Layout = ({ children }: LayoutProps) => {
  const data = useStaticQuery<SiteTitleQueryData>(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <main>{children}</main>
    </>
  )
}

export default Layout
