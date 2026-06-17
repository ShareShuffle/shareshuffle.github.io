# ShareShuffle Patch 41 Report — URL Title + Image Refresh

## Build
`2026.06.17-url-title-image-refresh-41`

## Problem
Guitar Center used-product pages can expose weak metadata. In the observed case, the app filled the title with only the brand, “Toms Line Engineering,” even though the URL contained the complete product name. Because Image Rescue searched only the weak title, Brave returned random Tom's Line pedals instead of the Bass Limiter.

## Product principle
Keep the flow “easier than share” and “don't make me think.” The user should not need to know that the URL slug contains better metadata or that changing the title should trigger a new image search.

## Changes
- Added URL-slug title extraction in the app.
- Added weak-title detection: brand-only or prefix-only titles lose to fuller product names in the URL.
- Used URL-derived product identity for Image Rescue queries when the page title is weak.
- Added automatic Image Rescue refresh after title edits when the current image state is missing, placeholder-based, or already from Image Rescue.
- Updated function-side `titleFromRetailUrl()` to strip `.gc` and score product-like slug segments higher.
- Updated function-side preview logic to replace weak retail titles with URL-derived titles.

## Acceptance Criteria
- The Guitar Center Bass Limiter URL should produce a specific product title, not just a brand.
- Brave candidate images should be searched with the fuller product identity.
- Changing the title to include the real item should automatically refresh candidates.
- Existing Patch 40 placeholder-card protection remains intact.
- Chrome extension package remains untouched while review is pending.

## Test Plan
1. Deploy hosting/functions.
2. Open `https://shareshuffle.com/app/?v=41`.
3. Paste the Guitar Center Bass Limiter URL.
4. Confirm the title is fuller than “Toms Line Engineering.”
5. Confirm backup image search uses the fuller product query.
6. Edit the title to add or change “Bass Limiter.”
7. Confirm the image chooser refreshes automatically.
8. Create the share and send the shfl.me link in iMessage.
9. Confirm the card shows either a real cached image or the clean fallback card.
