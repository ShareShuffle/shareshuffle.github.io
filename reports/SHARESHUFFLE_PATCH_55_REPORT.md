# ShareShuffle Patch 55 — Status/title/punctuation polish

Build: `2026.06.19-amazon-gp-title-guard-57`

## Purpose
Improve mobile feedback while links resolve, previews load, images cache, and shares are created. Also tighten Amazon title extraction and preserve punctuation such as `?!` / `!?` in notes and generated cards.

## Changes
- Added animated status pills with pulse + `/ — \\ |` ticker and elapsed dots for preview/create workflows.
- `Paste Product Link` now shows visible progress while resolving clipboard/Amazon/a.co links.
- `Create Share Link` now shows visible progress while creating the share and looking for/caching backup images.
- Improved Amazon title extraction from JSON-ish fields and image/title/aria attributes when mobile Amazon pages hide normal metadata.
- Fixed punctuation cleanup across app and social card generation so `sounds?!` does not become `sounds? !`.
- Kept ShareShuffle/Shuffle branding and RGBY network-node icon direction.

## Test notes
- Test on iPhone Safari/PWA with an `a.co` link.
- Expected: first paste may trigger iOS clipboard permission; second tap should paste and show a progress status.
- Expected: preview status animates while title/image lookup runs.
- Expected: if Amazon title is available anywhere in page metadata/attributes, Title should fill.
- Expected: notes containing `?!` or `!?` render without inserted spaces.
