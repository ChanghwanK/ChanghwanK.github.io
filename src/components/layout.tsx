import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import "./layout.css"

interface LayoutProps {
  children: React.ReactNode
  hideHeader?: boolean
}

interface SiteTitleQueryData {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const Layout = ({ children, hideHeader = false }: LayoutProps) => {
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
      {!hideHeader && (
        <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      )}
      <main>{children}</main>
    </>
  )
}

export default Layout
