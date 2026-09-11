SOLUTION WORKSHOP — LEGAL PATCH 24
July 31, 2026

WHAT THIS PATCH ADDS

- A public Solution Workshop privacy policy at /privacy/
- Public Solution Workshop terms at /terms/
- Transactional SMS/A2P disclosures, including STOP and HELP instructions
- Clear mobile opt-in and non-sharing language
- Additional privacy sections covering security, retention, cookies, choices,
  children, third-party services, and policy changes
- Additional service terms covering provider roles, estimates, scheduling,
  customer responsibilities, materials, permits, safety, warranties, liability,
  Texas law, and disputes
- Solution Workshop Privacy, Terms, and Contact links in the homepage footer
- Matching footer links on both legal pages
- Legal pages in sitemap.xml
- support@solwx.com wired into the homepage contact form

IMPORTANT SCOPE NOTE

This is a narrow overlay patch. It contains only the files needed for the
Solution Workshop legal update and does not replace firebase.json, .firebaserc,
or files belonging to other Tempo Foundry projects.

INSTALL

1. Back up the repository or commit current work.
2. Copy the contents of this patch into the root of:
   ~/Documents/GitHub/shareshuffle.github.io
3. Allow files to merge and replace the matching Solution Workshop files.
4. In Terminal, run:

   cd ~/Documents/GitHub/shareshuffle.github.io
   bash DEPLOY-SOLUTION-WORKSHOP-LEGAL-PATCH-24.command --check
   bash DEPLOY-SOLUTION-WORKSHOP-LEGAL-PATCH-24.command

The deploy command uses Firebase project shareshuffle-c7f96 and deploys only
the hosting target solutionworkshop, mapped to hosting site sol-wx. If the
Firebase CLI is not installed globally, the command uses npx automatically.

EXPECTED URLS

https://solutionworkshop.com/
https://solutionworkshop.com/privacy/
https://solutionworkshop.com/terms/

LEGAL REVIEW

These pages are written as a practical compliance-oriented starting point,
not a substitute for advice from a Texas attorney, tax professional, or the
licensed service provider responsible for regulated work. Review the provider-
role language and any project-specific warranty, cancellation, licensing, or
tax terms before using the pages as final customer contracts.
