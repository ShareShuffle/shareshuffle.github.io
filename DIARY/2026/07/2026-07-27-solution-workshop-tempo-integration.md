# July 27, 2026 — Solution Workshop joins Tempo Foundry

Solution Workshop began as a complete standalone landing page: a clear promise, a strong visual system, and a useful way to explain practical AI without turning it into theater. Patch 22 brings that work into the Tempo Foundry and ShareShuffle repository without collapsing its identity into another product.

The product now has its own isolated Firebase Hosting target, `solutionworkshop`, deployed from `sites/solution-workshop` to the separate Firebase project and site `sol-wx`. The long domain, `solutionworkshop.com`, is canonical. The compact `solwx.com` address is the short front door and preserves the requested path when it redirects.

The integration adds the pieces a standalone mockup did not yet have: canonical and social metadata, structured data, a sitemap, a web manifest, an original favicon, accessible keyboard navigation, a failure-safe animation fallback, cache rules, and a production-safe contact flow. The form no longer reports success when nothing was sent. Until a dedicated email or CRM is configured, it prepares and copies an inquiry and hands the visitor to Tempo Foundry contact.

Solution Workshop is also listed in the Tempo Foundry portfolio and documented as a first-class property. Its message stays deliberately plain: start with the actual business problem, decide whether AI belongs in the answer, and build only what makes the work better.
