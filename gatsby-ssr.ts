import * as React from "react"
import type { GatsbySSR } from "gatsby"

export const onRenderBody: GatsbySSR["onRenderBody"] = ({
  setHtmlAttributes,
  setHeadComponents,
}) => {
  setHtmlAttributes({ lang: `ko` })
  setHeadComponents([
    React.createElement("link", {
      key: "preconnect-jsdelivr",
      rel: "preconnect",
      href: "https://cdn.jsdelivr.net",
      crossOrigin: "anonymous",
    }),
    React.createElement("link", {
      key: "spoqa-han-sans-neo",
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css",
    }),
  ])
}
