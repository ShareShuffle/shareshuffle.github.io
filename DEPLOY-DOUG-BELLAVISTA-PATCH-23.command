#!/bin/bash
set -euo pipefail
export FIREBASE_CLI_DISABLE_UPDATE_CHECK=1

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ID="shareshuffle-c7f96"
DOUG_TARGET="dnwilkinson"
DOUG_SITE="dnwilkinson"
BELLA_TARGET="bellavista"
BELLA_SITE="bellavista"

firebase_cli() {
  if command -v firebase >/dev/null 2>&1; then
    firebase "$@"
  else
    npx --yes firebase-tools@15.24.0 "$@"
  fi
}

cd "$REPO_DIR"

echo
echo "TEMPO FOUNDRY — DOUG + BELLA VISTA — PATCH 23"
echo "Repository: $REPO_DIR"
echo "Firebase project: $PROJECT_ID"
echo

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required. Install the current Node.js LTS release, then run this file again."
  exit 1
}

if ! command -v firebase >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "Firebase CLI was not found, and npx is unavailable as a fallback."
  echo "Install the current Node.js LTS release, then run this file again."
  exit 1
fi

echo "1/7 Validating Patch 23..."
node <<'NODE'
const fs = require("fs");
const firebase = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
const firebaserc = JSON.parse(fs.readFileSync(".firebaserc", "utf8"));
const properties = JSON.parse(fs.readFileSync("config/tempo-properties.json", "utf8"));
const hosting = Array.isArray(firebase.hosting) ? firebase.hosting : [firebase.hosting];

const expected = {
  dnwilkinson: "sites/dn-wilkinson",
  bellavista: "sites/bella-vista-lake-house"
};

for (const [targetName, publicDir] of Object.entries(expected)) {
  const target = hosting.find((entry) => entry && entry.target === targetName);
  if (!target || target.public !== publicDir) {
    throw new Error(`firebase.json is missing ${targetName} -> ${publicDir}`);
  }
  const mapped = firebaserc.targets?.["shareshuffle-c7f96"]?.hosting?.[targetName] || [];
  if (!mapped.includes(targetName)) {
    throw new Error(`.firebaserc is missing ${targetName} in project shareshuffle-c7f96`);
  }
  if (!properties.properties?.[targetName]) {
    throw new Error(`Tempo property registry is missing ${targetName}`);
  }
}

[
  "sites/dn-wilkinson/index.html",
  "sites/dn-wilkinson/on-fractured-ground/index.html",
  "sites/dn-wilkinson/assets/images/on-fractured-ground-poster.webp",
  "sites/bella-vista-lake-house/index.html",
  "sites/bella-vista-lake-house/site-config.js",
  "sites/bella-vista-lake-house/assets/images/lake-view-living-room.webp"
].forEach((file) => {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    throw new Error(`Required file is missing or empty: ${file}`);
  }
});
NODE

if [[ "${1:-}" == "--check" ]]; then
  echo
  echo "LOCAL CHECK PASSED. No Firebase changes were made."
  exit 0
fi

echo "2/7 Checking Firebase login..."
if ! firebase_cli login:list >/dev/null 2>&1; then
  firebase_cli login
fi

echo "3/7 Confirming Firebase project access..."
PROJECT_LIST="$(firebase_cli projects:list 2>/dev/null || true)"
grep -Fq "$PROJECT_ID" <<<"$PROJECT_LIST" || {
  echo
  echo "Firebase project '$PROJECT_ID' was not found in the currently signed-in account."
  echo "Run this file again after signing in with the account that owns Tempo Foundry."
  exit 1
}

echo "4/7 Confirming both Hosting sites..."
SITE_LIST="$(firebase_cli hosting:sites:list --project "$PROJECT_ID" 2>/dev/null || true)"
for site in "$DOUG_SITE" "$BELLA_SITE"; do
  if ! grep -Fq "$site" <<<"$SITE_LIST"; then
    echo "Hosting site '$site' was not found in project '$PROJECT_ID'."
    echo "The site already needs to exist before this patch deploys."
    exit 1
  fi
done

echo "5/7 Repairing Hosting target mappings..."
firebase_cli target:clear hosting "$DOUG_TARGET" --project "$PROJECT_ID" >/dev/null 2>&1 || true
firebase_cli target:apply hosting "$DOUG_TARGET" "$DOUG_SITE" --project "$PROJECT_ID"
firebase_cli target:clear hosting "$BELLA_TARGET" --project "$PROJECT_ID" >/dev/null 2>&1 || true
firebase_cli target:apply hosting "$BELLA_TARGET" "$BELLA_SITE" --project "$PROJECT_ID"

echo "6/7 Deploying Doug and Bella Vista..."
firebase_cli deploy --only "hosting:$DOUG_TARGET,hosting:$BELLA_TARGET" --project "$PROJECT_ID"

echo "7/7 Publishing both cards on Tempo Foundry..."
firebase_cli deploy --only hosting:tempo --project "$PROJECT_ID"

echo
echo "PATCH 23 DEPLOYED"
echo
echo "Douglas N. Wilkinson:"
echo "  https://dnwilkinson.web.app"
echo "  https://dnwilkinson.web.app/on-fractured-ground/"
echo
echo "The Lake House at Bella Vista:"
echo "  https://bellavista.web.app"
echo
echo "Tempo Foundry:"
echo "  https://tempofoundry.com/projects/"
echo
echo "Next domain step:"
echo "  Connect dnwilkinson.com and www.dnwilkinson.com to Hosting site '$DOUG_SITE'."
echo "  Connie can choose a custom property domain later; bellavista.web.app is ready now."
echo
