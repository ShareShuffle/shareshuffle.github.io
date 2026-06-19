# ShareShuffle / ShareShuffle Patch 51 — Mobile card polish

Build: `2026.06.18-brand-reset-network-icons-52`

## Why
Mobile screenshots showed two polish issues:

1. Generated iMessage/social cards could feel cramped, with long titles running too close to the card edge.
2. The mobile app form could retain stale blocked/junk titles such as `Blocked` or opaque page tokens after Clear, failed preview, or clipboard failure.

## Changes

- Tightened the 1200×630 generated card layout:
  - smaller/safe title typography
  - narrower title wrapping
  - smaller product image frame to give text more room
  - safer right margin for iMessage previews
  - cleaner note/merchant/url spacing
- Improved mobile app safe-area padding so the header sits lower under the iPhone status bar.
- Added better mobile form spacing at narrow widths.
- Added focused-field scroll assist so the keyboard does not strand fields under the viewport.
- Added `resetComposer()` so Clear/New Share fully reset title, URL, note, image, image candidates, preview status, and stale rescue state.
- Expanded blocked/junk-title detection for values like `Blocked`, `Robot or human?`, and opaque alphanumeric leaked page tokens.

## Backlog items covered

- SS-068 — Improve iMessage/social card spacing so title/note do not run off the card.
- SS-069 — Add safer responsive mobile layout spacing for the app builder.
- SS-070 — Fix iPhone safe-area top padding on `/app`.
- SS-071 — Make Clear fully reset stale title/image/status state.
- SS-072 — Prevent `Blocked` or junk fallback titles from sticking after failed paste/preview.

## Notes

This patch does not touch the Chrome extension package. Chrome MV3 resubmission should still use the separate clean upload zip from Patch 50.
