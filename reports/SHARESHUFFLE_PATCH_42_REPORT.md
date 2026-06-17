# ShareShuffle Patch 42 — Image Cache Fallback

Build: `2026.06.17-image-cache-fallback-42`

## Why
Patch 41 improved product identity and image search for Guitar Center, but testing showed two additional failures:

- `/uploadShareImage` could fail with `The specified bucket does not exist.`
- The browser fallback update could hit Firestore `Missing or insufficient permissions`.
- Some image candidates loaded as blank/mostly-white images.

## Changes

- Server-side image fetch rejects blank/mostly-white/transparent images before using them in cards.
- `uploadShareImage` treats missing Storage bucket or Storage write failure as a graceful fallback state instead of a hard 500.
- On Storage failure, the function marks the share as `imageStatus=placeholder-card` using Admin Firestore and returns 200 so the app can finish.
- Browser fallback update no longer writes the `image` field directly after cache failure.
- Firestore rules allow image fallback maintenance fields if needed.
- Broken image candidates in Pick Best Image are hidden when the browser cannot load them.

## Expected behavior

A failed selected image or missing Storage bucket should no longer block share creation. The share should finish with either a valid cached image or a clean ShareShuffle fallback card.
