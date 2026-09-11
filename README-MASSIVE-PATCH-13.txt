TEMPO FOUNDRY MASSIVE PATCH 13 — LINK CHECK, MERCH, ARTISTS, MEDIA TOOLS
Generated: 20260716T211820Z

SOURCE
Built from the uploaded current repository: shareshuffle.github.io 2.zip
This is an overlay patch, not a stale full-repository replacement.

INSTALL + DEPLOY
ZIP="$HOME/Downloads/tempo-foundry-massive-linkcheck-merch-artists-patch-13-20260716T211820Z.zip"
WORK="$HOME/Downloads/tempo-foundry-massive-linkcheck-merch-artists-patch-13-20260716T211820Z"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-massive-13-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
test -d "$REPO"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-MASSIVE-LINKCHECK-MERCH-ARTISTS-13.command"
chmod +x "$REPO/tools/"*.command
bash "$REPO/DEPLOY-MASSIVE-LINKCHECK-MERCH-ARTISTS-13.command"

WHAT DEPLOYS
- Function: linkCheck
- Hosting: shuffle
- Hosting: breger
- Hosting: eternalroute66

MEDIA REPO
After the sites are verified, run:
bash "$REPO/tools/SPLIT-MEDIA-REPO.command"
This COPIES large media to tempo-foundry-media and does not remove anything from the working repo.

FUTURE CHAT ZIPS
Normal code work:
bash "$REPO/tools/ZIP-CODE-FOR-CHAT.command"
Media/art work:
bash "$REPO/tools/ZIP-MEDIA-FOR-CHAT.command"
