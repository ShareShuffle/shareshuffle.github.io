# Gracefeed Worship

FBCP's worship plan, selected keys, arrangements, rehearsal files, approved live performances, and bandmate sharing in one responsive app. Intended production address: **worship.gracefeed.com**. YouTube destination: **@richwilliamsgo only**.

**Current delivery:** the signed-in app is deployed at https://gracefeed-worship.web.app in the existing Gracefeed/ShareShuffle Firebase project. Planning Center is connected and the real September 20 set is imported. The invitation checker is enabled every 15 minutes. YouTube authorization remains outstanding; no playlists have been published yet.

## Run locally

Node 22 is required.

```sh
npm ci
npm ci --prefix functions
npm run dev
```

Without frontend Firebase configuration the app opens in sample mode. It never pretends to load a real plan, generate a real share link, or publish a playlist. The sample's chosen versions last only until reload. `npm test` runs provider-fixture and domain tests. `npm run build` creates the Hosting bundle.

For real setup and deployment, follow [SETUP.md](SETUP.md). The [DNS feature brief](docs/DOMAIN-CONNECTIONS.md) describes a future shared feature for Gracefeed and Solution Workshop; it is not implemented in their repositories.

## Included

- Firebase Google sign-in, with server-enforced owner UID; all Firestore client access denied.
- Planning Center single-church PAT connection through Secret Manager; UI selects the FBCP service type.
- Next plan import, preserving service order, song author, saved artist, selected key, arrangement and attachments. Provider pagination supported.
- With Rich's Planning Center person ID: every-15-minute check of upcoming visible schedules and `notification_sent_at`. Draft assignments and declined invitations do not trigger preparation. Up to 12 upcoming invited plans refreshed per run. Invitations from any sender count, including Steven; there is no email inbox scraping or automatic acceptance.
- Refresh on first open and when returning after two minutes. Server coalesces requests within two minutes; scheduled refresh continues independently. Bandmates can also refresh through their link.
- YouTube OAuth verifies both the configured channel ID and `@richwilliamsgo`. Live results rank artist/songwriter matches above other performances and exclude lyric, studio, tutorial, visualizer, karaoke and similar titles. Ranking is a heuristic: choices are automatic and Rich can replace any selection.
- Planning Center supplies songwriters rather than a dedicated artist field. Owners can set/edit the artist per song; it persists across refreshes and guides the live search. Native Planning Center chord charts also receive a link when present.
- Persistent approved version per Planning Center song ID, restored when the song returns. Key changes do not erase the saved performance. YouTube recordings are not transposed.
- Automatic creation/update of unlisted `YYYY-MM-DD-FBCP` playlists with 3–5 selected songs, one saved canonical performance per song. Owner choices are reused. New songs use Planning Center live references, then artist/songwriter live matches, Bethel, Hillsong, and other live recordings ranked by views and upload age, labeled as automatic selections; songs without any eligible live result pause publishing. Reconciliation removes obsolete entries and duplicates and restores service order; the playlist ID is saved immediately after creation.
- Read-only service and stable band-home links, random 256-bit keys held in URL fragments, hashed server-side. Links can be revoked. Share responses contain no provider tokens or private API references.
- Attachments tied to the selected key receive a key-match label. Steven attribution requires his Planning Center person ID to match the attachment creator. No pitch matching or unverified claims based on filenames.
- Optional Slack incoming webhook with a user-triggered “Send this link to Slack” button after a share link is created. No required commands or automatic messages.

## File access and sharing

By default, bandmates open files using their own Planning Center login. `SHARE_ATTACHMENTS=true` explicitly allows link holders to open provider-downloadable files through a server-generated file link; MP3 download restrictions are honored. Provider access tokens are never returned. File links may remain usable until the provider expires them, and downloaded files cannot be recalled by revoking a Worship share link. Files without download permission remain available only through Planning Center.

## Architecture

```text
React / Vite → Firebase Hosting → /api/** → Cloud Functions (Node 22)
                                         ├─ Firebase Auth owner check
                                         ├─ Firestore plans / canonical / shares
                                         ├─ Secret Manager provider credentials
                                         ├─ Planning Center Services
                                         └─ Google OAuth / YouTube
Cloud Scheduler → syncInvitations → sent invitations → refreshed plans
```

Worship lives in the existing `shareshuffle-c7f96` Firebase project. All app data is namespaced under `gracefeedWorship/app/`; the live shared rules deny client access there. Deployment is limited to the Worship Functions codebase and Hosting site and does not deploy shared Firestore rules. Secrets use the `WORSHIP_` prefix.

## Verification and limits

See [VALIDATION.md](VALIDATION.md) for delivered checks and activation checks still needed. Search results, attachment fields, real organization permissions, OAuth consent, quota behavior and end-to-end sharing still require a controlled account-connected test. API failures preserve the last stored plan and show an error rather than replacing it with sample data. YouTube updates run automatically once connected. Slack sending remains user-triggered.
