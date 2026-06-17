ShareShuffle Patch 44 — Share Text Polish

Build: 2026.06.17-share-text-polish-44aa

This hosted-only patch follows the successful Patch 43 image cache test. It trims note whitespace/accidental outer quotes, preserves internal quotes, improves card note truncation, and only says "Image cached" after the first-party /i-{id} route responds with image bytes.

Deploy: npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Chrome extension package is intentionally unchanged while Chrome review is pending.
