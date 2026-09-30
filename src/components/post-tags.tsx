import * as React from "react"
import * as styles from "./post-tags.module.css"

interface PostTagsProps {
  tags: string[] | null
  className?: string
}

// 태그는 글의 주제를 알려주는 표시일 뿐이라 링크나 클릭 동작을 두지 않는다.
const PostTags = ({ tags, className }: PostTagsProps) => {
  if (!tags || tags.length === 0) return null

  return (
    <ul
      className={className ? `${styles.tagList} ${className}` : styles.tagList}
      aria-label="태그"
    >
      {tags.map(tag => (
        <li key={tag} className={styles.tag}>
          {tag}
        </li>
      ))}
    </ul>
  )
}

export default PostTags
