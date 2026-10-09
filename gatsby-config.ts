import type { GatsbyConfig } from "gatsby"

interface SitemapQueryData {
  allSitePage: { nodes: Array<{ path: string }> }
  allMarkdownRemark: {
    nodes: Array<{
      fields: { slug: string }
      frontmatter: { date: string | null }
    }>
  }
}

interface SitemapPage {
  path: string
  lastmod?: string
}

const config: GatsbyConfig = {
  siteMetadata: {
    title: `0xA1D3N's 기술 블로그`,
    description: `개인 기술 블로그`,
    author: `@changhwanK`,
    siteUrl: `https://dev.k10n.me`,
    authorName: `0xA1D3N`,
    // 홈 상단 한 줄 소개. authorName은 구조화 데이터(BlogPosting author.name)에도 쓰이므로 문구를 따로 둔다.
    authorTagline: `머릿속의 물음표가 느낌표가 될 때까지`,
    authorRole: `DevOps Engineer`,
    authorHandle: `@changhwanK`,
    githubUrl: `https://github.com/changhwanK`,
    linkedInUrl: `https://www.linkedin.com/in/changhwan-kim-767139219/`,
    // authorBio: `올해로 5년 차가 된 DevOps 엔지니어 김창환입니다. 현재 Ad Tech 교육 도메인에서 AWS EKS 기반 Kubernetes 플랫폼을 운영하고 있습니다. \n 장애나 성능 저하가 생기면 커널과 네트워크 수준의 동작 원리까지 따라가 근본 원인을 찾고, 장애 자동 복구 시스템 설계와 아키텍처 개선, 자동화와 표준화로 같은 문제가 다시 생기지 않도록 재발 방지책을 마련해 왔습니다.`,
    // 검색 결과에 보이는 홈 설명(meta description)용 짧은 소개. 화면에는 아래 authorIntro가 보인다.
    authorBio: `안녕하세요, Platform Engineer 0xA1D3N(김창환)입니다. 쿠버네티스 생태계에 관심이 많으며, 물음표가 느낌표가 되는 과정을 기록합니다.`,
    // 홈 화면의 자기소개. 항목 하나가 한 문단이다.
    authorIntro: [
      `안녕하세요. 머리속의 물음표가 느낌표가 될 때까지 집요하게 파고드는 엔지니어 김창환입니다. 스스로 높은 기준과 목표를 세우며, 작은 성취가 쌓여 큰 목표를 달성할 수 있다 믿습니다. 어려운 문제에 몰입해 해결하고, 그 과정을 나눌 때 가장 큰 보람을 느낍니다.`,
      `최근에는 문제를 빠르고 안전하게 해결할 수 있는 플랫폼을 만드는 플랫폼 엔지니어링에 집중하고 있습니다. 개발자와 비개발자 모두 좋은 제품을 만드는 일에만 집중할 수 있도록, 쓰기 쉬우면서도 안전하게 관리되는 인프라를 만드는 것이 제 궁극적인 목표입니다.`,
      `이 목표를 프로그래밍과 쿠버네티스로 풀어 가고 있습니다. 필요한 도구는 직접 만들어 쓰고, 좋은 플랫폼은 그 아래 기술을 이해할 때 만들 수 있다고 믿기에 쿠버네티스와 컨테이너·리눅스가 동작하는 원리를 파고드는 데 관심이 많습니다.`,
    ],
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
              maxWidth: 780,
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
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        // 404 페이지는 플러그인 기본 제외 목록에 이미 들어 있다.
        query: `
          {
            site {
              siteMetadata {
                siteUrl
              }
            }
            allSitePage {
              nodes {
                path
              }
            }
            allMarkdownRemark {
              nodes {
                fields {
                  slug
                }
                frontmatter {
                  date
                }
              }
            }
          }
        `,
        // 글 페이지에만 게시일을 lastmod로 붙인다. 실제로 생성된 페이지(allSitePage)를 기준으로 합치므로
        // 프로덕션에서 빠지는 writing 글은 frontmatter가 있어도 사이트맵에 나오지 않는다.
        resolvePages: ({
          allSitePage,
          allMarkdownRemark,
        }: SitemapQueryData): SitemapPage[] => {
          const publishedDateBySlug = new Map(
            allMarkdownRemark.nodes.map(node => [
              node.fields.slug,
              node.frontmatter.date,
            ])
          )
          return allSitePage.nodes.map(({ path }) => ({
            path,
            lastmod: publishedDateBySlug.get(path) ?? undefined,
          }))
        },
        // changefreq·priority는 Google이 읽지 않아 넣지 않는다 (플러그인 기본값은 daily·0.7).
        serialize: ({ path, lastmod }: SitemapPage) =>
          lastmod ? { url: path, lastmod } : { url: path },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `0xA1D3N`,
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
            title: "0xA1D3N",
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
