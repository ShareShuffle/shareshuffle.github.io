# Patch 49 — ShareShuffle user-facing rename

Build: 2026.06.17-shareshuffle-user-facing-rename-49

Purpose:
- Rename hosted user-facing product language from ShareShuffle/Shuffle to ShareShuffle.
- Use the approved share text prefix: `Rich shared via Shuffle:`.
- Keep technical infrastructure names unchanged, including Firebase project `shareshuffle-c7f96`, repo folder `shareshuffle.github.io`, domain `shareshuffle.com`, and short domain `shfl.me`.
- Do not touch the Chrome extension package while Chrome review is pending.

Notes:
- This is a hosted app/functions/metadata rename patch, not a Chrome package update.
- Existing historical reports and archived notes may still reference ShareShuffle for history.
