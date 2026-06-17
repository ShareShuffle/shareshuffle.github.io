# ShareShuffle Patch 38 — image state copy + rescue trigger cleanup

Hosted web app/functions patch. Chrome extension package untouched.

Fixes:
- Stops calling the ShareShuffle fallback card an uploaded photo.
- Calls Image Rescue when a store image exists but is known risky/bot-hostile.
- Shows backup candidates even if only same-merchant candidates came back, while still falling back cleanly if caching fails.
- Uses clearer fallback copy: clean ShareShuffle card.

Deploy: npx firebase-tools@latest deploy --only hosting,functions
