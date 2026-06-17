# ShareShuffle Patch 45 — Preserve cached image on note/edit reshare

Build: `2026.06.17-preserve-cached-image-45`

## Problem
After a successful image-cached share, creating another share from the same form after adding only a note could downgrade to the ShareShuffle fallback/title card. The selected image field could contain an existing first-party `/i-{oldId}` route, but the image cache endpoint treated that as an invalid external image candidate.

## Fix
- App canonicalizes relative first-party image routes before sending them to `/uploadShareImage`.
- Function detects first-party image routes such as `/i-{id}` or `https://shfl.me/i-{id}`.
- Function clones the existing cached image bytes from the old share into the new share instead of round-tripping through a third-party host.
- New share still gets its own `/i-{newId}` image route.

## Philosophy
Once ShareShuffle has a good product image, note/title edits should not make the user think about images again.
