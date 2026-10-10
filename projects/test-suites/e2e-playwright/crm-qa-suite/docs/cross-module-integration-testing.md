# Cross-module integration testing — Contacts × Companies × Deals × Activities

Scope: every pairwise relationship in the data model — a deal links to a contact and a company; a
contact links to a company; an activity attaches to any of the three. Script:
`scripts/integration_cross_module.py`. Run twice (Vercel 2, Vercel 3) with a fresh, realistically
named graph each time (company "Bluewave Civil Engineering", contact "Priya Chandran", deal "Bluewave
Civil Engineering - Annual maintenance contract", plus a second throwaway graph for the delete-with-a-
live-reference check). **27/27 checks passed on both runs.**

## What was tested, and the result

### Create + link (positive)
Creating a contact with `companyId` set, and a deal with `contactId`+`companyId` set, all correctly
linked on the first read. The deal's embedded `contact`/`company` blocks come back `state: "resolved"`
with a full nested record — not just the raw id.

### Edit propagation (the main ask: "edited... integration should have proper result")
Renaming the company (`Bluewave Civil Engineering` → `Bluewave Civil & Structural Engineering`) and
re-reading the deal shows the **new** name in `deal.company.record.name` immediately — confirmed this
is a live join, not a cached snapshot taken at deal-creation time. Same result renaming the contact:
the deal's `contact.record.lastName` picks up the change immediately. The contact's own `companyName`
field also updates live when its company is renamed. **This is correct, well-built behaviour** — a
common integration bug in CRMs is a stale denormalized name field that never gets refreshed; this
product does not have that bug.

### Negative linking
`POST /deals` with a `contactId` that doesn't exist → `404 Contact not found`. `POST /contacts` with a
`companyId` that doesn't exist → `404 Company not found`. Both clean, both correct.

### Archive (the main ask: "deleted... any integration to that should have proper result check")
Archiving the **contact** does not cascade to its deal or its activities — the deal still resolves the
contact (`state: "resolved"`, even while archived — recorded, not flagged as wrong, since "archived"
and "gone" are different things and the UI likely still wants to show who the deal is with). Archiving
the **company** does not cascade to its contact (contact keeps its `companyId`, is not itself archived).
Unarchiving both restores them cleanly.

### Hard delete — referential integrity (the standout result)
`DELETE /companies/{id}`, `DELETE /contacts/{id}`, `DELETE /deals/{id}` and `DELETE /activities/{id}`
are all real routes — **three of these four were missing from the original API audit's route-coverage
table** (`docs/api-audit-report.md` §15, now corrected) because that 10,400-request audit never tried
`DELETE` on anything but companies.

The important finding: **the product enforces referential integrity correctly on hard delete.**

- Deleting a company that still has a live contact and deal pointing at it → **409 Conflict**,
  `"Cannot delete this company: 2 records still reference it."` Nothing is deleted; the graph is
  verified intact afterward.
- Deleting a contact that still has a live deal pointing at it → **409 Conflict**,
  `"Cannot delete this contact: 1 deal still references it."`
- Deleting an **activity** has no such restriction (204, succeeds immediately) — correct, since nothing
  else references an activity; it's a leaf node. Deleting the activity correctly removes it from the
  contact's feed, and the contact itself is unaffected.
- Deleting a **deal** also succeeds immediately (204) — correct, since nothing references a deal either;
  the linked contact is unaffected afterward.

So the system does **not** allow an orphaned foreign key to be created by direct deletion — it blocks
the delete instead of silently leaving a dangling `contactId`/`companyId` on a surviving record. This
is the behaviour you want, and it held consistently across both test runs and both the
company-delete-blocked and contact-delete-blocked cases.

## Documentation fix made alongside this

`docs/api-audit-report.md`'s live-only contract table (§15, Appendix K) was missing `DELETE` entirely
for `/contacts/{id}`, `/deals/{id}` and `/activities/{id}` — it only ever recorded `DELETE
/companies/{id}`. Added the three missing rows with today's evidence. This was a coverage gap in the
original audit, not a product bug.

## What this did not cover
- Deleting/archiving a **pipeline** or **stage** that a live deal is sitting in (a third kind of
  cross-module link, deal↔pipeline) — not in scope of this pass (user asked for the data-record
  relationships, not the pipeline/stage structural ones).
- Merge (contact-merge is a separate, already-tested flow per the earlier audit, not re-run here).
- What happens to a **won/lost** deal's close reason if the close-reasons list entry it points to is
  later removed — not tested this pass.

## Raw evidence
`reports/integration/cross_module_<projectId>.json` for each run — every check's name, pass/fail, and
the literal request/response detail that produced it.
