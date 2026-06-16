SHARESHUFFLE HOTFIX — 2026.06.12-server-share-data-25

Patch: server-backed-share-page

Why:
- https://shareshuffle.com/share.html?id=zhcaa was stuck on Loading.
- This is the same class of problem as shelf.html: browser-side Firebase loading is too fragile during review/testing.

What changed:
- Added /shareData?id=zhcaa server endpoint.
- Added /trackShareClick?id=zhcaa server endpoint.
- Added Firebase Hosting rewrites for both endpoints.
- Replaced share.html's Firebase browser module with a plain script that fetches /shareData.
- share.html still uses https://shareshuffle.com/i-{id} for image rescue.
- Keeps shfl.me short links and Chrome-review compatibility.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-server-share-data-25/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shareData?id=zhcaa"
  open "https://shareshuffle.com/share.html?id=zhcaa"
  open "https://shfl.me/zhcaa"
