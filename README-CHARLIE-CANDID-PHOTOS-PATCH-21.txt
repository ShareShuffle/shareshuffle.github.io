TEMPO FOUNDRY PATCH 21 — CHARLIE R. WILLIAMS CANDID PHOTO REFRESH

What this changes
=================

- Replaces the original polished headshots with the four photos Charlie selected.
- Uses IMG_0483 as the lead portrait, IMG_0497 as the story image, IMG_0317 as the focused gallery portrait, and IMG_0306 as the playful character image.
- Reworks portrait crops and gallery wording so the casual photos feel intentional on desktop and mobile.
- Uses new filenames so Firebase's immutable image cache cannot leave the old headshots visible for a week.
- Publishes optimized JPEG/WebP sizes with all embedded image metadata removed.
- Removes the twelve now-unused optimized copies of the former headshots from the published site directory. They remain recoverable from Patch 20 if ever needed.

Apply and deploy
================

1. Copy/merge this patch into:

   ~/Documents/GitHub/shareshuffle.github.io

2. Double-click:

   DEPLOY-CHARLIE-PHOTOS-PATCH-21.command

   The script uses npx, so a global firebase command is not required. It clears any stale Charlie Hosting target, reconnects that target only to the existing charlierw site, validates the page and deploys it.

3. Open:

   https://charlierw.web.app

No Firebase Console or DNS changes are required for this photo-only patch.

Image placement
===============

- Hero: IMG_0483 — candid white-shirt portrait
- Story: IMG_0497 — Charlie with the dinosaur character
- Gallery / Focused: IMG_0317 — red-shirt close portrait
- Gallery / In character: IMG_0306 — taco character hat
- Gallery / Out in the wild: IMG_0497 — dinosaur image repeated from the story

The original uploads are not published. Only resized, renamed, metadata-free copies are included.
