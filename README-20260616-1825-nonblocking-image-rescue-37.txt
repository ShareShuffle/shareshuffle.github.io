# ShareShuffle Patch 37 - Nonblocking Image Rescue

Build: 2026.06.16-nonblocking-image-rescue-37

This patch keeps Patch 36 but fixes the case where Guitar Center/Walmart image URLs are technically present but unreliable for final share cards.

Changes:
- Treat raw Guitar Center/Musician's Friend/Walmart merchant images as risky auto-preview images.
- If an auto-preview image is risky, clear it and call Image Rescue instead.
- Filter same-merchant bot-hostile image candidates from Image Rescue results.
- Add an 8s timeout to the Image Rescue candidate request.
- Add a 9s timeout to image caching so Create Share Link does not feel frozen.
- Fall back to a designed ShareShuffle card if caching fails.

Chrome extension package is untouched.
