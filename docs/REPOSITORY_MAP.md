# Repository map and cleanup plan

Status: inventory completed 2026-09-03. No production deployment was performed.

## What is here now

| Area | Contents | Recommended destination |
|---|---|---|
| Repository root | ShareShuffle static web/PWA files and historical patch artifacts | Keep only the current ShareShuffle web surface in this repository |
| `functions/` | ShareShuffle, LNKDX, LinkWombat, Tempo Account, Stripe, image, and link APIs | Move toward a private `gracefeed-platform` repository, split by service |
| `shareshuffle-extension/` | Chrome extension | Separate `shareshuffle-extension` repository |
| `sites/*` | Thirteen independently deployed websites | One repository per active property |
| `products/*` | Small product records and deployment notes | Move to Gracefeed portfolio documentation or each product repository |
| `shared/*` | Shared account and brand assets copied into many sites | Canonical sources in the platform/design-system repo; publish versioned packages or copy during builds |
| `brand/`, `icons/`, `app-store/` | Brand source and generated output | Design-assets repository or canonical per-product asset folders |
| `.project-context/`, `DIARY/`, `reports/` | Decision history, handoffs, and patch reports | Keep selected durable decisions; archive superseded operational notes |
| `backups/`, `.tempo-backups/` | Local snapshots | External backup/archive storage, never a deploy source |
| `README-*`, `PATCH-ID-*`, `DEPLOY-*.command` | Chronological patch kit | Archive after current state is captured in normal docs and release history |

## Important findings

- The checkout is about 747 MB. `sites/` is about 310 MB and installed function
  dependencies are about 91 MB.
- Only 266 paths are currently tracked, while a very large body of current work
  is untracked or modified. A cleanup commit must be curated, not made with a
  blanket `git add .`.
- The branch is one commit ahead of `origin/main` and also has extensive local
  changes.
- `firebase.json` currently describes one Solution Workshop deployment using a
  missing `public/` directory. `.firebaserc` describes thirteen targets in the
  `shareshuffle-c7f96` project. These files cannot safely be used together.
- A July backup contains the most complete known multisite configuration, but it
  lists ten sites and predates three targets now present in `.firebaserc`.
- `sites/dn-wilkinson/` and `sites/dnwilkinson/` are two materially different
  Douglas Wilkinson sites. Do not delete either until Doug identifies the live
  version and desired content is merged.
- `CNAME` maps this GitHub Pages repository to `shareshuffle.com`, while the same
  site is documented as Firebase-hosted. Choose one authoritative host before
  changing DNS.
- The old extension patch README contains intentionally open Firestore rules for
  MVP testing. It is historical advice and must not be used as a production rule.

## README review

The README files fall into four groups:

1. Durable project context: `COMPANY.md`, `FOUNDER_PRINCIPLES.md`, `ROADMAP.md`,
   `.project-context/`, `DIARY/`, and `products/*/README.md`.
2. Current component documentation: `sites/lnkdx/README.md`,
   `sites/duetloop/data/README.txt`, `shared/tempo-account/README.md`, and the
   canonical Joey brand README.
3. Historical patch notes: the root `README-*` files. These describe changes from
   June and July 2026 and frequently contain old absolute paths and broad deploy
   commands. Preserve them as an archive, not as present-tense instructions.
4. Duplicate/copied notes: Joey brand READMEs copied into sites, app-icon notes,
   and the duplicate extension patch README. Keep one canonical source when the
   repositories are split.

The historical sequence documents valuable decisions—static-first publishing,
real media only for Charlie, conservative affiliate handling, Route 66 and Butch
preservation rules, product-scoped identity, and accessibility requirements.
Those decisions should survive the cleanup as ADRs; the overlay/install commands
do not need to remain at repository root.

## Proposed repositories

```text
Gracefeed organization
├── gracefeed-platform            private APIs, auth, policies, infrastructure
├── richwilliams.github.io        durable public directory and fallback index
├── gracefeed-portfolio           Tempo Foundry/Gracefeed public portfolio
├── shareshuffle-web              current repository, narrowed to one product
├── shareshuffle-extension
├── douglas-wilkinson-site
├── praise-against-the-machine-site
├── eternal-route-66-site
├── butch-breger-museum-site
└── gracefeed-media-archive       private originals and large source media
```

Existing public site outside the proposed Gracefeed organization:

```text
richtattoo/richtattoo.github.io   Rich Tattoo site; https://richtattoo.github.io/
```

Keep this as its own repository and GitHub Pages root site. Do not make it a
folder of the ShareShuffle repository and do not replace ShareShuffle's `origin`
with this remote.

Create repositories for the other active products only when they are being
actively maintained. An empty repo per idea creates overhead without safety.
Each public site repository can publish its own GitHub Pages project URL under
`richwilliams.github.io/<repository>/`; it does not need a new GitHub account.

## Safe cleanup sequence

1. Make a full filesystem backup and a Git bundle before any moves.
2. Record which deployed URL and Firebase site each directory currently serves.
3. Reconcile `firebase.json` without deploying it; validate every target locally.
4. Identify the live Douglas Wilkinson directory and merge the alternate version.
5. Create the private platform and media repositories.
6. Extract one public site at a time while preserving Git history where useful.
7. Move patch kits and superseded reports into a dated archive.
8. Remove large media from the web repositories only after every public URL has
   been migrated and verified.
9. Change DNS last, one domain at a time, after the replacement host is live.
