#!/bin/bash
set -euo pipefail
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
OUT="$HOME/Desktop/shareshuffle-code-$(date +%Y%m%d-%H%M%S).zip"
cd "$HOME/Documents/GitHub"
zip -r "$OUT" "$(basename "$REPO")" -x "*/.git/*" "*/node_modules/*" "*/.firebase/*" "*/.DS_Store" "*/__MACOSX/*" "*/sites/breger/art/originals/*" "*/sites/eternal-route66/photos/*.jpg"
echo "$OUT"; open -R "$OUT"
