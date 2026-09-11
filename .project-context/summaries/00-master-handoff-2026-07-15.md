# Tempo Foundry Master Handoff — 2026-07-15

---

> This combined file mirrors the repository's hidden `.project-context` summaries.

---

# TEMPO FOUNDRY / SHARESHUFFLE — READ THIS FIRST

This repository is part of the Tempo Foundry / ShareShuffle ecosystem.

Before planning, editing, patching, or deploying anything:

1. Read **every Markdown file** in `.project-context/summaries/` in filename order.
2. Read `.project-context/PROJECT_STATE.json`.
3. Read `.project-context/NEW-CONVERSATION-STARTER.txt`.
4. Treat the user's **current local repository or freshly uploaded repository ZIP** as the source of truth for files.
5. Treat the summaries as the source of truth for goals, decisions, terminology, design intent, known issues, and workflow preferences.
6. Verify the current repository state before creating a patch. Never rebuild from an older patch merely because it is available.
7. Verify Firebase Hosting targets, JavaScript syntax, file paths, image references, live URLs, and rendered output before claiming completion.
8. Do not generate new artwork when the user has uploaded finished icon variants or photographs.
9. Do not clear browser data or recommend doing so as a routine fix. Use versioned filenames and query-string cache busting.
10. Preserve originals. Never silently alter Butch Breger's lines, inscriptions, paper color, stains, or physical character.

The master handoff date is **2026-07-15**. Later summary files supersede earlier ones only where they explicitly say so.

---

# 01 — Ecosystem and Brands

## Parent identity

The parent company and portfolio identity is **Tempo Foundry**.

Tempo Foundry is not merely a software holding page. Its projects share a broader theme: preserving and facilitating connection among people, music, recommendations, places, stories, memories, and culture.

A quiet portfolio-level signature may read:

> A Tempo Foundry project.

For preservation-oriented projects:

> A Tempo Foundry preservation project.

The products should remain visually and narratively independent. Tempo Foundry should be visible enough to establish provenance, but it should not overwhelm the primary brand.

## Active portfolio

### 1. ShareShuffle

Primary domains:

- `shareshuffle.com`
- `shfl.me`

Possible infrastructure or future domain:

- `shuffle.host`

Purpose:

- A better way to share recommendations.
- Share what is worth finding.
- Turn awkward, broken, incomplete, or search-result links into useful share cards.
- Build trusted shelves and recommendation history.

Core concepts already discussed or built in previous work include:

- Share Rescue
- Image Rescue
- cached preview cards
- SMS/iMessage-friendly `shfl.me` cards
- copy, message, voice, and email sharing
- post-share shelf suggestions
- share click tracking
- Chrome extension support
- Firebase Functions and Firestore-backed share/shelf records

Approved brand direction:

- Formal name: **ShareShuffle**
- Everyday name: **Shuffle**
- Lemon/yellow brand color, especially `#FFF78A`
- Approved favicon direction: colorful network-node **S**
- Do not replace uploaded artist-tuned favicon sizes with a single scaled master.

### 2. Duet Loop

Primary domain:

- `duetloop.com`

Purpose:

- Music compatibility, connection, and dating/social discovery.
- A user should be able to answer a no-login quiz, see real compatibility math, and then decide whether to join.
- Before a sufficient user base exists, results must be described honestly as comparisons against launch or sample profiles. Never fabricate a nearby real person.

Desired onboarding:

1. Answer questions without creating an account.
2. See compatibility results and transparent reasoning.
3. Add ZIP/locality concepts where appropriate.
4. Join free.
5. Claim a handle.

Approved or discussed details:

- Short usernames are a fun launch feature rather than a premium upsell.
- Reserved handles should include people important to the project and system names.
- Product-specific handles should be possible.
- Approved favicon: red heart/infinity loop.
- A previously discussed Firebase lead collection was `duetLoopLeads`.
- Product identity must not automatically expose a user's dating profile to their shopping or other public profiles.

### 3. Metromance

Primary domain:

- `metromance.com`

Purpose:

- City/suburb identity, local romance, venue preference, music, culture, and place-based compatibility.
- The product may eventually connect conceptually with Duet Loop but should remain a distinct profile and privacy scope.

Approved favicon:

- Aqua/blue city or hotel-heart icon.
- Native uploaded sizes were provided at 16, 24, 32, 64, 128, 256, and 512 pixels.
- The colorful version is preferred over the earlier black-and-white treatment.

Important privacy rule:

- A Metromance dating identity must not be publicly tied to ShareShuffle, Eternal Route 66, or another Tempo profile without explicit opt-in.

### 4. Eternal Route 66

Primary domains:

- `eternalroute66.com`
- `route66.co` as an intended companion or forwarding domain

Purpose:

- Preserve and present the user's father's **ETERNAL ROUTE 66** material.
- One rich, static-first page with Route 66 places, chapter roadmap, quotes, town/landmark information, food, hotels, photographs, and stories.
- The site can later add user favorites, visited stops, itineraries, corrections, and memories through Firestore, but the core content must continue working without the database.

Approved favicon:

- Red/blue Route 66 shield with a clear `66`.
- Seven artist-tuned native sizes were uploaded.

The site has a direct narrative and cross-link relationship with The Butch Breger Museum.

### 5. The Butch Breger Museum

Primary domain:

- `butchbreger.com`

Firebase Hosting site ID:

- `breger`

Formal name:

# The Butch Breger Museum

Preferred subtitle:

> The online home of the Round Barn Man.

Central voice:

> **Butch drew what he saw, what he remembered, and perhaps what only he could see.**

Purpose:

- Preserve the Rich Williams Collection of art and ephemera by Ernest Lee “Butch” Breger.
- Present a credible online folk-art museum while retaining warmth, humor, accessibility, and the refrigerator-print spirit associated with Butch.
- Connect Butch's art with Arcadia, Oklahoma, the Round Barn, Route 66, storytelling, and his accounts of unidentified flying objects.

Approved favicon:

- A single handwritten **B** derived from Butch's own writing.
- Exact artist-tuned 16, 24, and 32 pixel versions were uploaded.
- A 235×235 original was supplied to derive larger sizes.
- Do not redraw the B unless explicitly requested.

## Other owned or discussed assets

These may be future products, naming assets, redirects, or experiments rather than active portfolio sites:

- `soundflirt.com`
- `tuneflirt.com`
- `tempolove.com`
- Sugarproof
- What the Pup
- `shelfmix.com`
- `shareturbo.com`
- `trbo.me`
- `shareroid.com`
- `shareroids.com`
- several personal and short-link domains

Do not treat these as launched properties without checking the current repository and live domain status.

## Portfolio structure

```text
Tempo Foundry
├── ShareShuffle
├── Duet Loop
├── Metromance
├── Eternal Route 66
└── The Butch Breger Museum
```

The museum and Route 66 site are preservation projects inside the same technical ecosystem, not isolated side websites.

## Brand behavior and tone

The user prefers:

- playful but competent writing
- candid explanations
- strong visual personality
- readable, non-corporate pages
- one-page experiences when appropriate
- meaningful brand separation
- no generic AI art substituted for uploaded assets
- no unnecessary redesign after a direction has been approved

---

# 02 — Technical Architecture and Deployment

## Repository and Firebase

User's standard local repository path:

```text
/Users/richwilliams/Documents/GitHub/shareshuffle.github.io
```

Firebase project:

```text
shareshuffle-c7f96
```

Known or intended Hosting sites and targets:

| Property | Hosting target | Firebase site |
|---|---|---|
| ShareShuffle | `shuffle` | `shareshuffle-c7f96` |
| Tempo Foundry | `tempo` | `tempo-foundry-c7f96` |
| Duet Loop | `duetloop` | `duet-loop-c7f96` |
| Metromance | `metromance` | `metromance-c7f96` |
| Eternal Route 66 | `eternalroute66` | `eternal-route66-c7f96` |
| Butch Breger Museum | `breger` | `breger` |

Never assume these mappings are still present. Check `.firebaserc` and `firebase.json` before every deployment.

## Deployment style preferred by the user

The user strongly prefers:

- one clean Terminal block
- explicit variable names
- `unzip -oq`
- a timestamped backup before copying
- `ditto` for applying an overlay or repository copy
- a single deployment script
- automatic opening of relevant live pages in Safari
- minimal narration during deployment

Typical pattern:

```bash
ZIP="$HOME/Downloads/<patch>.zip"
WORK="$HOME/Downloads/<patch-folder>"
REPO="$HOME/Documents/GitHub/shareshuffle.github.io"
BACKUP="$HOME/Documents/GitHub/shareshuffle-before-<change>-$(date +%Y%m%d-%H%M%S)"

rm -rf "$WORK"
mkdir -p "$WORK"
unzip -oq "$ZIP" -d "$WORK"
ditto "$REPO" "$BACKUP"
ditto "$WORK/shareshuffle.github.io" "$REPO"
chmod +x "$REPO/<DEPLOY-SCRIPT>.command"
bash "$REPO/<DEPLOY-SCRIPT>.command"
```

For a documentation-only overlay, no Firebase deployment is necessary.

## Non-negotiable patching rules

1. **Start from the user's current repository state.**
   - Ask for or inspect a fresh ZIP when the current state is not known.
   - Do not rebuild a full project from an older patch.

2. **Validate before claiming success.**
   - confirm file paths
   - confirm Firebase targets
   - parse or execute-check JavaScript
   - confirm image files referenced by HTML exist
   - confirm manifests and favicon URLs exist
   - check live URLs after deployment
   - inspect rendered output when possible

3. **Do not rely on conversation claims alone.**
   - A previous assistant may have said a patch was created when no artifact exists.
   - The user's local Downloads folder or repository may contain a patch that is absent from the current ChatGPT runtime.
   - Verify instead of guessing.

4. **Preserve backups.**
   - Every major patch should create a timestamped repo backup.

5. **Avoid browser-data destruction.**
   - The user's browser sessions and cookies matter.
   - Do not casually recommend clearing Safari or Chrome data.
   - Use timestamped filenames and query-string cache busting.

6. **Do not confuse site IDs with target names.**
   - For example, the Butch site ID is `breger`; the Hosting target should also be checked as `breger`.

## Static-first architecture

The portfolio uses Firebase Hosting and can use Firestore/Functions, but important public content should remain static-first:

- Route 66 quotes and atlas should render from embedded or local static data.
- Museum catalog records and image metadata can initially be local JSON.
- Database enhancements should not make the basic page blank when Firestore or scripts fail.
- External CDNs should enhance the experience rather than own the core content.

## Front-end stack preferences

Approved for the museum and Route 66 experiences:

- Bootstrap 5
- Font Awesome
- vanilla JavaScript
- GLightbox or a comparable polished lightbox
- smooth one-page anchor navigation
- lazy-loaded responsive images
- print CSS
- full-resolution downloads loaded only on demand
- accessible focus states
- high contrast

The user explicitly asked for pages to open in Safari after a patch is deployed.

## Favicons and cache behavior

All five existing portfolio sites received timestamped or versioned favicon URLs to bypass stubborn browser caches.

Approved native icon families:

- ShareShuffle: colorful `S`
- Duet Loop: red heart/infinity
- Metromance: aqua/blue city or hotel-heart
- Tempo Foundry: colorful metronome
- Eternal Route 66: red/blue `66` shield
- Butch Breger Museum: handwritten `B`

Rules:

- Preserve exact native 16, 24, and 32 versions when provided.
- Preserve all artist-tuned sizes when seven variants are supplied.
- Generate larger sizes only from the supplied high-resolution original.
- Build a multi-resolution `.ico`.
- Include Apple touch and web manifest icons.
- Use a fresh filename timestamp when replacing a favicon.

## Accessibility

The user explicitly wants WCAG-oriented contrast:

- approximately 4.5:1 for normal text
- approximately 3:1 for large text and user-interface boundaries
- no white-on-cream
- no pale cream text on cream cards
- no nearly invisible state abbreviations
- no borderline subtitle contrast merely because it looks tasteful

Use clear keyboard focus indicators and do not hide key information in hover-only interactions.

## Existing ShareShuffle implementation context

Known technical context from previous work:

- Firebase project `shareshuffle-c7f96`
- Firestore collections including `shares`, `shelves`, and `waitlist`
- Functions such as preview, rendering, image generation, data retrieval, and click tracking
- Chrome extension work under Manifest V3
- historical Chrome Web Store rejection for remotely hosted code
- Node 22 functions environment
- server-side cached preview/image behavior
- slug normalization restricted to lowercase letters, numbers, and hyphens

This summary is not a substitute for inspecting the current source tree before modifying ShareShuffle.

---

# 03 — Eternal Route 66

## Purpose and source

Eternal Route 66 is based on the user's father's project/book:

# ETERNAL ROUTE 66

The desired public experience is a large, single-page Route 66 site with:

- hero material
- quotes and quote generator
- chapter roadmap
- towns
- landmarks
- restaurants
- hotels
- a living atlas
- photographs
- family and community stories
- contact and social calls to action

The source material was recovered from a known file:

```text
eternal-route66-one-page.html
```

A previously materialized copy existed as:

```text
/mnt/data/er66-source/eternal-route66-one-page.html
```

Important content known to be present in that source:

- 12 quotes
- 158 atlas/place records
- chapter roadmap
- `const QUOTES=`
- `const ATLAS=`
- `renderAtlas()`

## Critical historical bug

The original one-page file contained an invalid JavaScript single-quoted string with literal line breaks in the contact-form body.

The syntax error prevented the site's main JavaScript from running, which made these sections appear empty:

- quotes
- chapter roadmap
- atlas
- filters
- photos

The fix was to encode line breaks as `\n` and verify JavaScript syntax.

Future rule:

> Never replace or rewrite the entire Route 66 page merely because the content appears blank. Check JavaScript syntax and the original static source first.

## Static-first requirement

The quotes, roadmap, atlas, and primary editorial content must remain available without Firestore.

Potential later enhancements:

- save favorite stops
- mark places visited
- create itineraries
- submit corrections
- submit memories
- add community photographs
- add editor moderation
- use Firestore enrichment with static fallback

## Photo wall direction

The original concept considered automatically searching social hashtags, including combinations such as:

- `#route66`
- `#Jesus`
- `#cross`
- `#bible`
- `#christ`
- `#christian`

The approved direction is **not** an unmoderated live social feed.

Reasons:

- hashtag results are noisy and may be irrelevant
- family-friendly status cannot be assumed
- external platform APIs and scraping rules change
- copyright and permission matter
- social image URLs can expire or require login

Preferred source order:

1. family-owned photographs
2. photographs submitted directly with permission
3. manually approved outside photographs with attribution
4. curated supplemental imagery with clear usage rights
5. automated discovery only as a private candidate queue

Every public image should be approved before display.

## Family-friendly moderation principles

Reject or flag:

- sexual or nude imagery
- graphic violence
- drugs
- hate imagery
- profanity in image or caption
- harassment
- political rage bait
- spam
- unclear permission for photographs of children
- irrelevant interpretations of broad tags such as `#cross`

Potential filters:

- All
- The Road
- Churches
- Crosses
- Scripture
- People
- Landmarks
- Sunsets
- Roadside Faith

Potential heading:

> **Faith Along the Mother Road**  
> Crosses, churches, people, places, and moments of grace found along Route 66.

## Uploaded Route 66 photographs

A Route 66 archive was uploaded and extracted during the project. It included standard image formats and some HEIC files.

The assistant was asked to make educated identifications using:

- EXIF metadata
- GPS and date data
- visible signage
- business names
- architecture
- photo sequence
- known Route 66 landmarks
- web verification when necessary

Identification must be labeled:

- **Confirmed**
- **Likely**
- **Needs confirmation**

Never convert a guess into a confident published caption without support.

Strongly suggested or recognizable subjects from the uploaded collection included:

- Cadillac Ranch, Amarillo, Texas
- Blue Whale of Catoosa, Oklahoma
- Arcadia and Round Barn area
- POPS
- Meadow Gold sign, Tulsa
- Route 66 museum displays
- historic service stations
- motel signs
- roadside giants
- Santa Monica Pier
- Ambler-Becker Station
- Butch Breger art and notes

These identifications must be rechecked against the actual image files before publishing.

## Photo handling

Preferred directory pattern:

```text
sites/eternal-route66/photos/
├── display/
├── thumbs/
└── full-resolution-or-original-files
```

Each public record should eventually include:

```text
filename
title
town
state
subject
date or approximate date
photographer
caption
alt text
tags
permission status
confidence
source filename
```

High-resolution files should load only when requested.

## Relationship with The Butch Breger Museum

Eternal Route 66 should include a prominent but tasteful path to the museum, especially around:

- Arcadia
- the Round Barn
- Butch's artwork
- Route 66 characters
- preservation stories

The museum should link back to Eternal Route 66 for the broader road experience.

## Current caution

A previous large museum/ER66 patch was discussed and a later “final patch” was described in conversation. The current runtime does not contain a verifiable copy of that final artifact. The user's local repository may contain it.

Before any new ER66 patch:

1. ZIP the current local repository.
2. Upload it to the conversation.
3. Inspect the actual `sites/eternal-route66` directory.
4. Verify that quotes and atlas still execute.
5. Verify the current photo wall and Butch museum links.
6. Preserve working content.

---

# 04 — The Butch Breger Museum

## Formal identity

Formal name:

# The Butch Breger Museum

Preferred subtitle:

> The online home of the Round Barn Man.

Browser/SEO title may include:

> The Butch Breger Online Museum | Arcadia, Oklahoma

The word “Online” is useful in metadata, but the visible formal name should remain simple and permanent.

Central voice:

> **Butch drew what he saw, what he remembered, and perhaps what only he could see.**

This quote was strongly approved by the user and should remain central to the site.

## Who was Butch?

Ernest Lee “Butch” Breger was associated with the Arcadia Round Barn, Route 66, storytelling, handwritten signs, drawings, and local preservation.

The user met Butch in 2005 and provided this recollection:

> I met Butch in 2005 when he told me no other barn in the world was rounder and much of his art is inspired by the unidentified flying objects he saw out the window of his second story apartment over the gas station caddy corner to the round barn, where his parents owned both.

For formal site copy, this should be presented as Rich Williams's recollection rather than silently treated as independently documented fact.

A polished museum version may read:

> “I met Butch in 2005. He told me no other barn in the world was rounder. He also told me that much of his art was inspired by unidentified flying objects he saw from the second-story apartment over the gas station caddy-corner to the Round Barn.”  
> — Rich Williams

## Source and research links supplied by the user

- Route 66 News:  
  `https://www.route66news.com/2017/10/20/butch-breger-caretaker-round-barn-dies/`

- The Oklahoman:  
  `https://www.oklahoman.com/story/business/real-estate/2017/10/28/heaven-takes-the-man-at-the-round-barn-in-arcadia-oklahoma/60565845007/`

- Find a Grave:  
  `https://www.findagrave.com/memorial/184376726/ernest-lee-breger`

- KGOU:  
  `https://www.kgou.org/arts-and-entertainment/2013-03-20/a-round-barn-rendezvous-on-historic-route-66`

- Oklahoma City Cremation obituary:  
  `https://www.oklahomacitycremation.com/obituaries/ernest-lee-breger`

- Arcadia Historical & Preservation Society:  
  `https://arcadiaroundbarn.com/about-the-arcadia-historical-society/`

The museum should summarize and link rather than copy full outside articles.

Where published history and personal recollection differ, preserve both as clearly labeled sources until further documentation resolves the difference.

## Museum approach

The site should feel like a real small folk-art museum rather than a generic artist portfolio.

Desired one-page sequence:

```text
Museum masthead
Central quote
Who Was Butch?
Rich's 2005 recollection
The Collection
Visions Above Arcadia
The Round Barn Man
Photographs, articles, and ephemera
Timeline
Research and sources
Help identify an artwork
About the collection
Tempo Foundry / Eternal Route 66 footer
```

Approved technology:

- Bootstrap
- Font Awesome
- GLightbox or comparable lightbox
- zoom and full-screen viewing
- lazy-loading
- responsive masonry-style gallery
- print CSS
- search/filter support
- shareable anchors
- full-resolution downloads

## Visual direction

- warm paper background
- deep ink black
- faded barn red
- Route 66 blue
- restrained archival typography
- authentic irregular lines
- no fake “crazy artist” design
- no excessive UFO gimmicks
- art remains the loudest element
- Butch's shaky lines are a signature, not a defect to smooth away

Potential opening:

```text
THE BUTCH BREGER MUSEUM

The online home of the Round Barn Man

“Butch drew what he saw, what he remembered,
and perhaps what only he could see.”

[ Enter the Collection ] [ Who Was Butch? ]
```

## Museum records

Every work should receive a permanent accession number:

```text
BB-0001
BB-0002
BB-0003
```

The number does not change when a title or identification improves.

Recommended record fields:

```text
accession number
formal or descriptive title
artist
date or approximate date
medium
dimensions
inscriptions
subject
acquisition story
condition
front image
back image
collection
provenance
confidence
copyright/status note
image-treatment note
```

Unknown titles should be presented honestly:

> Untitled — descriptive title assigned by the collection.

Identification states:

- Confirmed
- Likely
- Unidentified
- Identification requested

## High-resolution philosophy

The user wants visitors to have full-resolution access so they can print the work and put it on a refrigerator. This is considered faithful to Butch's vibe.

Recommended image levels:

```text
thumbnail
display/zoom version
full-resolution download
untouched source retained privately
```

The gallery should not load all full-resolution originals during initial page load.

Suggested rights language:

> Please enjoy, print, and share these images for personal, educational, and noncommercial use. Commercial reproduction requires permission from the applicable rights holder.

Important:

- ownership of physical art does not automatically establish ownership of copyright
- do not imply broad commercial rights without research
- do not provide merchandising or licensing language until rights are clarified

## Image preservation and correction

The user photographed the art with an iPhone rather than having it professionally scanned.

Approved correction principles:

- preserve untouched original
- read EXIF orientation
- rotate sideways images
- detect the sheet's four corners
- correct keystone perspective
- crop away floor, wall, table, frame, or furniture
- preserve the paper
- preserve stains, creases, inscriptions, paper color, and edges
- use restrained exposure and sharpness correction
- never smooth or redraw Butch's lines
- flag uncertain images instead of damaging them automatically

Suggested file pattern:

```text
originals/BB-0001-original.jpg
archival/BB-0001-corrected.jpg
display/BB-0001.webp
thumbs/BB-0001.webp
```

## Batch straightening tool

A native Mac helper was created:

```text
Butch-Artwork-Straightener-Mac.zip
```

It uses Apple Vision and Core Image locally.

Intended behavior:

- choose a folder
- process JPG, PNG, HEIC, TIFF, WEBP, and similar formats
- detect paper rectangle
- correct perspective
- preserve the paper
- create full-resolution JPEGs, web previews, and thumbnails
- send uncertain images to `Needs Review`
- create a visual HTML report and CSV
- leave originals untouched

Gatekeeper behavior:

Because the tool is unsigned and unnotarized, macOS may say Apple cannot verify it.

Preferred safe opening method:

1. Double-click once and dismiss the warning.
2. Open System Settings.
3. Privacy & Security.
4. Click **Open Anyway** for the specific tool.
5. Do not disable Gatekeeper globally.

Terminal fallback for the specific tool:

```bash
TOOL="$HOME/Downloads/Butch-Artwork-Straightener"
xattr -dr com.apple.quarantine "$TOOL"
chmod +x "$TOOL/Butch Artwork Straightener.command"
open "$TOOL/Butch Artwork Straightener.command"
```

## Corrected archive

The user uploaded:

```text
01 Corrected Full Resolution.zip
```

The intent is:

- replace the corresponding museum image when the corrected filename clearly matches
- preserve the older phone crop privately
- retain an older crop publicly only when it contains meaningful material missing from the corrected version
- label such an image as an alternate photograph
- place corrected images prominently
- do not create duplicate catalog records for the same physical artwork

A previous response claimed specific counts and replacement coverage. Those counts must be verified directly from the uploaded ZIP and current repository before the next patch.

## Favicon

The museum favicon is Butch's handwritten capital **B**.

User-supplied files:

- exact 16×16
- exact 24×24
- exact 32×32
- original 235×235 art for generating 64, 128, 256, 512, Apple touch, and ICO sizes

Rules:

- preserve the exact small variants
- generate larger variants from the supplied original
- keep original source files in the repository
- use timestamped URLs when replacing the active favicon
- do not generate alternate art unless requested

## Firebase and domain

Firebase Hosting site ID:

```text
breger
```

The screenshot showed the site existing and awaiting its first release at one stage.

Useful default URL:

```text
https://breger.web.app
```

Custom domain:

```text
https://butchbreger.com
```

Deployment and DNS are separate. Verify both:

- that the `breger` Hosting target deploys
- that the custom domain's DNS/status is complete

## Cross-linking

Museum footer:

> The Rich Williams Collection  
> A Tempo Foundry preservation project in the ShareShuffle ecosystem.

The museum should link to Eternal Route 66.

Eternal Route 66 should link to the museum near Arcadia, the Round Barn, or Butch-related content.

Tempo Foundry should list the museum as a fifth active portfolio property.

---

# 05 — Identity, Privacy, and Europe

## Account architecture direction

The user wants the ecosystem to support Europe and especially the right to be forgotten, with dating products receiving the strictest treatment.

Recommended structure:

```text
Google / Apple / email authentication
                ↓
Firebase Authentication UID
                ↓
Private Tempo Account
                ↓
Optional Tempo-wide handle reservation
                ↓
Separate product profiles and product-specific handles
```

Key rules:

- Firebase UID is the immutable internal account key.
- Email, Google identifier, account number, and handle are not security keys.
- A human-readable Tempo account number may exist for support.
- A universal Tempo handle may reserve the same name across products.
- Product-specific handles must remain possible.
- A user may use a Tempo handle in one product and a different handle in another.
- Cross-product discoverability is opt-in.
- Dating profiles must not be automatically linkable to shopping or public community activity.

Possible data model, still conceptual unless found in current code:

```text
users/{uid}
accounts/{accountNumber}
handles/{scope_handle}
productProfiles/{uid_product}
```

Possible handle scopes:

- Tempo/universal
- Shuffle
- Duet Loop
- Metromance
- Eternal Route 66
- Butch Breger Museum/community

Handle claims must be enforced server-side with transactions.

## Privacy promise

Preferred portfolio-level promise:

> **Your identity belongs to you.**  
> Pause it, separate it, download it, or delete it. A Tempo Account connects our products; it does not give us permission to combine every part of your life.

Preferred dating promise:

> **Leaving should be easier than joining.**

## Deletion levels

### Pause

- hide profile
- stop matching/discovery
- preserve profile, answers, messages, and handle
- allow later return

### Delete one product identity

Example:

> Delete my Metromance profile but keep my Tempo Account and Duet Loop profile.

This should remove or anonymize product-specific:

- profile
- handle
- dating questionnaire answers
- match vectors
- likes/passes
- location history
- photos
- recommendations
- public links
- user-visible conversations according to the disclosed message policy

### Delete the entire Tempo Account

This should trigger deletion across all connected products and processors where applicable.

Potential workflow:

```text
User confirms deletion
        ↓
Dating profile disappears immediately
        ↓
Matching and messaging stop
        ↓
Photos become inaccessible
        ↓
Tracked deletion job runs
        ↓
Completion notice is sent
```

A short recovery window may exist, but a dating profile should be hidden immediately. A “delete now without recovery” option is desirable.

## Deletion orchestration

Conceptual record:

```text
deletionRequests/{requestId}
```

Possible fields:

```text
uid
scope
status
requestedAt
graceEndsAt
authentication status
Firestore status
Storage status
messages status
analytics status
email status
third-party status
backup-expiration status
```

Deletion must be a tracked backend workflow rather than a button that only deletes one Firestore document.

## Privacy Center

One Tempo Privacy Center should eventually provide:

- download my data
- correct my data
- manage consent
- manage connected sign-in methods
- manage product identities
- pause discovery
- delete one product profile
- delete entire Tempo Account
- track a privacy request

Potential export:

```text
account.json
handles.json
duet-loop/profile.json
duet-loop/quiz-answers.json
metromance/profile.json
metromance/preferences.json
shuffle/shelves.json
media/
README.html
```

Exclude another person's private data and sensitive abuse-prevention details.

## Dating-specific privacy defaults

- exact location is never public
- avoid background location unless necessary
- separate city/ZIP from exact coordinates
- quizzes private by default
- do not import indiscriminate music history
- sexual orientation and dating preference are not used for unrelated advertising
- discoverability is controlled explicitly
- contact syncing is opt-in
- no public Tempo-wide link between product profiles by default
- define inactivity and retention periods
- restrict staff access
- keep audit logs
- conduct a formal privacy and risk review before European launch

## Messages after deletion

A reasonable disclosed model:

```text
Before:
Rich: That show was amazing.

After account deletion:
Deleted member: That show was amazing.
```

Remove:

- profile link
- photo
- username
- location
- compatibility score
- cross-product links

Retain another participant's copy only when justified and disclosed.

## Safety records

A dating platform may need to prevent a banned abuser from immediately re-registering.

Use a tightly restricted safety record that is separate from ordinary product data and contains only what is necessary, with:

- limited access
- reason code
- legal/operational basis
- retention expiration
- no marketing or matching use

Do not keep a full deleted profile indefinitely merely because a report once existed.

## Status

These are product architecture and policy decisions. They should be implemented deliberately in code, rules, data retention jobs, product copy, and legal review. Do not claim they are already implemented unless the current repository proves it.

---

# 06 — Patch History, Current State, and Risks

## Known patch sequence

The working history included patches with names or roles similar to:

1. Tempo Foundry alignment/SEO
2. Duet quiz and ER66 restoration
3. ER66 living atlas
4. ER66 exact-source restoration
5. ER66 JavaScript/render fix
6. favicon and accessibility update
7. versioned favicon cache-busting
8. colorful favicon set and Safari launch
9. ER66 photo wall plus Butch Breger Museum
10. Butch native handwritten-B favicon update
11. a “final museum + ER66” update was described in conversation
12. this project-context documentation overlay

## Important artifact caveat

At the time this summary was created, the active ChatGPT runtime visibly contained:

- `tempo-foundry-er66-breger-museum-patch-09-20260714T171217Z.zip`
- `tempo-foundry-butch-native-favicons-patch-10-20260714T185955Z.zip`
- `01 Corrected Full Resolution.zip`
- `Butch-Artwork-Straightener-Mac.zip`
- earlier Tempo/ER66/favicon patches

The runtime did **not** contain a verifiable copy of the previously described Patch 11 artifact.

This does not prove Patch 11 is absent from the user's Mac. It means:

> Do not use an older ChatGPT artifact as the base for the next full patch until the current local repository is uploaded and inspected.

## Likely current local state

The user's local repository may already include:

- Patch 09 museum and ER66 work
- Patch 10 handwritten B favicon
- some or all of the corrected artwork replacement work described as Patch 11
- live deployments not reflected in this runtime

Only a fresh repo ZIP or direct inspection can resolve this.

## Risks to avoid

### 1. Regressing ER66

The quotes and atlas previously vanished because of one JavaScript syntax error.

Always verify:

- `const QUOTES=`
- `const ATLAS=`
- `renderAtlas()`
- browser console
- contact-form JavaScript syntax

### 2. Rebuilding from stale files

A 4 MB favicon patch is not a safe base for a later 300 MB museum state.

Use overlays for isolated changes or start from the actual current repository.

### 3. Duplicating art

Corrected photographs should replace the presentation image for the same physical object. Do not create a second accession number merely because a better photograph exists.

### 4. Publishing internal context

The `.project-context` folder is intentionally dot-prefixed so it should remain outside normal Firebase Hosting output. Confirm ignore behavior before deployment.

### 5. Overcorrecting art

Do not:

- whiten aged paper into pure white
- remove stains or creases without a curatorial reason
- smooth shaky lines
- reconstruct missing marks with generative fill
- crop signatures
- change the apparent medium
- make the paper transparent by default

### 6. Inventing photo facts

Use confirmed/likely/needs-confirmation states.

### 7. Browser cache confusion

Use timestamped asset names and open live pages with query parameters. Do not ask the user to destroy cookies or saved sessions.

### 8. Claiming deployment without checking

A successful ZIP build is not a Firebase deployment. A successful default Hosting URL does not prove custom DNS is active.

## User workflow preferences

- One concise deployment block.
- Backup first.
- Use Safari for post-deploy inspection.
- Avoid repeated clarifying questions when the intent is obvious.
- Own mistakes directly.
- Do not generate images simply because images were uploaded.
- No new art unless explicitly requested.
- Keep files and commands easy to identify by patch number and timestamp.

---

# 07 — Next Actions and Handoff

## Is another live-site patch required immediately?

A **website patch can wait** until a fresh copy of the current local repository is available.

The only patch that should be applied immediately is this small documentation/context overlay. It:

- does not change any public page
- does not deploy to Firebase
- adds durable project summaries to the repository
- makes the next conversation much safer and faster

Do not create a new full museum/ER66 patch from Patch 09 or Patch 10 alone.

## Best next technical step

At the beginning of the next conversation:

1. On the Mac, ZIP the actual current repository:

```bash
cd "$HOME/Documents/GitHub"
ditto -c -k --sequesterRsrc --keepParent \
  "shareshuffle.github.io" \
  "$HOME/Desktop/shareshuffle-current-$(date +%Y%m%d-%H%M%S).zip"
```

2. Upload that new ZIP.
3. Upload `01 Corrected Full Resolution.zip` again only if it is not already available in the new conversation or Library.
4. Tell the assistant to read `.AI_CONTEXT.md` and every file in `.project-context/summaries/`.
5. Ask it to inspect before changing anything.

## Recommended next task

After inspection:

> Integrate the corrected Butch artwork into the current museum by filename and accession number. Replace presentation images where the match is clear, retain originals privately, keep useful alternates only when they add information, verify ER66 and museum links, then build one verified overlay and deploy only the affected Hosting targets.

## Verification checklist for that patch

### Repository

- identify exact current museum directory
- count catalog records
- count corrected files
- map filenames to accession numbers
- report unmatched corrected files
- report catalog works without corrected replacements
- preserve originals
- do not renumber accession records

### Museum

- corrected image is the main display image
- thumbnail/display/full-resolution files all exist
- lightbox works
- download works
- print behavior works
- search and filters work
- captions and confidence labels remain honest
- favicon uses the handwritten B
- high contrast and keyboard focus remain acceptable

### ER66

- quotes render
- atlas renders
- roadmap renders
- photo wall loads local images
- Butch museum link works
- no stale Unsplash placeholders unless intentionally retained
- no JavaScript syntax errors

### Tempo Foundry

- museum appears as a portfolio property
- portfolio count and wording are correct
- links open the intended domains

### Firebase

- `.firebaserc` maps all intended targets
- `firebase.json` uses correct public directories
- deploy only affected targets
- verify default Firebase URL
- verify custom domain separately
- open updated sites in Safari

## New conversation starting prompt

Use the exact text in:

```text
.project-context/NEW-CONVERSATION-STARTER.txt
```

The most important sentence is:

> Treat the uploaded current repository as the source of truth for files, and the project summaries as the source of truth for decisions and intent.

## Long-term maintenance

After every major work session:

1. add a new dated file under `.project-context/summaries/`
2. summarize:
   - what changed
   - what was deployed
   - exact artifact name
   - exact source repo used
   - live URLs checked
   - unresolved issues
   - next recommended task
3. update `PROJECT_STATE.json`
4. never rewrite old summaries to hide mistakes; add a later correction
5. upload the new master handoff to the ChatGPT Library when useful

This creates an auditable project memory and prevents another conversation from rebuilding old work.

---

# New Conversation Starter

```text
We are continuing the Tempo Foundry / ShareShuffle ecosystem.

Before planning or changing anything:

1. Search my ChatGPT Library for **“Tempo Foundry Master Handoff 2026-07-15”** and read it completely.
2. I will also upload my CURRENT repository ZIP. Read `.AI_CONTEXT.md`, every file in `.project-context/summaries/`, and `.project-context/PROJECT_STATE.json`.
3. Treat the uploaded current repository as the source of truth for files.
4. Treat the summaries as the source of truth for approved decisions, goals, terminology, workflow preferences, and known risks.
5. Verify the actual current state before creating a patch.
6. Do not rebuild from an older patch.
7. Do not generate images unless I explicitly ask for new art.
8. Preserve all original photographs and Butch Breger artwork.
9. Use one clean deployment block, back up the repo first, and open affected sites in Safari after deployment.

My next task is:

[PASTE THE NEXT TASK HERE]
```
