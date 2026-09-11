#!/bin/bash
set -euo pipefail
REPO="${REPO:-$HOME/Documents/GitHub/shareshuffle.github.io}"
cd "$REPO"
echo "Validating LNKDX Park patch 15..."
node --check functions/index.js
python3 -m json.tool firebase.json >/dev/null
python3 -m json.tool .firebaserc >/dev/null
test -f sites/lnkdx/index.html
chmod +x functions/node_modules/.bin/* 2>/dev/null || true

echo "Deploying LNKDX resolver, one-time seed, and Hosting..."
npx --yes firebase-tools@15.24.0 deploy --only functions:lnkdxResolve,functions:seedLnkdxParks,hosting:lnkdx --project shareshuffle-c7f96

echo "Seeding RW, R3, JO, JW, and CB..."
curl --fail --silent --show-error -X POST "https://us-central1-shareshuffle-c7f96.cloudfunctions.net/seedLnkdxParks?token=HUNqNRw5-ugwYhglQQtcKV6wE4VwAwDa"
echo

echo "Opening tests..."
open -a Safari "https://lnkdx.web.app/RW"
open -a Safari "https://lnkdx.web.app/R3"
open -a Safari "https://lnkdx.web.app/JO"
open -a Safari "https://lnkdx.web.app/JW"
open -a Safari "https://lnkdx.web.app/CB"
