ETERNAL ROUTE 66 LIVING ATLAS + CLEAR 66 FAVICON PATCH 03
Generated 2026-07-13

ETERNAL ROUTE 66
- Keeps every quote and atlas entry embedded directly in the homepage.
- Replaces the squished highway-sign favicon with a large cream “66” on Route red.
- Adds Save, Mark Visited, and Suggest Update controls to every atlas row.
- Adds a device-local Road List and itinerary panel.
- Adds quote favorites stored on the device.
- Adds optional Firestore submissions for corrections, memories, updates, and itineraries.
- Database failure never removes or blocks the built-in quotes or atlas.
- Public submissions are private and cannot be read from the frontend.

OTHER PORTFOLIO PAGES
- Adds a consistent portfolio strip linking the five active brands.

INSTALL AND PUSH
ZIP="$HOME/Downloads/tempo-foundry-er66-living-atlas-patch-03.zip"
WORK="$HOME/Downloads/tempo-foundry-er66-living-atlas-patch-03"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-er66-living-atlas-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-ER66-LIVING-ATLAS.command"
bash "$REPO/DEPLOY-ER66-LIVING-ATLAS.command"

VERIFY
Open https://eternalroute66.com/?living-atlas=03
The homepage should show Roadside Wisdom and Towns, Landmarks, Motels & Eats.
The browser tab should show a large clear “66”.
