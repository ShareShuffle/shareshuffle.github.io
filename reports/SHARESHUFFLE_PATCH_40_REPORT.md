# ShareShuffle Patch 40 Report — No Blank Fallback

## Build
`2026.06.17-no-blank-fallback-40`

## Problem
Guitar Center and similar retailers can provide image URLs that appear usable in the browser but fail when ShareShuffle or iMessage tries to cache/render them. Earlier patches improved detection and copy, but the final card could still show a white/blank product-image box or a title tile inside the product-image slot.

## Decision
Treat the ShareShuffle fallback as a **card state**, not as an uploaded image.

The fallback should be rendered directly by the social card generator. It should not be uploaded into the share image cache and then placed inside the product-image frame.

## Changes
- Added `placeholder-card` as a real image state in the create flow.
- Placeholder choice no longer generates a client-side data URL as a product image.
- If image caching fails, the share document is updated with `imageStatus: "placeholder-card"` and `imageSource: "placeholder-after-cache-fail"`.
- `getShareImageBuffer()` now returns no product image for placeholder-card shares, forcing the social card generator to render its designed fallback panel.
- `/i-{id}` now returns a designed square fallback image when the share has no usable cached product image, instead of redirecting to the old no-product-image SVG.
- Share/shelf data now suppresses placeholder image URLs so shelves do not treat placeholders as real product images.

## Acceptance Criteria
- No final share card should display `Image not added yet`.
- No final share card should show a blank white product image box when no real image works.
- No ShareShuffle-generated card image should be recursively used as the product image inside another card.
- If Brave/Guitar Center image caching fails, the share should still complete with a polished fallback.
- Chrome extension package remains untouched while review is pending.

## Test Plan
1. Open `https://shareshuffle.com/app/?v=40`.
2. Paste a Guitar Center product URL that previously failed image lookup.
3. Let preview run and/or pick a backup image if offered.
4. Create the share.
5. Send the generated shfl.me link in iMessage.
6. Confirm the preview is either a real cached product image or a designed ShareShuffle fallback card.

## Notes
This patch is intentionally small and defensive. It does not replace the Brave Image Rescue feature; it prevents the card pipeline from showing failure states when Image Rescue cannot deliver a cacheable image quickly.
