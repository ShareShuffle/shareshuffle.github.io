# ADR 0002: LinkWombat routing model

**Status:** Accepted  
**Date:** 2026-07-21

LinkWombat supports:

- Random three-character codes, such as `wombat.to/k7p`
- Custom aliases, such as `wombat.to/volcanoes`
- User namespaces, such as `wombat.to/rw/supplies`

Random codes use lowercase letters and digits while excluding visually ambiguous characters: `0`, `o`, `1`, `l`, and `i`. Matching is case-insensitive. Reserved system paths cannot be claimed.
