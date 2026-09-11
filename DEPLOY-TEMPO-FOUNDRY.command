#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo
echo "TEMPO FOUNDRY MULTISITE DEPLOY"
echo "Repository: $REPO"
echo

command -v node >/dev/null || { echo "Node.js is required."; exit 1; }

echo "1/6 Checking Firebase login..."
npx firebase-tools@latest login:list >/dev/null 2>&1 || npx firebase-tools@latest login

echo "2/6 Selecting Firebase project..."
npx firebase-tools@latest use shareshuffle-c7f96

echo "3/6 Creating additional Hosting sites if needed..."
for SITE in tempo-foundry duet-loop metromance eternal-route66; do
  npx firebase-tools@latest hosting:sites:create "$SITE" --project shareshuffle-c7f96 >/dev/null 2>&1 || true
done

echo "4/6 Assigning local deploy targets..."
npx firebase-tools@latest target:apply hosting shuffle shareshuffle-c7f96
npx firebase-tools@latest target:apply hosting tempo tempo-foundry
npx firebase-tools@latest target:apply hosting duetloop duet-loop
npx firebase-tools@latest target:apply hosting metromance metromance
npx firebase-tools@latest target:apply hosting eternalroute66 eternal-route66

echo "5/6 Installing Cloud Functions dependencies..."
npm --prefix functions install

echo "6/6 Deploying all five Hosting targets plus existing functions and Firestore rules..."
npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

echo
echo "DEPLOY FINISHED."
echo
echo "Firebase preview domains:"
echo "  ShareShuffle:     https://shareshuffle-c7f96.web.app"
echo "  Tempo Foundry:    https://tempo-foundry.web.app"
echo "  Duet Loop:        https://duet-loop.web.app"
echo "  Metromance:       https://metromance.web.app"
echo "  Eternal Route 66: https://eternal-route66.web.app"
echo
echo "NEXT: In Firebase Console > Hosting, connect:"
echo "  tempofoundry.com      -> tempo-foundry"
echo "  duetloop.com          -> duet-loop"
echo "  metromance.com        -> metromance"
echo "  eternalroute66.com    -> eternal-route66"
echo
