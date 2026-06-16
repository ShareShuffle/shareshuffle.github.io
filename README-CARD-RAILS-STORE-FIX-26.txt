SHARESHUFFLE PATCH — 2026.06.12-card-rails-store-fix-26

Patch: controlled-shelf-cards-and-store-url-fix

Why:
- Shelf cards had cool editorial energy but looked unpredictable/unhinged.
- Share page "View Product" could loop back to ShareShuffle instead of merchant when a share doc had a hosted URL in data.url.

What changed:
- Shelf cards now have rails:
  - fixed image crop window
  - consistent card body height
  - clamped title/note text
  - stable button row
  - predictable but still editorial image focus
- Server /shareData and /shelfData now prefer real merchant URLs:
  originalUrl/storeUrl/productUrl/merchantUrl before url
- Hosted ShareShuffle/shfl/shelfmix URLs are rejected as store destinations.
- share.html and shelf.html also defend on the client side against hosted URLs.
- Keeps server-backed share and shelf loading.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-card-rails-store-fix-26/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"
  open "https://shareshuffle.com/share.html?id=zhcaa"
  open "https://shareshuffle.com/shareData?id=zhcaa"
