#!/bin/bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "Use only a newly rolled Stripe secret key. Never reuse the key pasted into chat."
echo "Firebase will prompt securely for STRIPE_SECRET_KEY."
npx --yes firebase-tools@15.24.0 functions:secrets:set STRIPE_SECRET_KEY \
  --project shareshuffle-c7f96

echo "Now paste the whsec_ signing secret from the live Stripe Dashboard webhook endpoint."
npx --yes firebase-tools@15.24.0 functions:secrets:set STRIPE_WEBHOOK_SECRET \
  --project shareshuffle-c7f96

echo "Stripe secrets are stored in Google Secret Manager, not in this repository."
