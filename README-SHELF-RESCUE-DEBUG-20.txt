SHARESHUFFLE PATCH — 2026.06.12-shelf-rescue-debug-20

Patch: shelf-rescue-visible-diagnostics

Purpose:
- Make https://shareshuffle.com/shelf.html?u=rich&s=bass-gear work or show exactly why it cannot.
- Keep Chrome-review no-user shelves working.
- Stop shelf.html from freezing silently on "Loading shelf...".

What changed in shelf.html:
- Adds a classic watchdog before the module script. If the Firebase module import never starts, the page shows "Shelf script did not start" instead of hanging.
- Logs visible shelf diagnostics into the page.
- Query order is now explicit:
  1. strict handleSlug + shelfSlug when u and s exist
  2. shelfSlug-only query, the Chrome-review path
  3. SDK collection scan fallback
  4. Firestore REST collection-list fallback
- If no items are found, the page shows the exact route and query attempts instead of only "No items yet."
- If anything errors, the page shows the error and debug log on-screen.

Compatibility:
- https://shareshuffle.com/shelf.html?s=bass-gear remains valid.
- https://shareshuffle.com/shelf.html?u=rich&s=bass-gear remains valid.
- Chrome extension no-user shelves remain valid.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-shelf-rescue-debug-20/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

After deploy:
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"
  open "https://shareshuffle.com/shelf.html?s=bass-gear"

If either still fails, the page should now tell us whether it is:
- module import failure
- Firestore SDK query failure
- REST/list permission failure
- zero matching docs
