These files define the initial protected Duet Loop handle inventory.

Current launch implementation:
- The browser availability checker blocks these names.
- Hold requests are written to duetLoopLeads.
- This is not yet a transactional account reservation system.

Before public account launch:
- Seed a server-owned reservedHandles collection.
- Create a transaction-based claim endpoint.
- Enforce unique normalized handles server-side.
- Email-verify all 1–2 character claims and complete-profile requirements.
