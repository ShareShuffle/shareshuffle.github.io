#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Deploying restored Eternal Route 66, functional Duet Loop quiz, and safe lead-capture rules."
npx firebase-tools@latest use shareshuffle-c7f96

npx firebase-tools@latest deploy \
  --only hosting:duetloop,hosting:eternalroute66,firestore:rules \
  --project shareshuffle-c7f96

echo
echo "Checking key pages..."
for URL in \
  "https://duet-loop-c7f96.web.app/quiz/" \
  "https://duetloop.com/quiz/" \
  "https://eternal-route66-c7f96.web.app/" \
  "https://eternalroute66.com/"; do
  CODE="$(curl -Lso /dev/null -w "%{http_code}" --max-time 20 "$URL" || true)"
  echo "$CODE  $URL"
done

echo
echo "Open:"
echo "  https://duetloop.com/quiz/"
echo "  https://eternalroute66.com/"
