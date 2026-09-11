TEMPO FOUNDRY FAVICONS + ACCESSIBILITY PATCH 06
Generated from the fresh uploaded repository.

INCLUDED
- Artist-tuned native favicon sizes for ShareShuffle, Tempo Foundry,
  Duet Loop, Metromance and Eternal Route 66.
- 16, 24, 32, 64, 128, 256 and 512px sources preserved exactly.
- Multi-resolution favicon.ico assembled from each brand's native files.
- Updated manifests and favicon link declarations.
- WCAG AA-oriented contrast corrections for all five sites.
- Specific correction of the pale ER66 roadmap cards/state labels.
- Specific correction of white Metromance headings and answers on cream cards.
- Stronger muted text, placeholders and keyboard focus indicators.
- No Firestore, Functions or DNS changes.
- No changes to ER66 quote/atlas data or rendering logic.

INSTALL AND PUSH
ZIP="$HOME/Downloads/tempo-foundry-favicons-accessibility-patch-06.zip"
WORK="$HOME/Downloads/tempo-foundry-favicons-accessibility-patch-06"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-visual-06-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-FAVICONS-ACCESSIBILITY-06.command"
bash "$REPO/DEPLOY-FAVICONS-ACCESSIBILITY-06.command"
