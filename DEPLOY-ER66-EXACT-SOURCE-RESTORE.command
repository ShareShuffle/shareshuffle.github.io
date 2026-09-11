#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

LOCAL="$REPO/sites/eternal-route66/index.html"

echo "LOCAL VALIDATION"
grep -q 'const QUOTES=' "$LOCAL"
grep -q 'const ATLAS=' "$LOCAL"
grep -q 'id="quotes"' "$LOCAL"
grep -q 'id="atlas"' "$LOCAL"
echo "PASS: exact rich source contains quotes and atlas"

echo
echo "Deploying Eternal Route 66 and Firestore rules only..."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy \
  --only hosting:eternalroute66,firestore:rules \
  --project shareshuffle-c7f96

echo
echo "LIVE VALIDATION"
for URL in \
  "https://eternal-route66-c7f96.web.app/" \
  "https://eternalroute66.com/"; do
  BODY="$(curl -LfsS --max-time 30 "$URL?restore=04-$(date +%s)" 2>/dev/null || true)"
  if [[ "$BODY" == *"const QUOTES="* && "$BODY" == *"const ATLAS="* && "$BODY" == *"Roadside Wisdom"* && "$BODY" == *"Towns, Landmarks, Motels & Eats"* ]]; then
    echo "PASS  $URL"
  else
    echo "FAIL  $URL"
  fi
done

open "https://eternalroute66.com/?restore=04-$(date +%s)"
