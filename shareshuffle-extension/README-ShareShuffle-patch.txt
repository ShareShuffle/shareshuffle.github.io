ShareShuffle patch contents

1. popup-upgraded.html
   Rename/copy to: shareshuffle-extension/popup.html

2. popup-upgraded.js
   Rename/copy to: shareshuffle-extension/popup.js

3. styles-upgraded.css
   Rename/copy to: shareshuffle-extension/styles.css

4. shelf.html
   Copy to the website root beside index.html, share.html, and dashboard.html

After copying:
- Reload the unpacked Chrome extension at chrome://extensions.
- Push/deploy shelf.html to ShareShuffle.com.
- Make sure Firestore rules allow reads/writes to shelves for MVP testing.

Temporary MVP Firestore rules reminder:
service cloud.firestore {
  match /databases/{database}/documents {
    match /shares/{shareId} {
      allow read, write: if true;
    }
    match /shelves/{shelfId} {
      allow read, write: if true;
    }
  }
}
