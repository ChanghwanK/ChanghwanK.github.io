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

// 홈 상단 자기소개. 아바타·블로그 이름·소셜 아이콘을 한 줄에 두고,
// 그 아래 한 줄 소개를 소개 문단의 제목으로 달아 본문 폭 그대로 펼친다.
const ProfileHeader = ({
  name,
  tagline,
  intro,
  githubUrl,
  linkedInUrl,
}: ProfileHeaderProps) => (
  <header className={styles.profile}>
    <div className={styles.topRow}>
      {/* 바로 옆에 이름이 글자로 있으므로 아바타는 장식으로 두고 대체 텍스트를 비운다. */}
      <img src={navisLogo} alt="" className={styles.avatar} />
      <h1 className={styles.siteTitle}>{name}</h1>
      <div className={styles.socialLinks}>
        <SocialLinks githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
      </div>
    </div>
    <h2 className={styles.introHeading}>{tagline}</h2>
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
