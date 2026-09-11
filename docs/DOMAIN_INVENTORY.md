# Domain and hosting inventory

This is a planning inventory derived from repository notes, not a live DNS audit.
Registrar, nameserver, record, certificate, and production status are **unknown**
until checked in the relevant accounts.

| Property | Domain(s) mentioned in repository | Intended/current host in notes | Action |
|---|---|---|---|
| ShareShuffle | `shareshuffle.com`, `shfl.me`, possibly `shuffle.host` | Firebase; root `CNAME` also claims GitHub Pages | Choose one authoritative web host |
| Gracefeed / Tempo Foundry | `tempofoundry.com`; Gracefeed domain not yet recorded | Firebase target `tempo` | Confirm corporate/public domain strategy |
| DuetLoop | `duetloop.com` | Firebase target `duetloop` | Isolate before real dating data |
| Metromance | `metromance.com` | Firebase target `metromance` | Isolate before real dating data |
| Eternal Route 66 | `eternalroute66.com`, `route66.co` | Firebase target `eternalroute66`; companion redirect intended | Verify redirect and canonical host |
| Butch Breger Museum | `butchbreger.com` | Firebase target/site `breger` | Verify custom-domain attachment |
| LNKDX | `lnkdx.com`, optional `www` | Firebase target `lnkdx`, site currently mapped as `lnkdx-com` | Reconcile old notes that say site ID `lnkdx` |
| LinkWombat | `wombat.to` | Firebase target `wombat`, site `linkwombat` | Verify domain and routing |
| Charlie R. Williams | No custom domain recorded in current product README | Firebase target `charlie`, site `charlierw` | Choose domain only if needed |
| Douglas N. Wilkinson | `dnwilkinson.com` | Firebase target/site `dnwilkinson` | Identify live source directory first |
| Lake House at Bella Vista | No custom domain recorded | Firebase target/site `bellavista` | Keep provider booking URL authoritative |
| Shops for Miles | `shopsformiles.com` | Firebase target/site `shopsformiles` | Verify connection |
| Solution Workshop | `solutionworkshop.com`, `solwx.com` | Separate Firebase project/site `sol-wx` in notes | Add an explicit project alias; do not mix configs |
| Praise Against the Machine | No domain recorded | Not built | Select repo and domain after product brief |
| Quit Stop (working name) | No domain selected | Firebase Hosting planned; source at `sites/quit-stop/` | Select final product name, Hosting site ID, and domain after prototype testing |

## Live audit worksheet

For each domain record:

```text
Registrar:
Nameservers:
DNS manager:
A/AAAA records:
CNAME records:
TXT verification records:
MX/SPF/DKIM/DMARC records:
Current provider URL:
Firebase/GitHub site ID:
Canonical domain:
www behavior:
HTTPS status:
Last verified:
Rollback value:
```

Do not replace nameservers merely to move a website. In most cases only the apex
and/or `www` web records need to change. Preserve mail and verification records.
