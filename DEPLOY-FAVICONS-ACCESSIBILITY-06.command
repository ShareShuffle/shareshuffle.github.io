#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Validating Eternal Route 66 before deploy..."
grep -q 'const QUOTES=' "$REPO/sites/eternal-route66/index.html"
grep -q 'const ATLAS=' "$REPO/sites/eternal-route66/index.html"
grep -q 'renderAtlas();' "$REPO/sites/eternal-route66/index.html"
echo "PASS: quotes, atlas and renderer are present"

echo
echo "Deploying all five Hosting targets. Functions and Firestore are not changed."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy \
  --only hosting:shuffle,hosting:tempo,hosting:duetloop,hosting:metromance,hosting:eternalroute66 \
  --project shareshuffle-c7f96

echo
echo "Opening the pages with a cache-busting query..."
STAMP="$(date +%s)"
open "https://shareshuffle.com/?visual=06-$STAMP"
open "https://tempofoundry.com/?visual=06-$STAMP"
open "https://duetloop.com/?visual=06-$STAMP"
open "https://metromance.com/?visual=06-$STAMP"
open "https://eternalroute66.com/?visual=06-$STAMP"
