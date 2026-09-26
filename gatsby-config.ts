import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Aiden_`,
    description: `개인 기술 블로그`,
    author: `@changhwanK`,
    siteUrl: `https://dev.k10n.me`,
    authorName: `Aiden_`,
    authorRole: `DevOps Engineer`,
    authorHandle: `@changhwanK`,
    githubUrl: `https://github.com/changhwanK`,
    linkedInUrl: `https://www.linkedin.com/in/changhwan-kim-767139219/`,
    authorBio: `올해로 5년 차가 된 DevOps 엔지니어 김창환입니다. 현재 Ad Tech 교육 도메인에서 AWS EKS 기반 Kubernetes 플랫폼을 운영하고 있습니다. \n 장애나 성능 저하가 생기면 커널과 네트워크 수준의 동작 원리까지 따라가 근본 원인을 찾고, 장애 자동 복구 시스템 설계와 아키텍처 개선, 자동화와 표준화로 같은 문제가 다시 생기지 않도록 재발 방지책을 마련해 왔습니다.`,
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
              // blog-post.module.css의 --figure-wide-width와 같은 값이어야 한다.
              // 이 값이 작으면 넓은 그림이 저해상도로 생성되어 확대되어 보인다.
              maxWidth: 940,
              showCaptions: true,
            },
          },
          // shiki보다 앞에 있어야 한다. shiki는 언어를 가리지 않고 모든 코드 블록을 가져가므로
          // 뒤에 두면 ```timeline 블록이 하이라이팅된 일반 코드 블록으로 렌더링된다.
          `gatsby-remark-timeline`,
          // 같은 이유로 shiki보다 앞에 둔다. ```mermaid 블록을 빌드타임에 SVG로 바꾼다.
          `gatsby-remark-mermaid-svg`,
          `gatsby-remark-shiki`,
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
        name: `Aiden_`,
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
            title: "Aiden_",
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
