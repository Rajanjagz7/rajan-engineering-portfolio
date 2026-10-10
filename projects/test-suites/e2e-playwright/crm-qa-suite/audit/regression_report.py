#!/usr/bin/env python3
"""Builds docs/regression-report.md from the regression evidence (reports/regress/*.json, evidence_RG/N*/R*/etc.)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RG = {r["id"]: r for r in json.loads((ROOT / "reports/regress/recheck.json").read_text(encoding="utf-8"))}
UI = {r["id"]: r for r in json.loads((ROOT / "reports/regress/recheck_ui.json").read_text(encoding="utf-8"))} if (ROOT / "reports/regress/recheck_ui.json").exists() else {}


def rid(key):
    r = RG.get(key)
    return ", ".join(f"`{x}`" for x in r["rids"][:2]) if r and r["rids"] else ""


F, P, O = "FIXED", "PARTLY FIXED", "STILL OPEN"
# (original id, title, status, evidence note, evidence ids)
ROWS = [
 ("BUG-01", "Null byte in search returns HTTP 500", F, "contacts, companies, deals, files all return 200 now", rid("BUG-01")),
 ("BUG-02", "Expired session on submit shows a raw API message", F, 'dialog now says "Your session has ended. Sign in again to continue." with a Sign in button', "UI re-check"),
 ("BUG-03", "Contact phone not validated", F, "'abc' -> 400 \"Use 7 to 15 digits, with only spaces, dots, dashes, brackets and a leading +\"", rid("BUG-03")),
 ("BUG-04", "Company phone and domain not validated", F, "phone 400; domain must be a hostname and is normalised to lower-case host (scheme, path, port, trailing dot stripped)", rid("BUG-04")),
 ("BUG-05", "Whitespace-only contact first name", F, "-> 400", rid("BUG-05")),
 ("BUG-06", "ownerActorId not verified", O, "'nope' and an all-zero id are still accepted (201)", rid("BUG-06")),
 ("BUG-07", "Inconsistent length limits (300-char company name, >254 email)", F, "company name 300 -> 400; email over 254 -> 400", rid("BUG-07")),
 ("BUG-08", "Control characters accepted in names", P, "NUL and line breaks are now rejected in names/titles/labels. Still accepted in free-text fields: NUL in note bodies, task descriptions, product descriptions, message bodies, lead_source; whitespace-only in several of them", rid("BUG-08")),
 ("BUG-09", "Invalid UTF-8 silently replaced", F, "-> 400", rid("BUG-09")),
 ("BUG-10", "120-char limit counts UTF-16 units", F, "100 emoji now accepted (201)", rid("BUG-10")),
 ("BUG-11", "Oversized bodies: empty 502 instead of 413", P, "502 is gone, but 2 MB is sometimes a 413 and sometimes a dropped connection, and 3 MB and above always drops the connection (client sees a reset, no status)", rid("BUG-11")),
 ("BUG-12", "TRACE returns a bare 500", F, "-> 405 application/problem+json", rid("BUG-12")),
 ("BUG-13", "text/plain parsed as JSON; cross-origin writes accepted", F, "415 for wrong content type; writes need a same-origin Origin (403 otherwise). Minor: an http:// Origin for our own host is accepted (HSTS mitigates)", rid("BUG-13") + " " + rid("BUG-13b")),
 ("BUG-14", "Stage order has gaps after a delete", O, "orders [0, 2] after deleting the middle stage", rid("BUG-14")),
 ("BUG-15", "Unknown Crm-Org-Id accepted", O, "-> 200", rid("BUG-15")),
 ("BUG-16", "Every page has the same title", F, "16 distinct titles, e.g. \"Contacts · Vercel 3 · CRM Platform\"", "UI re-check"),
 ("BUG-17", "Headings skip h1 to h3", F, "no skipped levels on any of 16 pages", "UI re-check"),
 ("BUG-18", "Unlabelled field on Files page", F, "all fields labelled", "UI re-check"),
 ("BUG-19", "Escape discards a dirty dialog without warning", F, "\"Discard changes?\" with Keep editing / Discard", "UI re-check"),
 ("BUG-20", "Table cells truncated on mobile", F, "0 of 5 cells clipped at 375 px", "UI re-check"),
 ("D-1", "Duplicates allowed everywhere", P, "Pipeline names are now unique (case and surrounding spaces ignored, archived included; holds under 10 parallel requests). Contacts (email), companies, products, rules still allow duplicates", "`REQ-N100001`"),
 ("D-2", "Stages can be added to an archived pipeline", F, "-> 409", rid("BUG-DQ2")),
 ("D-3", "Import cannot update or skip existing records", O, "onDuplicate accepts only create and reject", "`REQ-R200009`"),
 ("D-5", "Moving a deal to its current stage returns 200", O, "-> 200", rid("FX-MOVESAME")),
]
AUDIT = [
 ("CRM-FX-0001", "Big integers in number properties silently rounded", O, "9223372036854775807 stored as 9223372036854776000", rid("FX-NUMPREC")),
 ("CRM-FX-0002", "Writes accepted from a hostile Origin", F, "403 cross_site_request (see BUG-13)", rid("BUG-13b")),
 ("CRM-FX-0003", "Phone not validated", F, "see BUG-03", rid("BUG-03")),
 ("CRM-FX-0004", "Text fields accept NUL, CRLF, whitespace-only", P, "see BUG-08. Leading/trailing line breaks are simply trimmed (fine); internal ones are rejected", rid("FX-NUL")),
 ("CRM-FX-0005", "Stage creation accepts a client-chosen id, reusable across pipelines", O, "201", rid("FX-STAGEID")),
 ("CRM-FX-0006", "Null byte in search returns 500", F, "see BUG-01", rid("BUG-01")),
 ("CRM-FX-0007", "Automation rule with an action pointing at non-existent records is saved", O, "201", "integration step"),
 ("CRM-FX-0008", "Merge of a non-existent source returns 409, not 404", O, "409 \"Source contact not found\"", "integration step"),
 ("CRM-FX-0009", "Merge cannot resolve conflicting emails/phones", O, "409 with no field to choose", rid("FX-MERGE")),
 ("CRM-FX-0010", "/api/docs and other unknown /api paths return 200 HTML", O, "200 on /api/docs, /api/openapi.json, /api/v1/pipelines", rid("FX-SOFT404")),
 ("CRM-FX-0011", "No GET-by-id for custom properties", O, "404 \"No route\"", "`REQ-N300002`"),
 ("CRM-FX-0012", "Over-long URL error uses another envelope and names the framework", O, "414 with FST_ERR_MAX_PARAM_LENGTH", rid("FX-ENVELOPE")),
 ("CRM-FX-0013", "Automation runs about two minutes after the event with no hint", O, "task appeared after ~122 s", "integration step"),
 ("CRM-FX-0014", "No uniqueness rule (contact email, pipeline name)", P, "see D-1", "`REQ-N100001`"),
 ("CRM-FX-0015", "Repeating an archive: 200 for contacts/companies, 409 for pipelines/deals", O, "contact archive again -> 200", rid("FX-ARCH2")),
 ("CRM-FX-0016", "RETRACTED: lead routes exist at /leads/{id}/qualify|disqualify|convert", F, "routes respond", rid("FX-LEADROUTES")),
 ("CRM-FX-0017", "Internal identifiers exposed (AWS account id in bucket host, framework error code)", O, "bucket crm-staging-files-<12-digit id>; FST_ERR_* still returned", "`REQ-N300003`"),
 ("CRM-FX-0018", "timeZone accepts non-canonical names", O, "'australia/sydney' -> 201", rid("FX-TZ")),
 ("CRM-FX-0019", "Company domain not validated", F, "validated and normalised", rid("BUG-04")),
 ("CRM-FX-0020", "Duplicate JSON keys accepted", O, "last key wins (201) on all 21 write routes", rid("FX-DUPKEYS")),
 ("CRM-FX-0021", "Wrong or missing Content-Type accepted", F, "415 (matrix: accepted on 0 of 22 routes)", rid("FX-CTYPE")),
 ("CRM-FX-0022", "No rate-limit headers or Retry-After", O, "none seen over ~8,000 requests", rid("FX-HEADERS")),
 ("CRM-FX-0023", "Via header discloses the proxy", O, "Via: 1.1 Caddy", rid("FX-HEADERS")),
 ("CRM-FX-0024", "Invalid text replaced with U+FFFD", P, "invalid UTF-8 bytes now rejected; lone surrogates still silently replaced in all text fields", rid("BUG-09")),
 ("CRM-FX-0025", "Contact created as archived has no statusBeforeArchive", O, "None", rid("FX-BORNARCH")),
 ("CRM-FX-0026", "DELETE of a custom property only archives it", O, "still listed after 204", rid("FX-PROPDEL")),
 ("CRM-FX-0027", "PUT/DELETE/PATCH on a collection return 404, not 405", O, "404 x3 (OPTIONS still advertises them)", rid("FX-405")),
 ("CRM-FX-0028", "TRACE returns a bare 500", F, "405", rid("BUG-12")),
 ("CRM-FX-0029", "Replayed Idempotency-Key answers 'created' for a deleted record", O, "replay 201, GET original 404", rid("FX-IDEMDEL")),
 ("CRM-FX-0030", "Unknown Crm-Org-Id accepted", O, "200", rid("BUG-15")),
 ("CRM-FX-0031", "Filter status=archived rejected; only status[in]= works", O, "400 Unrecognized key", rid("FX-FILTER")),
 ("CRM-FX-0032", "Audit events for deleted records lose the name", O, "event data holds only the id", rid("FX-AUDITNAME")),
 ("CRM-FX-0033", "Idempotent replays carry no marker header", O, "no header", rid("FX-IDEMHDR")),
 ("CRM-FX-0034", "Import has no update/skip mode", O, "see D-3", "`REQ-R200009`"),
 ("CRM-FX-0035", "Oversized body gives a bare 502", P, "see BUG-11", rid("BUG-11")),
 ("CRM-FX-0036", "Move to the same stage succeeds", O, "200", rid("FX-MOVESAME")),
 ("CRM-FX-0037", "Name limit counts UTF-16 units", F, "see BUG-10", rid("BUG-10")),
 ("CRM-FX-0038", "RETRACTED: activities link through the attachments field", F, "201 with attachments", rid("FX-ACTLINK")),
 ("CRM-FX-0039", "Stage order gap after delete", O, "[0, 2]", rid("BUG-14")),
 ("CRM-FX-0040", "Stages can be added to an archived pipeline", F, "409", rid("BUG-DQ2")),
]
NEW = [
 ("P2", "NEW-01", "Intermittent connection resets and timeouts on ordinary requests; at least one create was saved although the client never got a response",
  "6 of 7,751 matrix requests ended with a reset (4) or a 30 s read timeout (2): `REQ-C200206` (create, reset after 2.8 s), `REQ-C200330` (create, 30 s timeout), `REQ-B200206`, `REQ-C200234`. Afterwards one catalog product existed that no successful response accounts for (count check: 6 + 132 accepted = 138 expected, 139 found). A client that retries without an Idempotency-Key can create duplicates; one that does not retry may lose the fact that the create succeeded.",
  "Make the proxy/app return a response or a clean error; clients should always send an Idempotency-Key on creates (it works)."),
 ("P3", "NEW-02", "Oversized request bodies drop the connection instead of returning 413",
  "1 MB -> 400 (parsed), 2 MB -> 413 (`REQ-R200002`) in one run but a reset in the re-check script and in pytest; 3 MB, 5 MB and 10 MB -> connection reset every time (`REQ-R200003`). The 502 from the first audit is gone, but the client still gets no status.",
  "Reject on Content-Length before reading; return 413 with the standard envelope."),
 ("P3", "NEW-03", "Free-text fields still accept NUL and whitespace-only text after the control-character fix",
  "Rejected now in names, titles and labels (\"Cannot contain control characters, line breaks or text-direction overrides\"), but accepted in: activity note body, task description, automation action title, product description, message body, custom property lead_source (NUL), and in file name, document file name, message subject, rule action title (whitespace-only). A NUL in a message body is customer-facing.",
  "Apply the same rule (allowing line breaks, forbidding NUL/control characters) to the free-text fields; reject blank required text."),
 ("P3", "NEW-04", "Pipeline-name uniqueness is bypassed by Unicode look-alikes",
  "Rule is documented as \"ignoring case and surrounding spaces\", so these all create a second pipeline that looks identical: NFD vs NFC \"Café\" (`REQ-N100002`), non-breaking space, double inner space, zero-width space, full-width letters.",
  "Compare names after Unicode normalisation (NFKC), collapsing whitespace and removing zero-width characters."),
 ("P3", "NEW-05", "Company domain accepts an IP address",
  "domain `192.168.1.1` is stored as is (201) while `localhost` and `[::1]` are rejected; a domain given with a port (`…:8080`) silently loses the port.",
  "Reject IP literals in a domain field; decide whether to reject rather than silently strip ports."),
 ("P3", "NEW-06", "Same-origin check accepts an http:// Origin for the same host",
  "Origin `http://crm.example.com` -> 201 (the scheme is not compared). Not exploitable while HSTS is on, which it is, but the check should compare scheme, host and port.",
  "Compare the full origin."),
 ("INFO", "NEW-07", "Automation rule is auto-suspended after 501 runs in an hour (limit 500), and resuming is only possible via PATCH enabled:true",
  "This is a sensible safeguard and worked as designed (my seeded \"New contact: welcome note\" rule was suspended by the bulk contact creation in the matrix). Observations: the suspension is visible only as suspendedAt/reason on the rule; there is no resume route (`POST .../resume` is 404); a single bulk import of 501 contacts would suspend a contact.created rule silently.",
  "Show the suspended state and a Resume button in the UI, and mention it in the import summary."),
]
SUITES = [
 ("API tests (pytest)", "163 passed, 2 expected failures (ownerActorId, 3 MB body), 1 failed: the 2 MB body test (connection reset, see NEW-02)"),
 ("UI tests (Playwright, Chromium + Firefox + WebKit + mobile)", "115 passed, 1 failed: WebKit page-load timeout on staging (flake; passed in every other run)"),
 ("Previously reported bug list re-checked", f"{sum(1 for r in ROWS+AUDIT if r[2]==F)} fixed, {sum(1 for r in ROWS+AUDIT if r[2]==P)} partly fixed, {sum(1 for r in ROWS+AUDIT if r[2]==O)} still open (of {len(ROWS)+len(AUDIT)} rows; some items appear in both lists)"),
 ("Full field matrix re-run", "4,690 cases over 23 write operations. 139 previously flagged cases now pass; 113 still flagged (mostly lone surrogates and free-text NUL/blank); 4 flagged cases are connection resets"),
 ("Behaviour steps re-run", "authentication (177 variants, all 401), isolation (identical 404s, no leaks), mass assignment (239 of 240 rejected), state machines (unchanged), idempotency (works), races (pipeline-name uniqueness holds under 10 parallel), partial failures (8 of 8 roll back), integration (50 pass, 3 unchanged failures)"),
]


def table(rows, cols):
    out = ["| " + " | ".join(cols) + " |", "|" + "|".join("---" for _ in cols) + "|"]
    for r in rows:
        out.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in r) + " |")
    return "\n".join(out)


L = ["# CRM regression report", "",
     "Staging https://crm.example.com, project `Vercel 3`, 5 Oct 2026. Baseline: the bug report and API audit of 1-2 Oct 2026. Every row cites a request id (`REQ-...`, logged in `reports/audit*/evidence*.jsonl`) or the UI re-check script.", "",
     "## 1. Result", ""]
fx = sum(1 for r in ROWS + AUDIT if r[2] == F)
L += [f"- **{sum(1 for r in ROWS if r[2]==F)} of the {len(ROWS)} tracked items in the first bug list are fixed** (including all 7 UI bugs), {sum(1 for r in ROWS if r[2]==P)} partly fixed, {sum(1 for r in ROWS if r[2]==O)} still open.",
      f"- **{sum(1 for r in AUDIT if r[2]==F)} of the 40 API audit findings are fixed**, {sum(1 for r in AUDIT if r[2]==P)} partly, {sum(1 for r in AUDIT if r[2]==O)} still open.",
      "- **7 new findings** (1 medium, 5 low, 1 informational). No blocker or high-severity issue, no regression in tenant isolation or authentication, no data exposure.",
      "- Test addresses in all scripts, fixtures, docs and the staging demo data now use `example.com` (a public inbox: keep sending in test mode).", ""]
L += ["## 2. Test runs", "", table(SUITES, ["Run", "Result"]), "", "## 3. New bugs found in this regression", ""]
for sev, i, title, detail, fix in NEW:
    L += [f"### {i} [{sev}] {title}", "", detail, "", f"**Suggested fix:** {fix}", ""]
L += ["## 4. First bug list (BUG-01 to BUG-20 and design questions)", "", table(ROWS, ["id", "bug", "status", "what I saw now", "evidence"]), "",
      "## 5. API audit findings (CRM-FX-0001 to 0040)", "", table(AUDIT, ["id", "finding", "status", "what I saw now", "evidence"]), "",
      "## 6. Behaviour changes to be aware of (intended, not bugs)", "",
      "- Every write now needs a same-site `Origin`; API clients without one get 403 `cross_site_request`.",
      "- Pipeline names are unique (case and surrounding spaces ignored, archived included): 409 on a duplicate or rename collision.",
      "- Names, titles and labels reject line breaks, NUL and text-direction overrides: a CSV import row with a multi-line quoted last name now fails with a clear per-row message.",
      "- A rule that exceeds 500 runs per hour is suspended automatically.",
      "- Page titles are now `<Page> · <Project> · CRM Platform`.", "",
      "## 7. Not covered", "",
      "- Member and other roles (still only one owner account).", "- Real screen readers; Safari on real hardware.",
      "- The 10x rate-limit probe (no limit is documented or observable).", "- The automation delay was re-observed (about 2 minutes) but not re-measured at scale.", ""]
(ROOT / "docs").mkdir(exist_ok=True)
(ROOT / "docs" / "regression-report.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print("rows:", {s: sum(1 for r in ROWS + AUDIT if r[2] == s) for s in (F, P, O)})
