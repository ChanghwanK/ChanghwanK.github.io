# dev.k10n.me

개인 기술 블로그. Gatsby 5 기반으로 작성하며 GitHub Pages(`dev.k10n.me`)로 배포합니다.

## Commands

```bash
npm run develop   # 로컬 개발 서버 (localhost:8000)
npm run build     # 프로덕션 빌드
npm run typecheck # TypeScript 타입 검사
npm run deploy    # 빌드 + GitHub Pages 배포 (deploy 브랜치)
npm run clean     # Gatsby 캐시 초기화
```

## 새 포스트 작성

`content/posts/<YYYY-MM-DD>-<slug>/index.md` 생성 후 아래 frontmatter 작성:

```yaml
---
title: "제목"
description: "설명"
date: YYYY-MM-DD
status: writing # writing | deploy
thumbnail: ./thumbnail.png # 선택 사항, 지정 시 같은 디렉터리에 파일 필요
tags:
  - Tag1
---
```

이미지는 같은 디렉토리에 함께 저장합니다.

`deploy` 상태의 포스트만 프로덕션 사이트와 RSS에 게시됩니다. 모든 포스트는
빌드 시 title, date, status, 지정한 썸네일 파일을 검증합니다.
