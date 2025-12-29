const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

// Slug 생성 (URL 경로) - 이 부분이 없으면 fields { slug } 에러가 발생합니다.
exports.onCreateNode = ({ node, actions, getNode }) => {
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

// 페이지 동적 생성
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const result = await graphql(`
    query {
      allMarkdownRemark(
        sort: { frontmatter: { date: DESC } }
        filter: { frontmatter: { date: { ne: null } } }
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

  const posts = result.data.allMarkdownRemark.nodes

  // 1. 각 포스트 페이지 생성
  posts.forEach(post => {
    createPage({
      path: post.fields.slug,
      component: path.resolve(`./src/templates/blog-post.js`),
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
      component: path.resolve("./src/templates/blog-list.js"),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
      },
    })
  })
}