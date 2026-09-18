# Validation — September 17, 2026

## Completed

- Production Vite build succeeded (React app and CSS bundles generated).
- 16 automated tests passed: ranking/exclusions, songwriter preference, public-data filtering, creator/key attribution, MP3 permission handling, church timezone, playlist size/approval enforcement, share-token format, path validation, provider pagination-origin guard, Planning Center fixture import, provider failure handling, YouTube channel restriction, repeat playlist reconciliation, early playlist-ID persistence, and sent-invitation eligibility.
- Node syntax checks passed for all server modules; the Cloud Functions entrypoint imports successfully.
- Desktop and 390-pixel phone layouts inspected in the browser. Verified sample version selection, approved-choice display, audio empty state, and sharing explanation. No horizontal overflow was visually observed.
- Existing Firebase project access checked. Created isolated Hosting site `gracefeed-worship` under Gracefeed's `shareshuffle-c7f96` project.
- Hosting-only sample deployed and the live page verified in the browser at https://gracefeed-worship.web.app. It prominently states that sample data is being shown and accounts are not connected. The sample has no account credentials or live service data.

## Not activated / not verified live

Planning Center credentials, actual FBCP service/person IDs, Google consent and @richwilliamsgo authorization, production Firebase identity/database/IAM, Cloud Scheduler, real attachment downloads, real playlist publishing, share-token access/revocation against Firestore, Slack delivery, and custom-domain DNS/TLS. These need the setup guide and a controlled first-service test.

Only Hosting was deployed. No Functions, Firestore rules, scheduler jobs, DNS changes, Slack messages, or YouTube changes were deployed/executed. Existing product sites and shared database rules were not modified. The deployment helper targets the existing Gracefeed project and excludes shared Firestore rules. The briefly created `gracefeed-worship-prod` project is empty and unused.

The scheduled preparation code checks sent invitations every 15 minutes. That is polling, not instant webhook delivery. Refresh requests are coalesced for two minutes. The original manual publishing flow was subsequently changed to automatic creation/update once YouTube is connected. Saved owner choices take precedence; new songs require strong metadata matches, otherwise publishing pauses for review. The canonical ranking is metadata-based and cannot prove that every result is the original performer or that its musical key matches the service.

## Gracefeed placement correction

Registered the Worship Web app in `shareshuffle-c7f96`, reused the existing Google owner UID, and moved all database access under `gracefeedWorship/app/`. Read the live shared rules and confirmed there is no client-access grant for that namespace. Added a namespace regression test: 17 tests pass. No shared Firestore rules were changed.

## Live Planning Center connection verified

The two `WORSHIP_PCO_*` Secret Manager values successfully authenticated to Services. Verified Rich Williams (83319670), Steven Braucht (4085339), Modern Service (172741), and Rich's confirmed September 20 invitation for plan 91302278. The invitation was sent by Steven Braucht on September 10. Imported all four songs and their attachments without warnings; saved the plan/settings only below the private Worship namespace. Secrets remained in memory during verification and were not written into source or Hosting assets. YouTube remains unconnected.

## Automatic playlist flow

Added automatic creation/update after invitation refresh, retaining owner choices and recording automatic picks honestly. Weak candidates pause publishing. Four regression tests cover automatic creation, uncertain matches, unchanged-playlist no-op and changed-set updates; 21 tests pass. No YouTube authorization or live publishing test has happened yet.

## Deployed connection and scheduler check

Both Worship functions are ACTIVE in `shareshuffle-c7f96`, using the verified runtime identity with access to the two Worship Planning Center secrets. Cloud Scheduler is ENABLED every 15 minutes. A controlled execution advanced the private settings refresh timestamp with `lastSyncError=null`. The Hosting health endpoint returns 200; unsigned owner access returns 401 and an invalid share link returns 404. The signed-in production UI is deployed. Automatic YouTube behavior is deployed and covered by tests, but remains inactive until the Google OAuth connection is configured.


### Page password and Google connection setup

Deployed the shared page gate to Firebase Hosting. It accepts exactly `WORSHIP`, `Worship`, and `worship`. Live browser verification confirmed an incorrect password is rejected and `worship` opens the Google owner login. This client-side courtesy gate does not replace owner authentication or secret share links. Bandmates need a share link, not an owner account; attachment access still uses their own Planning Center login by default.

Google OAuth client configuration and scoped runtime secret permissions are wired and the functions deployment completed. The owner must still complete Google consent from Connections before YouTube playlists can be created.


### Live recording preferences — September 17

30 checks pass covering writer name splitting, Planning Center YouTube link validation and priority, original performers above Bethel above Hillsong, popularity/age ranking, exclusion of lyric/studio results, automatic fallback, and preservation of owner choices. Searches no longer exclude official performances merely because their descriptions contain lyrics.

Published and verified unlisted playlist `PLOFAW5F_FQVQ` on channel `UCF9GLjmwFw17rY6oqdfyjrg`: `TmQ5qbm2Q4k`, `lKw6uqtGFfo`, `MV5x6M38ea8`, `rYQ5yXCc_CA` in service order. All four songs have key-matched PCO audio attachments; no audio was uploaded to YouTube. Existing item/arrangement attachments contained no YouTube references in this service. The app reads song writer metadata and attachment links, not the contents of chart PDFs.
