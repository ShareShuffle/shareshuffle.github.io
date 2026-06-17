ShareShuffle patch 32: mobile action copy polish

Hosted web app only. Does not touch the Chrome extension package.

Changes:
- Lowercases the post-create guidance in the Last Share Ready card.
- Shortens the blue status message after a share is created.
- Replaces “Now pick Message, Email, Share, Copy Text, or Open below.” with friendlier lowercase copy.

New copy:
- Last Share Ready hint: “Choose what to do next: message, email, share, copy text, or open.”
- Status: “Copied: {id}. Choose what to do next below.”
- Status when image cached: “Copied: {id}. Choose what to do next below. Image cached.”

Install:
ditto "/Users/richwilliams/Downloads/SHARESHUFFLE-PATCH-32-MOBILE-ACTION-COPY/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
npx firebase-tools@latest deploy --only hosting
