# Patch 59 — Open Buttons Internal Routes

Build: `2026.06.19-open-buttons-internal-routes-59`

## Problem
The Open and Open Shelf buttons could still do nothing in iOS PWA / WKWebView contexts after Patch 58.

## Fix
- Convert Open Share to same-origin `/share.html?id=...` whenever a share id exists.
- Convert Open Shelf to same-origin `/shelf.html?u=...&s=...` or `/shelf.html?s=...`.
- Add delegated capture click handling so button clicks are caught even if mobile WebKit swallows the anchor default behavior.
- Use `window.location.href` for reliable same-context navigation.

## Chrome
No Chrome extension package changes.
