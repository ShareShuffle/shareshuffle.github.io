# July 17, 2026 — Doug's DW checkout exposes the activation gap

Doug Wilkinson tried to claim `LNKDX.COM/DW` with the big founder discount code. Stripe came back with the "Payment received" success state, but `/DW` still resolved like an unclaimed two-character Park name.

That failure was useful. It separated the money side from the activation side: if Stripe says payment was received, the promo code was not the interesting problem. The interesting problem was that LNKDX depended too heavily on the webhook to flip the Park record active.

Patch 19 adds a second safe activation path. When Stripe returns a customer to LNKDX with a Checkout Session ID, the page now asks the backend to retrieve that session from Stripe and activate the Park if the session is paid or no-cost. The webhook remains the normal system of record, but successful checkouts no longer have to wait on it.

The patch also retires the stale "public claiming system is coming soon" copy on two-character Park pages. If someone visits `/DW` and it is not active, they should be guided into the Park claim flow, not told the system is still hypothetical.
