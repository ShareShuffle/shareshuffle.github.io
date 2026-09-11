#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
PROJECT="shareshuffle-c7f96"
ACTION_FILE="$REPO/.tempo-private/last-invite-action.json"

cd "$REPO"

python3 "$REPO/tools/tempo-invite.py" \
  --repo "$REPO" \
  wizard

echo
read -r -p "Deploy this invitation now? [Y/n] " ANSWER
ANSWER="${ANSWER:-Y}"

if [[ "$ANSWER" =~ ^[Yy] ]]; then
  chmod +x "$REPO/functions/node_modules/.bin/"* 2>/dev/null || true

  echo
  echo "Deploying the invitation engine..."
  firebase deploy \
    --project "$PROJECT" \
    --only functions:tempoAccountApi

  TARGET="$(
    python3 - "$ACTION_FILE" <<'PY'
import json
import sys
print(json.load(open(sys.argv[1])).get("target", ""))
PY
  )"

  if [ -n "$TARGET" ]; then
    echo
    echo "Publishing the invitation page for hosting:$TARGET..."
    if ! firebase deploy \
      --project "$PROJECT" \
      --only "hosting:$TARGET"
    then
      echo "WARNING: The function deployed, but hosting:$TARGET did not."
    fi
  fi
fi

MESSAGE_FILE="$(
  python3 - "$ACTION_FILE" <<'PY'
import json
import sys
print(json.load(open(sys.argv[1])).get("messageFile", ""))
PY
)"

if [ -n "$MESSAGE_FILE" ] && [ -f "$MESSAGE_FILE" ]; then
  open -a TextEdit "$MESSAGE_FILE"
fi

echo
echo "Invitation complete."
