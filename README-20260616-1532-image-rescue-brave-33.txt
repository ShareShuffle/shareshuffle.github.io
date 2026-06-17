ShareShuffle Patch 33 — Image Rescue / Brave
Patch ID: 20260616-1532-image-rescue-brave-33

This patch folder contains the patch files directly. Do NOT append /shareshuffle.github.io to the source path.

What it changes:
- Adds Firebase Function /imageRescue using secret BRAVE_SEARCH_API_KEY.
- Adds hosting rewrite for /imageRescue.
- Adds app-side Image Rescue UI that shows backup image candidates when product image lookup fails.
- Includes a designed ShareShuffle placeholder option so the app does not show a big blank/no-image tile.
- Keeps Chrome extension package untouched.

Apply:

PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-20260616-1532-image-rescue-brave-33"

ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

cat version.txt
grep -R "imageRescue" app functions firebase.json
grep -R "Pick a backup image" app

Set secret if you have not already:

npx firebase-tools@latest functions:secrets:set BRAVE_SEARCH_API_KEY

Deploy hosting and functions:

npx firebase-tools@latest deploy --only hosting,functions

Test after deploy:

curl -s "https://shareshuffle.com/imageRescue?q=markbass%20mini%20distortion%20bass"

Open:
https://shareshuffle.com/app/?v=33

If you need to roll back static files only, re-apply Patch 32 and deploy hosting only.
