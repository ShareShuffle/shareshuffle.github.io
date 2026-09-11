#!/bin/bash
set -u
declare -A EXPECT=(
  ["https://shareshuffle-c7f96.web.app"]="ShareShuffle"
  ["https://tempo-foundry-c7f96.web.app"]="TEMPO"
  ["https://duet-loop-c7f96.web.app"]="DUET"
  ["https://metromance-c7f96.web.app"]="METROMANCE"
  ["https://eternal-route66-c7f96.web.app"]="Eternal Route 66"
  ["https://shareshuffle.com"]="ShareShuffle"
  ["https://tempofoundry.com"]="TEMPO"
  ["https://duetloop.com"]="DUET"
  ["https://metromance.com"]="METROMANCE"
  ["https://eternalroute66.com"]="Eternal Route 66"
)
FAIL=0
for URL in "${!EXPECT[@]}"; do
  BODY="$(curl -LfsS --max-time 20 "$URL" 2>/dev/null || true)"
  CODE="$(curl -Lso /dev/null -w "%{http_code}" --max-time 20 "$URL" 2>/dev/null || echo 000)"
  if [[ "$CODE" == "200" && "$BODY" == *"${EXPECT[$URL]}"* ]]; then
    echo "PASS  $CODE  $URL"
  else
    echo "FAIL  $CODE  $URL  expected: ${EXPECT[$URL]}"
    FAIL=1
  fi
done
exit $FAIL
