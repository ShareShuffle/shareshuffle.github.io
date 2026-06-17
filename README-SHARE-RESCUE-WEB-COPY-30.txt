ShareShuffle patch 2026.06.16-share-rescue-web-copy-30

Scope: hosted web app/homepage only. The Chrome extension package is not changed.

Changes:
- Adds Share Rescue detection to /app/ for pasted search/result URLs.
- Detects common search pages for Amazon, YouTube, Google, Walmart, Target, eBay, and Best Buy.
- Shows friendly "this looks like search results" guidance without blocking the user from saving the link.
- Adds homepage language for: "Send the thing you meant to send," Search Result Rescue, Image Rescue, message-ready sharing, shelves, and affiliate-aware referrals.
- Updates build marker to 2026.06.16-share-rescue-web-copy-30.

Install/deploy:
ditto "/Users/richwilliams/Downloads/SHARE-RESCUE-WEB-COPY-30/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Notes:
- This does not scrape Amazon or YouTube from the server.
- This does not use LLM APIs.
- This is a web/PWA UX rescue feature, not an extension resubmission.
