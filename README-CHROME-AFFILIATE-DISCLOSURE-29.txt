SHARESHUFFLE PATCH — 2026.06.13-chrome-affiliate-disclosure-29

Patch: chrome-store-affiliate-disclosure-compliance

Why:
- Chrome Web Store rejected ShareShuffle for affiliate disclosure.
- Policy requires affiliate programs to be described prominently in the Web Store page, user interface, and before installation.

What changed:
- shareshuffle-extension/manifest.json
  - version bumped to 0.1.1
  - description now says links may include affiliate links including Amazon and Walmart.
- shareshuffle-extension/popup.html
  - adds a prominent affiliate disclosure near the top of the popup before users create a share link.
  - strengthens footer disclosure.
- shareshuffle-extension/styles.css
  - styles disclosure box so reviewers/users can plainly see it.
- CHROME-STORE-AFFILIATE-DISCLOSURE-TEXT.txt
  - exact text to paste into Chrome Web Store listing and resubmission note.

Apply web repo:
  ditto "/Users/richwilliams/Downloads/shareshuffle-chrome-affiliate-disclosure-29/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Build Chrome extension zip after applying:
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  zip -r ~/Desktop/ShareShuffle-extension-0.1.1-affiliate-disclosure.zip shareshuffle-extension -x "*.DS_Store"

Chrome Web Store must also be edited manually:
- Add the affiliate disclosure text to the short/long description.
- Upload the new extension zip.
- Resubmit.
