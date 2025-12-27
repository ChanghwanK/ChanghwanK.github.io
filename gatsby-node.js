const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

// Slug 생성 (URL 경로)
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
      allMarkdownRemark {
        nodes {
          fields {
            slug
          }
        }
      }
    }
  `)

  const posts = result.data.allMarkdownRemark.nodes

  // 각 포스트마다 페이지 생성
  posts.forEach(post => {
    createPage({
      path: post.fields.slug,
      component: path.resolve(`./src/templates/blog-post.js`),
      context: {
        slug: post.fields.slug,
      },
    })
  })
}