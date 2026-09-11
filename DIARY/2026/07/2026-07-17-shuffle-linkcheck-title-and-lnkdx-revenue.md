# July 17, 2026 — Shoes for Jo, a False Unsafe Warning, and the First LNKDX Revenue Product

Rich pasted a normal Amazon Adidas product URL into Shuffle so he could send shoes to Jo. The creator displayed “Shuffle Link Check: unsafe” even though its explanation merely said the link did not already contain an Associate tag.

The root cause was a default-state bug: both link-check implementations initialized every result as unsafe. Normal Amazon product pages never promoted themselves before an early-return condition. Patch 17 changes the default to healthy while retaining explicit unsafe handling for cart, checkout, account, and sign-in links.

The same screenshot exposed a second bug. Amazon’s `/ref=...` path segment beat the real product slug in the URL-title scoring and became “Ref Sw Img...” in the title field. Both client and server title fallbacks now discard referral-path debris.

The mobile UI now speaks in user terms rather than internal compliance labels, and the unrelated website-embed action is gone from the share flow.

For LNKDX, the first revenue product is defined as a recurring two-character Park shortcut license. Free mirrors stay free and direct. No interstitial advertising is introduced. The recommended launch price is $49/year for the first 100 paid names, then $79/year. Payment activation still requires an availability hold plus verified payment webhook; no unverified checkout link belongs on the public site.
