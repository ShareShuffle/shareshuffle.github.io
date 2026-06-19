# ShareShuffle Patch 53 — Hyphen-only public URLs

Build: `2026.06.18-hyphen-only-public-urls-53`

## What changed

- Public handles and shelf slugs are constrained to lowercase letters, numbers, and hyphens.
- Dots, underscores, slashes, backslashes, and encoded slashes are rejected for public handle URLs.
- Shelf names are slugified into clean hyphen-only slugs, so `Silk Flowers`, `silk_flowers`, and `silk.flowers` become `silk-flowers`.
- Public route parsing rejects `%2F` / `%5C` path segments instead of silently accepting encoded slash/backslash paths.
- App handle helper copy now says: letters, numbers, hyphens only; no dots or underscores.
- Existing short share IDs such as `shfl.me/a2c4e` continue to work.

## Product rule

ShareShuffle never intentionally generates `%2F` in public URLs. Public UI should show canonical paths like `/rich/silk-flowers`, not encoded slash paths.
