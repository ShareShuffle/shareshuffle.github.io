# July 16, 2026 — LNKDX.COM and LNKDX Park

## Origin

Rich was tired of typing a long LinkedIn profile URL. He changed his LinkedIn handle to `RCWX`, purchased `LNKDX.COM`, and defined the basic rule:

`LNKDX.COM/RCWX` → `linkedin.com/in/rcwx/`

DNS cannot transform a path into a LinkedIn subdirectory, so LNKDX uses the existing ShareShuffle Firebase backbone.

## Brand rules

- Brand is always written `LNKDX.COM` in all caps.
- User-entered profile paths may use whatever letter case the user wants.
- The service is independent and must not imply affiliation with LinkedIn.
- Direct redirects should remain immediate, with no countdown/interstitial advertising.
- The homepage and error/help screens may promote ShareShuffle.

## Routing model

### Three or more characters

Automatic free mirror; no account and no database record required.

`LNKDX.COM/RICHWILLIAMS` → `linkedin.com/in/richwilliams/`

### Exactly two letters or digits

Firestore-backed Park name.

Two-character Park names can point to a longer real LinkedIn profile and later support:

- editable destination
- durable QR code
- analytics
- account management
- optional professional card
- annual renewal

Initial founding price concept: $5 for the first year, with stronger paid tiers later.

## Seeded Park records

- `RW` → Rich / `rcwx`
- `R3` → Rich / `rcwx`
- `JO` → Johanna Williams / `johanna-williams-41b9a25`
- `JW` → Johanna Williams / `johanna-williams-41b9a25`
- `CB` → permanent, noncommercial Chester Bennington memorial experience

`CB` must never be sold, reassigned, or monetized. It is ad-free and reserved as a tribute.

## Firebase

- Firebase project remains `shareshuffle-c7f96`.
- Hosting target is `lnkdx`.
- Actual Firebase Hosting site ID is `lnkdx-com` because Firebase required at least six characters.
- Public custom domain is `LNKDX.COM`.
- Certificate and custom-domain connection were completed.

A duplicate target mapping briefly linked `lnkdx` to both `lnkdx` and `lnkdx-com`. It was corrected by clearing the target and applying it only to `lnkdx-com`.

## Product naming

“Linkedin Park” was considered as a Chester/Mike joke and a description of parking short names, but it is too close to both LinkedIn and Linkin Park as an official product name.

Chosen structure:

- main brand: `LNKDX.COM`
- paid/scarce feature: `LNKDX Park`
- phrase: “Park the professional name you actually want.”
