#!/usr/bin/env bash
# Usage (after: gh auth login):
#   ./publish.sh
set -euo pipefail
cd "$(dirname "$0")"
REPO="${1:-buyun00/lunch-fitness}"
if ! gh auth status >/dev/null 2>&1; then
  echo "请先运行: gh auth login"
  exit 1
fi
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --description "午休健身计划（静态页）" --source=. --remote=origin --push
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/${REPO}.git"
  git push -u origin main
fi
gh api -X PUT "repos/${REPO}/pages" \
  -f build_type=legacy \
  -f source='{"branch":"main","path":"/"}' \
  2>/dev/null || \
gh api -X POST "repos/${REPO}/pages" \
  -f build_type=legacy \
  -f source[branch]=main \
  -f source[path]=/ || true
OWNER="${REPO%/*}"
NAME="${REPO#*/}"
echo "Pages URL (may take 1–2 min): https://${OWNER}.github.io/${NAME}/"
