import * as React from "react"
import { Link } from "gatsby"
import * as styles from "./header.module.css"

const Header = ({ siteTitle }) => (
  <header className={styles.header}>
    <div className={styles.container}>
      <Link to="/" className={styles.title}>
        {siteTitle}
      </Link>

      <nav className={styles.nav}>
        <Link
          to="/blog"  // "/" → "/blog"로 변경
          className={styles.navLink}
          activeClassName={styles.navLinkActive}
        >
          글
        </Link>
        <Link
          to="/log"
          className={styles.navLink}
          activeClassName={styles.navLinkActive}
        >
          로그
        </Link>
      </nav>
    </div>
  </header>
)

export default Header