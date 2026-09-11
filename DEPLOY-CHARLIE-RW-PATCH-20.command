#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

PROJECT_ID="shareshuffle-c7f96"
SITE_ID="charlierw-c7f96"
FIREBASE="npx --yes firebase-tools@15.24.0"

echo "Validating Charlie R. Williams Patch 20..."
node - <<'NODE'
const fs = require("fs");
const path = require("path");

JSON.parse(fs.readFileSync("firebase.json", "utf8"));
JSON.parse(fs.readFileSync(".firebaserc", "utf8"));
JSON.parse(fs.readFileSync("sites/charlie-rw/site.webmanifest", "utf8"));

const root = "sites/charlie-rw";
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = fs.readFileSync(path.join(root, "site-config.js"), "utf8");
new Function(config);

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1].trim())
  .filter(Boolean)
  .filter((script) => !script.startsWith("{"));
scripts.forEach((script) => new Function(script));

const localRefs = [...html.matchAll(/(?:src|href)="(\/(?!\/)[^"?#]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => ref !== "/");
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const candidate of match[1].split(",")) {
    localRefs.push(candidate.trim().split(/\s+/)[0]);
  }
}
for (const ref of localRefs) {
  const file = path.join(root, ref.replace(/^\//, ""));
  if (!fs.existsSync(file)) throw new Error(`Missing local asset: ${ref}`);
}

if (!html.includes("Before the credits, there is the work.")) {
  throw new Error("Charlie story copy is missing");
}
if (!html.includes("Parent managed") || !html.includes("Parent-managed")) {
  throw new Error("Parent-management disclosure is missing");
}
console.log(`Validated ${new Set(localRefs).size} local asset references.`);
NODE

echo "Checking Firebase Hosting site..."
if ! $FIREBASE hosting:sites:list --project "$PROJECT_ID" 2>/dev/null | grep -q "$SITE_ID"; then
  echo "Creating Firebase Hosting site $SITE_ID..."
  $FIREBASE hosting:sites:create "$SITE_ID" --project "$PROJECT_ID"
fi

echo "Applying hosting target..."
$FIREBASE target:apply hosting charlie "$SITE_ID" --project "$PROJECT_ID"

echo "Deploying CharlieRW.com..."
$FIREBASE deploy --only hosting:charlie --project "$PROJECT_ID"

echo "Patch 20 complete."
open -a Safari "https://${SITE_ID}.web.app/?patch20=$(date +%s)"
