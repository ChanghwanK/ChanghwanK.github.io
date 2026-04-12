# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gatsby 5 기반 개인 기술 블로그. DevOps/Kubernetes/클라우드 인프라 관련 포스트를 Markdown으로 작성하고 GitHub Pages(`dev.k10n.me`)로 배포합니다.

## Commands

```bash
npm run develop     # 로컬 개발 서버 (localhost:8000)
npm run build       # 프로덕션 빌드 (public/ 생성)
npm run serve       # 빌드된 사이트 로컬 서빙
npm run clean       # Gatsby 캐시 초기화 (.cache, public)
npm run format      # Prettier 코드 포맷팅
npm run deploy      # 빌드 + gh-pages로 deploy 브랜치에 배포
```

테스트/린팅 설정 없음. 코드 포맷팅은 Prettier만 사용 (세미콜론 없음, arrow function 괄호 생략).

## Architecture

### 데이터 흐름

```
content/posts/**/*.md → gatsby-source-filesystem → GraphQL → React 컴포넌트 → 정적 HTML (public/)
```

### 동적 페이지 생성 (gatsby-node.js)

- **onCreateNode**: Markdown 파일 경로에서 slug 필드 자동 생성
- **createPages**: 두 종류의 페이지를 동적 생성
  - 개별 블로그 포스트 (`src/templates/blog-post.js`)
  - 페이지네이션된 목록 (`src/templates/blog-list.js`, 6개/페이지)

### 라우팅

- `/` — 프로필 홈 (bio, career, social links). `src/pages/index.js`의 `CAREER` 상수와 `gatsby-config.js`의 `siteMetadata`로 구성.
- `/blog` — 포스트 목록 (6개/페이지 페이지네이션)
- `/about` — About 페이지 (`src/pages/about.js`)

### 블로그 포스트 구조

포스트는 `content/posts/<date>-<slug>/index.md`에 위치하며, 포스트별 이미지는 같은 디렉토리에 함께 저장합니다.

**Frontmatter 필수 필드:**

```yaml
---
title: "제목"
description: "설명"
date: YYYY-MM-DD
thumbnail: ./thumbnail.png
tags:
  - Tag1
---
```

### 주요 컴포넌트

| 파일                       | 역할                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `src/components/layout.js` | 공통 레이아웃 (Header + main)                              |
| `src/components/header.js` | 네비게이션 (Posts, About Me)                               |
| `src/components/seo.js`    | OpenGraph/Twitter 메타 태그                                |
| `src/templates/blog-post.js` | TOC 포함 — 스크롤 300px 이후 표시되는 sticky 목차 인라인 구현 |

### 코드 하이라이팅

`@deckdeckgo/highlight-code` 웹 컴포넌트 사용 (one-dark 테마). `gatsby-browser.js`에서 커스텀 엘리먼트 로드. 헤딩 앵커 링크는 `gatsby-remark-autolink-headers`로 자동 생성.

### 배포

GitHub Pages의 `deploy` 브랜치로 배포 (`ChanghwanK/ChanghwanK.github.io` 레포). 커스텀 도메인은 `CNAME` 파일(`dev.k10n.me`)로 설정. RSS 피드는 `/rss.xml`에 자동 생성.
