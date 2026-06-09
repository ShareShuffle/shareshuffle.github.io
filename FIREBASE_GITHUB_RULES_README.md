# ShareShuffle Firebase rules from GitHub

This repo now contains the Firestore rules source of truth:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`

## One-time local setup

```bash
npm install -g firebase-tools
firebase login
firebase use --add shareshuffle-c7f96
firebase deploy --only firestore:rules,firestore:indexes
```

After this, edit `firestore.rules` in GitHub, not in the Firebase Console. The Firebase Console will still display the live rules, but the repo copy is the version you control and redeploy.

## GitHub Actions setup

Create a Google Cloud/Firebase service account with Firebase deploy permissions, download its JSON key, and save it in GitHub repo secrets as:

`FIREBASE_SERVICE_ACCOUNT_SHARESHUFFLE_C7F96`

The included workflow deploys rules when `firestore.rules`, `firestore.indexes.json`, or `firebase.json` changes on `main`.

## Important

Deploying rules from CLI/GitHub overwrites rules edited directly in Firebase Console. Treat console edits as temporary emergency changes only, then copy them back into `firestore.rules`.
