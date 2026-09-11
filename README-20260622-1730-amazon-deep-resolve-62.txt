ShareShuffle Patch 62 — Amazon deep resolve
2026-06-22

Goal
- Make Amazon/a.co/amzn.to preview resolution keep diving until it has the best available product title and image, instead of accepting a weak short-link or blocked-page result too early.

Changes
- Added fetchBestPreviewHtml() for getPreview and image-rescue paths.
- For Amazon links, ShareShuffle now follows normal redirects, meta refresh redirects, canonical URLs, og:url, ASINs found in URLs, and ASINs found inside HTML/state blobs.
- Tries both desktop and mobile Amazon product URLs:
  - https://www.amazon.com/dp/{ASIN}
  - https://www.amazon.com/gp/product/{ASIN}
  - https://www.amazon.com/gp/aw/d/{ASIN}
- Scores candidate previews by usable title, non-junk image, number of Amazon product images, and canonical amazon.com final URL.
- Stops early once a good title, image, and multiple image candidates are found.
- Fixed a tiny URL-title casing bug in titleFromAmazonUrl where a control-character regex slipped in instead of \b\w.
- Updated version.txt and assets/build-info.json to match the new patch.

Files changed
- functions/index.js
- version.txt
- assets/build-info.json
- README-20260622-1730-amazon-deep-resolve-62.txt

Verify
node --check functions/index.js
npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test URLs
- https://shareshuffle.com/status
- https://shareshuffle.com/app/?v=62

Suggested iPhone test
1. Paste an a.co or amzn.to product link.
2. Confirm the app resolves to an amazon.com final URL when possible.
3. Confirm Title is not blank/Gp/Aw/Dp/Product/Amazon.
4. Confirm image choices show product images and stay capped at six in the app UI.
5. Create the share and verify the card/image loads from the shfl.me share link.
