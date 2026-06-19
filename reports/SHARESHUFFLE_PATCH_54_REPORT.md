# ShareShuffle Patch 54 — Paste, Amazon title, and image-rescue polish

Build: `2026.06.19-amazon-gp-title-guard-57`

## Fixes

- Mobile **Paste Product Link** no longer focuses/selects the URL field before reading the clipboard, which could move focus to the wrong field on iOS.
- If clipboard access fails but a URL is already in the Product URL field, ShareShuffle now uses that existing URL instead of stopping.
- Amazon preview extraction now also checks JSON-LD/product-title patterns before falling back, improving cases where an Amazon image returns but the title does not.
- Title-based image rescue no longer replaces a likely-good store image just because older preview candidates exist. This prevents broad searches like “Trippy Retro Bluetooth Speaker” from swapping in unrelated Mickey/Rayelland speaker images after the correct Amazon product image is already present.
- Note punctuation cleanup now preserves `?!` / `!?` without introducing a weird space.

## Notes

This is a hosted app/functions patch only. Chrome extension package remains the Patch 50 MV3 clean upload package unless Chrome rejects again.
