Patch 61 — create flow title fallback + six image chooser

Build: 2026.06.19-create-flow-title-six-images-61

Fixes:
- Create Share Link should not spin forever on slow Firestore id/shelf checks or image cache work.
- Share creation uses timeouts around non-essential reads/verifications.
- Final share title is never blank or junk; if store metadata is weak, use a friendly fallback such as Amazon find, Hydration find, Audio find, Style find, or Shared find.
- Preview fill also supplies a fallback title when an image is found but the store title is blocked.
- Image chooser is capped at six image options instead of eight.
- Status activity always stops when create finishes/fails.
