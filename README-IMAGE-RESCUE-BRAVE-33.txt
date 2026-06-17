ShareShuffle Patch 33 — Image Rescue with Brave Search

Scope:
- Hosted web app + Firebase Functions only.
- Does not modify the Chrome extension package.
- Adds /imageRescue Firebase Function using BRAVE_SEARCH_API_KEY secret.
- Adds Firebase Hosting rewrite for /imageRescue.
- When store preview image lookup fails, /app/ can fetch 5 backup image candidates and show them with one designed ShareShuffle placeholder.
- Replaces ShelfMix route examples in the mobile app with shfl.me examples.
- Keeps Patch 32 lower-case action copy.

Before deploy:
firebase functions:secrets:set BRAVE_SEARCH_API_KEY

Paste your Brave API key when prompted. Do not paste the key into source files.

Deploy:
npx firebase-tools@latest deploy --only hosting,functions

Test:
https://shareshuffle.com/app/?v=33

Try a product URL whose store image lookup fails. The app should say the store image was blocked and show backup image choices plus a ShareShuffle placeholder.

Cost guardrails:
- The app only calls /imageRescue when preview lookup did not produce a clean image.
- Results are cached in localStorage by query to avoid repeat calls while testing.
- The chosen image is cached when the share is saved, so the social card does not need to call Brave later.
