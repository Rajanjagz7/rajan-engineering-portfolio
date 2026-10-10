# Coverage index for the 4-prompt QA brief (API contract, API hardening, fixtures, report)

Target: the CRM (`crm.example.com`), per your choice. This indexes where each of the four
prompts' deliverables already live in this repo, rather than duplicating them into a new file.

## Prompt 1 — API contract integrity (spec diff)
**Blocked, as agreed.** No OpenAPI/Swagger/Postman spec is published. Confirmed by requesting
`/api/crm/v1/openapi.json`, `openapi.yaml`, `swagger.json`, `/docs`, `/api/docs`, `/api/openapi.json` —
the first few 404 as JSON, the last two return HTTP 200 HTML (the dashboard shell, not a spec).
See `docs/api-audit-report.md` → **§15 Appendix K**. Every endpoint there is marked `ONLY-IN-LIVE`;
Steps 3–7 of Prompt 1 (spec diff, generated-client drift, version drift) have no spec to diff against.

## Prompt 2 — API hardening
`docs/api-audit-report.md` → **§14 Appendix J**:
- Error envelope baseline (every 4xx/5xx shape and count) — Step 1.
- Leak scan (stack frames, file paths, SQL error text, internal hosts, AWS account/access-key ids,
  framework codes, git hashes, env vars) — Step 2. 92 internal-host and 53 AWS-account-id matches found
  (already tracked as **CRM-FX-0025**, P3).
- Stable-codes table, same failing request × 20 — Step 3.
- Status-code-accuracy and header-hygiene table (method/path/status/content-type/Allow/Server/Via/
  X-Powered-By/Retry-After/RateLimit-\*/body) — Steps 5 and 8.
- Rate-limit note — Step 6: **not run**, marked blocked (no documented limit exists to multiply by 10x).
- Message quality — Step 4: judged inline per finding (e.g. CRM-FX-0016's framework-named error).

## Prompt 3 — Data fixtures
`fixtures/` (regenerated today, byte-identical to what was already committed — CRC32s in
`fixtures/README.md` match, no drift). One CSV per field, columns
`field, raw_input_as_user_typed, utf8_hex, normalised_form, expected_validator_result, category, reason, source`,
deterministic pinned seed `20261002`, every row sourced. AU-tax fields from the brief (ABN, TFN, BSB,
GST) have no matching CRM field, so they're kept as `au_reference.csv` only, not mapped to any endpoint
— noted explicitly rather than fabricated.

## Prompt 4 — Report
This **is** `docs/api-audit-report.md`'s structure already:
- §2 Coverage table = Step 1 (endpoint × method × auth × covered-by-prompt × statuses-seen × not-tested × blocked-by).
- §3–§13 + severity tables = Step 2 (per-finding id/endpoint/request/expected/actual/how-verified/impact/surfaces/reproducer/fix), ordered by severity.
- §4 = Step 3 (blockers vs nice-to-have bucket table).
- §16 = Step 4 (open questions / spec gaps, literal quotes).
- §17 = Step 5 (recommended next run, with rationale and estimated runtime per prompt).

## What changed in this pass
Two findings were wrong and are now retracted in `docs/api-audit-report.md` (both were "probed the
wrong URL path, concluded the feature doesn't exist"):
- **CRM-FX-0018** — activities *can* be linked, via `attachments: [{kind, id}]`.
- **CRM-FX-0023** — lead qualify/disqualify/convert *do* work, at `/leads/{id}/...` not `/contacts/{id}/...`.
  Re-verified live on 2026-10-06: `POST /leads/{id}/qualify` → 200, `POST /leads/{id}/convert` → 200.

Standing total: **38 findings** (0 blocker, 0 high, 6 medium, 32 low), down from 40 raised.
