# ShareShuffle Patch 52 — Brand Reset + Network Icons

Build: `2026.06.18-brand-reset-network-icons-52`

## Why
Patch 49/48 moved the hosted app too far into Shelzo. Rich wants to pause name exploration and return to the stable product language:

- Formal/normal brand: **ShareShuffle**
- Casual share label: **Shuffle**
- Short link identity: **SHFL.ME**
- Collection feature: **Shelves** / share-a-shelf, not ShelfMix as a public top-level brand

## Changes
- Replaced user-facing Shelzo references with ShareShuffle or Shuffle as appropriate.
- Restored the RGBY network-node iconography from the pre-Shelzo icon set.
- Rebuilt favicon, apple-touch-icon, ICO, SVG, and webmanifest around the network-node icon.
- Removed ShelfMix from the homepage nav/positioning and replaced with Shelves.
- Lightened homepage hero/header font weight.
- Updated demo card copy to say `Shared via Shuffle:`.
- Left repo/Firebase/domain technical names unchanged.

## Not included
- Chrome extension package changes. Patch 50 clean MV3 zip remains the Chrome resubmission package.
- Final renaming decisions. Name exploration stays outside the deployed app until committed.
