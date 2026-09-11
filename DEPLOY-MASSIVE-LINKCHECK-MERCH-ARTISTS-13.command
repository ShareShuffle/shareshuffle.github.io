#!/bin/bash
set -euo pipefail
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
cd "$REPO"

echo "Validating massive update..."
node --check functions/index.js
python3 - <<'PY2'
import json, pathlib
r=pathlib.Path('.')
json.load(open(r/'firebase.json'))
json.load(open(r/'merch/butch-shirts.json'))
for p in ['embed.js','embed/index.html','assets/link-check.js','sites/breger/index.html','sites/eternal-route66/index.html','app/index.html']:
 assert (r/p).exists(), p
print('PASS: JSON and files')
PY2

grep -q 'export const linkCheck' functions/index.js
grep -q 'data-shuffle-product="butch-birthday-donkey"' sites/breger/index.html
grep -q 'Route 66 Artist Community' sites/breger/index.html
grep -q 'butch-movie-star-dog' sites/eternal-route66/index.html

echo "Deploying Functions and affected Hosting targets..."
npx firebase-tools@latest use shareshuffle-c7f96
npx firebase-tools@latest deploy --only functions:linkCheck,hosting:shuffle,hosting:breger,hosting:eternalroute66 --project shareshuffle-c7f96

echo "Opening updated pages in Safari..."
open -a Safari "https://shareshuffle.com/app/?massive=20260716T211820Z"
open -a Safari "https://shareshuffle.com/embed/?massive=20260716T211820Z"
open -a Safari "https://butchbreger.com/#shop"
open -a Safari "https://butchbreger.com/#route66artists"
open -a Safari "https://eternalroute66.com/#butchMerch"
