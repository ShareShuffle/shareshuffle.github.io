# July 17, 2026 — LNKDX Debugging and Human Error

## What happened

A new Park record was manually created:

`LNKDX.COM/LR` → Leland Rangel’s LinkedIn profile.

The Firestore document was placed correctly in:

`lnkdxParks / LR`

The resolver found the document, incremented `clicks`, and updated `lastVisitedAt`, but returned:

`"linkedInUrl": null`

The browser therefore displayed:

“This Park name has no valid destination.”

## Debugging work

The resolver and client were improved to:

- use `Cache-Control: no-store` for Park lookups;
- add cache-busting query parameters;
- parse and expose real resolver errors;
- trim URL whitespace;
- accept LinkedIn destinations with or without `www`;
- tolerate a few reasonable destination-field capitalization variants.

Both the Firebase Hosting endpoint and direct Cloud Function endpoint returned the same `linkedInUrl: null`, proving the Hosting rewrite was not the cause.

## Actual cause

The Firestore field had been entered as:

`linkedinInUrl`

instead of:

`linkedInUrl`

The extra `in` was human error. The quotation marks shown by the Firestore UI were normal string formatting and were not the problem.

No redeploy was required after correcting the field name.

## Human note

Rich’s “Am I right, guys?” line references Marcello Hernández’s deliberately terrible “Movie Guy” jokes on Saturday Night Live. The character says something obvious, dumb, and technically correct, then asks, “Am I right, guys?”

That is now the unofficial emotional summary of this debugging session: the infrastructure worked; one tiny typo caused a full forensic investigation. Am I right, guys?

## Permanent lessons

1. When a document is found but a field is null, inspect the exact field name before changing architecture.
2. Keep direct resolver diagnostics available.
3. Error screens should reveal a useful category without exposing secrets.
4. Firestore’s displayed quotation marks do not mean quotes are embedded in the string.
5. Manual record creation needs an admin form with validation as soon as practical.
