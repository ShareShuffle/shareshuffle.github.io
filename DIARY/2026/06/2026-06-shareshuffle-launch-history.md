# June 2026 — ShareShuffle Launch History

## Confirmed milestones

- `shareshuffle.com` was purchased May 30, 2026.
- Firebase project: `shareshuffle-c7f96`.
- Blaze pay-as-you-go billing was enabled June 9, 2026.
- Google Search Console verification and indexing work occurred in early/mid June.
- Firestore-rule deployments through GitHub Actions failed repeatedly and were handled manually while the project architecture stabilized.
- The Chrome extension experienced multiple review cycles:
  - keyword-spam concerns involving merchant names;
  - affiliate-disclosure concerns;
  - Manifest V3 remotely hosted code concerns;
  - eventual public publication as version 0.1.2 around June 20, 2026.

## Product direction

ShareShuffle became the main sharing utility inside Tempo Foundry. Its purpose is to rescue awkward or ambiguous links, create usable cards and shelves, preserve the user’s intended destination, and eventually support compliant affiliate monetization.

Important concepts established during this period:

- Share Rescue
- Image Rescue
- shelf and card generation
- `shfl.me` short links
- Chrome-extension product detection
- preserving existing affiliate attribution
- avoiding hidden or deceptive redirects
- merchant-specific handling for Amazon, Walmart, Target, Best Buy, and eBay

## Permanent lessons

1. Affiliate disclosure must be prominent and explicit.
2. Manifest V3 cannot depend on remotely hosted executable code.
3. Search and merchant pages are unreliable server-scraping targets; browser/DOM rescue or approved APIs are safer.
4. A visible, understandable destination is more valuable than a clever but opaque redirect.
