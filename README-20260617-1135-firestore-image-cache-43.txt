# ShareShuffle Patch 43 — First-party Firestore image cache

Build: 2026.06.17-firestore-image-cache-43

This patch addresses a real GC/used-pedal test where the user selected a correct backup image, but uploadShareImage timed out and the final social card fell back to a title card.

Changes:
- Social cards and square product-image routes should use first-party ShareShuffle routes, not direct third-party image hosts.
- uploadShareImage now normalizes selected/candidate images with sharp before caching.
- If Firebase Storage bucket writes fail or the configured default bucket is missing, the function stores a compressed first-party image cache in Firestore on the share document.
- shareImage/cardImage read cachedImageBase64 before trying Storage or external URLs.
- Successful caching updates the share image field to /i-{shareId}.
- Client waits longer for image caching before falling back.
- Static build-info marker fixed to Patch 43, so /_build no longer shows static Patch 41 while functions show later patches.

Chrome extension package remains untouched during Chrome review.
