TEMPO FOUNDRY PATCH 20 — CHARLIE R. WILLIAMS VOICEOVER PORTFOLIO

What this adds
==============

- A complete responsive portfolio site in sites/charlie-rw.
- Bootstrap 5, Font Awesome, Google Fonts, local optimized headshots, SEO metadata, structured data, sitemap, robots file, and accessible responsive navigation.
- An honest first-reel story: no invented credits, Charlie's backstage lighting experience, mentorship with Joe Loesch, and the professional demo recording Thursday.
- A working custom reel player that stays in "in production" mode until an audio URL is configured.
- A parent-managed contact path with no school, personal phone, home address, birth date, or schedule published.
- Firebase Hosting target "charlie" using site ID charlierw-c7f96.

Apply and deploy
================

1. Copy/merge this patch into:

   ~/Documents/GitHub/shareshuffle.github.io

2. Double-click:

   DEPLOY-CHARLIE-RW-PATCH-20.command

   The script uses npx, so a global firebase command is not required. On the first run it creates the Firebase Hosting site if needed, applies the target, validates the site, and deploys it.

3. In Firebase Console, open Hosting > charlierw-c7f96 and connect the custom domain:

   charlierw.com

   Add the DNS records Firebase provides at the registrar. Firebase will provision HTTPS after DNS verifies.

4. Create or forward:

   contact@charlierw.com

   All inquiries should remain parent-managed.

After Thursday's demo
=====================

1. Put the finished audio in:

   sites/charlie-rw/assets/audio/charlie-r-williams-voiceover-demo.mp3

2. Edit sites/charlie-rw/site-config.js:

   demoUrl: "/assets/audio/charlie-r-williams-voiceover-demo.mp3",
   demoDownloadUrl: "/assets/audio/charlie-r-williams-voiceover-demo.mp3",
   demoStatus: "Professional voiceover demo — now available"

3. If a PDF résumé is added, place it in sites/charlie-rw/assets/ and set resumeUrl in the same configuration file. The current page deliberately does not advertise a résumé or credits that do not yet exist.

4. Run the deploy command again.

Image choices
=============

- Hero: IMG_4306
- Story/relaxed: IMG_4314
- Formal: IMG_4298
- Classic: IMG_4302

The deployed copies are renamed, stripped of metadata, and optimized as responsive WebP/JPEG assets. Original uploads are not published.
