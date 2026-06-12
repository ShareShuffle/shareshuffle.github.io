# ShareShuffle app next-step guidance patch 12

Build: 2026.06.12-app-next-step-12

This patch improves the /app/ post-create state. After a share is created and copied, the app now gives clear next-step guidance instead of only saying "Copied: {id}".

Visible changes:
- Adds a blue next-step guidance box inside the Last share ready panel.
- Explains what Message, Email, Share, Copy Text, and Open do.
- Updates create status to say the share is copied and the user should choose a next action.
- Handles Safari clipboard block with the same action guidance.
- Scrolls the Last share ready panel into view after creation so the next action buttons are visible.

This patch intentionally does not change Amazon image ranking or the tee-size-chart issue. That should be a separate getPreview/image-priority patch.
