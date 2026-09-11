TEMPO FOUNDRY — PATCH 23
DOUGLAS N. WILKINSON + THE LAKE HOUSE AT BELLA VISTA

WHAT THIS PATCH ADDS

1. Douglas N. Wilkinson portfolio
   - https://dnwilkinson.web.app/
   - https://dnwilkinson.web.app/on-fractured-ground/
   - Ready for dnwilkinson.com after the Firebase custom-domain connection

2. The Lake House at Bella Vista
   - https://bellavista.web.app/
   - Owner-controlled property story and gallery
   - Current availability and secure booking remain on Vrbo

3. Tempo Foundry integration
   - Both sites appear in the Tempo Foundry portfolio
   - Firebase targets live in the existing shareshuffle-c7f96 project
   - Solution Workshop's stale sol-wx project setting is repaired
   - Shops for Miles is restored to the complete projects page

HOW TO APPLY

1. Unzip this patch into:
   ~/Documents/GitHub/shareshuffle.github.io

2. Allow files to merge with the existing folders.

3. In Terminal:

   cd ~/Documents/GitHub/shareshuffle.github.io
   chmod +x DEPLOY-DOUG-BELLAVISTA-PATCH-23.command
   bash DEPLOY-DOUG-BELLAVISTA-PATCH-23.command --check
   bash DEPLOY-DOUG-BELLAVISTA-PATCH-23.command

The script uses a global Firebase command when available. If Firebase is not global,
it automatically runs Firebase Tools through npx.

IMPORTANT

- The script deploys Hosting only. It does not change Firestore data or functions.
- Firebase Hosting sites dnwilkinson and bellavista must already exist. They do.
- The lake-house site does not take payment. Vrbo remains the booking source of truth.
- To enable a direct inquiry email later, edit:
  sites/bella-vista-lake-house/site-config.js

