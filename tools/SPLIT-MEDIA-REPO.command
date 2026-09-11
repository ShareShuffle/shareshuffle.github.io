#!/bin/bash
set -euo pipefail
SOURCE="$HOME/Documents/GitHub/shareshuffle.github.io"
MEDIA="$HOME/Documents/GitHub/tempo-foundry-media"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-media-split-$(date +%Y%m%d-%H%M%S)"
MODE="${1:-copy}"
test -d "$SOURCE"
ditto "$SOURCE" "$BACKUP"
mkdir -p "$MEDIA/butch-breger"/{originals,corrected-masters,printable,display,thumbnails,shirt-art,shirt-mockups,source-documents} "$MEDIA/eternal-route66"/{originals,corrected-masters,display,thumbnails,research} "$MEDIA/artist-community"/{bob-waldmire,crocodile-lile,eternal-route66} "$MEDIA/manifests"
copy_dir(){ local src="$1" dst="$2"; if [ -d "$src" ]; then mkdir -p "$dst"; rsync -a --info=stats1 "$src/" "$dst/"; fi; }
copy_dir "$SOURCE/sites/breger/art/originals" "$MEDIA/butch-breger/originals"
copy_dir "$SOURCE/sites/breger/art/display" "$MEDIA/butch-breger/display"
copy_dir "$SOURCE/sites/breger/art/thumbs" "$MEDIA/butch-breger/thumbnails"
copy_dir "$SOURCE/sites/eternal-route66/photos" "$MEDIA/eternal-route66/originals"
copy_dir "$SOURCE/merch/butch" "$MEDIA/butch-breger/shirt-mockups"
cat > "$MEDIA/README.md" <<'EOF'
# Tempo Foundry Media
Large or rarely changing originals, corrected masters, printable files, public display derivatives, shirt art, mockups and research assets.
The deployable web/code repo remains `shareshuffle.github.io`. Do not delete web copies until every public URL and full-resolution download has been verified against cloud storage or a release manifest.
EOF
find "$MEDIA" -type f -not -path '*/.git/*' -print0 | sort -z | xargs -0 shasum -a 256 > "$MEDIA/manifests/SHA256SUMS-$(date +%Y%m%d-%H%M%S).txt"
echo "Media copy complete: $MEDIA"
echo "Working repo was NOT pruned. Use the generated lean ZIP script for normal new conversations."
open "$MEDIA"
