#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"
echo "Deploying five exact Hosting targets. Existing Functions are not changed."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy \
  --only hosting:shuffle,hosting:tempo,hosting:duetloop,hosting:metromance,hosting:eternalroute66 \
  --project shareshuffle-c7f96
echo
echo "Running routing verification..."
"$REPO/VERIFY-PORTFOLIO-ROUTING.command" || true
echo
echo "Done. Review any FAIL lines above before changing DNS."
