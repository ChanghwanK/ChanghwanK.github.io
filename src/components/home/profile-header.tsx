import * as React from "react"
import navisLogo from "../../images/navis-7e.png"
import * as styles from "./profile-header.module.css"

interface ProfileHeaderProps {
  name: string
  role: string
  handle: string
}

const ProfileHeader = ({ name, role, handle }: ProfileHeaderProps) => {
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
        </div>
        <p className={styles.role}>{role}</p>
      </div>
    </div>
  )
}

export default ProfileHeader
