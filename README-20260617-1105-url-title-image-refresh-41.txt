# ShareShuffle Patch 41 — URL Title + Image Refresh

## Build
2026.06.17-url-title-image-refresh-41

## Why
A Guitar Center used product page returned only the brand as the preview title. That weak title caused Brave Image Rescue to search for the brand instead of the item, producing random Tom's Line pedal images.

Example URL:
https://www.guitarcenter.com/Used/Toms-Line-Engineering/Used-Toms-Line-Engineering-BASS-LIMITER-Bass-Effect-Pedal.gc?pfm=krecs+122313424+31259+GCWPLP

The product identity is available in the URL slug even when the retailer page metadata is weak.

## Changes
- Added product-title extraction from retailer URL slugs in the web app.
- Added Guitar Center, Musician's Friend, Sweetwater, and Reverb to messy share-text URL extraction.
- Preview flow now treats short brand-only titles as weak when the URL slug contains a fuller product title.
- Image Rescue query now prefers the URL-derived product title when the preview title is weak.
- Editing the title automatically refreshes backup image candidates when the current image state is missing, placeholder, or image-rescue based.
- Server getPreview now strips `.gc` and similar extensions from retailer slugs and falls back to URL-derived titles when page titles are weak.
- Build marker updated to 2026.06.17-url-title-image-refresh-41.

## Acceptance
- Guitar Center URL above should fill a title like “Used Toms Line Engineering BASS LIMITER Bass Effect Pedal” rather than only “Toms Line Engineering.”
- Brave Image Rescue should search the product identity, not just the brand.
- If the sender edits the title to add “Bass Limiter,” backup images should refresh automatically without a new mental step.
- Chrome extension package remains untouched during review.

## Deploy
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io" && npm --prefix functions install && npx firebase-tools@latest deploy --only hosting,functions
