SHARESHUFFLE CARD REFACTOR PATCH 08

Build: 2026.06.11-card-refactor-08

Adds:
- /c-{shareId} generated 1200x630 PNG social card endpoint.
- renderRoute OG + Twitter/X tags now point og:image/twitter:image to /c-{shareId}?v=...
- /i-{shareId} remains raw cached/uploaded product image route.
- Message body uses full https://shfl.me/{id} for iMessage card reliability.
- Message signature becomes "Rich shared via Shuffle:" when @user/name exists.
- Create share stores cardPath, imagePath, updatedAt.
- Adds sharp dependency for generated PNG card rendering.

Deploy:
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
npm --prefix functions install
npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

After deploy:
- https://shareshuffle-c7f96.web.app/_status should show 2026.06.11-card-refactor-08
- https://shareshuffle-c7f96.web.app/c-a2c4e should return a PNG social card or 404 if no share exists.
- New messages should use https://shfl.me/{id}.
