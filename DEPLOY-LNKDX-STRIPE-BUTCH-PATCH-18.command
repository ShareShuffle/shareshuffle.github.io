#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Validating Patch 18..."
node --check functions/index.js
node tests/link-check-title.test.cjs
node tests/lnkdx-stripe-merch.test.cjs
node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8'));JSON.parse(require('fs').readFileSync('merch/butch-shirts.json','utf8'))"
test -f sites/lnkdx/terms.html
test -f sites/lnkdx/privacy.html

echo "Deploying LNKDX Park subscriptions and approved Butch Museum merchandise..."
npx --yes firebase-tools@15.24.0 deploy \
  --only hosting:shuffle,hosting:breger,hosting:eternalroute66,hosting:lnkdx,functions:lnkdxResolve,functions:lnkdxParkAvailability,functions:lnkdxCreateCheckout,functions:lnkdxStripeWebhook \
  --project shareshuffle-c7f96

echo "Patch 18 complete."
open -a Safari "https://lnkdx.com/?patch18=$(date +%s)"
open -a Safari "https://butchbreger.com/#shop"
