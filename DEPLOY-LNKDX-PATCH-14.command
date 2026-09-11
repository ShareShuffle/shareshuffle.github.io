#!/bin/bash
set -euo pipefail
REPO="${REPO:-$HOME/Documents/GitHub/shareshuffle.github.io}"
PROJECT="shareshuffle-c7f96"
SITE_ID="lnkdx"
cd "$REPO"

echo "Validating LNKDX patch..."
python3 -m json.tool firebase.json >/dev/null
python3 -m json.tool .firebaserc >/dev/null
test -f sites/lnkdx/index.html
grep -q 'LNKDX.COM/RCWX' sites/lnkdx/index.html
grep -q 'linkedin.com/in/' sites/lnkdx/index.html

echo "Ensuring Firebase Hosting site exists..."
if ! npx --yes firebase-tools@15.24.0 hosting:sites:list --project "$PROJECT" 2>/dev/null | grep -Eq "(^|[[:space:]])${SITE_ID}([[:space:]]|$)"; then
  npx --yes firebase-tools@15.24.0 hosting:sites:create "$SITE_ID" --project "$PROJECT"
fi

echo "Applying the local hosting target..."
npx --yes firebase-tools@15.24.0 target:apply hosting lnkdx "$SITE_ID" --project "$PROJECT"

echo "Deploying LNKDX..."
npx --yes firebase-tools@15.24.0 deploy --only hosting:lnkdx --project "$PROJECT"

echo
echo "LNKDX is deployed to the Firebase site."
echo "Next: Firebase Console > Hosting > lnkdx > Add custom domain > lnkdx.com"
echo "Use exactly the DNS records Firebase provides."
open -a Safari "https://${SITE_ID}.web.app/?deployed=$(date +%s)"
