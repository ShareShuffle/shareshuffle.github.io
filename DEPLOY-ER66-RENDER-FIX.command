#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"
LOCAL="$REPO/sites/eternal-route66/index.html"

echo "LOCAL SOURCE CHECK"
grep -q 'const QUOTES=' "$LOCAL"
grep -q 'const ATLAS=' "$LOCAL"
grep -q "renderAtlas();" "$LOCAL"
node --check <(python3 - "$LOCAL" <<'PY'
import re,sys
s=open(sys.argv[1],encoding="utf-8").read()
for attrs,body in re.findall(r'<script([^>]*)>(.*?)</script>',s,re.S|re.I):
    if 'src=' not in attrs and 'application/ld+json' not in attrs and 'type="module"' not in attrs:
        print(body)
PY
) 2>/dev/null || {
  echo "Inline script validation failed."
  exit 1
}
echo "PASS: source and JavaScript syntax are valid"

echo
echo "Deploying only Eternal Route 66 hosting..."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy \
  --only hosting:eternalroute66 \
  --project shareshuffle-c7f96

echo
echo "LIVE SOURCE CHECK"
for URL in \
  "https://eternal-route66-c7f96.web.app/" \
  "https://eternalroute66.com/"; do
  BODY="$(curl -LfsS --max-time 30 "$URL?render-fix=05-$(date +%s)" 2>/dev/null || true)"
  if [[ "$BODY" == *"const QUOTES="* && "$BODY" == *"const ATLAS="* && "$BODY" == *"renderAtlas();"* ]]; then
    echo "PASS  $URL"
  else
    echo "FAIL  $URL"
  fi
done

open "https://eternalroute66.com/?render-fix=05-$(date +%s)"
