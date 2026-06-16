SHARESHUFFLE PATCH — 2026.06.12-short-domain-destination-19

Patch: short-domain-open-on-app-host

Why:
- https://shfl.me/m5vnu was rendering the dynamic preview correctly, but its Open/fallback destination stayed relative.
- On the shfl.me host, a relative /share.html?id=m5vnu becomes https://shfl.me/share.html?id=m5vnu.
- The short domain should be the public preview/short-link domain, but the actual app page should open on https://shareshuffle.com.

What changed:
- Dynamic public routes now keep the canonical/public URL on the current host for previews.
- The Open button and JS fallback redirect now always send app pages to https://shareshuffle.com.
- So https://shfl.me/m5vnu should open https://shareshuffle.com/share.html?id=m5vnu, not https://shfl.me/share.html?id=m5vnu.
- Included optional GitHub Pages router updates for shfl-me.github.io and shelfmix.github.io if those repos still serve the custom domains.

Apply main Firebase repo patch:
  ditto "/Users/richwilliams/Downloads/shareshuffle-short-domain-destination-19/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Then deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Optional, only if separate GitHub Pages repos are still live:
  ditto "/Users/richwilliams/Downloads/shareshuffle-short-domain-destination-19/shfl-me.github.io" "/Users/richwilliams/Documents/GitHub/shfl-me.github.io"
  ditto "/Users/richwilliams/Downloads/shareshuffle-short-domain-destination-19/shelfmix.github.io" "/Users/richwilliams/Documents/GitHub/shelfmix.github.io"

How to tell whether the separate repos matter:
- If shfl.me and shelfmix.com are attached to Firebase Hosting for shareshuffle, deploy the main Firebase repo only.
- If GitHub Pages still serves either domain, commit/push the matching repo folder changes too.
