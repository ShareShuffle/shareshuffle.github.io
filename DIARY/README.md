# TEMPO FOUNDRY DIARY

This directory is the durable chronological memory for the Tempo Foundry repository.

## Purpose

Add a dated entry whenever meaningful work happens: product decisions, site changes, patches, deployments, bugs, fixes, domain work, legal/compliance decisions, artwork handling, new ideas, and unresolved questions.

## Naming

Use:

`YYYY/MM/YYYY-MM-DD-short-topic.md`

A day may have multiple entries when topics are materially different.

## What every entry should contain

- What was requested
- Decisions made
- Files or systems changed
- Commands or patches used
- Deployment results
- Bugs found and their actual causes
- Legal/compliance constraints
- Open work and next actions
- A little human context when it explains the product direction

## Source-of-truth rule

The repository and deployed services are the source of truth for code. Diary entries are historical context, not executable instructions. Before changing code, inspect the current files and current Firebase configuration.

## Conversation-history limitation

The diary may be backfilled from prior chats, project summaries, uploaded logs, and remembered decisions. It is not guaranteed to reproduce every historical conversation verbatim. Entries should distinguish confirmed facts from reconstructed context.
