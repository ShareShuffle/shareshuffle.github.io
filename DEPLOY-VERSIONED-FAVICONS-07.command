#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

STAMP="20260713T190604Z"

echo "Validating versioned favicon files..."
for DIR in   "$REPO"   "$REPO/sites/tempo-foundry"   "$REPO/sites/duetloop"   "$REPO/sites/metromance"   "$REPO/sites/eternal-route66"; do
  test -f "$DIR/favicon-32x32-$STAMP.png"
  test -f "$DIR/favicon-$STAMP.ico"
  test -f "$DIR/site-$STAMP.webmanifest"
done
echo "PASS: all five versioned favicon sets exist"

echo
echo "Deploying all five Hosting targets only..."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy   --only hosting:shuffle,hosting:tempo,hosting:duetloop,hosting:metromance,hosting:eternalroute66   --project shareshuffle-c7f96

echo
echo "Opening with cache-busting URLs..."
open "https://shareshuffle.com/?favicon=20260713T190604Z"
open "https://tempofoundry.com/?favicon=20260713T190604Z"
open "https://duetloop.com/?favicon=20260713T190604Z"
open "https://metromance.com/?favicon=20260713T190604Z"
open "https://eternalroute66.com/?favicon=20260713T190604Z"
