# Patch 16 — LNKDX Hotfix Capture and Project Diary

Date: 2026-07-17

This documentation-focused patch captures all post-Patch-15 LNKDX work and adds a durable `DIARY/` directory.

It also preserves the deployed LNKDX resolver/client hardening that occurred after Patch 15:

- no-store Park lookups
- client cache busting
- useful resolver error output
- URL trimming
- LinkedIn validation with or without `www`
- tolerant destination-field aliases

The LR failure was ultimately caused by the manually entered Firestore field name `linkedinInUrl`; the correct canonical field is `linkedInUrl`.

The diary is intended to be updated every workday and backfilled from reliable project summaries, uploaded logs, and prior-chat context when available.
