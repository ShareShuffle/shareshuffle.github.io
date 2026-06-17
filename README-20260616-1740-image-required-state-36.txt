ShareShuffle Patch 36 — Image required state / merchant cleanup

Purpose:
- Stop final cards from showing “Image not added yet.”
- Add Guitar Center, Musician's Friend, Sweetwater, and Reverb merchant detection.
- Capitalize display names like Rich while keeping URL slugs lowercase.
- If the store image is missing at create time, try Brave image rescue once.
- If a rescue image cannot be cached, cache a designed ShareShuffle placeholder instead.
- If no rescue image exists, use a designed ShareShuffle placeholder instead of a blank box.

Apply:
PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-20260616-1740-image-required-state-36"
ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cat version.txt
grep -R "image-required-state\|Required image state\|Guitar Center" app functions assets version.txt
npx firebase-tools@latest deploy --only hosting,functions

Test:
https://shareshuffle.com/app/?v=36
Try a Guitar Center / Walmart link whose store image fails. The final iMessage card should use a backup image or a designed ShareShuffle card, never “Image not added yet.”
