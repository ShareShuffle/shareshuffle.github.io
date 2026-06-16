SHARESHUFFLE HOTFIX — 2026.06.12-amazon-affiliate-safe-27

Patch: restore-amazon-affiliate-tag-without-overwrite

Why:
- The last store URL fix correctly stopped ShareShuffle links from looping back to ShareShuffle.
- But Amazon store URLs could lose Rich's Amazon Associate tag.

What changed:
- Server-side chooseStoreUrl now adds:
    tag=shareshuffle-20
  to Amazon URLs only when no tag already exists.
- It does not overwrite existing Amazon tags.
- Client-side share.html and shelf.html include the same safety fallback.
- No route/card/loading behavior was otherwise changed.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-amazon-affiliate-safe-27/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shareData?id=zhcaa"
  open "https://shareshuffle.com/share.html?id=zhcaa"

In shareData, Amazon URLs should include:
  tag=shareshuffle-20
unless the source URL already had a different tag.
