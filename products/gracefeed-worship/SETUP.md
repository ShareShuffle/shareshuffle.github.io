# Setup and deployment

The signed-in app is live at **https://gracefeed-worship.web.app**. Planning Center and invitation checking are connected. YouTube still needs authorization. The production address will be **worship.gracefeed.com** after Firebase gives us its required DNS records.

## 1. Existing Gracefeed setup — done

Worship belongs to `shareshuffle-c7f96`. Its dedicated Web app and Hosting site are registered. The existing Google sign-in account `rchwms@gmail.com` is configured as Worship's owner; no new account is needed. Local `.firebaserc`, `.env.local`, and `functions/.env` hold the app configuration. Its data stays below `gracefeedWorship/app/`, outside ShareShuffle's public collections. Shared Firestore rules are not deployed or replaced.

The separately created `gracefeed-worship-prod` project is empty and unused. Do not use it for this app.

## 2. Planning Center — connected

At https://api.planningcenteronline.com/oauth/applications create a personal access token for Rich's church account. This is the supported single-church integration approach. Store the Application ID and Secret in Secret Manager as `WORSHIP_PCO_APP_ID` and `WORSHIP_PCO_SECRET`; never paste them into this guide or the source.

Use the Google Cloud console's Secret Manager “Create secret” flow, or the Firebase CLI's interactive secret prompts:

```sh
npx firebase functions:secrets:set WORSHIP_PCO_APP_ID --project shareshuffle-c7f96
npx firebase functions:secrets:set WORSHIP_PCO_SECRET --project shareshuffle-c7f96
```

Set `PCO_STEVEN_PERSON_ID` to Steven Braucht's Services person ID to label his uploads. Set `PCO_PERSON_ID` to Rich's Services person ID to enable automatic invitation preparation. Both can be found in the Services API Explorer; the person ID is not an email address. After deployment, Connections lists service types; choose the actual FBCP worship service type. The app cannot infer which church/service type belongs to FBCP merely from a title.

With no Rich person ID, Refresh uses the next future plan. With a person ID, it prepares upcoming visible plans only after the invitation's `notification_sent_at` is present. It checks every 15 minutes and on open; it does not accept or decline invitations. A leader changing the set later is picked up by subsequent refreshes.

## 3. Connect @richwilliamsgo

In Google Cloud → Google Auth Platform, configure consent and a Web application OAuth client. Add Rich as a test user if the application is in Testing. Set this authorized redirect URI, matching `APP_ORIGIN` exactly:

```text
https://gracefeed-worship.web.app/api/oauth/callback
```

Store the client ID as `WORSHIP_GOOGLE_CLIENT_ID` and the client secret as `WORSHIP_GOOGLE_CLIENT_SECRET` in Secret Manager. The client ID has been copied into the backend configuration; the secret remains in Secret Manager. Create an **empty secret container** named `WORSHIP_YOUTUBE_REFRESH_TOKEN` in Google Cloud Secret Manager; the app writes its first version after successful OAuth. Do not fill it with a fabricated token.

The app resolves `@richwilliamsgo` through YouTube during the first authorized connection, verifies the signed-in channel matches, and saves its immutable channel ID. Future publishing checks both the saved ID and handle. No manual channel-ID lookup is needed.

Grant the Functions runtime service account `Secret Manager Secret Accessor` on the four secrets (`WORSHIP_PCO_APP_ID`, `WORSHIP_PCO_SECRET`, `WORSHIP_GOOGLE_CLIENT_SECRET`, `WORSHIP_YOUTUBE_REFRESH_TOKEN`), and `Secret Manager Secret Version Adder` on `WORSHIP_YOUTUBE_REFRESH_TOKEN` only. For 2nd-gen Functions, inspect the runtime identity in Cloud Functions/Cloud Run; do not guess it or grant broad project ownership. Firestore access and scheduler invocation permissions must also be available to the deployed runtime, normally configured by Firebase provisioning.

After configuring Google OAuth, sign in → Connections → **Connect @richwilliamsgo**. Choose that channel. The app requests YouTube management access to create/update playlists. Consent-screen Testing may require reconnection after token expiry; production consent/verification requirements depend on Google's configuration. No Gracefeed channel is used or created. With `AUTO_PLAYLIST=true` (the configured default), scheduled checks create/update the dated playlist automatically using saved selections or Planning Center live references, then artist/songwriter live matches, Bethel, Hillsong, and other live recordings ranked by views and upload age. Publication only pauses when no eligible live recording is found. Automatic picks are labeled distinctly from owner choices.

## 4. Optional file sharing and Slack

Default `SHARE_ATTACHMENTS=false` means each bandmate uses their own Planning Center login for audio/charts. Set it to `true` only if these downloadable rehearsal files may be shared with anyone holding your band link. This uses Planning Center's attachment-open action and honors its download flags; it does not bypass restricted files.

For Slack, create an incoming webhook for the desired channel, store it as `WORSHIP_SLACK_WEBHOOK_URL` in Secret Manager, grant the runtime access to that secret, and set `SLACK_ENABLED=true`. In Worship: Share → create a link → **Send this link to Slack**. The message says the FBCP rehearsal set is ready and includes an Open rehearsal set button. Nothing is sent automatically.

## 5. Build and deploy

From this folder:

```sh
npm ci
npm ci --prefix functions
npm run deploy
```

The deployment helper checks the project and public configuration, runs tests/build, and deploys only Worship Functions and its Hosting site in Gracefeed. Shared Firestore rules and other Hosting sites are excluded. No secrets are bundled into Hosting. Confirm scheduler creation and the runtime IAM grants, then test one real invitation, key change, attachment and playlist.

## 6. Attach worship.gracefeed.com

Firebase Console → your Worship project → Hosting → Add custom domain → `worship.gracefeed.com`. Use **only the exact verification/routing records Firebase displays** at the authoritative DNS provider for `gracefeed.com`. You do not need to alter the apex website or mail records. Wait for DNS verification and certificate issuance.

Update `APP_ORIGIN` to `https://worship.gracefeed.com`; add that host to Firebase Auth authorized domains and add `https://worship.gracefeed.com/api/oauth/callback` to Google's OAuth redirect URIs. Rebuild/redeploy as needed. Old share links use the origin under which they were created, so create final band links after the canonical domain is set. No DNS automation has been installed yet.

## Local integration testing

For a full local emulator stack, set frontend `VITE_USE_EMULATORS=true`, use the Firebase emulator project, build, and run `npm run emulators`. Set the backend `APP_ORIGIN=http://localhost:5000` for those local writes. Secret Manager still needs authorized application-default credentials and real configured secrets; this repository does not mock live OAuth or store secrets in localStorage. Secure OAuth cookies require an HTTPS deployment for the Google connection test. Use the zero-configuration demo for ordinary UI work.

## First real-service acceptance check

1. Sign in as owner; a second Google account must be denied management access.
2. Select FBCP and Rich's person ID; refresh a sent invitation and compare every song/key/arrangement to Planning Center.
3. Verify Steven's identified MP3 against the actual selected key; confirm a restricted file is not anonymously downloadable.
4. Choose 3–5 live performances; create the dated playlist on @richwilliamsgo, then update twice and confirm no duplicates.
5. Open service and band-home links in a signed-out browser. Confirm read-only behavior and no credentials in API responses; revoke a link and confirm it stops working.
6. Change the plan's key or add a song in Planning Center; reopen and verify refresh preserves approved versions while showing changes. Verify a draft assignment does not prepare a service until its invitation is sent.

References: [Planning Center authentication](https://developer.planning.center/docs/), [attachments and open action](https://api.planningcenteronline.com/docs/apps/services/versions/2018-11-01/vertices/attachment), [invitation fields](https://api.planningcenteronline.com/docs/apps/services/versions/2018-11-01/vertices/plan_person), [YouTube OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [playlist operations](https://developers.google.com/youtube/v3/guides/implementation/playlists), [Firebase secrets](https://firebase.google.com/docs/functions/config-env).
