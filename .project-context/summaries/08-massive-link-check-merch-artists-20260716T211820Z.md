# 2026-07-16 — Massive Shuffle Link Check, Museum Merch and Route 66 Artist Community Update

## Source of truth
Built from the user-uploaded current repository archive `shareshuffle.github.io 2.zip`, not from an older patch.

## Shuffle Link Check
- Added reusable `/assets/link-check.js`.
- Detects malformed/private Amazon URLs, shortened Amazon links, search/brand pages, missing ASINs, tracking clutter and existing Associate tags.
- Preserves another publisher's existing tag.
- Adds `shareshuffle-20` only when code runs on an approved Tempo/ShareShuffle-owned hostname.
- Leaves unknown external embeds untagged unless their own tag is supplied.
- Never auto-redirects to Amazon; buttons are direct visible Amazon links.
- Adds link-level commission language when ShareShuffle monetization is applied.
- Avoids price, ratings, reviews, availability and shipping claims.
- Added public Cloud Function `/linkCheck` for shared rule-based analysis.
- Added visible Link Check assistance inside the Shuffle mobile creator.

## Reusable product embeds
- Added `/embed.js` with standard, compact and feature card layouts.
- Added `/embed/` builder for publisher-owned images and direct destinations.
- The builder explains that publishers remain responsible for rights, disclosures, Associates registration and current terms.
- Added central `merch/butch-shirts.json` status records.
- Pending product cards point to the exact submitted Amazon brand-search URL and clearly say the listings are under review.
- Central card records can later be changed from `pending` to `live` with specific Amazon listing URLs.

## Museum merch
- Added three distinct placements to The Butch Breger Museum:
  1. Birthday Donkey featured card on gray.
  2. Movie Star Dog standard card on yellow.
  3. Mirror Pig compact card on red.
- Mockups are explicitly labeled illustrative; the submitted artwork remains the actual product art.
- Added legal/affiliate disclosures and no fabricated Amazon data.

## Eternal Route 66
- Added a smaller Movie Star Dog museum-shop promotion.
- Links back to the complete Butch museum shop section.
- Uses the same central Shuffle embed infrastructure.

## Route 66 Artist Community
- Added Bob Waldmire, Bob “Crocodile” Lile and Chuck Williams / Eternal Route 66.
- Bob Waldmire uses a CC BY-SA 2.0 Wikimedia image of his Route 66 van, with author/license attribution and official catalog link.
- Bob Lile uses a Williams-family Cadillac Ranch photograph and official Lile Art Gallery link. A portrait is intentionally withheld until permission is documented.
- Chuck Williams is the featured family favorite, using Williams-family media and the Eternal Route 66 site.
- No Bob Waldmire map image or Crocodile Lile portrait was copied from a copyrighted commercial site without permission.

## Media separation
- Added `tools/SPLIT-MEDIA-REPO.command`; it backs up and COPIES large assets into `tempo-foundry-media` without pruning the live repo.
- Added `tools/ZIP-CODE-FOR-CHAT.command` for routine lean conversation handoffs.
- Added `tools/ZIP-MEDIA-FOR-CHAT.command` for image/archive work.
- Pruning and cloud-storage migration remain a later verified step; public URLs are not broken in this patch.

## Compliance posture
This is a conservative implementation based on Amazon Associates rules reviewed in July 2026. It is not legal advice. Amazon terms can change. The configuration is designed to preserve existing attribution, avoid tag insertion on unrelated sites, use direct links, show disclosures, and avoid unlicensed Amazon Program Content.

## Amazon shirt status
The three Butch designs were submitted to Amazon Merch on Demand and are pending review. Their Amazon brand is exactly:
`The Ernest Lee "Butch The Barn Man" Breger Museum`

## Next steps after approval
1. Record each ASIN and live URL.
2. Update `merch/butch-shirts.json` and `embed.js` records from `pending` to `live`.
3. Keep the exact brand wording.
4. Order samples and inspect print legibility.
5. Confirm every affiliate-bearing domain is listed in Associates Central.
6. Continue rights/provenance research before expanding the commercial catalog.
