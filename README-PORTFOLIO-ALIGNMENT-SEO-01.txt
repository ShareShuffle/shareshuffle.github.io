TEMPO FOUNDRY PORTFOLIO ALIGNMENT + SEO PATCH 01
Generated 2026-07-12

WHAT CHANGED
- Five aligned favicon systems from the supplied icons.
- Unique titles, descriptions, canonicals, Open Graph and Twitter metadata.
- JSON-LD structured data appropriate to each company.
- XML sitemaps and robots.txt for all five domains.
- PWA manifests and social preview images.
- New keyword-focused, genuinely useful content pages:
  ShareShuffle: recommendation sharing, creator shelves, business.
  Tempo Foundry: capabilities, partnerships.
  Duet Loop: music dating, concert compatibility, venues.
  Metromance: city dating, city curious, city date ideas.
  Eternal Route 66: book, Route 66 travel, churches, partners.
- Firebase cache headers.
- Exact five-target deployment script.
- Automated .web.app and custom-domain routing verifier.

SAFETY
- Existing ShareShuffle functions and Firestore rules are preserved.
- DEPLOY-PORTFOLIO-SEO.command deploys Hosting only.
- The patch does not change Namecheap DNS or Firebase custom-domain ownership.

INSTALL
ZIP="$HOME/Downloads/tempo-foundry-alignment-seo-patch-01.zip"
WORK="$HOME/Downloads/tempo-foundry-alignment-seo-patch-01"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"

rm -rf "$WORK"
unzip -oq "$ZIP" -d "$HOME/Downloads"
cp "$REPO/firebase.json" "$REPO/firebase.before-alignment-seo-01.json"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/DEPLOY-PORTFOLIO-SEO.command" "$REPO/VERIFY-PORTFOLIO-ROUTING.command"
open "$REPO/DEPLOY-PORTFOLIO-SEO.command"

AFTER DEPLOY
- Open all five .web.app URLs.
- Run VERIFY-PORTFOLIO-ROUTING.command.
- Add each root domain and its www variation to Google Search Console.
- Submit each /sitemap.xml.
- Verify email/contact addresses before publishing forms.
