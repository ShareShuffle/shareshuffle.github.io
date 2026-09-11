#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

PROJECT_ID="shareshuffle-c7f96"
SITE_ID="charlierw"
FIREBASE="npx --yes firebase-tools@15.24.0"

echo "Validating Charlie photo Patch 21..."
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

const required = [
  "charlie-r-williams-hero-candid",
  "charlie-r-williams-story-candid",
  "charlie-r-williams-focused",
  "charlie-r-williams-character",
  "Focused. Playful. Charlie."
];
for (const value of required) {
  if (!html.includes(value)) throw new Error(`Missing Patch 21 marker: ${value}`);
}

console.log(`Validated ${new Set(localRefs).size} local asset references.`);
NODE

echo "Resetting the Charlie Hosting target to the existing charlierw site..."
$FIREBASE target:clear hosting charlie --project "$PROJECT_ID" >/dev/null 2>&1 || true
$FIREBASE target:apply hosting charlie "$SITE_ID" --project "$PROJECT_ID"

echo "Deploying Charlie's new photos..."
$FIREBASE deploy --only hosting:charlie --project "$PROJECT_ID"

echo "Patch 21 complete."
open -a Safari "https://${SITE_ID}.web.app/?patch21=$(date +%s)"

