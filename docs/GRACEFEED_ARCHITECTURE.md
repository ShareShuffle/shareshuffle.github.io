# Gracefeed ecosystem architecture

## Naming

- **Gracefeed**: company/administrative owner and technical platform namespace.
- **Tempo Foundry**: public-facing studio, portfolio, and creative umbrella.
- **Product brands**: ShareShuffle, Praise Against the Machine, Douglas N.
  Wilkinson, and the other properties retain independent identities.

The EIN alone does not establish how the name should appear publicly. Confirm the
registered legal name and suffix before legal copy is changed. Until then, public
copy can say “A Tempo Foundry project” and internal infrastructure can use the
Gracefeed name.

## Hosting decision rule

Use GitHub Pages for a site that is truly static: public HTML/CSS/JavaScript,
images, no protected data, no server secrets, and no server-side API requirement.

Use Firebase Hosting when the site needs clean integration with Cloud Functions,
Authentication, Firestore, preview channels, rewrites, or protected configuration.
A static site can still live on Firebase; consistency may be worth more than the
small hosting difference.

### Permanent GitHub fallback

Every GitHub account or organization can have one root Pages site from a
repository named `<owner>.github.io`. Other repositories publish project sites at
`<owner>.github.io/<repository>/`.

For example, under the `richwilliams` account:

```text
richwilliams.github.io repository  -> https://richwilliams.github.io/
dnwilkinson repository             -> https://richwilliams.github.io/dnwilkinson/
praise-against-the-machine repo    -> https://richwilliams.github.io/praise-against-the-machine/
richtattoo.github.io repository    -> https://richtattoo.github.io/
```

Do not put all client sites into folders of `richwilliams.github.io`. Give each
site its own repository and enable Pages for that repository. The root site can
be a durable directory linking to every public project site.

If continuity after domain loss is the objective, do not configure the client
domain as the custom domain of the fallback Pages deployment. A configured
custom domain can make the default GitHub Pages address redirect to that domain.
Instead, use this pattern:

```text
custom domain -> primary host (often Firebase)
GitHub Pages project URL -> independent static fallback copy
```

Both deployments should be produced from the same repository and build output so
the fallback does not quietly become stale. Display the GitHub fallback URL in
the project handoff and keep it in the Gracefeed portfolio directory.

Recommended now:

| Property | Host | Reason |
|---|---|---|
| ShareShuffle | Firebase Hosting | Existing Functions/Firestore routes are part of the product |
| Gracefeed/Tempo Foundry portfolio | GitHub Pages or Firebase | Static portfolio; choose Firebase if account/invite features remain |
| Douglas N. Wilkinson | GitHub Pages fallback; GitHub Pages or Firebase primary | Static portfolio unless a managed inquiry backend is added |
| Praise Against the Machine | GitHub Pages fallback; GitHub Pages or Firebase primary | Start as an independent static brand/content site |
| Rich Tattoo | GitHub Pages | Existing public user-site repository: `richtattoo/richtattoo.github.io`; durable URL is `https://richtattoo.github.io/` |
| Quit Stop (working name) | Firebase Hosting | Installable, static PWA with no database; use a dedicated Hosting site in the existing Gracefeed project |
| DuetLoop and Metromance | Separate Firebase projects before real users | Dating identity and location data deserve an isolated security boundary |
| LNKDX | Separate Firebase project when commerce is relaunched | Stripe and scarce-name state should not share the entire portfolio blast radius |
| Preservation sites | Firebase multisite or Pages | Static-first content; keep originals outside deploy repositories |

## Backend shape

“One backbone” should mean shared contracts and services, not one unrestricted
database shared by every brand.

A site can use GitHub Pages for its public frontend and still call Firebase APIs.
Needing a database does not force the frontend itself onto Firebase Hosting.
Firebase Hosting becomes preferable when the site needs same-origin Function
rewrites, server-rendered responses, protected hosting configuration, or Firebase
preview/deployment features.

```text
Product sites
    |
    +-- public Gracefeed API gateway / versioned endpoints
    |
    +-- centralized identity broker (only when needed)
    |
    +-- product-owned Firebase project and data
            +-- Firestore rules
            +-- Functions
            +-- Storage
            +-- analytics/retention policy
```

Build shared packages for authentication UI, consent, API clients, observability,
and brand attribution. Keep each product's private records in its product project.
Cross-product discovery and profile linking must remain explicit opt-ins.

## Environments

Production and development should be separate Firebase projects. Multiple Hosting
sites in one project are appropriate only when those sites intentionally share the
same backend resources and security boundary. Do not use another production site
as the staging environment.

Suggested first projects:

```text
gracefeed-core-dev / gracefeed-core-prod
shareshuffle-dev / shareshuffle-prod
```

Add isolated product projects when products gain accounts, payments, sensitive
data, or independent operators. Do not migrate all existing sites at once.

## APIs and secrets

- All external credentials stay in Google Cloud Secret Manager and are bound only
  to the functions that use them.
- Browser Firebase configuration is not a server secret; authorization belongs in
  Security Rules and server checks.
- Version public endpoints (`/v1/...`) and document ownership, rate limits, data
  retention, and failure behavior.
- Keep a small service catalog listing owner, project, deployed region, domain,
  data classification, secrets, and rollback procedure.
- Never put payment, affiliate, AI, email, or registrar credentials in a website
  repository.

## DNS migration pattern

For each domain:

1. Inventory the registrar, current nameservers, all A/AAAA/CNAME/TXT/MX records,
   current host, and certificate status.
2. Preserve email records exactly.
3. Publish and test the replacement on its provider URL first.
4. Add the domain in the target hosting console and use the exact verification
   records it supplies.
5. Lower TTL in advance when practical.
6. Change only the web records for that domain.
7. Verify apex, `www`, redirects, HTTPS, canonical URL, email, and rollback.

DNS should point domains to hosting; databases are not exposed by pointing DNS at
them. Websites call authenticated HTTPS APIs or Firebase SDK endpoints.

## Next two site projects

### Douglas N. Wilkinson

First reconcile `sites/dn-wilkinson/` with `sites/dnwilkinson/`. The second copy
contains more project routes; the first has newer/different styling and media.
Confirm the live site and Doug's desired emphasis before merging. Preserve the
editorial rules in `products/dn-wilkinson/README.md`.

### Praise Against the Machine

Start in a new repository. Before design, capture the exact name, audience,
purpose, approved copy, owned domains, music/media rights, and whether the site is
a band, ministry, editorial project, event, or store. Begin with a static site and
add a backend only for a defined need such as a mailing list or member account.
