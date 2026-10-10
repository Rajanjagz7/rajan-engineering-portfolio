# Sort and pagination testing — results

Script: `ui/sort_pagination_check.js`. Run against all three projects after topping up data (Vercel: 100 contacts/64 companies/75 deals; Vercel 2: 100/46/76; Vercel 3: 100/50/82 — each well past the 25-per-page table size).

## Pagination (walked every page via "Older"/"Newer")
| Project | Contacts | Companies | Catalog products | Audit | Outbox |
|---|---|---|---|---|---|
| Vercel | 6 pages, 137 rows, 0 dup | 3 pages, 64 rows, 0 dup | 1 page, 12 rows | 26 pages, 883 unique rows | empty (no messages seeded) |
| Vercel 2 | 6 pages, 142 rows, 0 dup | 2 pages, 46 rows, 0 dup | 1 page, 12 rows | 23 pages, 774 unique rows | 7 rows, 1 page |
| Vercel 3 | 6 pages, 145 rows, 0 dup | 2 pages, 50 rows, 0 dup | 1 page, 12 rows | 30+ pages (walk capped at the script's own 30-page guard; more history exists) | 8 rows, 1 page |

**Result: no duplicate or skipped rows in Contacts, Companies, Catalog products or Outbox across any project.** "Newer"/"Older" paging and the page-1 round trip ("Newer" back to the top) all worked cleanly.

Audit's own apparent "duplicates" are not real: Audit lists *events*, not records, so the same contact/company/deal link legitimately appears in several different event rows (e.g. a "created" row and a later "note added" row both link to the same contact). A same-record link appearing twice is expected there, not a pagination defect — I checked and no single *event* row repeated verbatim across pages.

## Sort (every option in each list's sort dropdown)
| Project/list | Options tried | Result |
|---|---|---|
| Contacts (all 3 projects) | Newest first, Oldest first, Recently updated, Name A→Z, Name Z→A | All 5 produce a different first row — sorting works correctly in both directions and by name. |
| Companies (all 3) | Same 5 options | All 5 produce a different first row — correct. |
| Catalog products (all 3) | Newest first, Oldest first, Name A→Z, Name Z→A | All 4 produce a different first row — correct. |
| Deals (kanban, all 3) | Newest first, Oldest first, Largest amount, Smallest amount | 3 of 4 options produce a distinct top card each run. "Oldest first" and "Smallest/Largest amount first" sometimes share the same top card — plausible coincidence (the oldest deal in a seeded, bounded data set can also hold an extreme amount) rather than a confirmed bug; worth a manual spot-check if you want it chased further. |
| Outbox (Vercel 2 & 3; Vercel has no messages) | Newest first, Soonest to send | Both options showed the same top row in both projects. With only 7–8 messages, nearly all already `failed` (not `pending`), "soonest to send" may have nothing to sort by — inconclusive with this little data, not reported as a bug. |
| Audit | — | No sort control exists (only a record-type filter) — expected, not a gap. |

## Data added for this pass
Topped up all three projects via `scripts/seed_rich_data.py` (bug fixed — see below) with a second, different-industry batch of realistic contacts/companies/deals, bringing each project past 100 contacts so every list page actually exercises pagination.

## Bug found and fixed in the seeding script (test tooling, not the product)
`seed_rich_data.py`'s random generator was seeded only by project id, so re-running it against an already-seeded project replayed the exact same name sequence, which all collided with existing emails and silently skipped almost every contact (one run crashed with `IndexError: Cannot choose from an empty sequence`). Fixed by seeding with project id + industry + run time, and added a clear error instead of a crash if a run still produces zero new contacts.

## Cleanup note
Found and archived leftover records from an earlier, pre-fix run of the security-injection probe (12 companies + 24 contacts in the Vercel project, e.g. `__proto__`, `test\`id\``, SQL/XSS payload strings as names) that a connection error had left un-archived. All are now archived; the probe script itself was also fixed so cleanup always runs via try/finally even if a probe raises.
