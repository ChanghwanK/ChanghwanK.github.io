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

테스트/린팅 설정 없음 (예외: 타임라인 플러그인은 `node --test plugins/gatsby-remark-timeline/`). 코드 포맷팅은 Prettier만 사용 (세미콜론 없음, arrow function 괄호 생략).

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
status: deploy      # deploy | writing (deploy만 빌드/배포에 포함됨)
thumbnail: ./thumbnail.png
tags:
  - Tag1
---
```

> `status: writing`으로 설정하면 로컬 개발 서버에서도 보이지 않음 (GraphQL 필터로 제외).

### 타임라인 블록

장애 회고 글의 세로 타임라인은 ` ```timeline ` 코드 블록으로 쓴다. 로컬 플러그인 `plugins/gatsby-remark-timeline`이 빌드 시점에 HTML로 바꾸고, 모양은 `src/templates/blog-post.module.css`의 `.timeline` 규칙이 입힌다.

````markdown
```timeline
# 장애 전
14:20 // 05:20Z | info   | anon 27.8GB(84%), MemAvailable 2.8GB | 헤드룸 없는 상태로 하루 종일 운영 중이었다.
14:32 // 05:32Z | danger | kubelet 하트비트 중단 | `vmsingle` 9.4GB 시점.
14:34:44        | danger | 노드 NotReady 판정
14:45:18        | ok     | 노드 Ready 자연 복귀 | NodeRepair=false라 자동 교체도 없었다.
```
````

- 한 줄 = 사건 하나. 필드는 `시간 | 상태 | 제목 | 설명` 순서이고 설명만 생략할 수 있다.
- 상태는 `info`(회색), `danger`(빨강, 연속되면 세로선이 빨간 구간으로 이어진다), `ok`(초록 점) 셋뿐이다.
- 시간의 `//`는 줄바꿈이다 (KST와 UTC 병기용). 본문에 `|`가 필요하면 `\|`로 쓴다. 빈 줄과 `#`으로 시작하는 줄은 무시된다.
- 제목과 설명에서 지원하는 마크다운은 백틱 인라인 코드뿐이다 (링크, 굵게 미지원).
- 문법 오류(상태값 오타, 필드 개수 등)는 조용히 넘어가지 않고 `index.md:줄번호`가 담긴 오류로 빌드를 실패시킨다. develop에서는 해당 글에만 오류가 뜬다.
- `gatsby-config.ts`에서 `gatsby-remark-timeline`은 `gatsby-remark-shiki`보다 **앞에** 있어야 한다. shiki가 모든 코드 블록을 가져가므로 순서가 바뀌면 타임라인이 일반 코드 블록으로 렌더링된다.
- 파서와 렌더러 테스트: `node --test plugins/gatsby-remark-timeline/` (의존성 없는 Node 내장 러너).

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

## 블로그 글쓰기 톤앤매너

- **비격식체(반말)** 사용 — 높임말(`~입니다`, `~합니다`, `~하세요`) 금지
- 이 블로그는 개인의 생각·경험·학습을 정리하는 공간으로, 독자에게 설명하는 것이 아닌 자신의 이야기를 풀어내는 방식을 지향
- 예: "했습니다" → "했다", "사용합니다" → "사용한다", "알아보겠습니다" → "알아보자"
