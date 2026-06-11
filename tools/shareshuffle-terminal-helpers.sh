# ShareShuffle local helper commands.
# Load once per Terminal tab:
# source "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io/tools/shareshuffle-terminal-helpers.sh"

export SSHUFFLE_REPO="/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
export SSHUFFLE_DOWNLOADS="/Users/richwilliams/Downloads"
export SSHUFFLE_DESKTOP="/Users/richwilliams/Desktop"

ssgo() {
  cd "$SSHUFFLE_REPO" || return 1
}

sspatch() {
  local name="$1"
  if [ -z "$name" ]; then
    echo "Usage: sspatch patch-folder-or-zip-name"
    echo "Recent downloads:"
    ls -lt "$SSHUFFLE_DOWNLOADS" | head -12
    return 1
  fi
  local folder="$SSHUFFLE_DOWNLOADS/$name"
  local zip="$SSHUFFLE_DOWNLOADS/$name"
  [[ "$zip" != *.zip ]] && zip="$zip.zip"
  if [ -d "$folder" ]; then
    ditto "$folder" "$SSHUFFLE_REPO"
  elif [ -f "$zip" ]; then
    ditto -x -k "$zip" "$SSHUFFLE_REPO"
  else
    echo "Could not find folder or zip: $folder or $zip"
    return 1
  fi
  echo "Patch applied to $SSHUFFLE_REPO"
}

ssdeploy() {
  ssgo || return 1
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules
}

sshosting() {
  ssgo || return 1
  npx firebase-tools@latest deploy --only hosting
}

sszip() {
  cd "/Users/richwilliams/Documents/GitHub" || return 1
  zip -r "$SSHUFFLE_DESKTOP/shareshuffle-current-clean.zip" shareshuffle.github.io \
    -x "*/node_modules/*" \
    -x "*/.git/*" \
    -x "*/.firebase/*" \
    -x "*/__MACOSX/*" \
    -x "*/.DS_Store" \
    -x "*.psd" \
    -x "*.zip"
  echo "$SSHUFFLE_DESKTOP/shareshuffle-current-clean.zip"
}

sscheck() {
  ssgo || return 1
  echo "--- build files ---"
  cat version.txt 2>/dev/null || true
  echo "--- function exports ---"
  grep -n "export const \(getPreview\|renderRoute\|ogImage\|shareImage\|getBuildInfo\)" functions/index.js || true
  echo "--- firebase rewrites ---"
  grep -n "getPreview\|renderRoute\|ogImage\|shareImage\|getBuildInfo\|_build\|_status\|/img/\|/i-" firebase.json || true
}

ssopenstatus() {
  open "https://shareshuffle-c7f96.web.app/_status"
}
