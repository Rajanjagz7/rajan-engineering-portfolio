# Security and injection testing — results

Authorized testing against the staging CRM's own API (`CRM_BASE_URL`, the user's staging environment). Script: `scripts/security_injection_probe.py`. Run against all three projects (Vercel, Vercel 2, Vercel 3), 216 payload probes per project (648 total) plus 7 structural probes per project.

## Payload classes tried
XSS (`<script>`, `onerror`, `<svg onload>`, attribute breakout, `javascript:` markdown link), SQLi (`' OR 1=1`, `UNION SELECT`, comment truncation, stacked `DROP TABLE`), NoSQL operator injection (`$gt`, `$ne`, `$where`), server-side template injection (Jinja `{{7*7}}`, `${7*7}`, `#{7*7}`, Angular sandbox escape), OS command injection (`;`, backticks, pipes, `$()`), path traversal (Unix and Windows), null bytes, CRLF/header injection, LDAP injection, an XXE marker, format-string (`%n`), Unicode RTL override and zero-width hiding, 10 KB/100 KB strings, a 2000-emoji flood, a Mongo operator as a bare string, and `__proto__`. Fields targeted: `firstName`/`lastName`/`title`/on contacts, `name`/`domain` on companies, `title` on deals.

## Result: clean across all three projects
- **0 of 648** probes returned a 5xx.
- **0** were stored differently from what was sent (no silent mangling, no server-side execution markers appearing in the read-back).
- **0** leaked into response headers (no header injection via stored field values).
- The CRM rejects type-confused bodies correctly: `firstName` as an array → 400; `firstName` as `{"$gt": ""}` → 400; a 500-level-deep nested JSON object → 400, not a crash.
- Oversized payloads degrade gracefully: 50 KB and 500 KB custom-property values → 400 (validation), 2 MB → 413 (payload too large) — not a crash, not a hang.
- Values that are accepted (e.g. `<script>alert(1)</script>` as a first name) are stored **verbatim** as plain text. That is correct API behavior; it only becomes an XSS risk if the frontend ever renders such a field as raw HTML instead of as text — worth a quick manual check the next time any new contact-name display surface is added, but no evidence of unescaped rendering was found in the existing UI, and this was not re-verified in the browser in this pass.

## One client-side-only finding (not a product bug)
Testing a literal CRLF (`\r\n`) inside an HTTP *header value* (not inside the JSON body) failed on the test client itself — Python's own `http.client` refuses to send a header value containing `\r`/`\n`, so this particular transport-level attack could not be sent at all through this tool. A real attacker would hit the same restriction in virtually every standard HTTP client, so this is a low-value gap, not a sign of a vulnerability. CRLF **inside JSON body fields** (the realistic injection vector) was tested fine and handled correctly (stored as literal text, no header split).

## What this does not cover
- Actual script execution in the browser (requires rendering each payload in a live page and checking for an alert/DOM change — not done this pass).
- Authentication/authorization bypass (IDOR across projects/orgs, privilege escalation) — not in scope of this run; worth a dedicated pass if wanted.
- Rate-limiting / brute-force on login.
- File-upload content-type and malware-signature handling on the imports/attachments flow.

Full machine-readable results: `reports/security/injection-probe-<projectId>.json` for each project.

## Load/volume data added (for UI stress testing)
Ran `scripts/seed_load_fields.py` against all three projects — enriches existing (already-realistic) contacts/deals/companies with a long realistic account-history note (~6.5k characters) and 8-12 follow-up tasks per contact, to stress-test activity feeds, the My work list, and pagination.

| Project | Contacts enriched | Notes added | Tasks added | Deal notes | Company notes |
|---|---|---|---|---|---|
| Vercel | 15 | 15 | 161 | 15 | 15 |
| Vercel 2 | 15 | 15 | 148 | 15 | 15 |
| Vercel 3 | 15 | 15 | 143 | 15 | 15 |

No new contacts/companies were created by this pass — it only adds activity volume to existing, already-realistic records, so no placeholder/test-style names were introduced.
