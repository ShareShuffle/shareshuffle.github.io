# ShareShuffle Patch 57 — Amazon GP Title Guard

Build: `2026.06.19-amazon-gp-title-guard-57`

## Problem
An Amazon mobile/a.co preview could resolve and return good image candidates but still fill the title as `Gp`, because the fallback URL-title parser treated Amazon path plumbing such as `/gp/aw/d/...` as a product-like slug.

## Fix
- Rejects very short auto-generated titles such as `Gp`, `Aw`, `Dp`, `D`, and similar route fragments.
- Adds explicit Amazon route-fragment filtering for `gp`, `aw`, `dp`, `d`, `ref`, `sp`, `nav`, `node`, `hz`, and store/navigation segments.
- Cleans final preview titles before returning them from `/getPreview`.
- Adds a conservative fallback such as `Bluetooth Speaker` only when Amazon provides a usable image but no clean title.
- Adds matching client-side guardrails so stale/junk titles do not populate or persist in the mobile app.

## Expected behavior
The same Amazon/a.co speaker flow should no longer create cards titled `Gp`. If Amazon still hides the full title, the app should leave title blank or use a useful generic fallback like `Bluetooth Speaker`, not URL route fragments.
