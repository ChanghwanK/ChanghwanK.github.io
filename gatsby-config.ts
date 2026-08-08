import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `N@vis`,
    description: `개인 기술 블로그`,
    author: `@changhwanK`,
    siteUrl: `https://dev.k10n.me`,
    authorName: `N@vis`,
    authorRole: `DevOps Engineer`,
    authorHandle: `@changhwanK`,
    githubUrl: `https://github.com/changhwanK`,
    linkedInUrl: `https://www.linkedin.com/in/changhwan-kim-767139219/`,
    authorBio: `안녕하세요. DevOps Egineer 김창환입니다. \n\n 소프트웨어 개발부터 배포, 운영까지의 흐름을 더 효율적이고 안정적으로 만드는 방법을 고민하며, 클라우드 네이티브 인프라를 설계하고 운영하고 있습니다.`,
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
          {
            resolve: `gatsby-remark-katex`,
            options: {
              strict: `ignore`,
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
        name: `N@vis`,
        short_name: `Changhwan`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#7026b9`,
        display: `minimal-ui`,
        icon: `src/images/navis-7e.png`,
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
            title: "N@vis",
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
