# Patch 18 — LNKDX Park Stripe subscriptions and live Butch Museum merchandise

Date: 2026-07-17

## LNKDX Park pricing

- Three-character-or-longer LinkedIn mirrors remain free and direct.
- Two-letter or two-number Park names are premium: $49/year founding, then $79/year.
- Mixed letter-number Park names are half-price: $24.50/year founding, then $39.50/year.
- Founding pricing applies to the first 100 paid or transactionally held Park names.
- Existing noncommercial founder reservations remain unchanged. CB remains permanently reserved and noncommercial.

## Stripe/Firebase architecture

- Added public availability checks with stale-hold cleanup.
- Added transactional 31-minute holds before Stripe Checkout, preventing duplicate sales.
- Added server-created Stripe subscription Checkout Sessions; the browser cannot choose or alter the charged price.
- Added raw-body HMAC webhook verification with a five-minute timestamp tolerance.
- Added activation only after confirmed payment, idempotent event handling, annual renewal updates, failed-payment grace, cancellation grace, and eventual release.
- Added Stripe customer/subscription mapping without storing card data.
- Added Firebase Secret Manager bindings for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; no keys are stored in source.
- Added a no-code customer-portal link slot in `sites/lnkdx/config.js`.

## Public LNKDX pages

- Added Park pricing, availability, profile destination, terms consent, and secured Checkout UI.
- Added `/terms` and `/privacy` launch drafts.
- Added Stripe success/cancel feedback.
- Direct profile redirects remain free of advertising interstitials.

## Security incident

A live Stripe secret was pasted into chat during setup. It is not present in any source file or patch. It must be rolled/revoked and replaced before launch. The replacement must be entered only through Firebase Secret Manager.

## Approved Butch Museum merchandise

User-confirmed mapping:

- Birthday Donkey — `B0H968Y4DP`
- Movie Star Dog — `B0H98Q41TW`
- Mirror Pig — `B0H96JQMF9`
- Complete Museum shop — user-provided Amazon brand collection URL

All four are now live ShareShuffle ad records. The Museum and Eternal Route 66 copy no longer says pending or under review. The central collection ad uses a three-image collage and direct, visible Amazon destinations with the existing Associate disclosure logic.

## Required account setup before deployment

1. Roll the exposed live Stripe secret.
2. Configure Stripe business identity, email receipts, Smart Retries, and the no-code customer portal.
3. Add `https://lnkdx.com/api/stripe-webhook` with the documented events.
4. Store the replacement `sk_live_...` and endpoint `whsec_...` values using the included secret-configuration command.
5. Paste the no-code customer portal URL into `sites/lnkdx/config.js`.
6. Review the terms, privacy, refund, and tax posture before accepting live payments.

