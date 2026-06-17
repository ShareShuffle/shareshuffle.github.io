ShareShuffle Patch 35 — Image Rescue Preview Candidates

Purpose:
- Fix Patch 34 being too strict and returning 0 usable images after attempting to cache every Brave result up front.
- /imageRescue now returns the first 5 obvious-good Brave image URLs as preview candidates for the chooser.
- The selected image is cached through uploadShareImage when the share is created.
- This keeps the UI from showing no images just because server-side pre-caching rejected everything.

Install:
PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-20260616-1630-image-rescue-preview-35"
ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cat version.txt
grep -R "preview-candidates\|imageRescue" functions firebase.json app
npx firebase-tools@latest deploy --only hosting,functions

Test:
curl -s "https://shareshuffle.com/imageRescue?q=markbass%20mini%20distortion%20bass&debug=1" | python3 -m json.tool

Expected:
- ok true
- mode preview-candidates
- usable > 0
- images contains raw preview candidates

Note:
- This patch does not touch the Chrome extension package.
