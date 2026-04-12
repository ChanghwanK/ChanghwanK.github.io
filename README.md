# dev.k10n.me

개인 기술 블로그. Gatsby 5 기반으로 작성하며 GitHub Pages(`dev.k10n.me`)로 배포합니다.

## Commands

```bash
npm run develop   # 로컬 개발 서버 (localhost:8000)
npm run build     # 프로덕션 빌드
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
thumbnail: ./thumbnail.png
tags:
  - Tag1
---
```

이미지는 같은 디렉토리에 함께 저장합니다.
