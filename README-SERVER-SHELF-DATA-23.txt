SHARESHUFFLE HOTFIX — 2026.06.12-server-shelf-data-23

Patch: server-backed-shelf-page

Why:
- /shelf.html?s=bass-gear must work for the Chrome extension review.
- The browser Firebase module path has been fragile and could die before diagnostics rendered.
- The Apple-only mobile meta warning was still present.

What changed:
- Added a public server endpoint: /shelfData?s=bass-gear&u=rich
- Added a Firebase Hosting rewrite for /shelfData.
- Replaced shelf.html's Firebase browser module with a plain script that fetches /shelfData.
- This keeps both:
    https://shareshuffle.com/shelf.html?s=bass-gear
    https://shareshuffle.com/shelf.html?u=rich&s=bass-gear
  working without direct browser Firestore queries.
- Added <meta name="mobile-web-app-capable" content="yes"> alongside Apple's meta.
- Keeps Chrome-review no-user shelves compatible.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-server-shelf-data-23/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shelfData?s=bass-gear"
  open "https://shareshuffle.com/shelf.html?s=bass-gear"
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"
