# CRM regression report

Staging https://crm.example.com, project `Vercel 3`, 5 Oct 2026. Baseline: the bug report and API audit of 1-2 Oct 2026. Every row cites a request id (`REQ-...`, logged in `reports/audit*/evidence*.jsonl`) or the UI re-check script.

## 1. Result

- **16 of the 24 tracked items in the first bug list are fixed** (including all 7 UI bugs), 3 partly fixed, 5 still open.
- **8 of the 40 API audit findings are fixed**, 4 partly, 28 still open.
- **7 new findings** (1 medium, 5 low, 1 informational). No blocker or high-severity issue, no regression in tenant isolation or authentication, no data exposure.
- Test addresses in all scripts, fixtures, docs and the staging demo data now use `example.com` (a public inbox: keep sending in test mode).

## 2. Test runs

| Run | Result |
|---|---|
| API tests (pytest) | 163 passed, 2 expected failures (ownerActorId, 3 MB body), 1 failed: the 2 MB body test (connection reset, see NEW-02) |
| UI tests (Playwright, Chromium + Firefox + WebKit + mobile) | 115 passed, 1 failed: WebKit page-load timeout on staging (flake; passed in every other run) |
| Previously reported bug list re-checked | 24 fixed, 7 partly fixed, 33 still open (of 64 rows; some items appear in both lists) |
| Full field matrix re-run | 4,690 cases over 23 write operations. 139 previously flagged cases now pass; 113 still flagged (mostly lone surrogates and free-text NUL/blank); 4 flagged cases are connection resets |
| Behaviour steps re-run | authentication (177 variants, all 401), isolation (identical 404s, no leaks), mass assignment (239 of 240 rejected), state machines (unchanged), idempotency (works), races (pipeline-name uniqueness holds under 10 parallel), partial failures (8 of 8 roll back), integration (50 pass, 3 unchanged failures) |

## 3. New bugs found in this regression

### NEW-01 [P2] Intermittent connection resets and timeouts on ordinary requests; at least one create was saved although the client never got a response

6 of 7,751 matrix requests ended with a reset (4) or a 30 s read timeout (2): `REQ-C200206` (create, reset after 2.8 s), `REQ-C200330` (create, 30 s timeout), `REQ-B200206`, `REQ-C200234`. Afterwards one catalog product existed that no successful response accounts for (count check: 6 + 132 accepted = 138 expected, 139 found). A client that retries without an Idempotency-Key can create duplicates; one that does not retry may lose the fact that the create succeeded.

**Suggested fix:** Make the proxy/app return a response or a clean error; clients should always send an Idempotency-Key on creates (it works).

### NEW-02 [P3] Oversized request bodies drop the connection instead of returning 413

1 MB -> 400 (parsed), 2 MB -> 413 (`REQ-R200002`) in one run but a reset in the re-check script and in pytest; 3 MB, 5 MB and 10 MB -> connection reset every time (`REQ-R200003`). The 502 from the first audit is gone, but the client still gets no status.

**Suggested fix:** Reject on Content-Length before reading; return 413 with the standard envelope.

### NEW-03 [P3] Free-text fields still accept NUL and whitespace-only text after the control-character fix

Rejected now in names, titles and labels ("Cannot contain control characters, line breaks or text-direction overrides"), but accepted in: activity note body, task description, automation action title, product description, message body, custom property lead_source (NUL), and in file name, document file name, message subject, rule action title (whitespace-only). A NUL in a message body is customer-facing.

**Suggested fix:** Apply the same rule (allowing line breaks, forbidding NUL/control characters) to the free-text fields; reject blank required text.

### NEW-04 [P3] Pipeline-name uniqueness is bypassed by Unicode look-alikes

Rule is documented as "ignoring case and surrounding spaces", so these all create a second pipeline that looks identical: NFD vs NFC "Café" (`REQ-N100002`), non-breaking space, double inner space, zero-width space, full-width letters.

**Suggested fix:** Compare names after Unicode normalisation (NFKC), collapsing whitespace and removing zero-width characters.

### NEW-05 [P3] Company domain accepts an IP address

domain `192.168.1.1` is stored as is (201) while `localhost` and `[::1]` are rejected; a domain given with a port (`…:8080`) silently loses the port.

**Suggested fix:** Reject IP literals in a domain field; decide whether to reject rather than silently strip ports.

### NEW-06 [P3] Same-origin check accepts an http:// Origin for the same host

Origin `http://crm.example.com` -> 201 (the scheme is not compared). Not exploitable while HSTS is on, which it is, but the check should compare scheme, host and port.

**Suggested fix:** Compare the full origin.

### NEW-07 [INFO] Automation rule is auto-suspended after 501 runs in an hour (limit 500), and resuming is only possible via PATCH enabled:true

This is a sensible safeguard and worked as designed (my seeded "New contact: welcome note" rule was suspended by the bulk contact creation in the matrix). Observations: the suspension is visible only as suspendedAt/reason on the rule; there is no resume route (`POST .../resume` is 404); a single bulk import of 501 contacts would suspend a contact.created rule silently.

**Suggested fix:** Show the suspended state and a Resume button in the UI, and mention it in the import summary.

## 4. First bug list (BUG-01 to BUG-20 and design questions)

| id | bug | status | what I saw now | evidence |
|---|---|---|---|---|
| BUG-01 | Null byte in search returns HTTP 500 | FIXED | contacts, companies, deals, files all return 200 now | `REQ-RG00001`, `REQ-RG00002` |
| BUG-02 | Expired session on submit shows a raw API message | FIXED | dialog now says "Your session has ended. Sign in again to continue." with a Sign in button | UI re-check |
| BUG-03 | Contact phone not validated | FIXED | 'abc' -> 400 "Use 7 to 15 digits, with only spaces, dots, dashes, brackets and a leading +" | `REQ-RG00005` |
| BUG-04 | Company phone and domain not validated | FIXED | phone 400; domain must be a hostname and is normalised to lower-case host (scheme, path, port, trailing dot stripped) | `REQ-RG00006` |
| BUG-05 | Whitespace-only contact first name | FIXED | -> 400 | `REQ-RG00007` |
| BUG-06 | ownerActorId not verified | STILL OPEN | 'nope' and an all-zero id are still accepted (201) | `REQ-RG00008` |
| BUG-07 | Inconsistent length limits (300-char company name, >254 email) | FIXED | company name 300 -> 400; email over 254 -> 400 | `REQ-RG00009`, `REQ-RG00010` |
| BUG-08 | Control characters accepted in names | PARTLY FIXED | NUL and line breaks are now rejected in names/titles/labels. Still accepted in free-text fields: NUL in note bodies, task descriptions, product descriptions, message bodies, lead_source; whitespace-only in several of them | `REQ-RG00011` |
| BUG-09 | Invalid UTF-8 silently replaced | FIXED | -> 400 | `REQ-RG00012` |
| BUG-10 | 120-char limit counts UTF-16 units | FIXED | 100 emoji now accepted (201) | `REQ-RG00013` |
| BUG-11 | Oversized bodies: empty 502 instead of 413 | PARTLY FIXED | 502 is gone, but 2 MB is sometimes a 413 and sometimes a dropped connection, and 3 MB and above always drops the connection (client sees a reset, no status) | `REQ-RG00014`, `REQ-RG00015` |
| BUG-12 | TRACE returns a bare 500 | FIXED | -> 405 application/problem+json | `REQ-RG00020` |
| BUG-13 | text/plain parsed as JSON; cross-origin writes accepted | FIXED | 415 for wrong content type; writes need a same-origin Origin (403 otherwise). Minor: an http:// Origin for our own host is accepted (HSTS mitigates) | `REQ-RG00021` `REQ-RG00022` |
| BUG-14 | Stage order has gaps after a delete | STILL OPEN | orders [0, 2] after deleting the middle stage | `REQ-RG00024`, `REQ-RG00025` |
| BUG-15 | Unknown Crm-Org-Id accepted | STILL OPEN | -> 200 | `REQ-RG00026` |
| BUG-16 | Every page has the same title | FIXED | 16 distinct titles, e.g. "Contacts · Vercel 3 · CRM Platform" | UI re-check |
| BUG-17 | Headings skip h1 to h3 | FIXED | no skipped levels on any of 16 pages | UI re-check |
| BUG-18 | Unlabelled field on Files page | FIXED | all fields labelled | UI re-check |
| BUG-19 | Escape discards a dirty dialog without warning | FIXED | "Discard changes?" with Keep editing / Discard | UI re-check |
| BUG-20 | Table cells truncated on mobile | FIXED | 0 of 5 cells clipped at 375 px | UI re-check |
| D-1 | Duplicates allowed everywhere | PARTLY FIXED | Pipeline names are now unique (case and surrounding spaces ignored, archived included; holds under 10 parallel requests). Contacts (email), companies, products, rules still allow duplicates | `REQ-N100001` |
| D-2 | Stages can be added to an archived pipeline | FIXED | -> 409 | `REQ-RG00028` |
| D-3 | Import cannot update or skip existing records | STILL OPEN | onDuplicate accepts only create and reject | `REQ-R200009` |
| D-5 | Moving a deal to its current stage returns 200 | STILL OPEN | -> 200 | `REQ-RG00061` |

## 5. API audit findings (CRM-FX-0001 to 0040)

| id | finding | status | what I saw now | evidence |
|---|---|---|---|---|
| CRM-FX-0001 | Big integers in number properties silently rounded | STILL OPEN | 9223372036854775807 stored as 9223372036854776000 | `REQ-RG00030`, `REQ-RG00031` |
| CRM-FX-0002 | Writes accepted from a hostile Origin | FIXED | 403 cross_site_request (see BUG-13) | `REQ-RG00022` |
| CRM-FX-0003 | Phone not validated | FIXED | see BUG-03 | `REQ-RG00005` |
| CRM-FX-0004 | Text fields accept NUL, CRLF, whitespace-only | PARTLY FIXED | see BUG-08. Leading/trailing line breaks are simply trimmed (fine); internal ones are rejected | `REQ-RG00032` |
| CRM-FX-0005 | Stage creation accepts a client-chosen id, reusable across pipelines | STILL OPEN | 201 | `REQ-RG00038` |
| CRM-FX-0006 | Null byte in search returns 500 | FIXED | see BUG-01 | `REQ-RG00001`, `REQ-RG00002` |
| CRM-FX-0007 | Automation rule with an action pointing at non-existent records is saved | STILL OPEN | 201 | integration step |
| CRM-FX-0008 | Merge of a non-existent source returns 409, not 404 | STILL OPEN | 409 "Source contact not found" | integration step |
| CRM-FX-0009 | Merge cannot resolve conflicting emails/phones | STILL OPEN | 409 with no field to choose | `REQ-RG00071` |
| CRM-FX-0010 | /api/docs and other unknown /api paths return 200 HTML | STILL OPEN | 200 on /api/docs, /api/openapi.json, /api/v1/pipelines |  |
| CRM-FX-0011 | No GET-by-id for custom properties | STILL OPEN | 404 "No route" | `REQ-N300002` |
| CRM-FX-0012 | Over-long URL error uses another envelope and names the framework | STILL OPEN | 414 with FST_ERR_MAX_PARAM_LENGTH | `REQ-RG00067` |
| CRM-FX-0013 | Automation runs about two minutes after the event with no hint | STILL OPEN | task appeared after ~122 s | integration step |
| CRM-FX-0014 | No uniqueness rule (contact email, pipeline name) | PARTLY FIXED | see D-1 | `REQ-N100001` |
| CRM-FX-0015 | Repeating an archive: 200 for contacts/companies, 409 for pipelines/deals | STILL OPEN | contact archive again -> 200 | `REQ-RG00041` |
| CRM-FX-0016 | RETRACTED: lead routes exist at /leads/{id}/qualify, disqualify, convert | NOT A BUG | routes respond | `REQ-RG00044`, `REQ-RG00045` |
| CRM-FX-0017 | Internal identifiers exposed (AWS account id in bucket host, framework error code) | STILL OPEN | bucket crm-staging-files-<12-digit id>; FST_ERR_* still returned | `REQ-N300003` |
| CRM-FX-0018 | timeZone accepts non-canonical names | STILL OPEN | 'australia/sydney' -> 201 | `REQ-RG00068` |
| CRM-FX-0019 | Company domain not validated | FIXED | validated and normalised | `REQ-RG00006` |
| CRM-FX-0020 | Duplicate JSON keys accepted | STILL OPEN | last key wins (201) on all 21 write routes | `REQ-RG00065` |
| CRM-FX-0021 | Wrong or missing Content-Type accepted | FIXED | 415 (matrix: accepted on 0 of 22 routes) | `REQ-RG00066` |
| CRM-FX-0022 | No rate-limit headers or Retry-After | STILL OPEN | none seen over ~8,000 requests | `REQ-RG00075` |
| CRM-FX-0023 | Via header discloses the proxy | STILL OPEN | Via: 1.1 Caddy | `REQ-RG00075` |
| CRM-FX-0024 | Invalid text replaced with U+FFFD | PARTLY FIXED | invalid UTF-8 bytes now rejected; lone surrogates still silently replaced in all text fields | `REQ-RG00012` |
| CRM-FX-0025 | Contact created as archived has no statusBeforeArchive | STILL OPEN | None | `REQ-RG00042`, `REQ-RG00043` |
| CRM-FX-0026 | DELETE of a custom property only archives it | STILL OPEN | still listed after 204 | `REQ-RG00053`, `REQ-RG00055` |
| CRM-FX-0027 | PUT/DELETE/PATCH on a collection return 404, not 405 | STILL OPEN | 404 x3 (OPTIONS still advertises them) | `REQ-RG00062`, `REQ-RG00063` |
| CRM-FX-0028 | TRACE returns a bare 500 | FIXED | 405 | `REQ-RG00020` |
| CRM-FX-0029 | Replayed Idempotency-Key answers 'created' for a deleted record | STILL OPEN | replay 201, GET original 404 | `REQ-RG00051`, `REQ-RG00052` |
| CRM-FX-0030 | Unknown Crm-Org-Id accepted | STILL OPEN | 200 | `REQ-RG00026` |
| CRM-FX-0031 | Filter status=archived rejected; only status[in]= works | STILL OPEN | 400 Unrecognized key | `REQ-RG00057` |
| CRM-FX-0032 | Audit events for deleted records lose the name | STILL OPEN | event data holds only the id | `REQ-RG00072` |
| CRM-FX-0033 | Idempotent replays carry no marker header | STILL OPEN | no header | `REQ-RG00048`, `REQ-RG00049` |
| CRM-FX-0034 | Import has no update/skip mode | STILL OPEN | see D-3 | `REQ-R200009` |
| CRM-FX-0035 | Oversized body gives a bare 502 | PARTLY FIXED | see BUG-11 | `REQ-RG00014`, `REQ-RG00015` |
| CRM-FX-0036 | Move to the same stage succeeds | STILL OPEN | 200 | `REQ-RG00061` |
| CRM-FX-0037 | Name limit counts UTF-16 units | FIXED | see BUG-10 | `REQ-RG00013` |
| CRM-FX-0038 | RETRACTED: activities link through the attachments field | NOT A BUG | 201 with attachments | `REQ-RG00058` |
| CRM-FX-0039 | Stage order gap after delete | STILL OPEN | [0, 2] | `REQ-RG00024`, `REQ-RG00025` |
| CRM-FX-0040 | Stages can be added to an archived pipeline | FIXED | 409 | `REQ-RG00028` |

## 6. Behaviour changes to be aware of (intended, not bugs)

- Every write now needs a same-site `Origin`; API clients without one get 403 `cross_site_request`.
- Pipeline names are unique (case and surrounding spaces ignored, archived included): 409 on a duplicate or rename collision.
- Names, titles and labels reject line breaks, NUL and text-direction overrides: a CSV import row with a multi-line quoted last name now fails with a clear per-row message.
- A rule that exceeds 500 runs per hour is suspended automatically.
- Page titles are now `<Page> · <Project> · CRM Platform`.

## 7. Not covered

- Member and other roles (still only one owner account).
- Real screen readers; Safari on real hardware.
- The 10x rate-limit probe (no limit is documented or observable).
- The automation delay was re-observed (about 2 minutes) but not re-measured at scale.

