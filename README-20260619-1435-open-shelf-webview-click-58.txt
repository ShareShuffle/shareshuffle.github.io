Patch 58 — Open Shelf WebView Click Fix

Build: 2026.06.19-open-shelf-webview-click-58

Fixes Open Shelf / Open Share buttons in iOS PWA and WKWebView contexts by removing reliance on target=_blank and routing clicks through same-context location.assign(). This is important for the new Apple app shell, where target blank links may not open unless a WKUIDelegate handles them.

Includes previous Patch 57 Amazon GP title guard behavior.
