import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `경험과 생각을 기록합니다.`,
    description: `개인 기술 블로그`,
    author: `@changhwanK`,
    siteUrl: `https://dev.k10n.me`,
    authorName: `김창환`,
    authorRole: `DevOps Engineer`,
    authorBio: `안녕하세요 Kubernetes에 관심이 많은 DevOps Engineerer 김창환입니다. 경험과 생각을 기록하고 있습니다.`,
    techStack: [`Kubernetes`, `AWS`, `Terraform`, `Docker`, `Istio`, `ArgoCD`],
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `posts`,
        path: `${__dirname}/content/posts`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
              showCaptions: true,
            },
          },
          {
            resolve: `gatsby-remark-highlight-code`,
            options: {
              terminal: "carbon",
              theme: "one-dark",
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              icon: false,
              className: `anchor-header`,
              maintainCase: false,
              removeAccents: true,
            },
          },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Dev.ch - 기술 블로그`,
        short_name: `Dev.ch`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#7026b9`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`,
      },
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }: any) =>
              allMarkdownRemark.nodes.map((node: any) => ({
                ...node.frontmatter,
                description: node.frontmatter.description || node.excerpt,
                date: node.frontmatter.date,
                url: site.siteMetadata.siteUrl + node.fields.slug,
                guid: site.siteMetadata.siteUrl + node.fields.slug,
                custom_elements: [{ "content:encoded": node.html }],
              })),
            query: `{
              allMarkdownRemark(
                sort: {frontmatter: {date: DESC}}
                filter: {frontmatter: {date: {ne: null}, status: {eq: "deploy"}}}
              ) {
                nodes {
                  excerpt
                  html
                  fields {
                    slug
                  }
                  frontmatter {
                    title
                    date
                    description
                  }
                }
              }
            }`,
            output: "/rss.xml",
            title: "Lazy - 기술 블로그 RSS Feed",
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-robots-txt`,
      options: {
        host: `https://dev.k10n.me`,
        sitemap: `https://dev.k10n.me/sitemap-index.xml`,
        policy: [{ userAgent: `*`, allow: `/` }],
      },
    },
  ],
}

export default config
