import * as React from "react"
import { Link } from "gatsby"
import SocialLinks from "./social-links"
import * as styles from "./profile-tabs.module.css"

interface ProfileTabsProps {
  activeTab: "post" | "about"
  githubUrl: string
  linkedInUrl: string
}

const ProfileTabs = ({ activeTab, githubUrl, linkedInUrl }: ProfileTabsProps) => (
  <div className={styles.tabBar}>
    <div className={styles.tabs}>
      <Link
        to="/"
        className={`${styles.tab} ${
          activeTab === "about" ? styles.tabActive : ""
        }`}
      >
        About
      </Link>
      <Link
        to="/blog"
        className={`${styles.tab} ${
          activeTab === "post" ? styles.tabActive : ""
        }`}
      >
        Post
      </Link>
    </div>

    <SocialLinks githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
  </div>
)

export default ProfileTabs
