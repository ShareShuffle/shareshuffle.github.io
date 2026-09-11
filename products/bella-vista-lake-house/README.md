# The Lake House at Bella Vista

A direct-owned marketing site for Connie Jaquess’s lakefront vacation home on Loch Lomond in Bella Vista, Arkansas.

## Public site

- Firebase Hosting target: `bellavista`
- Firebase Hosting site: `bellavista`
- Public directory: `sites/bella-vista-lake-house`
- Firebase URL and current canonical: `https://bellavista.web.app`
- Booking source: `https://www.vrbo.com/4798748ha`

## Booking model

The site owns the property story, gallery, and search presence. Vrbo remains the source of truth for live availability, rates, policies, secure payment, and verified reviews.

`sites/bella-vista-lake-house/site-config.js` contains:

- `bookingUrl`: current Vrbo listing.
- `directInquiryEmail`: intentionally blank. Add an approved address later to enable email inquiries.

Until a direct booking system is intentionally designed, the site must not imply that payment or reservation confirmation occurs on the site.

## Property-policy cautions

- The Vrbo copy reviewed for this patch contained inconsistent small-dog weight limits. The website therefore says small dogs may be considered with prior approval and tells guests to confirm current limits and fees with Connie.
- Bella Vista guest passes are described at a high level. Do not publish POA member numbers or automate guest submissions without an approved data-handling workflow.
- The Vrbo listing controls when pricing, policies, or availability differ from this site.

## Deployment

Run from the repository root:

```bash
bash DEPLOY-DOUG-BELLAVISTA-PATCH-23.command
```

