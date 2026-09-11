#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$HOME/Desktop/tempo-foundry-source-$(date +%Y%m%d-%H%M).zip}"
cd "$ROOT"
rm -f "$OUT"
zip -r "$OUT" . -x ".git/*" "node_modules/*" "functions/node_modules/*" ".firebase/*" "__MACOSX/*" "*.DS_Store" "*.zip" "*.psd" "*.ai" "*.tif" "*.tiff" "*.heic" "assets/original/*" "assets/generated/*"
echo "Created $OUT"
open -R "$OUT" 2>/dev/null || true
