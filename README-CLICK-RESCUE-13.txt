SHARESHUFFLE PATCH — 2026.06.12-click-rescue-13

Patch: click-flow-image-rescue-display-name

What changed
- Added real-time image rescue for missing share images. If /i-{id} has no cached image, the function now retries metadata lookup from the merchant page and caches a better image when found. This helps shelves recover from "Image not added yet" states on the next request.
- Shelf cards are now clickable: clicking the image/title/card body opens the Share page.
- Share page primary content is now clickable: clicking the image/title/note/card body opens the original store page. Buttons still work normally.
- Share/Shelf SMS and email text now uses the cleaner ShareShuffle message format with the full https://shfl.me/{id} URL on the final line for better preview reliability.
- Shelf display names now preserve user-entered capitalization where available (for example SS stays SS for display, while URLs/slugs remain lowercase).
- /app/ last-share panel now gives a clearer "what next" hint and scrolls into view after creation.
- Build markers bumped across static and functions.

Apply
Folder form:
  ditto "/Users/richwilliams/Downloads/shareshuffle-click-rescue-13" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Zip form:
  ditto -x -k "/Users/richwilliams/Downloads/shareshuffle-click-rescue-13.zip" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Then deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules
