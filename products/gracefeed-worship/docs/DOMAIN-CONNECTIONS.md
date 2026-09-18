# Shared feature proposal: Connect a subdomain

Requested during the Worship build. Intended consumers: Gracefeed and Solution Workshop. **This is a design brief, not an installed capability. No DNS records or existing product repositories were changed.**

## Experience

Choose a site → enter a subdomain → connect its DNS provider → review the exact record changes → apply → watch DNS and HTTPS readiness. Support Namecheap for applicable Gracefeed domains and GoDaddy for `solutionworkshop.com`, after checking authoritative nameservers. A registrar is not necessarily the DNS host.

## Shared service

A server-only domain service with Firebase Hosting adapter and DNS provider adapters (`Namecheap`, `GoDaddy`). Products call a common API rather than sharing provider credentials. Tenant ownership and approved domain suffixes constrain each operation. Secrets live in Secret Manager; no DNS credentials enter browser storage.

Suggested API: `POST /domain-connections/plan`, `POST /domain-connections/:id/apply`, `GET /domain-connections/:id/status`. Plan records contain the target site/hostname, provider, current records hash, exact additions/replacements, and expected validation records. Apply requires owner authorization and approval of that exact plan; it rechecks existing records to catch drift before writing. Polling reports separate DNS ownership, routing and certificate states. Success means the actual requested HTTPS address serves the expected site.

Firebase's Hosting API registers custom domains and returns required DNS updates. The DNS adapter applies those records. Firebase does not obtain control of an external registrar merely because it hosts the website.

## Provider details

- Namecheap requires API eligibility and an allowlisted IPv4 source address. A serverless deployment needs a configured static outbound IP, such as VPC/NAT egress. `getHosts` retrieves the zone; `setHosts` replaces the full host-record set. Preserve every unrelated record, including MX/TXT and email configuration. Save a pre-change snapshot, check for concurrent edits, and refuse to overwrite drift. Namecheap has no atomic compare-and-swap, so document the remaining race and serialize app-originated updates.
- GoDaddy provides DNS operations and currently documents Personal Access Token authentication alongside legacy keys. Check this account's actual eligibility and scopes; use record-type/name-scoped updates where supported. Do not assume registration at GoDaddy means its nameservers are authoritative.
- Never guess a Firebase CNAME/A target. Use returned required DNS updates, including verification TXT records. Preserve the apex site and email records. Do not automatically delete conflicting records without including them in the approved change plan.

## Bounded first release

One existing domain at a time; subdomains only; Firebase Hosting only; no purchases, renewals, transfers, apex migrations or nameserver changes. Start with a dry-run plan for `worship.gracefeed.com`. Verify authoritative DNS, account/API access and the Firebase target before implementation is enabled against a live zone.

Sources checked September 17, 2026: [Firebase Hosting API](https://firebase.google.com/docs/reference/hosting/rest), [Namecheap DNS API](https://www.namecheap.com/support/api/methods/domains-dns/), [Namecheap whole-zone update semantics](https://www.namecheap.com/support/api/methods/domains-dns/set-hosts/), [Namecheap API access](https://www.namecheap.com/support/api/intro/), [GoDaddy authentication](https://developer.godaddy.com/en/docs/api-users/auth), [GoDaddy DNS operations](https://developer.godaddy.com/en/docs/references/rest/domains/v1).
