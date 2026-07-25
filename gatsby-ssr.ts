import * as React from "react"
import type { GatsbySSR } from "gatsby"

export const onRenderBody: GatsbySSR["onRenderBody"] = ({
  setHtmlAttributes,
  setHeadComponents,
}) => {
  setHtmlAttributes({ lang: `ko` })
  setHeadComponents([
    React.createElement("link", {
      key: "preconnect-google-fonts",
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    }),
    React.createElement("link", {
      key: "preconnect-gstatic",
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    }),
    React.createElement("link", {
      key: "pretendard-variable",
      rel: "stylesheet",
      as: "style",
      crossOrigin: "anonymous",
      href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable-dynamic-subset.css",
    }),
    React.createElement("link", {
      key: "noto-serif-kr",
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap",
    }),
  ])
}
