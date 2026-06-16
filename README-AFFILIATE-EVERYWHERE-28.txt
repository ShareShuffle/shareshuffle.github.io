SHARESHUFFLE HOTFIX — 2026.06.13-affiliate-everywhere-28

Patch: amazon-and-walmart-affiliate-everywhere

Why:
- Shelf page store buttons were still leaking raw Amazon/Walmart URLs.
- Patch 27 fixed Amazon server/share fallback, but the shelf client helper was not patched because the helper shape had drifted.
- Revenue links have to work from shelf cards and share pages.

What changed:
- Server-side /shareData and /shelfData both run store URLs through withAffiliateUrl().
- share.html client-side fallback runs store URLs through withAffiliateUrl().
- shelf.html client-side fallback now also runs store URLs through withAffiliateUrl().
- Amazon:
    Adds tag=shareshuffle-20 only when no Amazon tag already exists.
- Walmart:
    Converts walmart.com URLs to:
    https://goto.walmart.com/c/1936697/565706/9383?veh=aff&sourceid=imp_000011112222333344&u={encoded destination}
- Existing Walmart Impact/goto URLs are not double-wrapped.
- Hosted ShareShuffle/shfl/shelfmix URLs are still rejected as store destinations.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-affiliate-everywhere-28/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shareData?id=zhcaa"
  open "https://shareshuffle.com/shelfData?s=bass-gear"
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"

Verify:
- Amazon item URLs include tag=shareshuffle-20.
- Walmart item URLs start with goto.walmart.com/c/1936697/565706/9383.
