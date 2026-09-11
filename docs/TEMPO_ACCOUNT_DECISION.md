# Tempo Account identity, privacy, and URL decision

## Identity

- One Firebase Authentication directory inside the shared Firebase project.
- Product-scoped memberships and handles.
- No automatic public identity joining LinkWombat, ShareShuffle, Duet Loop,
  Metromance, or preservation properties.
- Domain-local browser sessions even when the Firebase UID is shared.

## LinkWombat privacy

- No public teacher shelf by default.
- No public profile by default.
- Individual links are **unlisted**, not private.
- Visiting a username root shows a neutral message, never a link directory.

## LinkWombat routes

- Existing one-segment namespace remains global/random:
  `wombat.to/volcanoes`
- A reserved username root is exact:
  `wombat.to/th`
- Two segments are member-owned:
  `wombat.to/th/volcanoes`

The patch adds exact root rewrites only for invited handles, so unrelated
one-segment links continue through the original LinkWombat resolver.

## Characters

Allowed:

- lowercase letters
- numbers
- hyphens

Normalization:

- capitalization is ignored
- spaces, dots, underscores, `+`, `@`, and `&` become hyphens
- `mrrich` and `mr-rich` remain distinct
- `Mr-Rich` and `mr-rich` are the same
- `mr.rich` is not a separate username

Dictionary and creative-compound spellcheck is a later UX enhancement.
