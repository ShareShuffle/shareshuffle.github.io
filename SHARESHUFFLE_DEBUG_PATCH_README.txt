ShareShuffle real debug patch - June 2026

Files changed:
- app/index.html
  - paste now awaits preview lookup instead of leaving clipboard status stuck
  - 15 second browser-side timeout with AbortController
  - cache-busting cb= timestamp on /getPreview requests
  - console logs prefixed with [ShareShuffle preview debug]
  - status messages now appear both near Paste and near Image URL when paste triggers lookup

- functions/index.js
  - no-store cache header for preview debugging
  - returns requestedUrl, contentType, status, ok in preview JSON
  - small productTitle parser fix

- firebase.json
  - hosting ignore now excludes functions/**, zips, psd, .firebase, etc.
  - this keeps hosting deploys from uploading thousands of function dependency files

Deploy from project root only:
cd ~/Documents/GitHub/shareshuffle.github.io
npx firebase-tools@latest deploy --only hosting,functions:getPreview

Verify patch landed locally before deploy:
grep -n "Preview lookup timed out\|AbortController\|cb=\|preview debug" app/index.html

Verify live after deploy:
curl -L "https://shareshuffle.com/app/index.html?v=debug-real-2" | grep "Preview lookup timed out"

Test direct function endpoint:
https://shareshuffle.com/getPreview?url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0C2CN9V8Q
