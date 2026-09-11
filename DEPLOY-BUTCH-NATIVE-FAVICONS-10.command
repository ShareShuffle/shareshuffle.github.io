#!/bin/bash
set -euo pipefail

REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
STAMP="20260714T185955Z"

cd "$REPO"

echo "Validating Butch's handwritten B favicon set..."
for FILE in   "sites/breger/favicon-16x16-$STAMP.png"   "sites/breger/favicon-24x24-$STAMP.png"   "sites/breger/favicon-32x32-$STAMP.png"   "sites/breger/favicon-64x64-$STAMP.png"   "sites/breger/favicon-128x128-$STAMP.png"   "sites/breger/favicon-256x256-$STAMP.png"   "sites/breger/icon-512-$STAMP.png"   "sites/breger/favicon-$STAMP.ico"   "sites/breger/site-$STAMP.webmanifest"; do
  test -f "$FILE"
done

grep -q "favicon-16x16-$STAMP.png" sites/breger/index.html
echo "PASS: native and generated favicon files are ready"

echo
echo "Deploying The Butch Breger Museum..."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy   --only hosting:breger   --project shareshuffle-c7f96

echo
echo "Opening both museum addresses in Safari..."
open -a Safari "https://breger.web.app/?favicon=$STAMP"
open -a Safari "https://butchbreger.com/?favicon=$STAMP"
