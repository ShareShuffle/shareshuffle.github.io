#!/bin/bash
set -euo pipefail
MEDIA="$HOME/Documents/GitHub/tempo-foundry-media"
OUT="$HOME/Desktop/tempo-foundry-media-$(date +%Y%m%d-%H%M%S).zip"
cd "$HOME/Documents/GitHub"
zip -r "$OUT" "$(basename "$MEDIA")" -x "*/.git/*" "*/.DS_Store"
echo "$OUT"; open -R "$OUT"
