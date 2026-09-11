#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="shareshuffle-c7f96"
HOSTING_TARGET="solutionworkshop"
HOSTING_SITE="sol-wx"
REPO="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$REPO/sites/solution-workshop"

if command -v firebase >/dev/null 2>&1; then
  FIREBASE=(firebase)
else
  FIREBASE=(npx --yes firebase-tools@latest)
fi

echo "SOLUTION WORKSHOP — LEGAL PATCH 24 DEPLOY"
echo "Repository: $REPO"
echo "Firebase project: $PROJECT_ID"
echo "Hosting site: $HOSTING_SITE"
echo

echo "1/6 Validating patch files..."
required_files=(
  "$SITE_DIR/index.html"
  "$SITE_DIR/legal.css"
  "$SITE_DIR/privacy/index.html"
  "$SITE_DIR/terms/index.html"
  "$SITE_DIR/sitemap.xml"
  "$REPO/firebase.json"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

grep -q 'href="/privacy/"' "$SITE_DIR/index.html"
grep -q 'href="/terms/"' "$SITE_DIR/index.html"
grep -q 'text messaging originator opt-in data and consent' "$SITE_DIR/privacy/index.html"
grep -q 'Reply <strong>STOP</strong>' "$SITE_DIR/terms/index.html"
grep -q '"target": "solutionworkshop"' "$REPO/firebase.json"

if [ "${1:-}" = "--check" ]; then
  echo "Patch validation passed. No deployment was performed."
  exit 0
fi

echo "2/6 Selecting Firebase CLI..."
"${FIREBASE[@]}" --version

echo "3/6 Confirming Firebase login and project access..."
"${FIREBASE[@]}" projects:list --json >/dev/null

echo "4/6 Linking the hosting target to the correct project..."
"${FIREBASE[@]}" target:apply hosting "$HOSTING_TARGET" "$HOSTING_SITE" --project "$PROJECT_ID"

echo "5/6 Deploying Solution Workshop only..."
"${FIREBASE[@]}" deploy --only "hosting:$HOSTING_TARGET" --project "$PROJECT_ID"

echo "6/6 Done."
echo "Homepage: https://solutionworkshop.com/"
echo "Privacy:  https://solutionworkshop.com/privacy/"
echo "Terms:    https://solutionworkshop.com/terms/"
