# LNKDX.COM — Patch 14

LNKDX is a standalone Firebase Hosting site under the Tempo Foundry / ShareShuffle technical backbone. Its purpose is to make public LinkedIn profile URLs easy to type:

`LNKDX.COM/RCWX` → `https://www.linkedin.com/in/RCWX/`

## Product decisions

- The displayed brand is always **LNKDX.COM** in all caps.
- Profile-name capitalization is preserved as entered; users may use whatever letter case they prefer.
- Direct profile shortcuts redirect immediately. There is no countdown, display ad, or monetized interstitial.
- Monetization begins as ShareShuffle cross-promotion on the homepage and invalid-link screen.
- The root page offers a URL/name converter, copy, Web Share, test link, and on-demand QR code.
- LNKDX accepts only a single LinkedIn public-profile slug made of letters, numbers, and hyphens.
- Destinations are constructed internally under `https://www.linkedin.com/in/`; users cannot supply arbitrary redirect destinations.
- The service does not scrape, cache, or reproduce LinkedIn profile content.
- The UI states that LNKDX is independent and not affiliated with or endorsed by LinkedIn.

## Firebase

- Expected Hosting site ID: `lnkdx`
- Local target: `lnkdx`
- Public directory: `sites/lnkdx`
- Unknown paths rewrite to `index.html`, where validated path routing occurs.
- `DEPLOY-LNKDX-PATCH-14.command` creates the Hosting site if needed, applies the target, and deploys it.
- The custom domain must then be connected in Firebase Console. Use the exact DNS records Firebase supplies.

## Future monetization options

Potential later additions include first-party analytics, downloadable QR assets, user-configured professional cards, email-signature blocks, resume buttons, and paid custom presentation options. Do not sell ownership of a LinkedIn identity or scrape LinkedIn profile data.
