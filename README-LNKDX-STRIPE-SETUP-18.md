# LNKDX Park Stripe launch setup — Patch 18

Patch 18 contains no Stripe keys. Do not place a secret key in source code, GitHub, `config.js`, a ZIP, or chat.

## 1. Secure the Stripe account

The original live secret was pasted into chat on July 17, 2026. Roll or revoke it in Stripe before doing anything else. Use the replacement only in Firebase Secret Manager.

Stripe business description:

> Tempo Foundry builds and operates independent web utilities and digital publishing projects. LNKDX provides renewable short-link licenses that redirect customers’ chosen two-character shortcuts to their public professional profile URLs. We do not sell social-media accounts, profile ownership, or user data.

Recommended public settings:

- Business/product name: `LNKDX Park by Tempo Foundry`
- Statement descriptor: `LNKDX PARK`
- Website: `https://lnkdx.com`
- Terms: `https://lnkdx.com/terms`
- Privacy: `https://lnkdx.com/privacy`
- Product category: software / online business services / URL-shortcut subscription, whichever current Stripe wording most closely matches

## 2. Configure recurring billing

In Stripe Billing settings:

1. Enable automatic customer emails for successful payments, failed payments, expiring cards, and upcoming renewals.
2. Enable Smart Retries and Stripe revenue recovery.
3. Activate the no-code customer portal.
4. Allow customers to update payment methods, view/download invoices, and cancel at the end of the current annual period.
5. Copy the no-code portal login URL into `sites/lnkdx/config.js` as `customerPortalUrl`. Customers will authenticate there with their billing email and a one-time passcode.

The code creates the correct annual recurring price inside each secured Checkout Session:

- Two letters or two numbers: $49 founding / $79 standard per year.
- One letter plus one number: $24.50 founding / $39.50 standard per year.
- Founding pricing is transactionally limited to the first 100 paid/held Park names.

## 3. Create the webhook endpoint

In Stripe Developers → Webhooks, add:

`https://lnkdx.com/api/stripe-webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Reveal and retain the endpoint signing secret beginning with `whsec_`. Never use a Stripe CLI webhook secret for the live Dashboard endpoint.

## 4. Store secrets from Terminal

Run from the current repository:

```bash
cd ~/Documents/GitHub/shareshuffle.github.io

npx --yes firebase-tools@15.24.0 functions:secrets:set STRIPE_SECRET_KEY \
  --project shareshuffle-c7f96

npx --yes firebase-tools@15.24.0 functions:secrets:set STRIPE_WEBHOOK_SECRET \
  --project shareshuffle-c7f96
```

Each command prompts securely. Use the replacement `sk_live_...` key for the first and the Dashboard endpoint `whsec_...` signing secret for the second.

## 5. Test before live sales

The safest launch is to repeat the setup in Stripe test/sandbox mode first, deploy, and buy an unclaimed test Park with a Stripe test card. Verify:

1. Checkout shows the correct premium or mixed price.
2. Successful payment changes the Firestore Park status to `active`.
3. `https://lnkdx.com/XY` redirects to the submitted public profile.
4. A second checkout cannot buy the same Park.
5. Canceling or abandoning checkout releases the hold after about 30 minutes.
6. The customer portal sends its one-time email code and shows the subscription.

Then replace the two Firebase secrets with their live-mode equivalents and redeploy the four Stripe/LNKDX functions.

## 6. Tax and policy review

Patch 18 does not silently enable Stripe Tax. Review Texas and other applicable registration/collection obligations before enabling automatic tax. The included terms and privacy notice are practical launch drafts and should be reviewed for the business before accepting live payments.
