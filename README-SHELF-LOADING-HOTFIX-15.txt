SHARESHUFFLE HOTFIX — 2026.06.12-shelf-loading-hotfix-15

Patch: shelf-loading-firebase-version-and-pretty-route

Why:
- shelf.html was stuck at Loading shelf.
- The shelf page in patch 14 referenced Firebase CDN version 12.14.0, while the rest of the app uses 10.12.5. If that import fails, the module never runs and the shelf stays frozen.
- The explicit shelfmix.com/shelf.html?u=rich&s=bass-gear URL also looked wrong/confusing even when it was technically routed.

What changed:
- shelf.html now uses Firebase 10.12.5 like the rest of ShareShuffle.
- shelf.html now replaces shelfmix.com/shelf.html?u=rich&s=bass-gear in the address bar with /rich/bass-gear after load starts.
- shelf loading now has a fallback client-side scan if the targeted Firestore query fails or returns nothing.
- shelf loading now shows a real error card instead of hanging forever.
- build markers updated.

Apply folder form first, since Rich's Mac often auto-unzips downloads:
  ditto "/Users/richwilliams/Downloads/shareshuffle-shelf-loading-hotfix-15" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Then deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules
