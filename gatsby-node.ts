import fs from "fs"
import path from "path"
import { createFilePath } from "gatsby-source-filesystem"
import type { GatsbyNode } from "gatsby"

export const onCreateNode: GatsbyNode["onCreateNode"] = ({
  node,
  actions,
  getNode,
}) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const markdownNode = node as typeof node & {
      frontmatter: PostFrontmatter
      parent: string
    }
    const fileNode = getNode(markdownNode.parent) as
      | { absolutePath?: string }
      | undefined

    if (!fileNode?.absolutePath) {
      throw new Error(`포스트 원본 파일을 찾을 수 없습니다: ${node.id}`)
    }

    validatePostFrontmatter(markdownNode.frontmatter, fileNode.absolutePath)

    const slug = createFilePath({ node, getNode, basePath: `posts` })

    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

interface AllMarkdownRemarkData {
  allMarkdownRemark: {
    nodes: Array<{
      fields: { slug: string }
    }>
  }
}

const postStatuses = ["deploy", "writing"] as const
type PostStatus = (typeof postStatuses)[number]

interface PostFrontmatter {
  title?: unknown
  date?: unknown
  status?: unknown
  thumbnail?: unknown
}

const isPostStatus = (status: unknown): status is PostStatus =>
  typeof status === "string" && postStatuses.includes(status as PostStatus)

const validatePostFrontmatter = (
  frontmatter: PostFrontmatter,
  sourcePath: string
) => {
  const errors: string[] = []

  if (
    typeof frontmatter.title !== "string" ||
    frontmatter.title.trim() === ""
  ) {
    errors.push("title은 비어 있지 않은 문자열이어야 합니다")
  }

  if (!frontmatter.date) {
    errors.push("date는 필수입니다")
  }

  if (!isPostStatus(frontmatter.status)) {
    errors.push(`status는 ${postStatuses.join(" 또는 ")} 중 하나여야 합니다`)
  }

  if (
    typeof frontmatter.thumbnail === "string" &&
    frontmatter.thumbnail.startsWith(".") &&
    !fs.existsSync(
      path.resolve(path.dirname(sourcePath), frontmatter.thumbnail)
    )
  ) {
    errors.push(`thumbnail 파일을 찾을 수 없습니다: ${frontmatter.thumbnail}`)
  }

  if (errors.length > 0) {
    throw new Error(
      `포스트 frontmatter 검증 실패 (${sourcePath}): ${errors.join(", ")}`
    )
  }
}

export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions,
}) => {
  const { createPage } = actions

  const isDev = process.env.NODE_ENV !== "production"
  // 개발 환경: 모든 포스트 노출 / 프로덕션: deploy 상태만 노출
  const statusFilter = isDev ? `` : `, status: { eq: "deploy" }`

  const result = await graphql<AllMarkdownRemarkData>(`
    query {
      allMarkdownRemark(
        sort: { frontmatter: { date: DESC } }
        filter: { frontmatter: { date: { ne: null }${statusFilter} } }
      ) {
        nodes {
          fields {
            slug
          }
        }
      }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const posts = result.data!.allMarkdownRemark.nodes

  // 1. 각 포스트 페이지 생성
  posts.forEach(post => {
    createPage({
      path: post.fields.slug,
      component: path.resolve(`./src/templates/blog-post.tsx`),
      context: {
        slug: post.fields.slug,
      },
    })
  })

  // 2. 블로그 리스트 페이지 생성 (페이지네이션)
  const postsPerPage = 6
  // 배포 가능한 포스트가 없어도 홈에서 연결하는 /blog 페이지는 유지한다.
  const numPages = Math.max(1, Math.ceil(posts.length / postsPerPage))

  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/blog` : `/blog/${i + 1}`,
      component: path.resolve("./src/templates/blog-list.tsx"),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
        // 페이지 쿼리 필터로 전달 (개발: 전체, 프로덕션: deploy만)
        validStatuses: isDev ? ["deploy", "writing"] : ["deploy"],
      },
    })
  })
}
