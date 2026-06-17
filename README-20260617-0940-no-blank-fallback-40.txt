ShareShuffle Patch 40 — No Blank Fallback
Build: 2026.06.17-no-blank-fallback-40
Created: 2026-06-17 09:40 CDT

Purpose
- Fix the white/blank product image box that could appear when Guitar Center/Walmart-style image lookup failed.
- Treat the ShareShuffle fallback as a card-rendering state, not as an uploaded product image.
- Prevent the client from uploading a title/placeholder tile into the product image slot.
- Ensure /i-{id} returns a designed square fallback when a share has no cached product image.
- Keep /c-{id} social cards using a designed left-panel fallback when no product image is available.

Changed files
- app/index.html
- functions/index.js
- assets/build-info.json
- version.txt
- ShareShuffle_Product_Backlog_2026-06-16.txt
- ShareShuffle_Product_Backlog_2026-06-16.xlsx
- reports/SHARESHUFFLE_PATCH_40_REPORT.md
- reports/SHARESHUFFLE_NEW_CHAT_HANDOFF_20260617.md

Deploy
PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-20260617-0940-no-blank-fallback-40"
ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cat version.txt
grep -R "no-blank-fallback-40\|placeholder-card\|makeSquareFallbackPng" app functions assets version.txt
npx firebase-tools@latest deploy --only hosting,functions

Smoke tests
https://shareshuffle.com/status.html?v=40
https://shareshuffle.com/app/?v=40
curl -s "https://shareshuffle.com/imageRescue?q=markbass%20mini%20distortion%20bass&debug=1" | python3 -m json.tool

Expected result
- New Guitar Center share should never show "Image not added yet".
- If no real product image can be cached, the final iMessage/OG card should show a designed ShareShuffle recommendation card rather than a blank white product image box.
- The user can still pick a Brave candidate; if it fails to cache, fallback is clean and fast.
