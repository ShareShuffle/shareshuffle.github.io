# July 16, 2026 — Massive Patch 13

## Scope

Patch 13 was the largest integrated ShareShuffle/Tempo Foundry update to date. It added:

- Shuffle Link Check
- Amazon-link and affiliate-compliance rules
- ShareShuffle product/embed builder
- three distinct Butch Museum merchandise placements
- a smaller Eternal Route 66 merchandise placement
- Route 66 Artist Community content
- repository/media-splitting tools
- expanded project-memory and handoff documentation

## Shuffle Link Check rules

The feature checks for malformed, private, session-bound, misleading, cluttered, or ambiguous links and offers help rather than silently changing the user’s intent.

Amazon handling:

1. Existing affiliate tag: preserve it.
2. No tag on an approved ShareShuffle/Tempo-owned domain: ShareShuffle may add its own tag with clear disclosure.
3. Unknown third-party site with no publisher tag: do not silently monetize.
4. Use direct visible Amazon destinations rather than hidden affiliate redirects.
5. Do not display Amazon prices, ratings, reviews, delivery claims, or copied Program Content without an authorized mechanism.

This protects the Associates account while allowing legitimate revenue where the rules permit it.

## Deployment history

The first combined deployment passed patch validation but failed while Firebase analyzed Functions. The generic error concealed the real cause:

`EACCES` executing `functions/node_modules/.bin/firebase-functions`.

The fix was to remove and reinstall `functions/node_modules`, restore executable permissions, and redeploy.

Successful results:

- Butch Breger Museum hosting deployed
- Eternal Route 66 hosting deployed
- ShareShuffle hosting deployed
- `linkCheck` Node.js 22 second-generation function deployed

## Media-repository decision

The working repository had become large because of full-resolution artwork, photos, `node_modules`, Firebase cache files, and Git history. The chosen direction:

- keep deployable code and lightweight display assets in `shareshuffle.github.io`;
- create `tempo-foundry-media` for originals, corrected masters, printable files, large photos, mockups, and archival material;
- eventually use Firebase Storage or another object-storage layer for stable public media URLs;
- routine chat handoffs should use a lean code ZIP excluding `.git`, `node_modules`, `.firebase`, and other generated folders.
