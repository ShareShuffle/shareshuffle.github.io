SHARESHUFFLE HOTFIX — 2026.06.12-shelf-syntax-fix-21

Patch: shelf-newline-syntax-fix

Why:
- shelf.html was throwing:
  Uncaught SyntaxError: Invalid or unexpected token at shelf.html line 535.
- The problem was a generated JavaScript string literal that accidentally contained real line breaks:
  .join("
")
  instead of:
  .join("\\n")

What changed:
- Fixed the broken buildShareMessage newline code in shelf.html.
- Added mobile-web-app-capable meta alongside the deprecated apple-only meta.
- Build markers updated.

Apply:
  ditto "/Users/richwilliams/Downloads/shareshuffle-shelf-syntax-fix-21/shareshuffle.github.io" "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  cd "/Users/richwilliams/Documents/GitHub/shareshuffle.github.io"
  npm --prefix functions install
  npx firebase-tools@latest deploy --only hosting,functions,firestore:rules

Test:
  open "https://shareshuffle.com/shelf.html?u=rich&s=bass-gear"
  open "https://shareshuffle.com/shelf.html?s=bass-gear"
