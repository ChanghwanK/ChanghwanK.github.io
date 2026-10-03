import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildBlogPostingSchema,
  buildWebSiteSchema,
  serializeJsonLd,
} from "./structured-data.ts"

const author = {
  name: "Aiden_",
  url: "https://dev.k10n.me",
  sameAs: ["https://github.com/changhwanK"],
}

const basePost = {
  headline: "제목",
  description: "설명",
  canonicalUrl: "https://dev.k10n.me/2026-09-26-istio-envoy-xds/",
  publishedTime: "2026-09-26T00:00:00.000Z",
  author,
}

test("수정일이 없으면 게시일을 수정일로 쓴다", () => {
  const schema = buildBlogPostingSchema(basePost)

  assert.equal(schema.dateModified, basePost.publishedTime)
})

test("썸네일이 없는 글에는 image 키를 넣지 않는다", () => {
  const schema = buildBlogPostingSchema(basePost)

  assert.equal("image" in schema, false)
})

test("썸네일이 있으면 절대 URL 하나를 image 목록으로 넣는다", () => {
  const imageUrl = "https://dev.k10n.me/static/abc/thumbnail.png"

  const schema = buildBlogPostingSchema({ ...basePost, imageUrl })

  assert.deepEqual(schema.image, [imageUrl])
})

test("WebSite는 사이트 이름과 홈 URL을 담는다", () => {
  const schema = buildWebSiteSchema({
    name: "Aiden_",
    homeUrl: "https://dev.k10n.me/",
  })

  assert.equal(schema["@type"], "WebSite")
  assert.equal(schema.name, "Aiden_")
  assert.equal(schema.url, "https://dev.k10n.me/")
})

test("제목에 </script>가 있어도 스크립트 태그를 닫지 못하게 직렬화한다", () => {
  const injectedHeadline = "</script><script>alert(1)</script>"
  const schema = buildBlogPostingSchema({
    ...basePost,
    headline: injectedHeadline,
  })

  const serialized = serializeJsonLd(schema)

  assert.equal(serialized.includes("<"), false)
  // 이스케이프는 HTML 파서만 속이고 JSON 값은 그대로 보존해야 한다.
  assert.equal(JSON.parse(serialized).headline, injectedHeadline)
})
