import * as React from "react"
import * as styles from "./profile-header.module.css"

interface ProfileHeaderProps {
  name: string
  role: string
  handle: string
}

const ProfileHeader = ({ name, role, handle }: ProfileHeaderProps) => {
  const useFallbackImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = "/profile.jpg"
  }

  return (
    <div className={styles.avatarRow}>
      <img
        src="/profile.png"
        alt={name}
        className={styles.avatar}
        onError={useFallbackImage}
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
