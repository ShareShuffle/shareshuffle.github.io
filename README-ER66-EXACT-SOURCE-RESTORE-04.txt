ETERNAL ROUTE 66 EXACT SOURCE RESTORE PATCH 04
Generated 2026-07-13

This patch starts from the exact original eternal-route66-one-page.html source.
It does not use the earlier reduced or intermediate homepage.

CONFIRMED IN THE GENERATED FILE
- const QUOTES=
- const ATLAS=
- Roadside Wisdom section
- Towns, Landmarks, Motels & Eats section
- Original chapters, atlas filters, quotes, places and links

ADDITIONS ONLY
- Large clear “66” favicon
- SEO metadata
- Save quote
- Save stop and mark visited
- Device-local Road List
- Optional Firestore update submissions
- Tempo Foundry portfolio footer

INSTALL AND DEPLOY
ZIP="$HOME/Downloads/tempo-foundry-er66-exact-source-restore-patch-04.zip"
WORK="$HOME/Downloads/tempo-foundry-er66-exact-source-restore-patch-04"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-er66-exact-restore-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-ER66-EXACT-SOURCE-RESTORE.command"
bash "$REPO/DEPLOY-ER66-EXACT-SOURCE-RESTORE.command"
