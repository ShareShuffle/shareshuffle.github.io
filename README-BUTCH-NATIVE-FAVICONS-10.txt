BUTCH BREGER NATIVE FAVICONS PATCH 10
Generated: 20260714T185955Z

SOURCE ART
- 16×16: exact uploaded artist-tuned favicon
- 24×24: exact uploaded artist-tuned favicon
- 32×32: exact uploaded artist-tuned favicon
- 64×64, 128×128, 256×256, 512×512: generated from the uploaded 235×235 original B artwork
- 180×180 Apple touch icon: generated from the uploaded original
- Multi-resolution ICO: contains 16, 24, 32, 64, 128 and 256 pixel variants

The original uploaded source files are preserved in:
sites/breger/favicon-source/

INSTALL AND DEPLOY
ZIP="$HOME/Downloads/tempo-foundry-butch-native-favicons-patch-10-20260714T185955Z.zip"
WORK="$HOME/Downloads/tempo-foundry-butch-native-favicons-patch-10-20260714T185955Z"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-butch-favicons-10-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-BUTCH-NATIVE-FAVICONS-10.command"
bash "$REPO/DEPLOY-BUTCH-NATIVE-FAVICONS-10.command"
