ShareShuffle patch: 2026.06.11-amazon-image-10

Purpose:
- Fix Amazon preview images that were becoming a tiny white pixel/dot.
- Reject product page URLs, tracking pixels, spacer images, transparent GIFs, logos, icons, and tiny image variants as product images.
- Parse Amazon product page HTML for real m.media-amazon.com / images-na.ssl-images-amazon.com product gallery images, including data-a-dynamic-image, hiRes, large, imageGalleryData, and colorImages.initial patterns.
- Prefer real Amazon media URLs such as https://m.media-amazon.com/images/I/...jpg.
- Keep the /c-{id} generated card route and /i-{id} raw image route from the card refactor.

Deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Check:
  https://shareshuffle-c7f96.web.app/_status

Expected build:
  2026.06.11-amazon-image-10
