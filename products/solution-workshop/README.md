# Solution Workshop

## Purpose
Practical AI discovery, design, agents, automations, and workflows for ordinary businesses with real operational problems.

## Brand and domains
- Canonical domain: `solutionworkshop.com`
- Short domain: `solwx.com`
- Firebase project and Hosting site: `sol-wx`
- Hosting target in the Tempo Foundry repository: `solutionworkshop`

`solutionworkshop.com` is the public canonical address. `solwx.com` is the compact entry point and should redirect to the same path on the canonical domain.

## Current direction
Lead with business problems and measurable improvement. Avoid hype, jargon, robot imagery, and claims that AI is the goal by itself. Solution Workshop is presented as part of the Tempo Foundry ecosystem while retaining its own client-facing brand.

## Contact configuration
The public page never pretends a message was sent. Until a dedicated inbox or CRM endpoint is supplied, the inquiry form copies a prepared inquiry and points the visitor to the Tempo Foundry contact page.

To connect a dedicated inbox later, set `contactEmail` in `sites/solution-workshop/site-config.js`. No other page changes are required.

## Deployment
Run `bash DEPLOY-SOLUTION-WORKSHOP.command` from the repository root. The helper uses a fixed Firebase CLI through `npx`, verifies the hosting target, and deploys only Solution Workshop to project `sol-wx`.

## Documentation rule
Record material product, architecture, brand, domain, and deployment decisions here or in linked ADRs.
