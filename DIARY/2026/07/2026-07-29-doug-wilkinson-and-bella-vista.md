# Doug Wilkinson and Bella Vista join Tempo Foundry

**Date:** July 29, 2026  
**Patch:** 23

## What was requested

Add two portfolio properties to the existing Tempo Foundry Firebase multisite repository:

1. A professional site for Douglas N. Wilkinson, including an `/on-fractured-ground/` project page.
2. A direct-owned marketing site for Connie Jaquess’s Lake House at Bella Vista.

Firebase Hosting sites `dnwilkinson` and `bellavista` already existed in project `shareshuffle-c7f96` and were waiting for their first release.

## Decisions

### Douglas N. Wilkinson

- Use `DNWilkinson.com` as the writer/actor umbrella and `/on-fractured-ground/` as the screenplay’s permanent project route.
- Present the credit as “Screenplay by Douglas N. Wilkinson” and “Based on an unpublished novel by Richard C. Williams.”
- Describe the adaptation honestly: Douglas retained important characters, community, predicament, and destination, then rebuilt the material as a substantially new feature screenplay.
- Publish a spoiler-light logline, project details, and verified competition recognition—not the full screenplay or private contact information.

### The Lake House at Bella Vista

- Build an owner-controlled story and gallery site while keeping Vrbo as the current source of truth for dates, prices, policy changes, secure checkout, and reviews.
- Lead with what differentiates the property: a large five-bedroom/five-bathroom home, room for thirteen, private Loch Lomond access and dock, family-friendly gathering spaces, and Connie’s hospitality.
- Use careful pet language because the current Vrbo material contained conflicting weight limits.
- Do not expose Bella Vista POA member details or pretend direct booking is active.

## Repository changes

- Added `sites/dn-wilkinson`.
- Added `sites/bella-vista-lake-house`.
- Added Firebase Hosting targets `dnwilkinson` and `bellavista`.
- Added both properties to `config/tempo-properties.json`.
- Added both cards to Tempo Foundry’s home and project directory.
- Restored the missing Shops for Miles card in the complete project directory and added its product README.
- Corrected Solution Workshop so Hosting site `sol-wx` is deployed from the shared Firebase project `shareshuffle-c7f96`.
- Added `DEPLOY-DOUG-BELLAVISTA-PATCH-23.command`.

## Open work

- Connect `dnwilkinson.com` and `www.dnwilkinson.com` to Hosting site `dnwilkinson`.
- Choose and connect a custom domain for Connie’s property when she is ready.
- Add an approved direct-inquiry email to the lake-house config if Connie wants email leads.
- Build direct availability, agreements, payment, and Bella Vista guest-pass workflows only after the operating and privacy requirements are settled.

