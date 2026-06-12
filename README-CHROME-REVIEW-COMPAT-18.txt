SHARESHUFFLE PATCH — 2026.06.12-chrome-review-compat-18

Patch: chrome-review-backwards-compatible-routes

Goal
- Nail Chrome extension review by supporting the exact package behavior already submitted.
- Keep no-user shelves working.
- Keep old temporary @rich short routes working.
- Add clean future behavior without breaking review.

Compatibility matrix supported after this patch
1. Chrome-review no-user shelf:
   https://shareshuffle.com/shelf.html?s=bass-gear

2. New handled shelf:
   https://shareshuffle.com/shelf.html?u=rich&s=bass-gear
   https://shelfmix.com/rich/bass-gear  (with optional shelfmix router patch)

3. Legacy ShelfMix no-user shelf:
   https://shelfmix.com/bass-gear        (with optional shelfmix router patch)

4. Clean item share:
   https://shfl.me/abc12

5. Chrome-review / old temporary item share:
   https://shfl.me/@rich/bass-gear/abc12
   https://shfl.me/u/rich/bass-gear/abc12

What changed
- shelf.html queries by shelfSlug first, so Chrome-review no-user shelves load correctly.
- shelf.html still accepts handle routes but does not require handleSlug on old share docs.
- shelf.html has a fallback lookup and real error card instead of hanging.
- Copy Shelf keeps the legacy shareshuffle.com/shelf.html?s=... URL when no real handle exists.
- Copy Shelf upgrades to ShelfMix only when a real handleSlug is present.
- The future local extension source now creates clean shfl.me/{id} links, but the live public routers remain compatible with the already-submitted Chrome package.
- Optional shelfmix/shfl GitHub Pages routers preserve handle + shelf slug instead of collapsing routes.

Important Chrome review note
- Chrome reviewers are testing the submitted package, not this local extension source unless you upload a new Web Store package.
- This patch focuses on making the live site/backend compatible with that submitted package.

Apply main Firebase repo patch:
  ditto "/Users/richwilliams/Downloads/shareshuffle-chrome-review-compat-18/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Then deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Optional, only if these separate GitHub Pages repos are still live:
  ditto "/Users/richwilliams/Downloads/shareshuffle-chrome-review-compat-18/shelfmix.github.io" "/Users/richwilliams/Documents/GitHub/shelfmix.github.io"
  ditto "/Users/richwilliams/Downloads/shareshuffle-chrome-review-compat-18/shfl-me.github.io" "/Users/richwilliams/Documents/GitHub/shfl-me.github.io"
