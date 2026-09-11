#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Validating Patch 17..."
node --check functions/index.js
node tests/link-check-title.test.cjs
test -f ".project-context/summaries/12-shuffle-linkcheck-title-hotfix-lnkdx-revenue-20260717.md"

echo "Deploying the Shuffle creator and the two corrected functions..."
npx --yes firebase-tools@15.24.0 deploy \
  --only hosting:shuffle,functions:getPreview,functions:linkCheck \
  --project shareshuffle-c7f96

echo "Patch 17 complete."
open -a Safari "https://shareshuffle.com/app/?patch17=$(date +%s)"
