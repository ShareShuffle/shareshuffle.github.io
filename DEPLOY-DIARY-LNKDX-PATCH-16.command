#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Validating Patch 16..."
test -f "DIARY/README.md"
test -f "DIARY/INDEX.md"
test -f ".project-context/summaries/11-lnkdx-debug-diary-patch-16-20260717.md"
node --check functions/index.js

echo "Deploying only the captured LNKDX resolver and Hosting site..."
npx --yes firebase-tools@15.24.0 deploy \
  --only functions:lnkdxResolve,hosting:lnkdx \
  --project shareshuffle-c7f96

echo "Patch 16 complete."
open -a Safari "https://lnkdx.com/?patch16=$(date +%s)"
