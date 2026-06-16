SHARESHUFFLE PATCH — 2026.06.12-editorial-shelf-crop-24

Patch: intentional-editorial-crop-and-dedupe

Why:
- The accidental hot zoom looks modern and premium, but the product images were allowed to make cards comically tall.
- /shelf.html?s=bass-gear and /shelf.html?u=rich&s=bass-gear must remain Chrome-review safe.
- Duplicate items make the shelf look broken.

What changed:
- Keeps editorial cropped product images as the default.
- Constrains image windows to a fixed responsive height:
    desktop: about 260–430px
    mobile: about 240–360px
- Cards now have consistent body/content sizing.
- Missing-image placeholders match the same editorial card system.
- Adds lightweight front-end de-dupe by normalized title/url/image.
- Keeps server-backed /shelfData from patch 23.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-editorial-shelf-crop-24/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shelf.html?s=bass-gear"
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"
