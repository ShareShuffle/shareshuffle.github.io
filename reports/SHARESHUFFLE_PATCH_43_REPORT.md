# ShareShuffle Patch 43 Report — First-party Firestore Image Cache

## Build
2026.06.17-firestore-image-cache-43

## Problem observed
A selected image candidate appeared correct in the app, but `/uploadShareImage` timed out. The created share completed, but the social preview card used the designed fallback/title card instead of the selected product image.

The app field still displayed a third-party image URL such as specialtytraders.com or i.ebayimg.com. The desired behavior is that the final card image path should be first-party ShareShuffle, e.g. `/i-{shareId}` and `/c-{shareId}`, not a third-party host.

## Fix
- Normalize fetched/uploaded images to compressed JPEG via `sharp` before caching.
- Try Firebase Storage first.
- If Storage bucket write fails, save a compact base64 cache on the Firestore share doc.
- Update the share doc image field to `/i-{shareId}` after successful cache.
- Read Firestore cached image bytes before Storage/external fetches.
- Increase the browser upload wait from 9s to 24s and function timeout to 35s.
- Update static build marker to 43.

## Expected behavior
For Guitar Center used pedals and similar cases:
- App can still use external candidates for selection.
- On Create Share Link, the chosen candidate is copied into a ShareShuffle-controlled cache.
- iMessage should pull `/c-{shareId}` from shfl.me/shareshuffle, and the card should include the cached product image when caching succeeds.
- If all image caching fails, fallback card remains clean and non-broken.

## Backlog entries
- SS-056 — Done — First-party Firestore image cache fallback when Storage is missing/failing.
- SS-057 — Done — Update share image field to `/i-{shareId}` after caching.
- SS-058 — Done — Extend image cache wait window for user-selected image candidates.
- SS-059 — Future — Add background retry queue for slow third-party image hosts.
