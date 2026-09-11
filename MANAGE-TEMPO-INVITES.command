#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
PROJECT="shareshuffle-c7f96"
ACTION_FILE="$REPO/.tempo-private/last-invite-action.json"

cd "$REPO"

python3 "$REPO/tools/tempo-invite.py" \
  --repo "$REPO" \
  manage

DEPLOY="$(
  python3 - "$ACTION_FILE" <<'PY'
import json
import sys
print("yes" if json.load(open(sys.argv[1])).get("deploymentRequired") else "no")
PY
)"

if [ "$DEPLOY" = "yes" ]; then
  echo
  read -r -p "Deploy this invitation change now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"

  if [[ "$ANSWER" =~ ^[Yy] ]]; then
    chmod +x "$REPO/functions/node_modules/.bin/"* 2>/dev/null || true
    firebase deploy \
      --project "$PROJECT" \
      --only functions:tempoAccountApi
  fi
fi
