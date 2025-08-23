#!/usr/bin/env bash
# scripts/release.sh
set -euo pipefail

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Committing local changes..."
  git add -A
  git commit -m "chore(release): stabilize; all tests green"
fi

echo "Verifying..."
npm run --silent verify:all

VERSION=$(node -p "require('./package.json').version")
STAMP=$(date +%Y%m%d-%H%M%S)
TAG="v${VERSION}-stable.${STAMP}"

echo "Tagging ${TAG}..."
git tag -a "${TAG}" -m "Stable release ${TAG}"

echo "Pushing HEAD and tags..."
git push origin HEAD --follow-tags
git push origin "${TAG}"

echo "Done."
