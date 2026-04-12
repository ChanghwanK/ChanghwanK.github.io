import * as React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const NotFoundPage = () => (
  <Layout>
    <div
      style={{
        maxWidth: "var(--size-content)",
        margin: "0 auto",
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      <h1>404: 페이지를 찾을 수 없습니다</h1>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
      <Link to="/">홈으로 돌아가기</Link>
    </div>
  </Layout>
)

export const Head = () => <Seo title="404: 페이지를 찾을 수 없습니다" />

export default NotFoundPage
