Patch 09 generated 20260714T171217Z
64 Breger works and 40 Route 66 photos.

ZIP="$HOME/Downloads/tempo-foundry-er66-breger-museum-patch-09-20260714T171217Z.zip"
WORK="$HOME/Downloads/tempo-foundry-er66-breger-museum-patch-09-20260714T171217Z"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-er66-breger-09-$(date +%Y%m%d-%H%M%S)"
rm -rf "$WORK"; mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-ER66-BREGER-MUSEUM-09.command"
bash "$REPO/DEPLOY-ER66-BREGER-MUSEUM-09.command"
