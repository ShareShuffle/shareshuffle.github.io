SHARESHUFFLE HOTFIX — 2026.06.12-short-host-share-image-22

Patch: short-host-share-page-redirect-and-image-route

Why:
- https://shfl.me/share.html?id=jt8v6 is an app-page URL on the short-link domain.
- shfl.me should be the public short/preview host; the actual app pages should open on shareshuffle.com.
- The share page also needs to avoid old saved merchant image URLs that can be tiny transparent/1x1 pixels.

What changed:
- share.html now redirects if loaded on shfl.me or shelfmix.com:
    https://shfl.me/share.html?id=jt8v6
  becomes:
    https://shareshuffle.com/share.html?id=jt8v6
- share.html now loads product art through:
    https://shareshuffle.com/i-{id}
  so the image-rescue route can correct bad old images.
- No Chrome-review route is removed.
- Includes the prior shelf syntax fix file too.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-short-host-share-image-22/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shfl.me/share.html?id=jt8v6"
  open "https://shareshuffle.com/share.html?id=jt8v6"
  open "https://shareshuffle.com/i-jt8v6"
