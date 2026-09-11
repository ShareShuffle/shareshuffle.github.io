#!/bin/bash
set -euo pipefail
export FIREBASE_CLI_DISABLE_UPDATE_CHECK=1

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ID="shareshuffle-c7f96"
SITE_ID="shopsformiles"
TARGET_NAME="shopsformiles"

cd "$REPO_DIR"

echo
echo "SHOPS FOR MILES — FIREBASE HOSTING"
echo "Repository: $REPO_DIR"
echo "Firebase project: $PROJECT_ID"
echo "Hosting site/target: $SITE_ID"
echo

command -v node >/dev/null 2>&1 || {
  echo "ERROR: Node.js is required."
  exit 1
}

echo "1/5 Checking repository files..."
node - <<'NODE'
const fs = require('fs');
const firebase = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
const hosting = Array.isArray(firebase.hosting) ? firebase.hosting : [firebase.hosting];
const entry = hosting.find((item) => item && item.target === 'shopsformiles');
if (!entry || entry.public !== 'sites/shops-for-miles') {
  throw new Error('firebase.json does not point shopsformiles to sites/shops-for-miles.');
}
const mapped = firebaserc.targets?.['shareshuffle-c7f96']?.hosting?.shopsformiles;
if (!Array.isArray(mapped) || !mapped.includes('shopsformiles')) {
  throw new Error('.firebaserc does not map the shopsformiles target.');
}
[
  'sites/shops-for-miles/index.html',
  'sites/shops-for-miles/404.html',
  'sites/shops-for-miles/assets/css/styles.css',
  'sites/shops-for-miles/assets/js/app.js'
].forEach((file) => {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
});
NODE

if [[ "${1:-}" == "--check" ]]; then
  echo "LOCAL CHECK PASSED. No Firebase commands were run."
  exit 0
fi

# Use the Firebase CLI already installed on this Mac. The previous script tried
# to download a pinned firebase-tools package and failed before deployment.
if ! command -v firebase >/dev/null 2>&1; then
  echo "ERROR: The Firebase CLI is not installed or is not on PATH."
  echo "Install it once with: npm install -g firebase-tools"
  exit 1
fi

echo "2/5 Checking Firebase login and project access..."
if ! firebase projects:list --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Firebase needs you to sign in. A browser window may open."
  firebase login
fi
firebase projects:list --project "$PROJECT_ID" >/dev/null

echo "3/5 Making sure the Hosting site exists..."
SITE_LIST="$(firebase hosting:sites:list --project "$PROJECT_ID" 2>&1 || true)"
if ! grep -Fq "$SITE_ID" <<<"$SITE_LIST"; then
  echo "Creating Firebase Hosting site: $SITE_ID"
  firebase hosting:sites:create "$SITE_ID" --project "$PROJECT_ID"
fi

echo "4/5 Applying the Hosting target mapping..."
firebase target:apply hosting "$TARGET_NAME" "$SITE_ID" --project "$PROJECT_ID"

echo "5/5 Deploying only Shops for Miles..."
firebase deploy --only "hosting:$TARGET_NAME" --project "$PROJECT_ID"

echo
echo "DEPLOYMENT COMPLETE"
echo "https://shopsformiles.web.app"
echo "https://shopsformiles.firebaseapp.com"
echo
echo "Custom domains can then be attached to this Hosting site:"
echo "  shopsformiles.com"
echo "  www.shopsformiles.com"
echo
