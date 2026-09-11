# Gracefeed / Tempo Foundry workspace

This repository currently contains the production history and working files for
ShareShuffle plus several Tempo Foundry sites and shared Firebase services.
Gracefeed is the company identity; Tempo Foundry is the studio and portfolio
brand. Confirm the company's exact legal suffix before putting it in contracts,
invoices, privacy policies, or website footers.

## Stop before deploying

The active `firebase.json` does not match the multisite targets in `.firebaserc`
and points to a `public/` directory that is not present. Do not run a broad
Firebase deploy from this checkout until the hosting configuration has been
reconciled and tested with preview channels.

The working tree also contains a large amount of uncommitted project work.
Preserve it before moving or deleting anything.

## Start here

1. Read `.AI_CONTEXT.md` and `.project-context/README.md`.
2. Read the summaries in `.project-context/summaries/` in filename order.
3. Read [the repository map](docs/REPOSITORY_MAP.md).
4. Read [the platform architecture](docs/GRACEFEED_ARCHITECTURE.md).
5. Treat current source files as code truth and the notes as historical and
   decision context. A patch README is not a current deployment instruction.

## Current dependency setup

The only active npm package is `functions/`. It targets Node 22 and uses the
lockfile in that directory.

```bash
cd functions
npm ci
```

The root `package-lock.json` is an empty historical lockfile; there is no root
`package.json` and therefore no root npm application to install.

## Near-term rule

Do not add another public site to this repository. Stabilize ShareShuffle here,
then give each independently deployed site its own repository. Shared backend
code belongs in a private Gracefeed platform repository.

