import * as React from "react"
import navisLogo from "../../images/navis-7e.png"
import SocialLinks from "./social-links"
import * as styles from "./profile-header.module.css"

interface ProfileHeaderProps {
  name: string
  tagline: string
  // siteMetadata.authorIntro. 항목 하나가 한 문단이다.
  intro: string[]
  githubUrl: string
  linkedInUrl: string
}

// 홈 상단 자기소개. 아바타·한 줄 소개·소셜 아이콘을 한 줄에 두고, 그 아래 소개 문단을 본문 폭 그대로 펼친다.
const ProfileHeader = ({
  name,
  tagline,
  intro,
  githubUrl,
  linkedInUrl,
}: ProfileHeaderProps) => (
  <header className={styles.profile}>
    <div className={styles.topRow}>
      <img src={navisLogo} alt={name} className={styles.avatar} />
      <h1 className={styles.tagline}>{tagline}</h1>
      <div className={styles.socialLinks}>
        <SocialLinks githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
      </div>
    </div>
    <div className={styles.intro}>
      {intro.map((paragraph, i) => (
        <p key={i} className={styles.introText}>
          {paragraph}
        </p>
      ))}
    </div>
  </header>
)

export default ProfileHeader
