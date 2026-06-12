ShareShuffle patch: 2026.06.12-coherent-card-image-11

What changed:
- Bumped static and function build markers together.
- Status page now expects this build and still checks both /assets/build-info.json and /_build.
- /app/ preview endpoint recognizes shareshuffle.com, shfl.me, shelfmix.com, and Firebase hosts as first-party.
- Create-share payload now records imageStatus/imageSource immediately so cards can explain pending/no-image states.
- Native Share avoids duplicating the URL by sending the URL through navigator.share() and the body text without a second trailing URL.
- Copy Text / Message / Email still use the full simple message with https://shfl.me/{id} as the final line.
- Image caching is more tolerant of real merchant photos, rejects true tiny placeholder images by pixel size, and downsizes oversized images with Sharp.
- Firestore rules are widened for compatible image/card fields while preserving the old Chrome extension payload.

Deploy:
  sspatch shareshuffle-coherent-card-image-11
  ssdeploy

Or, if the download is still zipped:
  ditto -x -k "/Users/richwilliams/Downloads/shareshuffle-coherent-card-image-11.zip" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Smoke test with a brand-new share ID because iMessage caches previews aggressively.
