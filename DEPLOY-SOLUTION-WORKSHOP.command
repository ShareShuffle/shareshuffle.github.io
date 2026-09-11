#!/bin/bash
set -euo pipefail
export FIREBASE_CLI_DISABLE_UPDATE_CHECK=1

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ID="shareshuffle-c7f96"
SITE_ID="sol-wx"
TARGET_NAME="solutionworkshop"

firebase_cli() {
  npx --yes firebase-tools@15.24.0 "$@"
}

cd "$REPO_DIR"

echo
echo "SOLUTION WORKSHOP — PATCH 22 DEPLOY"
echo "Repository: $REPO_DIR"
echo "Firebase project: $PROJECT_ID"
echo "Hosting site: $SITE_ID"
echo

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required. Install the current Node.js LTS release, then run this file again."
  exit 1
}

command -v npx >/dev/null 2>&1 || {
  echo "npx is required. It is included with current Node.js installations."
  exit 1
}

echo "1/7 Validating the local patch..."
node -e '
  const fs = require("fs");
  const firebase = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
  const firebaserc = JSON.parse(fs.readFileSync(".firebaserc", "utf8"));
  const properties = JSON.parse(fs.readFileSync("config/tempo-properties.json", "utf8"));
  const hosting = Array.isArray(firebase.hosting) ? firebase.hosting : [firebase.hosting];
  const target = hosting.find((entry) => entry && entry.target === "solutionworkshop");
  if (!target || target.public !== "sites/solution-workshop") {
    throw new Error("firebase.json does not contain the isolated Solution Workshop hosting target.");
  }
  const mappedSites = firebaserc.targets?.["shareshuffle-c7f96"]?.hosting?.solutionworkshop || [];
  if (!mappedSites.includes("sol-wx")) {
    throw new Error(".firebaserc is missing the Solution Workshop hosting target.");
  }
  if (!properties.properties || !properties.properties.solutionworkshop) {
    throw new Error("Tempo property registry is missing Solution Workshop.");
  }
  [
    "sites/solution-workshop/index.html",
    "sites/solution-workshop/site-config.js",
    "sites/solution-workshop/favicon.svg",
    "sites/solution-workshop/robots.txt",
    "sites/solution-workshop/sitemap.xml"
  ].forEach((file) => {
    if (!fs.existsSync(file)) throw new Error("Required file is missing: " + file);
  });
'

if ! grep -q 'https://solutionworkshop.com/' sites/solution-workshop/index.html; then
  echo "The canonical Solution Workshop domain is missing from the page."
  exit 1
fi

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
if ! PROJECT_LIST="$(firebase_cli projects:list 2>/dev/null)"; then
  echo
  echo "Firebase projects could not be read with the currently signed-in account."
  echo "Run this file again and complete Firebase sign-in when prompted."
  exit 1
fi
grep -Fq "$PROJECT_ID" <<<"$PROJECT_LIST" || {
  echo
  echo "Firebase project '$PROJECT_ID' was not found in the currently signed-in account."
  echo "Run this file again after signing in with an account that can access that project."
  exit 1
}

echo "4/7 Confirming the Hosting site..."
SITE_LIST="$(firebase_cli hosting:sites:list --project "$PROJECT_ID" 2>/dev/null || true)"
if ! grep -Fq "$SITE_ID" <<<"$SITE_LIST"; then
  echo "Hosting site '$SITE_ID' was not found. Creating it in project '$PROJECT_ID'..."
  firebase_cli hosting:sites:create "$SITE_ID" --project "$PROJECT_ID"
fi

echo "5/7 Repairing the local target mapping..."
firebase_cli target:clear hosting "$TARGET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1 || true
firebase_cli target:apply hosting "$TARGET_NAME" "$SITE_ID" --project "$PROJECT_ID"

echo "6/7 Deploying Solution Workshop..."
firebase_cli deploy --only "hosting:$TARGET_NAME" --project "$PROJECT_ID"

echo "7/7 Publishing the Solution Workshop card on Tempo Foundry..."
firebase_cli deploy --only hosting:tempo --project "$PROJECT_ID"

echo
echo "SOLUTION WORKSHOP DEPLOYED"
echo
echo "Firebase URL:"
echo "  https://sol-wx.web.app"
echo "  https://tempofoundry.com/projects/"
echo
echo "Custom domains to connect to Hosting site '$SITE_ID':"
echo "  solutionworkshop.com  (canonical)"
echo "  www.solutionworkshop.com"
echo "  solwx.com             (short domain; page redirects to canonical)"
echo "  www.solwx.com"
echo
echo "Firebase will show the DNS records required for each domain."
echo
