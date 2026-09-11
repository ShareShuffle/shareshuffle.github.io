TEMPO FOUNDRY LIVE PATCH 01
Generated July 10, 2026

WHAT THIS DOES
- Preserves the uploaded ShareShuffle repository and its existing Cloud Functions/Firestore rules.
- Converts Firebase Hosting to a five-site multisite configuration.
- Keeps ShareShuffle on the existing shareshuffle-c7f96 Hosting site.
- Adds:
    sites/tempo-foundry/index.html
    sites/duetloop/index.html
    sites/metromance/index.html
    sites/eternal-route66/index.html
- Adds the Duet Loop and Metromance interactive interest-card systems.
- Adds a one-click Mac deployment script.

IMPORTANT
The deploy script can publish Firebase preview URLs. Public custom domains still require one-time
domain connection in Firebase Console and DNS records at the registrar. The script cannot click
those account settings for you.

SAFE INSTALL
1. Quit any editor that is writing to the ShareShuffle repo.
2. Keep your current ZIP backup.
3. Copy this patched shareshuffle.github.io folder over the existing repo with ditto.
4. Run DEPLOY-TEMPO-FOUNDRY.command.

TERMINAL INSTALL
ZIP="$HOME/Downloads/tempo-foundry-platform-live-patch-01.zip"
WORK="$HOME/Downloads/tempo-foundry-platform-live-patch-01"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"

rm -rf "$WORK"
unzip -q "$ZIP" -d "$HOME/Downloads"
cp "$REPO/firebase.json" "$REPO/firebase.before-tempo-foundry-local.json" 2>/dev/null || true
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-TEMPO-FOUNDRY.command"
open "$REPO/DEPLOY-TEMPO-FOUNDRY.command"

ROLLBACK
cp "$REPO/firebase.before-tempo-foundry-local.json" "$REPO/firebase.json"
npx firebase-tools@latest deploy --only hosting:shuffle

DOMAIN MAP
shareshuffle.com    -> existing site shareshuffle-c7f96
tempofoundry.com    -> tempo-foundry
duetloop.com        -> duet-loop
metromance.com      -> metromance
eternalroute66.com  -> eternal-route66
route66.co          -> continue forwarding externally to eternalroute66.com
