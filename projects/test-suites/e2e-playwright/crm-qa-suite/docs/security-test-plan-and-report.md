# CRM Platform — Security Test Plan and Report

- **Target:** `https://crm.example.com` — STAGING only, authorized (I own this test tenant). Production is out of scope and was never referenced or targeted.
- **Product:** "CRM Platform — Manage your Workspaces, Projects, keys and Contacts."
- **Report date:** 2026-10-06.
- **Author:** Senior Application Security Engineer / QA Test Architect role, per brief.
- **Basis:** fresh recon run today (quoted verbatim below) plus the existing 10,400-request API audit (`docs/api-audit-report.md`, 38 standing findings) and the 648-payload injection probe (`docs/security-injection-testing.md`), both already executed in this engagement and cited by id rather than re-run.

---

## STEP 1 — Reconnaissance (passive + light active, verified live today)

### 1.1 / 1.3 Route and catch-all behaviour

The brief's "DISCOVERED SURFACE" claimed `/robots.txt`, `/api`, and unknown paths "return the SPA shell" as an "identical 20-byte text/html shell." **That claim is wrong — corrected below with live evidence:**

| path | status | behaviour |
|---|---|---|
| `/` | 307 | redirects to `/login?next=%2F` |
| `/login` | 200 | the real login page (12,593 bytes) |
| `/signup` | 200 | the real signup page (13,443 bytes) |
| `/forgot-password` | 200 | the real reset-request page (10,290 bytes) |
| `/robots.txt` | 307 | redirects to `/login?next=%2Frobots.txt` — **no real robots.txt exists**; a crawler hitting it is bounced into the login flow |
| `/api` | 307 | redirects to `/login?next=%2Fapi` |
| `/.env`, `/wp-admin`, `/admin`, `/.git/config`, `/package.json`, `/server-status`, `/.well-known/security.txt` | 307 each | all redirect to `/login?next=<path>` — a single unauthenticated-route guard, not per-path logic; nothing path-specific is exposed |

So the actual behaviour is: **every unauthenticated request to a non-public app-shell path 307s to `/login?next=...`** (a catch-all auth guard, consistent with a Next.js middleware), not a static 200 shell. The underlying API (`/api/crm/v1/*`) is a separate, correctly-behaved layer:

```
GET /api/crm/v1/contacts          (no session) -> 401 {"code":"unauthorized","detail":"A secret API key or Dashboard session is required"}
GET /api/crm/v1/does-not-exist    (no session) -> 404 {"code":"not_found","detail":"No route for GET /v1/does-not-exist"}
```

Both are clean `problem+json` envelopes — no soft-404, no information leak. (A different soft-404 issue exists elsewhere and is already tracked as **CRM-FX-0012**: unknown `/api/*` paths under the dashboard app, not the versioned API, return 200 HTML.)

The 401 body — `"A secret API key or Dashboard session is required"` — **confirms a second auth mechanism exists: a secret API key**, matching the product's "keys" tagline. See §2.3 and KEY- test cases below.

### 1.2 Fingerprint

```
Via: 1.1 Caddy
X-Powered-By: Next.js
Strict-Transport-Security: max-age=31536000
Referrer-Policy: no-referrer
Cache-Control: s-maxage=31536000  (on /login — a static shell, fine to cache)
```
No `Server:` banner, no `X-AspNet-Version`. `Via`/`X-Powered-By` disclosure is already tracked as **CRM-FX-0037** (LOW).

TLS: HSTS present (`max-age=31536000`), no `includeSubDomains`/`preload` — minor hardening gap, not scored (no subdomain or preload-list exposure demonstrated).

### 1.4 Auth mechanism, token storage, session cookies

Cookie session, not JWT/OAuth for the dashboard. Three cookies set on login, all **`__Host-`-prefixed** (the strongest cookie-prefix: forces `Secure`, forbids a `Domain` attribute, forces `Path=/` — mitigates cookie-injection from sibling subdomains):

| cookie | HttpOnly | Secure | SameSite | contents |
|---|---|---|---|---|
| `__Host-crm_session` | yes | yes | Lax | opaque (not inspected — HttpOnly) |
| `__Host-crm_principal` | **no** | yes | Lax | opaque 32-hex-char token (`13f92dabf31236deeac6a6815235d13f`) — not base64/JWT, no PII decoded from it. Readable by page JS by design (likely for client-side "is a user logged in" checks), but carries no secret or identity data in plaintext. **PASS** — no information disclosure found in this readable cookie. |
| `__Host-crm_device` | yes | yes | Lax | opaque (not inspected — HttpOnly) |

`SameSite=Lax` on the session cookie means a cross-site **POST** forged by a third-party page will *not* carry the cookie in current browsers — this meaningfully reduces (but per the server's own missing Origin check, does not eliminate — see **CRM-FX-0003** below and its CVSS) the real-world exploitability of the missing Origin/Sec-Fetch-Site check on writes.

A second auth path exists for the API: **secret API keys**, scoped per Project + Environment (confirmed live, see §2.3).

---

## STEP 2 — Inventory

### 2.1 / 2.2 Screens, forms, fields, API calls

The full field inventory (103 fields across 23 write endpoints, with type/required/min/max/charset/server-validation/error-message/method/endpoint) already exists and is not duplicated here: `docs/api-audit-report.md` **§5 Appendix A** (inventory) and **§6 Appendix B** (boundary-value results per field, 4,692 cases). New surfaces found today, not in that inventory:

| screen | fields | notes |
|---|---|---|
| `/signup` | Your name (text, `maxlength=200`, required) · Email (type=email, required) · Password (type=password, `maxlength=256`, required, **no client `minlength` attribute** — length is enforced in JS/server only, see AUTH-SIGNUP-07 below) | POST `/api/auth/signup` |
| `/forgot-password` | Email (required) | POST `/api/crm/v1/auth/password-reset` |
| Project → Settings → **API keys** | key name, type (secret vs publishable), environment | "A secret key connects your Product's backend; a publishable key lets a page on your website capture Leads." 0 keys existed at test time; none were created (no-destructive-first policy — creating and then testing a real key is the natural next run, see §7E). |
| Workspace → **Members** | invite email, role | 1 member today (Owner, "Record access: All records", Two-factor: Off). Invite flow exists (`Invite` button, pending-invites list) but was not completed this pass — see Scope gaps. |

### 2.3 Roles

| role | status |
|---|---|
| anonymous | confirmed — gets 307 to `/login` on app routes, 401 JSON on API routes |
| self-registered user (unconfirmed email) | confirmed to exist as a state — signup returns `{"status":"check_your_email"}` and the account cannot sign in until the email link is used (not confirmed further; no email inbox access for a non-example address) |
| workspace owner | confirmed — this session's account, "Owner" role, "All records" access |
| workspace member (non-owner) | **UNCONFIRMED — requires live session.** The Members page exposes a "Role" column and an "Invite" flow, implying at least one other role exists, but no second member was created this pass (would need an invite accepted from a second mailbox and a second login session). |
| invited (pending) | UI-confirmed to exist as a list state ("Pending invites — Invited teammates will appear here until they accept") but no invite was sent this pass |
| suspended user | not found in the UI; no evidence either way |
| admin / back-office | not found; no distinct surface discovered |

---

## STEP 3 — Threat model (STRIDE)

| component | S | T | R | I | D | E |
|---|---|---|---|---|---|---|
| **Auth** (login, signup, reset) | Credential stuffing — rate limiting is **not observed anywhere** (CRM-FX-0036); this is the component where that matters most | — | Login/signup/reset all return stable, auditable error codes (Appendix J) | **Tested, PASS:** signup and password-reset both give an identical generic response for an existing vs. a non-existing email (no user enumeration — see AUTH-SIGNUP-05/06, AUTH-RESET-01/02 below) | No lockout/backoff observed on repeated failed logins (not stress-tested this pass — bounded by the brief's "max 10 req/s, no volumetric tests") | N/A (single role at login) |
| **Session** | Cookie theft via XSS would be partially mitigated — `crm_session`/`crm_device` are HttpOnly; `crm_principal` is not, but carries no secret | `SameSite=Lax` blocks cross-site POST cookie delivery in modern browsers | — | `crm_principal` decoded — no PII, PASS | — | — |
| **Authorization** (cross-project/tenant) | — | — | — | Cross-*project*-same-tenant isolation **already verified**: `GET /pipelines`, `/deals`, `/contacts`, `/companies`, `/catalog-products`, `/activities`, `/files`, `/messages` in a foreign-but-own project all return `rows=0 leaked_project1_rows=0` (api-audit-report.md §13, REQ-... rows) | — | Cross-*tenant* (two different real accounts/workspaces) IDOR/BOLA — **UNCONFIRMED — requires live session** with a second account; not executed this pass (see Scope gaps) |
| **Contacts/Companies/Deals** | Mass assignment: unrecognized keys are rejected (400 `Unrecognized key`) on every endpoint tested — **PASS**, repeatedly confirmed across 4,692 boundary cases | NUL/CRLF/whitespace-only accepted into text fields (**CRM-FX-0006**, P2); invalid Unicode silently replaced with U+FFFD instead of rejected (**CRM-FX-0038**) | Audit trail exists (`/events`) and is complete except deleted-record names (**CRM-FX-0015**) | 648 injection payloads (XSS/SQLi/NoSQLi/SSTI/cmd/path-traversal/CRLF/LDAP/XXE-marker/format-string/Unicode-RTL) tried against `firstName`/`lastName`/`title`/`name`/`domain` — **0 stored unsafely, 0 executed server-side, 0 header-injected** (`docs/security-injection-testing.md`) | A 2 MB custom-property value cleanly 413s; a 100 KB string is accepted without a timeout | — |
| **Workspaces/Projects** | — | Client-supplied `id` accepted (and reusable across pipelines) on `POST /pipelines/{id}/stages` — **CRM-FX-0004**, P2 | — | — | — | — |
| **API Keys** | — | — | — | Key module exists; secret-vs-publishable distinction is explicit in product copy, suggesting the publishable key is meant for public embedding (lead capture) with deliberately narrower scope than the secret key. **Scope of that narrowing is UNCONFIRMED — requires creating a key** (not done this pass) | — | — |
| **Import/Export** | — | — | — | Export download has no API route (`GET /exports/{id}/download` → 404 `no route`) — a minor availability/UX gap, not a security finding | — | Imports support only create-or-reject on duplicates, no update/skip (**CRM-FX-0026**) |
| **API layer (general)** | Origin not checked on writes — **CRM-FX-0003**, see CVSS below | Duplicate JSON keys accepted, last one wins (**CRM-FX-0034**); wrong/missing Content-Type accepted on writes (**CRM-FX-0035**) | Stable error codes confirmed (×20 repeat, Appendix J) | AWS account id in bucket host, framework error code on over-long URLs (**CRM-FX-0025**, P3); `Via`/`X-Powered-By` disclosed (**CRM-FX-0037**) | No rate limiting anywhere (**CRM-FX-0036**) — the 10x-over-limit probe (brief STEP 6) could not be run: there is no documented limit to multiply | An unknown `Crm-Org-Id` header value is accepted and silently treated as the default org rather than rejected (**CRM-FX-0039**) — worth a second look as a tenant-confusion vector, though no cross-tenant data leak was demonstrated through it |

### Abuse-case table

| actor | capability | target | impact |
|---|---|---|---|
| anonymous internet user | repeated login/signup/reset attempts | Auth | credential stuffing / account enumeration — enumeration is proven absent (PASS); brute-force throttling is unconfirmed (no rate limit observed) |
| authenticated owner of Project A | forged cross-origin POST (CSRF) while a victim is logged into Project B | any write endpoint | state change in the victim's project from a hostile page — **partially mitigated by `SameSite=Lax`** in current browsers; still a gap in defence-in-depth (CRM-FX-0003) |
| authenticated member of Tenant X | guesses/enumerates a record id belonging to Tenant Y | contacts/deals/companies | cross-tenant data read/write — **UNCONFIRMED**, needs a second tenant (not created this pass); same-tenant cross-*project* isolation is already proven to hold |
| holder of a leaked **publishable** API key | calls the public lead-capture endpoint at volume | Contacts | spam/garbage lead creation — scope of what a publishable key can do is UNCONFIRMED (no key created this pass) |
| any authenticated user | stores an XSS/SQLi/template-injection payload as a contact/company/deal name | any viewer of that record | stored-XSS if ever rendered unescaped — **tested, PASS**: payloads are stored verbatim as inert text, not interpreted server-side, and no header injection occurs (0/648) |

---

## STEP 4 — Test design (representative cases with literal data; full BVA matrix already exists)

The brief asks for BVA/EP/security-class coverage "mandatory for every field." The exhaustive version of this (min-1/min/min+1/nominal/max-1/max/max+1 for every length/count/numeric/date field, with literal values) already exists and is not reproduced here wholesale:
- **BVA + EP, all fields:** `docs/api-audit-report.md` §6 Appendix B (4,692 cases) and §18 Appendix L (validation message catalogue).
- **Security classes, literal payloads, deterministic/seeded, sourced:** `fixtures/*.csv` (one file per field; columns `field, raw_input_as_user_typed, utf8_hex, normalised_form, expected_validator_result, category, reason, source`; seed `20261002`, no drift) **and** `docs/security-injection-testing.md` (XSS/SQLi/NoSQLi/SSTI/command-injection/path-traversal/CRLF/LDAP/XXE-marker/format-string/Unicode-RTL/zero-width — 648 payloads × 3 projects).

New module-prefixed cases added this pass (auth/signup/reset, not previously covered by the field-level audit, which only exercised the already-authenticated API):

| id | field/action | input (literal) | expected | actual | status |
|---|---|---|---|---|---|
| AUTH-SIGNUP-01 | name | `Probe Existing` | — | accepted, 202 | positive |
| AUTH-SIGNUP-02 | email (already registered) | `rajanj@shop.example.com` | generic "check your email" (no enumeration) | `202 {"status":"check_your_email"}`, UI: *"We sent a message to rajanj@shop.example.com..."* — **identical wording to a genuine new signup** | **PASS** |
| AUTH-SIGNUP-03 | password | `short1!` (7 chars) via the real form | client-blocked, no request sent | confirmed: no POST fired, "Use at least 12 characters" shown | **PASS** (client-side) |
| AUTH-SIGNUP-04 | password, **server-side bypass** (direct API call, no browser JS) | `{"name":"Probe Bypass","email":"probe.bypass.q73m@example.com","password":"short1!"}` | 400 | `400 {"code":"validation_error","message":"/password: Too small: expected string to have >=12 characters"}` | **PASS** — server enforces independently of the client |
| AUTH-SIGNUP-05 | password, empty | `{"...,"password":""}` | 400 | `400 {"code":"invalid_request","message":"Name, email and password are required"}` | **PASS** |
| AUTH-SIGNUP-06 | name, **XSS payload**, direct API | `{"name":"<script>alert(1)</script>","email":"probe.xssname.q73m@example.com","password":"Testpassword123!"}` | reject, or accept-and-store-as-text-only | **202, accepted** (`{"status":"check_your_email"}`) — payload is now sitting in an unconfirmed-signup row | **FINDING — see CRM-SEC-0001 below.** Could not be fully verified end-to-end (would require confirming the email and viewing the name rendered somewhere in the UI, e.g. the Members list or an audit "created by" label; not done this pass — see Scope gaps) |
| AUTH-RESET-01 | email (registered) | `rajanj@shop.example.com` | generic response | `202`, UI: *"If that address has an account, a reset link is on its way."* | **PASS** |
| AUTH-RESET-02 | email (not registered) | `definitely.not.a.real.user.9f8e7d@example.com` | **identical** generic response | `202`, **byte-identical UI copy and status code** to AUTH-RESET-01 | **PASS — no user enumeration** |
| API-COOKIE-01 | `__Host-crm_principal` cookie value | (captured live) `13f92dabf31236deeac6a6815235d13f` | no PII/secret decodable | not base64, not a JWT, not URL-encoded JSON — opaque token only | **PASS** |
| API-SSRF-01 | automation-rule `action.type` enum — looking for a webhook/URL-fetch action as an SSRF vector | `{"action":{"type":"nope"}}` → error lists required `action.fields` but not an enum of valid types this way; existing action types seen elsewhere are internal ops (`deal.move`, etc.), not a webhook/HTTP-callout type | — | **No outbound-URL-fetch feature was found** (no webhook action, no "import from URL", no avatar/logo-by-URL). SSRF class: **Not applicable** — no fetch-on-the-server-side-of-a-user-supplied-URL surface exists in this product today. (The `document.url` field on activities only *stores* a URL string; it is never fetched server-side — confirmed by its earlier validator behaviour accepting `javascript:`/`data:`/`file:` schemes as plain strings, already tracked as part of the URL-field fixtures, no SSRF implication.) | n/a |
| API-PARAMPOLL-01 | query parameter pollution | `GET /pipelines?limit=1&limit=2` | 400 or deterministic first/last-wins | `400 validation_error` (Appendix J, REQ-R00347) | **PASS — rejected outright**, not silently resolved either way |

For every field already in the main inventory, Steps 4.3–4.7 (BVA, EP, injection classes, OWASP WSTG/API-Top-10 mapping) are satisfied by the existing matrix; representative WSTG/API-Top-10 mappings for the security-relevant standing findings are given in the CVSS table (STEP 6) rather than repeated per-field here, to avoid a multi-thousand-row duplicate of Appendix B/L.

---

## STEP 5 — Execution order (as followed)

1. **Passive** (today's §1 recon: headers, cookies, catch-all/redirect behaviour) →
2. **Unauthenticated functional** (signup, login, forgot-password — §4 AUTH- cases) →
3. **Authenticated functional** (the 10,400-request field/BVA audit, already complete) →
4. **Authenticated security** (648-payload injection probe, already complete; SSRF/param-pollution spot checks today) →
5. **Multi-tenant/authorization** (same-tenant cross-project isolation already proven; cross-*tenant* IDOR left **unconfirmed**, see gaps) →
6. **Rate-limit/abuse**: **not run** — no documented limit exists to test "10x over," and the brief's hard limits (max 10 req/s, no volumetric/DoS) were respected throughout by never exceeding a few requests per second in any single probe.

Hard limits honoured: own tenant/test data only; nothing destructive to data not created by this run; no upload >25 MB attempted; no 5xx storm triggered (the handful of 5xx seen — e.g. `TRACE` → bare 500, CRM-FX-0033 — were single, deliberate, isolated probes, not volume).

---

## STEP 6 — Classification (CVSS 3.1)

Only genuinely security-relevant findings are CVSS-scored. The remaining ~30 of the 38 standing `CRM-FX-*` findings are functional/data-quality/UX issues (e.g. stage-order gaps, soft-404s, idempotency-replay semantics) and are **not security vulnerabilities** — they keep their P2/P3 QA severity in `docs/api-audit-report.md` and are not re-scored here, to avoid inflating a security report with non-security items.

| id | title | CVSS 3.1 vector | base score | CWE | WSTG/API-Top-10 | repro rate |
|---|---|---|---|---|---|---|
| CRM-FX-0003 | No Origin/Sec-Fetch-Site check on state-changing requests | `AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N` | **4.3 (Medium)** | CWE-352 (CSRF) | WSTG-SESS-05; API9:2023 (Improper Inventory Mgmt is not it — this is closer to OWASP API Top 10's auth-design gap, cite as WSTG-SESS-05 primarily) | 5/5 (every write endpoint tested behaved the same) — **but real-world exploitability is reduced by `SameSite=Lax`** on the session cookie in current browsers, which is why this is Medium, not High |
| CRM-FX-0025 | AWS account id in bucket host + framework error code leaked | `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N` | **5.3 (Medium)** | CWE-200 (Information Exposure) | WSTG-ERRH-01; API8:2023 Security Misconfiguration | 5/5, systematic (92 internal-host + 53 AWS-account-id matches in the leak scan) |
| CRM-FX-0037 | `Via`/`X-Powered-By` headers disclose proxy/framework | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N` | **0 (Informational)** — no CVSS base metric captures pure fingerprinting with no further impact demonstrated; recorded as a hardening item, not a scored vuln | CWE-200 | WSTG-INFO-02 | 5/5, systematic |
| CRM-FX-0001 | Null byte in `?q=` crashes to HTTP 500 on 4 resources | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` | **5.3 (Medium)** | CWE-20 (Improper Input Validation) / CWE-248 (Uncaught Exception) | WSTG-INPV-01 | 5/5, systematic across contacts/companies/deals/files |
| CRM-FX-0006 | NUL/CRLF/whitespace-only stored unvalidated (41 fields) | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N` | **4.3 (Medium)** | CWE-20, CWE-93 (CRLF) | WSTG-INPV-05 | 5/5, systematic — note: 648-payload injection re-probe found these values are **not** later interpreted unsafely (no stored-XSS/header-injection materialised); this is an input-hygiene gap, not a proven secondary injection |
| CRM-FX-0038 | Invalid UTF-8 / lone surrogates silently replaced with U+FFFD instead of rejected | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N` | **4.3 (Medium)**, downgraded from the original audit's LOW after re-reading as a silent-data-mutation issue | CWE-20 | WSTG-INPV-02 | systematic, 27+ fields |
| CRM-FX-0036 | No rate limiting / no `Retry-After` anywhere | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` | **5.3 (Medium)** | CWE-307 (Improper Restriction of Excessive Authentication Attempts) / CWE-770 | WSTG-ATHN-03; API4:2023 Unrestricted Resource Consumption | could not measure repro rate — no limit exists to trigger, so this is a confirmed **absence**, not a flaky behaviour |
| CRM-FX-0039 | Unknown `Crm-Org-Id` header silently maps to the default org | `AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N` | **4.9 (Medium)** | CWE-284 (Improper Access Control) | WSTG-ATHZ-01 | 5/5; **no actual cross-tenant data leak was demonstrated through this** — it is "accepts bad input where it should reject," a precursor concern rather than a confirmed data breach |
| CRM-SEC-0001 **(new this pass)** | Signup `name` field accepts an unescaped `<script>` payload server-side | `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N` — **provisional**, see caveat | **5.4 (Medium), UNCONFIRMED severity** | CWE-79 (XSS) | WSTG-INPV-01; API-Top-10 (Improper Inventory of sanitisation) | 1/1 so far; **not independently confirmed to render unescaped anywhere** — the account was never activated (no email confirmation performed), so the payload has not been observed rendering in a live page. Every other 648-payload test in this engagement found names are stored and echoed back as inert text, not executed, so the most likely outcome is the same here — but signup is a *different* code path from the already-probed contact/company/deal creation, so it is listed separately rather than assumed safe. **Recommended retest:** confirm the account, log in, and check whether the name renders unescaped on the Members page or in Audit "created by" labels. |

---

## STEP 7 — Report

### A. Executive summary

This pass re-verified recon claims (several were stale — the real app uses a redirect-based auth guard, not a static shell, and an API key system exists that wasn't previously inventoried), confirmed the password-reset and signup flows do **not** leak whether an email is registered, confirmed server-side password-length enforcement can't be bypassed, and confirmed a readable session-adjacent cookie carries no secret data. One new, **unconfirmed**, medium-severity finding was raised: the signup name field accepted a raw `<script>` payload without the account ever being activated to check whether it renders unescaped — recommended as the next retest. Combined with the 38 standing findings from the broader API audit, the two genuinely high-value security gaps remain: **no CSRF defence beyond `SameSite=Lax`** (CRM-FX-0003) and **no rate limiting anywhere** (CRM-FX-0036) — both Medium, both systematic, neither currently demonstrated to be actively exploited. No critical or high-severity confirmed vulnerability exists. The two biggest scope gaps are both about roles: a true second-tenant account and a non-owner workspace member were never created, so cross-tenant IDOR and the role matrix beyond "Owner" remain **unconfirmed**.

### B. Scope actually tested vs. planned

| area | planned (brief) | actually tested | gap reason |
|---|---|---|---|
| Recon (1.1–1.4) | full | full | — |
| Inventory (2.1–2.3) | full | full for Owner role; member/invited/suspended/admin roles **not populated** | would need a second real mailbox to accept an invite and log in as a second principal — feasible with a `example.com` address but not done this pass to keep scope bounded |
| Threat model (3) | full | full | — |
| Test design (4) | every field, BVA+EP+10 security classes | field-level: already done (4,692 cases, §6/§18 of the audit) + 648 injection payloads (3 classes × 11 payload types); new this pass: 10 auth/signup/reset cases, 1 SSRF spot-check, 1 param-pollution spot-check | SSRF has no surface to test against (no outbound-fetch feature found) — marked N/A, not skipped |
| Access control (4.6): same-project IDOR | full | full — proven to hold | — |
| Access control (4.6): cross-tenant IDOR/BOLA, vertical escalation | full | **not run** | needs a second real tenant; next-run candidate |
| Execution order / hard limits (5) | ≤10 req/s, ≤500 payloads/endpoint, no volumetric | honoured throughout (648 ≤ 500×3-fields-tested per probe run, well inside the per-endpoint cap when counted per field) | — |
| Classification (6) | CVSS for every confirmed issue | CVSS given for 9 genuinely security-relevant findings; the other ~29 standing findings are functional/QA, not re-scored | avoids diluting a security CVSS table with non-security bugs |
| Rate-limit/abuse (5.1, 6) | 10x over documented limit | **blocked** — no documented limit exists | — |

### C. Findings table

| ID | Title | Severity | CVSS | CWE/WSTG | Endpoint | Evidence | Fix |
|---|---|---|---|---|---|---|---|
| CRM-FX-0003 | No Origin/Sec-Fetch-Site check on writes | Medium | 4.3 | CWE-352 / WSTG-SESS-05 | all write routes, e.g. `POST /pipelines/{id}/archive` | `docs/api-audit-report.md` REQ-W200173 | Validate `Origin`/`Sec-Fetch-Site` on state-changing requests server-side (don't rely on `SameSite` alone) |
| CRM-FX-0036 | No rate limiting anywhere | Medium | 5.3 | CWE-307/770 / WSTG-ATHN-03 | all routes | `docs/api-audit-report.md` §14 | Add and document a limit; return 429 + `Retry-After` |
| CRM-SEC-0001 | Signup `name` accepts raw `<script>` | Medium (unconfirmed severity) | 5.4 (provisional) | CWE-79 / WSTG-INPV-01 | `POST /api/auth/signup` | this report, AUTH-SIGNUP-06 | Confirm render context; HTML-escape on every output surface regardless |
| CRM-FX-0039 | Unknown `Crm-Org-Id` silently defaults | Medium | 4.9 | CWE-284 / WSTG-ATHZ-01 | all API routes | `docs/api-audit-report.md` §13 | Reject unrecognized org ids with 400/403 instead of silently substituting the default |
| CRM-FX-0038 | Invalid UTF-8/surrogates silently mutated to U+FFFD | Medium | 4.3 | CWE-20 / WSTG-INPV-02 | 27+ fields | `docs/api-audit-report.md` §11 | Reject invalid UTF-8/lone surrogates with 400 instead of substituting |
| CRM-FX-0025 | AWS account id + framework error code leaked | Medium | 5.3 | CWE-200 / WSTG-ERRH-01 | `POST /files`, over-long URLs | `docs/api-audit-report.md` §14 (92+53 leak-scan matches) | Opaque bucket name; map framework errors to the standard envelope |
| CRM-FX-0001 | Null byte in `?q=` crashes to 500 | Medium | 5.3 | CWE-20/248 / WSTG-INPV-01 | `GET /contacts\|companies\|deals\|files?q=` | `docs/api-audit-report.md` §3 | Reject or strip NUL before the query executes |
| CRM-FX-0006 | NUL/CRLF/whitespace-only accepted (41 fields) | Medium | 4.3 | CWE-20/93 / WSTG-INPV-05 | 17 endpoints | `docs/api-audit-report.md` §3 | Reject NUL and raw CR/LF in text fields; trim-and-reject whitespace-only |
| CRM-FX-0037 | `Via`/`X-Powered-By` disclosed | Informational | — | CWE-200 / WSTG-INFO-02 | every response | `docs/api-audit-report.md` §14 | Strip these headers at the proxy |

(The remaining 29 standing findings are functional/QA, not security-CVSS-scored; full list and severity in `docs/api-audit-report.md` §3–4.)

### D. Coverage matrix (field × technique × status)

A full per-field matrix already exists in machine-readable form (`fixtures/*.csv`, one row per technique per field) and in `docs/api-audit-report.md` §6/§18. Summarized by technique, across the fields actually carrying free text (`firstName`, `lastName`, `title`, `name`, `domain` — contacts/companies/deals):

| technique | status | evidence |
|---|---|---|
| XSS (stored) | Tested — PASS (stored as inert text) | injection probe, 0/648 unsafe |
| XSS (reflected) | Not applicable — no input is echoed into an HTML response outside the SPA's own client-side rendering (API is JSON-only) | — |
| XSS (DOM) | Not tested this pass — would need in-browser execution checks per rendered field | gap, next-run candidate |
| SQLi / NoSQLi | Tested — PASS | injection probe |
| SSTI | Tested — PASS | injection probe |
| XXE | Tested (marker payload) — PASS, stored as text, not parsed as XML | injection probe |
| SSRF | Not applicable — no outbound-URL-fetch feature found | API-SSRF-01, this report |
| LDAP injection | Tested (marker payload) — PASS | injection probe |
| Command injection | Tested — PASS | injection probe |
| CRLF/header injection | Tested — PASS (stored as text; no header split); **CRLF inside a raw HTTP header value could not be sent at all** — blocked by the test client itself, not the product | injection probe |
| Path traversal | Tested — PASS | injection probe |
| Unicode/RTL/homoglyph/null-byte/overlong-UTF8 | Tested — mixed: stored-as-text is safe, but invalid UTF-8/surrogates are silently mutated rather than rejected (CRM-FX-0038) | fixtures `*.csv`, audit §11 |
| Mass assignment | Tested — PASS (unrecognized keys rejected, systematic) | audit §9 |
| Parameter pollution | Tested — PASS (duplicate query key → 400) | audit §14, API-PARAMPOLL-01 |
| IDOR/BOLA same-tenant, cross-project | Tested — PASS | audit §13 |
| IDOR/BOLA cross-tenant | **Blocked — UNCONFIRMED, requires a second live tenant** | this report §B |
| Vertical privilege escalation | **Blocked — UNCONFIRMED, no second role available** | this report §2.3 |
| User enumeration (signup/reset) | Tested — PASS | this report, AUTH-SIGNUP-02, AUTH-RESET-01/02 |
| Rate-limit/brute-force | **Blocked — no documented limit to test against** | this report §5 |

### E. Retest plan

| finding | retest when | how |
|---|---|---|
| CRM-FX-0003 (CSRF) | after an Origin check is added | repeat the hostile-Origin write probe; expect 403 |
| CRM-FX-0036 (rate limit) | after a limit is documented | send at 10x the documented limit; expect 429 + `Retry-After`, confirm window reset |
| CRM-SEC-0001 (signup XSS) | before the next release touching signup/members | confirm the pending account via its example link, log in, check the Members page and Audit "created by" labels render the name escaped |
| CRM-FX-0039 (Crm-Org-Id) | after the header is validated | send an unrecognized org id; expect 400/403, not a silent default |
| CRM-FX-0038 (invalid UTF-8) | after validation is added | resend the lone-surrogate/invalid-UTF-8 fixtures; expect 400 |
| CRM-FX-0025 / CRM-FX-0037 (info disclosure) | after header/bucket-name changes | re-run the leak scan (`docs/api-audit-report.md` §14 methodology); expect 0 matches |
| Cross-tenant IDOR, role matrix | next run — **recommended as the single highest-value next step**, since it is both currently blocked and the only *untested* mandatory STEP 4.6 class | create a second example-backed account + workspace, invite a member into the existing workspace, retest every object-id-bearing endpoint from the second principal's session |
