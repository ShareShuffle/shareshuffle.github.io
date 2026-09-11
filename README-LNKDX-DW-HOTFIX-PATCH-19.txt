Patch 19 is the Doug/DW checkout activation hotfix.

What it fixes:

- Adds /api/park-finalize, a public Stripe-session finalizer for completed LNKDX Park checkouts.
- The success page now calls /api/park-finalize with Stripe's Checkout Session ID and activates the Park immediately when Stripe reports paid or no_payment_required.
- /DW-style unclaimed Park pages no longer say the claiming system is coming soon. They jump to the Park claim form and re-check availability.

Why it matters:

If Stripe Checkout succeeds but the webhook is delayed, missing, or misconfigured, the old Patch 18 page could show "Payment received" while /DW still looked unclaimed. Patch 19 gives successful checkouts a second safe activation path.

Doug rescue after deployment:

1. Deploy this patch.
2. If Doug still has the Stripe success tab, refresh it.
3. If not, open Stripe Dashboard, find the completed Checkout Session or Payment for DW, copy the Checkout Session ID beginning with cs_live_.
4. Run:

curl -X POST https://lnkdx.com/api/park-finalize \
  -H "content-type: application/json" \
  -d '{"sessionId":"cs_live_REPLACE_ME"}'

5. Then test https://lnkdx.com/DW.

If that still fails, check Firebase Firestore:

- Collection: lnkdxParks
- Document: DW
- Expected active fields include status=active, displayName=Doug Wilkinson, linkedInUrl=<Doug's public LinkedIn URL>, stripeSubscriptionId=<sub_...>.

The FOUNDER99 promo code is not the likely failure point if Stripe displayed payment/success. This patch targets activation.
