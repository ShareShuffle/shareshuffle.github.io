# ShareShuffle New Chat Handoff — 2026-06-17

We are working on ShareShuffle, a Chrome extension + Firebase/hosting app for saving product recommendations, adding personal notes, creating short share links, and organizing recommendations into shelves.

## Domains / project
- Main brand: `https://shareshuffle.com`
- Short links: `https://shfl.me`
- Firebase project: `shareshuffle-c7f96`
- Local repo: `/Users/richwilliams/Documents/GitHub/shareshuffle.github.io`
- Extension item ID: `jmhhcbbmiphlapkekmdildhiaddbnjbm`

## Chrome review status
Chrome rejected once for affiliate disclosure. We resubmitted compliance-only changes in extension version 0.1.1. Do **not** upload a new extension package unless Chrome rejects again or approval clears. Hosted web/Firebase patches are okay.

## Product thesis
ShareShuffle should not just shorten links. It should help people **send the thing they meant to send**.

Important language:
- “Send the thing you meant to send.”
- “From messy link to clear recommendation.”
- “Paste anything. ShareShuffle finds the thing. You add why it matters. It sends clean.”
- “ShareShuffle turns messy copied links into intentional recommendations.”

## Current implemented themes
- Share Rescue: detects pasted search-result URLs and warns without scolding.
- Image Rescue: uses Brave Search API candidates when store image lookup fails.
- Pick the best image: user can choose from candidate images.
- Message-ready sharing: Copy URL, Copy Text, Share, Message, Email, Open, Open Shelf.
- Affiliate-aware: Amazon/Walmart links are handled with affiliate disclosure and URL rules.
- Server-backed shelf/share loading: `/shelfData` and `/shareData` avoid browser Firestore fragility.

## Current important build line
Patch 40 target build:
`2026.06.17-no-blank-fallback-40`

Patch 40 fixes the blank/white image problem by treating missing images as a card state rather than uploading a fake product image.

## Image Rescue history
- Google Custom Search was attempted but whole-web search could not be enabled because the setting is deprecated.
- Brave Search API was chosen instead.
- Secret name: `BRAVE_SEARCH_API_KEY`
- Function endpoint: `/imageRescue`
- `/imageRescue?q=markbass%20mini%20distortion%20bass&debug=1` returned real candidate images.
- Problem: Guitar Center/Walmart image URLs may still fail when cached or rendered in iMessage.
- Decision: search candidates are discovery only; final cards should use cached images or a designed ShareShuffle fallback.

## Patch 40 behavior
- If a product image works and caches, use it.
- If a Brave backup image is chosen and caches, use it.
- If image caching fails, set `imageStatus: "placeholder-card"`.
- Do not upload a fallback/title tile as the product image.
- Card generator renders a clean fallback panel directly.
- `/i-{id}` returns a square fallback image if the share has no usable product image.

## Current known issues / next backlog
- Need verify Patch 40 live with a new Guitar Center share.
- Need improve image picker timing: do not make creation feel frozen.
- Need add “Improve image” after share creation when fallback was used.
- Need clean up stale ShelfMix wording in shelf/profile copy.
- Need update status page to distinguish static build vs function build clearly.
- Need protect username namespace: random share IDs should not collide with future handles like `/rich`.
- Extension 0.1.2 after approval: Search Result Rescue / “Pick what you meant” from visible Amazon/YouTube results.

## Preferred patch workflow
Patch zips should be timestamped and unzip to a folder containing patch files directly:
`shareshuffle-patch-YYYYMMDD-HHMM-description-NN/`

Apply pattern:
```bash
PATCH_DIR="/Users/richwilliams/Downloads/shareshuffle-patch-YYYYMMDD-HHMM-description-NN"
ditto "$PATCH_DIR" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cat version.txt
npx firebase-tools@latest deploy --only hosting,functions
```

## Zip current repo for handoff
Use `zip`, not `ditto --exclude`, because this Mac's `ditto` does not support `--exclude`:
```bash
cd "/Users/richwilliams/Documents/GitHub"
STAMP=$(date +"%Y%m%d-%H%M")
ZIP="/Users/richwilliams/Desktop/shareshuffle-current-${STAMP}.zip"
zip -r "$ZIP" "shareshuffle.github.io" \
  -x "*/.git/*" \
  -x "*/node_modules/*" \
  -x "*/functions/node_modules/*" \
  -x "*/.firebase/*" \
  -x "*/firebase-debug.log" \
  -x "*/ui-debug.log" \
  -x "*/.DS_Store"
echo "$ZIP"
ls -lh "$ZIP"
```
