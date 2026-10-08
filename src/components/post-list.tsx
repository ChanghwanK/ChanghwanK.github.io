import * as React from "react"
import { Link } from "gatsby"
import * as styles from "./post-list.module.css"

// 홈(최근 글)과 /blog(전체 글)가 같은 한 줄 목록을 쓴다. 두 쿼리는 이 모양대로 필드를 가져온다.
export interface PostListNode {
  fields: { slug: string; readingMinutes: number }
  frontmatter: {
    title: string
    date: string
    rawDate: string
    status: string | null
  }
}

// 목록은 제목·읽는 시간과 날짜만 한 줄로 보여준다. 요약·썸네일·태그를 빼서 글 수가 늘어도 한눈에 훑을 수 있게 한다.
const PostListItem = ({ post }: { post: PostListNode }) => {
  const { title, date, rawDate, status } = post.frontmatter
  const { slug, readingMinutes } = post.fields

  return (
    <li>
      <Link to={slug} className={styles.postLink}>
        <span className={styles.postTitle}>
          {title}
          <span className={styles.readingTime}>{readingMinutes}분</span>
          {status === "writing" && (
            <span className={styles.statusBadge}>{status}</span>
          )}
        </span>
        <time className={styles.date} dateTime={rawDate}>
          {date}
        </time>
      </Link>
    </li>
  )
}

interface PostListProps {
  posts: PostListNode[]
  // 홈의 최근 글처럼 프로필 아래 곁들이는 목록은 글자를 한 단계 줄여 프로필보다 앞서 읽히지 않게 한다.
  compact?: boolean
}

const PostList = ({ posts, compact = false }: PostListProps) => (
  <ul
    className={`${styles.postList} ${compact ? styles.compact : ""}`.trim()}
  >
    {posts.length === 0 ? (
      <li className={styles.emptyState}>아직 공개된 포스트가 없습니다.</li>
    ) : (
      posts.map(post => <PostListItem key={post.fields.slug} post={post} />)
    )}
  </ul>
)

export default PostList
