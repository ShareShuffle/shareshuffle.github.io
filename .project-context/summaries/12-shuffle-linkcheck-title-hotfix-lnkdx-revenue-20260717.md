# Patch 17 — Shuffle Link Check/Title Hotfix and LNKDX Revenue Decision

Date: 2026-07-17

## Shuffle fixes

- Fixed the link checker’s unsafe-by-default logic. Ordinary public Amazon product URLs now begin healthy and become cleanable when Shuffle removes clutter or applies its disclosed tag.
- Private cart, checkout, sign-in and account URLs remain unsafe.
- Replaced internal verdict language with customer language: Ready to share, Ready — Shuffle can clean it, Needs a closer look, and Do not share this link.
- Removed the website-embed detour from the mobile creator’s send-a-product flow.
- Rejected Amazon `/ref=...` path debris as a possible title in both client and Cloud Function preview parsing.
- Added a regression test using the same Adidas/Amazon URL shape that produced the July 17 screenshot.

## LNKDX revenue decision

Keep the universal three-character-or-longer LinkedIn mirrors free. The first paid product should be a renewable license for a scarce two-character LNKDX Park shortcut, not an ad interstitial and not the sale of a LinkedIn identity.

Recommended launch offer:

- Founding Park: $49/year for the first 100 paid names.
- Standard Park: $79/year after the founding allocation.
- CB remains permanently reserved, noncommercial, and unavailable for purchase.
- Claimants choose a two-character Park name and provide the public `linkedin.com/in/...` destination.
- LNKDX retains ownership/control of the shortcut and can suspend misleading, infringing, abusive, abandoned, or unpaid claims.
- Do not scrape or reproduce LinkedIn profile data and do not use LinkedIn logos.

## Lowest-maintenance checkout

Start with a Stripe subscription Payment Link. Stripe can collect the requested Park name and LinkedIn destination as required custom fields and can send `checkout.session.completed` to a webhook for automatic fulfillment. Do not publish a buy button until availability is checked atomically, or two people can pay for the same scarce name.

Implementation order:

1. Public availability check against `lnkdxParks`.
2. Short reservation hold before checkout.
3. Stripe Checkout/Payment Link session containing the selected Park metadata.
4. Verified webhook activates the Park only after successful payment.
5. Subscription cancellation or failed renewal enters a grace period before release.
6. Terms, privacy, refund/cancellation language, and a neutral independent-product disclaimer ship before checkout.

No payment credentials or unconfirmed price were embedded in this patch.
