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

export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions,
}) => {
  const { createPage } = actions

  const isDev = process.env.NODE_ENV !== "production"
  // 개발 환경: 모든 포스트 노출 / 프로덕션: deploy 상태만 노출
  const statusFilter = isDev
    ? ``
    : `, status: { eq: "deploy" }`

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
  const numPages = Math.ceil(posts.length / postsPerPage)

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
