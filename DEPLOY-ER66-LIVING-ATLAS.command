#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Deploying Eternal Route 66 living atlas, clear 66 favicon, portfolio footer links, and Firestore submission rules."
npx firebase-tools@latest use shareshuffle-c7f96

npx firebase-tools@latest deploy \
  --only hosting:eternalroute66,hosting:tempo,hosting:duetloop,hosting:metromance,hosting:shuffle,firestore:rules \
  --project shareshuffle-c7f96

echo
echo "Checking Eternal Route 66..."
for URL in \
  "https://eternal-route66-c7f96.web.app/" \
  "https://eternalroute66.com/"; do
  BODY="$(curl -LfsS --max-time 20 "$URL" 2>/dev/null || true)"
  CODE="$(curl -Lso /dev/null -w "%{http_code}" --max-time 20 "$URL" 2>/dev/null || echo 000)"
  if [[ "$CODE" == "200" && "$BODY" == *"const QUOTES="* && "$BODY" == *"const ATLAS="* && "$BODY" == *"er66Submissions"* ]]; then
    echo "PASS  $CODE  $URL  quotes + atlas + database enhancement present"
  else
    echo "FAIL  $CODE  $URL"
  fi
done

echo
echo "Open:"
echo "  https://eternalroute66.com/?living-atlas=03"
