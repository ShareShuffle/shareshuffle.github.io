ShareShuffle permissions + Amazon image/card fix

This patch fixes two immediate blockers:

1. Firestore rules rejected the card refactor share payload because the app now creates shares with cardPath, imagePath, and updatedAt. The rules now allow those fields while keeping old Chrome extension payloads compatible.

2. Amazon preview extraction sometimes saved the Amazon product page URL itself as the image URL. The preview function now rejects retail product page URLs as images, so Amazon falls back to the ASIN image route instead of poisoning the share image.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-permissions-amazon-card-fix" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"

Deploy:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Expected build:
  2026.06.11-permissions-amazon-card-09
