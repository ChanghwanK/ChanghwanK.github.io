import fs from "fs"
import path from "path"
import { createFilePath } from "gatsby-source-filesystem"
import type { GatsbyNode } from "gatsby"
import { estimateReadingMinutes } from "./src/utils/reading-time"

// 태그가 있는 글이 하나도 배포되지 않아도(= 추론할 값이 없어도) tags·readingMinutes 쿼리가 깨지지 않게
// 두 필드의 타입만 명시하고 나머지는 계속 추론에 맡긴다.
export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] =
  ({ actions }) => {
    actions.createTypes(`
      type MarkdownRemarkFrontmatter @infer {
        tags: [String!]
      }
      type MarkdownRemarkFields @infer {
        readingMinutes: Int!
      }
    `)
  }

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
      rawMarkdownBody: string
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

    createNodeField({
      node,
      name: `readingMinutes`,
      value: estimateReadingMinutes(markdownNode.rawMarkdownBody),
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
  tags?: unknown
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

  // tags는 선택 항목이다. 적었다면 빈 문자열이 섞이지 않은 목록이어야 화면에 빈 알약이 생기지 않는다.
  if (
    frontmatter.tags !== undefined &&
    (!Array.isArray(frontmatter.tags) ||
      !frontmatter.tags.every(
        tag => typeof tag === "string" && tag.trim() !== ""
      ))
  ) {
    errors.push("tags는 비어 있지 않은 문자열 목록이어야 합니다")
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

  // 2. 포스트 목록 페이지 생성. 페이지를 나누지 않고 전체 글을 한 페이지에 싣는다 (무한 스크롤은 템플릿이 처리).
  const listPageContext = {
    // 페이지 쿼리 필터로 전달 (개발: 전체, 프로덕션: deploy만)
    validStatuses: isDev ? ["deploy", "writing"] : ["deploy"],
  }

  // 홈(/)은 프로필과 최근 글만 싣는 src/pages/index.tsx이고, 전체 글 목록은 /blog 한 곳에만 만든다.
  createPage({
    path: `/blog`,
    component: path.resolve("./src/templates/blog-list.tsx"),
    context: listPageContext,
  })
}
