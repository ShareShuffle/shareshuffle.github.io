TEMPO FOUNDRY PATCH 22 — SOLUTION WORKSHOP

What this adds
==============

- A complete responsive Solution Workshop site in sites/solution-workshop.
- A separate Firebase Hosting target named "solutionworkshop".
- Deployment to Firebase project and Hosting site "sol-wx" without touching ShareShuffle, Tempo Foundry, LNKDX, LinkWombat, Charlie RW, or the other hosted properties.
- solutionworkshop.com as the canonical public domain.
- solwx.com as the compact domain, with a same-path browser redirect to solutionworkshop.com as a fallback.
- A Solution Workshop card on the Tempo Foundry home and projects pages.
- Product and Foundry diary documentation.
- SEO and social metadata, structured data, sitemap, robots file, web manifest, original favicon, keyboard accessibility, safe CDN fallbacks, and Firebase cache/security headers.

Contact behavior
================

This patch deliberately does not pretend the form sent a message.

Until a dedicated Solution Workshop email address or CRM endpoint exists, the form prepares and copies the inquiry, then offers the Tempo Foundry contact page. To connect a dedicated inbox later, edit:

  sites/solution-workshop/site-config.js

and put the address in:

  contactEmail: ""

The form will then open the visitor's email application with the inquiry already prepared.

Apply and deploy
================

1. Merge this patch into:

   ~/Documents/GitHub/shareshuffle.github.io

2. Run:

   cd ~/Documents/GitHub/shareshuffle.github.io
   bash DEPLOY-SOLUTION-WORKSHOP.command

The deployer uses Firebase CLI 15.24.0 through npx. A global "firebase" command is not required. It validates the patch, checks project access, creates the Hosting site only if it is genuinely missing, repairs only the Solution Workshop target mapping, deploys that target, and publishes the new Solution Workshop card on the Tempo Foundry Hosting target.

3. Test:

   https://sol-wx.web.app

4. In Firebase Console, connect these custom domains to Hosting site "sol-wx":

   solutionworkshop.com
   www.solutionworkshop.com
   solwx.com
   www.solwx.com

The page identifies solutionworkshop.com as canonical. Requests arriving through solwx.com redirect to the same path at solutionworkshop.com.

Important
=========

- The default Firebase project for the rest of the repository remains shareshuffle-c7f96.
- Solution Workshop's project alias is "solutionworkshop" and resolves to sol-wx.
- No Cloud Functions, Firestore rules, Stripe configuration, or unrelated Hosting targets are deployed by this command.
- The only Hosting targets deployed are Solution Workshop in project sol-wx and the Tempo Foundry portfolio in project shareshuffle-c7f96.
