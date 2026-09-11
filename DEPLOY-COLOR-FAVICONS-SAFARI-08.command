#!/bin/bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"
STAMP="20260713T194353Z"

echo "Validating versioned favicon files..."
for DIR in   "$REPO"   "$REPO/sites/tempo-foundry"   "$REPO/sites/duetloop"   "$REPO/sites/metromance"   "$REPO/sites/eternal-route66"; do
  test -f "$DIR/favicon-16x16-$STAMP.png"
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
echo "Opening all five sites in Safari..."
open -a Safari "https://shareshuffle.com/?favicon=$STAMP"
open -a Safari "https://tempofoundry.com/?favicon=$STAMP"
open -a Safari "https://duetloop.com/?favicon=$STAMP"
open -a Safari "https://metromance.com/?favicon=$STAMP"
open -a Safari "https://eternalroute66.com/?favicon=$STAMP"
