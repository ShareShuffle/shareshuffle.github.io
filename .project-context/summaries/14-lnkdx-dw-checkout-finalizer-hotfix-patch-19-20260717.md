# Patch 19 — LNKDX DW checkout finalizer hotfix

Date: 2026-07-17

## Trigger

Doug Wilkinson attempted to claim `LNKDX.COM/DW` with the `FOUNDER99` promotion code. Stripe returned to the LNKDX success page with "Payment received," but visiting `/DW` still showed the old unclaimed two-character message:

> The public claiming system is coming soon.

This suggested that the Stripe discount/checkout succeeded, but the LNKDX Park record had not been activated from the webhook yet.

## Fix

- Added `lnkdxFinalizeCheckout`, exposed as `/api/park-finalize`.
- The finalizer accepts a Stripe Checkout Session ID from the success URL, retrieves it server-side with the Stripe secret, and activates the Park if Stripe reports `payment_status=paid` or `payment_status=no_payment_required`.
- Existing activation safeguards still apply: the session metadata must contain the Park slug and reservation ID, and the Firestore Park record must match the pending checkout reservation unless it is already active for the same subscription.
- The LNKDX success page now calls `/api/park-finalize` automatically.
- Unclaimed two-character paths such as `/DW` now jump back to the Park claim form and re-check availability instead of saying the public claiming system is coming soon.

## Operations note

If Doug's original Checkout Session ID is still available in the success URL or Stripe Dashboard, Patch 19 can finalize it after deployment:

```bash
curl -X POST https://lnkdx.com/api/park-finalize \
  -H "content-type: application/json" \
  -d '{"sessionId":"cs_live_REPLACE_ME"}'
```

If the Checkout Session ID is unavailable, manually inspect Firestore `lnkdxParks/DW` and Stripe Events for the completed checkout/webhook failure.
