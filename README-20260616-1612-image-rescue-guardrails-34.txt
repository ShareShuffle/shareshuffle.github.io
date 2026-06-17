ShareShuffle Patch 34 — Image Rescue Guardrails

Build: 2026.06.16-image-rescue-guardrails-34
Scope: hosting + functions only. Does not touch the Chrome extension package.

What changed:
- /imageRescue now asks Brave for a larger candidate pool, then server-tests/caches candidates.
- Returns the first 5 usable ShareShuffle-hosted rescue image URLs instead of raw third-party image URLs.
- Adds /rimg-{id} route for cached rescue images.
- App filters recursive ShareShuffle social-card images so a card is never used inside another card.
- App calls imageRescue with count=50 and shows only usable backup choices plus the placeholder.
- Shelf social card copy now uses ShareShuffle / shfl.me instead of ShelfMix.

Required secret:
- BRAVE_SEARCH_API_KEY must already be set with:
  npx firebase-tools@latest functions:secrets:set BRAVE_SEARCH_API_KEY

Apply:
PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-20260616-1612-image-rescue-guardrails-34"
ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cat version.txt
grep -R "rescueImage\|imageRescue" functions firebase.json app
npx firebase-tools@latest deploy --only hosting,functions

Test:
curl -s "https://shareshuffle.com/imageRescue?q=markbass%20mini%20distortion%20bass" | python3 -m json.tool
Open https://shareshuffle.com/app/?v=34
