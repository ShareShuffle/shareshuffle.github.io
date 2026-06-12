SHARESHUFFLE PATCH — 2026.06.12-shelf-card-picker-14

Patch: shelf-social-card-image-picker-loading-fix

What changed
- Added /shelfCard OG/Twitter image generation for ShelfMix shelf links. Shelf links now get a polished 1200x630 card made from up to 9 shelf item images.
- Added a /app/ image picker when getPreview finds several plausible product images. The user can choose the best image before saving.
- getPreview now returns an images[] candidate list in addition to image.
- Made shelf.html more resilient: it queries by handle and shelf slug, de-dupes results, times out instead of hanging forever, and keeps the page from getting stuck on Loading shelf.
- Kept the click flow: shelf cards open share pages; share cards open store pages.

Apply:
  ditto -x -k "/Users/richwilliams/Downloads/shareshuffle-shelf-card-picker-14.zip" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

After deploy, test:
  https://shelfmix.com/shelf.html?u=rich&s=bass-gear
  https://shelfmix.com/rich/bass-gear
  https://shelfmix.com/shelfCard?u=rich&s=bass-gear
