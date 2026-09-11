#!/bin/bash
set -e

PROJECT="shareshuffle-c7f96"
TARGET="dnwilkinson"
SITE="dnwilkinson"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

run_firebase() {
  if command -v firebase >/dev/null 2>&1; then
    firebase "$@"
  else
    npx --yes firebase-tools@latest "$@"
  fi
}

echo "DOUGLAS N. WILKINSON — PATCH 25 DEPLOY"
echo "Repository: $ROOT"
echo "Firebase project: $PROJECT"
echo "Hosting site: $SITE"
echo

echo "1/6 Preserving existing Firebase targets and adding Doug's target..."
node PATCH-DNW-CONFIG-25.js "$ROOT"

echo "2/6 Validating the local portfolio..."
test -s sites/dnwilkinson/index.html
test -s sites/dnwilkinson/on-fractured-ground/index.html
test -s sites/dnwilkinson/the-returned/index.html
test -s sites/dnwilkinson/e-town/index.html
test -s sites/dnwilkinson/the-middleman/index.html
test -s sites/dnwilkinson/brothers-of-the-badge/index.html

echo "3/6 Confirming Firebase CLI access..."
run_firebase --version

echo "4/6 Confirming the Firebase project..."
run_firebase projects:list --project "$PROJECT" >/dev/null

echo "5/6 Linking target '$TARGET' to site '$SITE'..."
run_firebase target:apply hosting "$TARGET" "$SITE" --project "$PROJECT"

echo "6/6 Deploying only Doug's hosting target..."
run_firebase deploy --only "hosting:$TARGET" --project "$PROJECT"

echo
echo "Patch 25 deployment complete."
echo "Primary URL: https://dnwilkinson.web.app/"
echo "Custom domain: https://dnwilkinson.com/"
