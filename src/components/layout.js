import * as React from "react"
import { Link } from "gatsby"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      // <p>
      //   <Link to="/">{title}</Link>
      // </p>
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
      <p style={{fontSize: 11, textAlign: "center", position: "fixed", bottom: 0}}>©Changhwan {new Date().getFullYear}, Built with Gatsby-starter</p>
      </footer>
    </div>
  )
}

export default Layout
