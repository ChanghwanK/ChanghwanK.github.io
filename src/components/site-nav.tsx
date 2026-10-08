import * as React from "react"
import { Link } from "gatsby"
import * as styles from "./site-nav.module.css"

// 홈(프로필 + 최근 글)과 /blog(전체 글)를 오가는 상단 메뉴. 지금 있는 페이지에는 밑줄을 긋는다.
const SiteNav = () => (
  <nav className={styles.nav} aria-label="사이트 메뉴">
    <Link to="/" className={styles.link} activeClassName={styles.active}>
      Home
    </Link>
    <Link to="/blog" className={styles.link} activeClassName={styles.active}>
      Posts
    </Link>
  </nav>
)

export default SiteNav
