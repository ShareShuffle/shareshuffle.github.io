# ShareShuffle Patch 56 — Amazon title recovery

Build: `2026.06.19-amazon-gp-title-guard-57`

## Problem
On iPhone/Safari, Amazon `a.co` links could resolve to a full Amazon URL and return correct product images, but the Title field stayed empty because server-side metadata/title extraction missed Amazon mobile/AW page title locations.

## Fix
- Added broader Amazon title candidate extraction from visible title blocks, mobile/AW title fields, escaped state blobs, `aria-label`, `alt`, and stripped visible text.
- Added title scoring to prefer product-like titles and reject Sponsored/review/deal/navigation copy.
- Added query-param fallback for Amazon URLs where available.
- Preserved Patch 55 animated status and punctuation fixes.

## Notes
This does not guarantee Amazon will always expose title text to server fetches, but it makes the common “image found, title empty” case much less likely.
