TEMPO FOUNDRY COLOR FAVICONS + SAFARI PATCH 08
Generated timestamp: 20260713T194353Z

UPDATED
- Tempo Foundry colorful metronome.
- Metromance aqua/blue hotel-heart.
- Eternal Route 66 red/blue 66 shield.
- ShareShuffle and Duet Loop retain their approved icon sets.
- All five use fresh timestamped filenames.
- All five sites open specifically in Safari after deployment.

INSTALL AND PUSH
ZIP="$HOME/Downloads/tempo-foundry-color-favicons-safari-patch-08-20260713T194353Z.zip"
WORK="$HOME/Downloads/tempo-foundry-color-favicons-safari-patch-08-20260713T194353Z"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-color-favicons-08-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-COLOR-FAVICONS-SAFARI-08.command"
bash "$REPO/DEPLOY-COLOR-FAVICONS-SAFARI-08.command"
