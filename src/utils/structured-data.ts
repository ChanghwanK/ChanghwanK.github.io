// 검색엔진용 구조화 데이터(JSON-LD)를 만든다. 무엇을 넣을지는 Google Search Central의
// Article 구조화 데이터, 사이트 이름(WebSite) 문서를 기준으로 한다.

const SCHEMA_CONTEXT = "https://schema.org"
const CONTENT_LANGUAGE = "ko"

export interface StructuredDataAuthor {
  name: string
  url: string
  sameAs: string[]
}

export interface BlogPostingInput {
  headline: string
  description: string
  canonicalUrl: string
  publishedTime: string
  // 글 수정일을 따로 적는 frontmatter 필드가 아직 없어서, 없으면 게시일을 그대로 쓴다.
  modifiedTime?: string
  imageUrl?: string
  author: StructuredDataAuthor
}

export const buildBlogPostingSchema = ({
  headline,
  description,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  imageUrl,
  author,
}: BlogPostingInput) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "BlogPosting",
  headline,
  description,
  datePublished: publishedTime,
  dateModified: modifiedTime ?? publishedTime,
  author: {
    "@type": "Person",
    name: author.name,
    url: author.url,
    sameAs: author.sameAs,
  },
  // 썸네일이 없는 글에 빈 값을 넣으면 Search Console이 잘못된 image로 경고하므로 키 자체를 뺀다.
  ...(imageUrl ? { image: [imageUrl] } : {}),
  mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  url: canonicalUrl,
  inLanguage: CONTENT_LANGUAGE,
})

export interface WebSiteInput {
  name: string
  homeUrl: string
}

// Google은 홈페이지의 WebSite.name을 검색 결과의 사이트 이름 후보로 쓴다.
export const buildWebSiteSchema = ({ name, homeUrl }: WebSiteInput) => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "WebSite",
  name,
  url: homeUrl,
  inLanguage: CONTENT_LANGUAGE,
})

// JSON.stringify는 "</script>"를 그대로 두므로, 제목·설명에 그 문자열이 들어가면
// 스크립트 태그가 조기에 닫혀 뒤쪽 JSON이 HTML로 해석된다. "<"를 유니코드 이스케이프로 바꾸면
// JSON 값은 같고 HTML 파서는 태그로 보지 않는다.
export const serializeJsonLd = (schema: object): string =>
  JSON.stringify(schema).replace(/</g, "\\u003c")
