TEMPO FOUNDRY VERSIONED FAVICONS PATCH 07
Generated timestamp: 20260713T190604Z

WHAT THIS DOES
- Keeps the artist-tuned native favicon assets already installed.
- Copies every favicon to a unique timestamped filename.
- Updates all five homepages to reference only the timestamped URLs.
- Versions the web manifest too.
- Prevents Chrome from reusing an older favicon URL from its favicon database.
- Deploys Hosting only. No Functions, Firestore, DNS, or cookies are touched.

INSTALL AND PUSH
ZIP="$HOME/Downloads/tempo-foundry-versioned-favicons-patch-07-20260713T190604Z.zip"
WORK="$HOME/Downloads/tempo-foundry-versioned-favicons-patch-07-20260713T190604Z"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-versioned-favicons-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-VERSIONED-FAVICONS-07.command"
bash "$REPO/DEPLOY-VERSIONED-FAVICONS-07.command"
