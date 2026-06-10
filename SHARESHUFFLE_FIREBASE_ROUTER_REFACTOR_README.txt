ShareShuffle Firebase Router Refactor

What changed:
- Firebase Hosting now has a catch-all rewrite to /router.html after /getPreview.
- router.html normalizes public paths case-insensitively.
- shfl.me/A2C4E, /a2c4e, and mixed case variants route to the same share.
- Current username routes use @ to protect 1-2 character early adopter handles: /@r, /@jo, /@rich.
- Future no-@ username routes are scaffolded in the router, with 5-character share IDs reserved first.
- App-created shares now store handleSlug, handleDisplay, and publicPath.
- Shelf pages can load by ?u=handle&s=shelf, allowing /@handle/shelf routes.
- Firestore rules were updated to allow the new public route fields.

Deploy from project root:
  npx firebase-tools@latest deploy --only hosting,functions:getPreview,firestore:rules

Test after domains point to Firebase Hosting:
  https://shareshuffle-c7f96.web.app/a2c4e
  https://shareshuffle-c7f96.web.app/A2C4E
  https://shareshuffle-c7f96.web.app/@rich/bass
  https://shareshuffle-c7f96.web.app/getPreview?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0FQN61QKB

Domains to attach to Firebase Hosting:
- shareshuffle.com
- shfl.me
- shelfmix.com

Important:
Do not deploy until shareshuffle-c7f96.web.app works. Then move DNS/custom domains.
