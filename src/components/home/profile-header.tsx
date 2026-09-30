import * as React from "react"
import navisLogo from "../../images/navis-7e.png"
import SocialLinks from "./social-links"
import * as styles from "./profile-header.module.css"

interface ProfileHeaderProps {
  name: string
  bio: string
  handle: string
  githubUrl: string
  linkedInUrl: string
}

const ProfileHeader = ({
  name,
  bio,
  handle,
  githubUrl,
  linkedInUrl,
}: ProfileHeaderProps) => {
  // siteMetadata.authorBio는 "\n"으로 문단을 나눈다.
  const bioParagraphs = bio
    .split("\n")
    .map(para => para.trim())
    .filter(para => para !== "")

  return (
    <div className={styles.avatarRow}>
      <img
        src={navisLogo}
        alt={name}
        className={styles.avatar}
      />
      <div className={styles.profileInfo}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{name}</span>
          <span className={styles.handle}>{handle}</span>
          {/* 이름 줄 안에 두어 아이콘의 세로 중심을 이름에 맞추고, 소개글이 아이콘 아래까지 펼쳐지게 한다. */}
          <div className={styles.socialLinks}>
            <SocialLinks githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
          </div>
        </div>
        <div className={styles.bio}>
          {bioParagraphs.map((para, i) => (
            <p key={i} className={styles.bioText}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
