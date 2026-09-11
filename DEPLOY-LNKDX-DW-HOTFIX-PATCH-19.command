#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Validating Patch 19..."
node --check functions/index.js
node tests/link-check-title.test.cjs
node tests/lnkdx-stripe-merch.test.cjs
node - <<'NODE'
const fs = require('fs');
JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
const html = fs.readFileSync('sites/lnkdx/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
if (!script) throw new Error('missing LNKDX inline script');
new Function(script);
NODE

echo "Deploying LNKDX DW checkout activation hotfix..."
npx --yes firebase-tools@15.24.0 deploy \
  --only hosting:lnkdx,functions:lnkdxFinalizeCheckout \
  --project shareshuffle-c7f96

echo "Patch 19 complete."
open -a Safari "https://lnkdx.com/DW?patch19=$(date +%s)"
