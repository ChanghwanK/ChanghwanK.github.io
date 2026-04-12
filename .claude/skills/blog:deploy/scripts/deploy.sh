#!/bin/bash
# tech_blog GitHub Pages 배포 스크립트
# gatsby build → gh-pages -d public -b deploy
set -euo pipefail

# 스크립트 위치 기준으로 프로젝트 루트 계산
# .claude/skills/blog:deploy/scripts/ → 4단계 위가 프로젝트 루트
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="$(cd "$SCRIPT_DIR/../../../../" && pwd)"

if [ ! -f "$BLOG_DIR/gatsby-config.ts" ] && [ ! -f "$BLOG_DIR/gatsby-config.js" ]; then
  echo "ERROR: Gatsby 프로젝트를 찾을 수 없습니다: $BLOG_DIR" >&2
  exit 1
fi

cd "$BLOG_DIR"
echo "==> 작업 디렉토리: $(pwd)"
echo ""

UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt "0" ]; then
  echo "WARNING: 미커밋 변경사항이 ${UNCOMMITTED}개 있습니다."
  echo "$(git status --short)"
  echo ""
  echo "계속 진행합니다..."
fi

echo "==> gatsby build 시작..."
npm run build

echo ""
echo "==> gh-pages 배포 시작 (deploy 브랜치)..."
npx gh-pages -d public -b deploy

echo ""
echo "==> 배포 완료!"
echo "URL: https://dev.k10n.me"
