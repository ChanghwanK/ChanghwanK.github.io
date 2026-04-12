import * as React from "react"
import { Link } from "gatsby"
import * as styles from "./header.module.css"

interface HeaderProps {
  siteTitle: string
}

const Header = ({ siteTitle }: HeaderProps) => (
  <header className={styles.header}>
    <div className={styles.container}>
      <Link to="/" className={styles.title}>
        {siteTitle}
      </Link>

      <nav className={styles.nav} aria-label="주요 내비게이션">
        <Link
          to="/blog"
          className={styles.navLink}
          activeClassName={styles.navLinkActive}
        >
          Posts
        </Link>
        <Link
          to="/about"
          className={styles.navLink}
          activeClassName={styles.navLinkActive}
        >
          About Me
        </Link>
      </nav>
    </div>
  </header>
)

export default Header
