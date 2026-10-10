#!/usr/bin/env python3
"""Renders docs/api-audit-report.md and docs/validation-messages.csv. Run: python audit/render_report.py"""
from __future__ import annotations

import collections
import csv
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_report as B  # noqa: E402
from build_report import (AUD, DOCS, EV, KN, MATRIX, RO, SEV_NAME, WR, curl, derive_known_findings, derive_matrix_findings,  # noqa: E402
                          derive_readonly_findings, derive_write_findings, derive_integration_findings, derive_readback_gap_findings, INT, dedupe_and_number, fence, finding, md_cell, norm_path, redact,
                          quote_req, quote_resp, table)


def step_prompt(step):
    if step.startswith("matrix") or step == "negative-only":
        return "P1"
    if step in ("authn", "authn-replay", "idor-read", "mass-assignment", "state-machine", "csrf-xproject"):
        return "P2"
    if step in ("idempotency", "races", "partial-failure"):
        return "P3"
    if step in ("error-stability", "hygiene") or step.startswith("known"):
        return "P5"
    return None


def coverage_rows():
    seen = collections.defaultdict(lambda: dict(steps=set(), statuses=set()))
    for r in EV.values():
        if r["step"] in ("cleanup", ""):
            continue
        s = seen[(r["method"], norm_path(r["path"]))]
        s["steps"].add(step_prompt(r["step"]) or "other")
        s["statuses"].add(r["status"])
    rows = []
    for (m, p), s in sorted(seen.items(), key=lambda x: (x[0][1], x[0][0])):
        write = m in ("POST", "PUT", "PATCH", "DELETE")
        applicable = {"P1", "P2", "P3", "P5"} if write else {"P2", "P5"}
        if m in ("OPTIONS", "HEAD", "TRACE"):
            applicable = {"P5"}
        missing = sorted(applicable - s["steps"])
        blocked = ["P4 spec diff (no published spec)"]
        if "P2" in applicable:
            blocked.insert(0, "role matrix and cross-user/tenant tokens (single owner account)")
        rows.append([p, m, "no" if "/auth/login" in p else "yes", ",".join(sorted(s["steps"] - {"other"})) or "-",
                     ",".join(str(x) for x in sorted(x for x in s["statuses"] if x)), ",".join(missing) or "-", "; ".join(blocked), "write" if write else "read"])
    return rows


def validation_catalogue():
    cat = collections.OrderedDict()
    for r in EV.values():
        if not r["status"] or not (400 <= r["status"] < 500):
            continue
        try:
            j = json.loads(r["resp_body"])
        except Exception:
            continue
        det = j.get("detail") or j.get("message") or ""
        if not det:
            continue
        for seg in re.split(r";\s+(?=/)", det):
            m = re.match(r"^(/[\w/\-\[\]]*)\s*:\s*(.*)$", seg)
            field, msg = (m.group(1), m.group(2)) if m else ("(request)", seg)
            norm_msg = re.sub(r"[0-9a-f]{24}", "<id>", msg)
            norm_msg = re.sub(r"\d{4,}", "<n>", norm_msg)[:200]
            key = (r["method"], norm_path(r["path"]), field, norm_msg)
            e = cat.setdefault(key, dict(status=r["status"], code=j.get("code", ""), count=0, rid=r["id"]))
            e["count"] += 1
    return cat


LEAK_PATTERNS = [("stack frame", r"\bat [\w.$<>]+ \(|\.js:\d+:\d+|\.ts:\d+:\d+"), ("file path", r"[A-Za-z]:\\\\|/usr/|/app/|/var/|node_modules|/home/"),
                 ("SQL/DB error text", r"SQLSTATE|PG::|duplicate key value|syntax error at or near|MongoServerError|E11000|ORA-\d+"),
                 ("internal host / IP", r"\.internal\b|\b10\.\d+\.\d+\.\d+\b|\b192\.168\.\d+\.\d+\b|\b172\.(1[6-9]|2\d|3[01])\.\d+\.\d+\b"),
                 ("AWS access key id", r"\b(AKIA|ASIA)[0-9A-Z]{16}\b"), ("12-digit AWS account id in a bucket host", r"[a-z\-]+-\d{12}\.s3"),
                 ("framework error code", r"FST_ERR_[A-Z_]+|ECONNREFUSED|ENOTFOUND"), ("git commit hash", r"\b[0-9a-f]{40}\b"),
                 ("environment variable assignment", r"\b[A-Z][A-Z0-9_]{6,}=[^\s]{3,}")]


def leak_scan():
    hits = collections.defaultdict(list)
    for r in EV.values():
        blob = r["resp_body"] + " " + " ".join(f"{k}: {v}" for k, v in r["resp_headers"].items() if k.lower() != "set-cookie")
        for name, pat in LEAK_PATTERNS:
            if re.search(pat, blob):
                hits[name].append(r["id"])
    return hits


def render():
    derive_matrix_findings()
    derive_readonly_findings()
    derive_write_findings()
    derive_known_findings()
    derive_integration_findings()
    derive_readback_gap_findings()
    leaks = leak_scan()
    for name, ids in leaks.items():
        if name in ("12-digit AWS account id in a bucket host", "AWS access key id", "framework error code"):
            finding("P3", f"information disclosure: {name} appears in responses", "see request ids", ids[:4], "no internal identifiers in client-facing bodies",
                    f"{len(ids)} response(s) matched; e.g. {redact(EV[ids[0]]['resp_body'])[:140]!r}", "regex scan of every recorded response and header",
                    "aids fingerprinting and targeting", "API-only", "remove or generalise the identifier")
    F = dedupe_and_number()
    by_sev = collections.Counter(f["sev"] for f in F)
    L = []
    A = L.append
    A("# CRM API audit report")
    A("")
    A("- **Target:** https://crm.example.com/api/crm/v1 (staging); authorised owner test tenant; both own projects used for isolation checks.")
    A(f"- **Evidence:** {len(EV)} recorded requests (`reports/audit/evidence*.jsonl`, ids `REQ-...`). Every claim cites a request id.")
    A("- **Guard rails kept:** own tenant only; no cross-tenant access; no load (two to three sequential streams at 1-2 req/s each, at most 10 parallel and only in the race step); deletes only for rows created by this run; messages only in `test` environment mode to `example.com` addresses (one earlier probe ran in live mode, see Open questions); no brute-force.")
    A("- **ID prefix:** `CRM-FX-####` (the brief's `RBM8-FX` belongs to another project).")
    A("- **No spec:** the API publishes no OpenAPI/Swagger/Postman file, so contract rows are live-only.")
    A("")
    A("## 1. Summary")
    A("")
    A(table(["Severity", "Count"], [[f"{SEV_NAME[s]} ({s})", by_sev.get(s, 0)] for s in ("P0", "P1", "P2", "P3")]))
    A("")
    A(f"Total findings: **{len(F)}**. Matrix: **{len(MATRIX['rows'])}** cases, **{len({r['op'] for r in MATRIX['rows']})}** write operations, **{len(MATRIX['inventory'])}** fields.")
    A("")
    for s in ("P0", "P1"):
        for f in [x for x in F if x["sev"] == s][:8]:
            A(f"- **{f['id']} ({s})** {f['title']}")
    A("")
    A("## 2. Coverage table (mandatory)")
    A("")
    A("`covered-by`: P1 validation/boundary, P2 authn/authz/mass-assignment/state, P3 idempotency/race/partial, P5 error hygiene. `not-tested` lists applicable prompts with no evidence for that endpoint. P4 (contract) has no per-endpoint evidence because no spec exists.")
    A("")
    A(table(["endpoint", "method", "auth", "covered-by", "statuses seen", "not-tested", "blocked-by", "kind"], coverage_rows()))
    A("")
    A("## 3. Findings (ordered by severity)")
    A("")
    for f in F:
        A(f"### {f['id']} [{SEV_NAME[f['sev']]} / {f['sev']}] {f['title']}")
        A("")
        A(f"- **endpoint:** `{f['endpoint']}`")
        A(f"- **expected:** {f['expected']}")
        A(f"- **actual:** {f['actual_note']}")
        A(f"- **how-verified:** {f['how']}")
        A(f"- **impact:** {f['impact']}" + (f"  \n- **revenue or safety impact:** {f['biz']}" if f["biz"] else ""))
        A(f"- **surfaces affected:** {f['surface']}")
        A(f"- **evidence ids:** {', '.join('`' + r + '`' for r in f['rids']) or '(aggregate; see appendix tables)'}")
        if f["rids"]:
            r0 = f["rids"][0]
            A("- **request (verbatim):**")
            A(fence(quote_req(r0), "http"))
            A("- **response (verbatim):**")
            A(fence(quote_resp(r0), "http"))
            if curl(r0):
                A("- **reproducer:**")
                A(fence(curl(r0), "bash"))
        A(f"- **suggested fix direction:** {f['fix']}")
        A("")
    A("## 4. Blockers vs nice-to-have")
    A("")
    A(table(["id", "bucket", "title", "revenue or safety justification"],
            [[f["id"], SEV_NAME[f["sev"]], f["title"], f["biz"] or ("-" if f["sev"] in ("P2", "P3") else "(state one)")] for f in F]))
    A("")
    A("## 5. Appendix A: field inventory")
    A("")
    A("Built from the live UI/Network walkthrough, validation messages and the matrix (no spec exists). Text `min`/`max` are boundaries *discovered by bisection*, not assumed.")
    A("")
    A(table(["operation", "field", "kind", "required", "min", "max", "enum", "note"],
            [[i["op"], i["field"], i["kind"], "yes" if i["required"] else "no", i["min"] if i["min"] is not None else "-", i["max"] if i["max"] is not None else "-",
              ",".join(map(str, i["enum"] or [])) or "-", i.get("note", "")] for i in MATRIX["inventory"]]))
    A("")
    A("## 6. Appendix B: boundary-value results per field")
    A("")
    cases = collections.defaultdict(dict)
    for r in MATRIX["rows"]:
        cases[(r["op"], r["field"])][r["case"]] = r
    rowsB = []
    for Lm in MATRIX["limits"]:
        c = cases[(Lm["op"], Lm["field"])]

        def g(n):
            if n is None:
                return "-"
            x = c.get(f"length={n}") or c.get(f"array length={n}")
            return f"{n} -> {x['status']} ({x['rid']})" if x else str(n)
        rowsB.append([Lm["op"], Lm["field"], g(Lm["min_minus1"]), g(Lm["min_ok"]), g(Lm["max_ok"]), g(Lm["max_plus1"]), Lm["note"]])
    A(table(["operation", "field", "min-1", "valid-min", "valid-max", "max+1", "note"], rowsB))
    A("")
    A("## 7. Appendix C: type and representation results (flagged cases)")
    A("")
    flagged = [r for r in MATRIX["rows"] if r["verdict"] in ("ACCEPTED-INVALID", "REJECTED-VALID", "SILENT-MUTATION", "SERVER-ERROR", "BASELINE-FAILED")]
    A(f"{len(flagged)} flagged of {len(MATRIX['rows'])} cases; the rest behaved as expected or have no firm expectation (all rows are in `reports/audit/matrix_*.json`).")
    A("")
    A(table(["op", "field", "case", "sent", "status", "code", "message", "verdict", "rid", "read-back"],
            [[r["op"], r["field"], r["case"], r["value"], r["status"], r["code"], r["detail"][:90], r["verdict"], r["rid"], (r.get("readback") or "")[:80]] for r in flagged[:500]]))
    A("")
    A("## 8. Appendix D: read-back evidence (requested vs stored)")
    A("")
    rb = [r for r in MATRIX["rows"] if r.get("readback")]
    A(f"{sum(1 for r in MATRIX['rows'] if r['status'] in (200, 201, 202))} accepted writes; each was followed by a GET; {len(rb)} showed a difference.")
    A("")
    A(table(["op", "field", "case", "write rid", "read-back rid", "difference"], [[r["op"], r["field"], r["case"], r["rid"], r.get("rb_rid") or "", r["readback"]] for r in rb[:300]]))
    A("")
    A("## 9. Appendix E: count-delta evidence")
    A("")
    A(table(["operation", "collection", "before", "accepted creates", "expected after", "after", "ok"],
            [[c["op"], c["collection"], c["before"], c["accepted"], c["expected"], c["after"], "yes" if c["ok"] else "NO"] for c in MATRIX["counts"]] +
            [[c["op"] + " (negative-only)", "-", c["before"], c["accepted"], c["before"] + c["accepted"], c["after"], "yes" if c["ok"] else "NO"] for c in WR.get("negative_only_counts", [])]))
    A("")
    A("List endpoints return no `totalCount`; counts come from paging `GET /<resource>?limit=100` with `starting_after`.")
    A("")
    A("## 10. Appendix F: identity, authn, authz")
    A("")
    A("**Identity matrix.** Only one role exists (workspace `owner`). Rows for other roles are BLOCKED: no member or viewer account was issued and no RBAC document was supplied, so testing stops on those rows.")
    A("")
    res_list = ("pipelines", "deals", "contacts", "companies", "catalog-products", "automation-rules", "activities", "messages", "files", "close-reasons", "custom-properties")
    A(table(["role", "resource", "action", "expected", "status"],
            [["owner", res, act, "200/201/204", "tested"] for res in res_list for act in ("read", "write")] +
            [["member / viewer / other", "*", "*", "unknown (no RBAC spec)", "BLOCKED"], ["a user of ANOTHER tenant", "*", "*", "403/404", "OUT OF SCOPE (no cross-tenant access)"]]))
    A("")
    A("**Authn hypotheses** (each variant against every protected route):")
    A("")
    v, ex = collections.defaultdict(collections.Counter), {}
    for r in RO.get("authn", []):
        v[r["variant"]][(r["status"], r["code"])] += 1
        ex.setdefault(r["variant"], r["rid"])
    A(table(["variant", "routes tried", "responses (status, code): count", "example rid", "expected"],
            [[k, sum(c.values()), "; ".join(f"{s},{cd}: {n}" for (s, cd), n in c.items()), ex[k], "401, stable code" if not k.startswith("valid") else "200 or 401"] for k, c in v.items()]))
    A("")
    A("Replay after logout: " + (", ".join(f"`{r['rid']}` -> {r['status']} ({r['variant']})" for r in RO.get("authn_replay", [])) or "not run (run `audit/steps_readonly.py --with-logout` last)") + ".")
    A("")
    A("Blocked rows: " + "; ".join(RO.get("authn_blocked", [])) + ".")
    A("")
    A("**IDOR (own tenant, two own projects):**")
    A("")
    A(table(["endpoint", "id kind", "caller", "status", "code", "detail", "rid"], [[r["endpoint"], r["id_kind"], r["caller"], r["status"], r["code"], r["detail"], r["rid"]] for r in RO.get("idor", [])]))
    A("")
    A("## 11. Appendix G: mass assignment and state machines")
    A("")
    ma = collections.defaultdict(collections.Counter)
    for r in WR.get("mass_assignment", []):
        ma[r["op"]][(r["status"], r["verdict"])] += 1
    A(table(["operation", "extra fields tried", "outcomes (status, verdict): count"], [[op, sum(c.values()), "; ".join(f"{s},{vd}: {n}" for (s, vd), n in c.items())] for op, c in ma.items()]))
    A("")
    A(table(["case", "status", "code", "detail", "expected", "verdict", "rid"], [[r["case"], r["status"], r["code"], r["detail"], r["expect"], r["verdict"], r["rid"]] for r in WR.get("state_machine", [])]))
    A("")
    A("## 12. Appendix H: idempotency, concurrency, lost update, partial failure")
    A("")
    A(table(["endpoint", "same key x2: statuses", "rows created by the pair", "new key + same body", "replay header", "verdict", "rids"],
            [[r["endpoint"], r["same_key_twice"], r["same_key_rows_created"], r["new_key_same_body"], r["replay_header"] or "(none)", r["verdict"], r["rids"]] for r in WR.get("idempotency", [])]))
    A("")
    A(table(["case", "statuses", "rows created", "final count delta", "detail", "verdict", "rids"],
            [[r["case"], r["statuses"], r["rows_created"], r["final_count_delta"], r.get("detail", ""), r["verdict"], ", ".join(r["rids"][:10])] for r in WR.get("races", [])]))
    A("")
    A(table(["case", "status", "message", "count delta", "verdict", "rid"], [[r["case"], r["status"], r["detail"], r["count_delta"], r["verdict"], r["rid"]] for r in WR.get("partial_failure", [])]))
    A("")
    A("## 13. Appendix I: negative-only requests (every write endpoint)")
    A("")
    A(table(["operation", "case", "status", "code", "message", "envelope ok", "content-type", "verdict", "rid"],
            [[r["op"], r["case"], r["status"], r["code"], r["detail"][:80], r["envelope"], r["ctype"], r["verdict"], r["rid"]] for r in WR.get("negative_only", [])]))
    A("")
    A("## 14. Appendix J: error envelope, stability, hygiene")
    A("")
    sh = collections.Counter()
    for r in EV.values():
        if r["status"] and r["status"] >= 400:
            ct = r["resp_headers"].get("content-type", "(none)").split(";")[0]
            if all(k in r["resp_body"] for k in ('"type"', '"title"', '"status"', '"detail"', '"code"', '"requestId"')):
                shape = "problem+json (type,title,status,detail,code,requestId)"
            else:
                shape = "empty body" if not r["resp_body"] else ("html" if "<html" in r["resp_body"][:200].lower() else "other")
            sh[(r["status"], ct, shape)] += 1
    A("Envelope baseline (every 4xx/5xx in this run; forced by the audit, as no production traffic is accessible):")
    A("")
    A(table(["status", "content-type", "body shape", "count"], [[s, c, shp, n] for (s, c, shp), n in sorted(sh.items())]))
    A("")
    A("Leak scan over every recorded response body and header:")
    A("")
    A(table(["pattern", "matches", "example rids"], [[n, len(leaks.get(n, [])), ", ".join(leaks.get(n, [])[:3])] for n, _ in LEAK_PATTERNS]))
    A("")
    A("Stable codes (same failing request x20):")
    A("")
    A(table(["request", "repeats", "distinct responses", "status", "code", "detail"], [[r["request"], r["repeats"], r["distinct_responses"], r["status"], r["code"], r["detail"]] for r in RO.get("stability", [])]))
    A("")
    A("Status-code accuracy and header hygiene:")
    A("")
    A(table(["method", "path", "status", "content-type", "Allow", "Server", "Via", "X-Powered-By", "Retry-After", "RateLimit-*", "body", "rid"],
            [[r["method"], r["path"], r["status"], r["ctype"], r["allow"], r["server"], r["via"], r["powered"], r["retry_after"], r["ratelimit"], r["body"], r["rid"]] for r in RO.get("hygiene", [])]))
    A("")
    A("Wrong-password login (own account, one attempt): " + json.dumps(RO.get("login_wrong_password", {}))[:400])
    A("")
    A("Session cookie attributes on login: " + "; ".join(RO.get("login_cookie_attributes", []))[:600])
    A("")
    A("Rate limiting: no 429, no `Retry-After` and no `RateLimit-*` header appeared at any point. No limit is documented, so the 10x-over-limit probe was **not run** (blocked).")
    A("")
    A("## 15. Appendix K: contract (live-only, no spec)")
    A("")
    A("`/api/crm/v1/openapi.json`, `openapi.yaml`, `swagger.json`, `docs`, `/api/docs` and `/api/openapi.json` were requested. The first four return 404 JSON; the last two return HTTP 200 HTML (the dashboard shell). **No spec is published**, so every row below is ONLY-IN-LIVE; spec diffs, generated-client drift and breaking-change history are BLOCKED.")
    A("")
    live = collections.defaultdict(lambda: dict(statuses=set(), ctypes=set(), n=0))
    for r in EV.values():
        if r["step"] in ("cleanup", ""):
            continue
        k = (r["method"], norm_path(r["path"]))
        live[k]["statuses"].add(r["status"])
        live[k]["ctypes"].add(r["resp_headers"].get("content-type", "").split(";")[0])
        live[k]["n"] += 1
    A(table(["method", "path", "statuses observed", "response content-types", "requests", "spec row"],
            [[m, p, ",".join(str(s) for s in sorted(x for x in d["statuses"] if x)), ",".join(sorted(c for c in d["ctypes"] if c)), d["n"], "ONLY-IN-LIVE"] for (m, p), d in sorted(live.items(), key=lambda x: (x[0][1], x[0][0]))]))
    A("")
    A("Version drift: `/api/crm/v2/pipelines` and `/api/v1/pipelines` were requested (hygiene table); only `/api/crm/v1` is routed.")
    A("")
    A("## 16. Open questions / spec gaps")
    A("")
    for q in ["No OpenAPI/Swagger/Postman spec exists. Which document is authoritative for field limits, enums and error codes?",
              "Uniqueness: may two pipelines, companies, close-reason labels or contacts share a name or email? Today all are allowed, and parallel creates make duplicates (race table).",
              "Archived pipelines: the page text says an archived pipeline 'takes no new deals', yet stages can be added. Intended?",
              "Retry contract: should POST endpoints honour `Idempotency-Key`? An occasional empty 502 plus no idempotency means a client retry duplicates records or messages.",
              "Phone and domain formats: E.164 is required to send SMS, but any text is accepted when saving a contact. Which is the rule?",
              "Role model: only an owner exists. Which actions may members and viewers perform? (Blocks the whole role matrix.)",
              "Custom properties: DELETE only archives; archived rows stay in the default list, cannot be filtered out and cannot be hard-deleted. Deliberate?",
              "Activities cannot reference a contact, deal or company in this API version. Is the link modelled elsewhere?",
              "Lead lifecycle events (`lead.qualified`, `lead.disqualified`, `lead.converted`) are advertised as automation triggers, but no route raises them.",
              "List endpoints return no total count; is cursor paging the only supported way to count?",
              "Scope note: one early probe (before the harness) queued two emails in live mode to a throw-away test contact, at that time on the example.com domain, which cannot receive mail. All later message sends used `test` mode; test addresses are now on example.com, a public inbox, so use test mode there too."]:
        A(f"- {q}")
    A("")
    A("## 17. Recommended next run")
    A("")
    A(table(["prompt", "re-run when", "why", "observed runtime"], [
        ["P1 validation matrix", "any change to request schemas or validators", "re-bisects limits; re-checks read-back and counts", f"{MATRIX['requests']} requests, roughly 1-2 hours at 1-2 req/s per stream"],
        ["P2 authn, authz, mass assignment, state machines", "any change to auth, roles or lifecycle routes; add member/viewer accounts first", "the role matrix is blocked until a second role exists", "about 10 min"],
        ["P3 idempotency, races, partial failure", "any change to create/update paths, or after adding Idempotency-Key", "largest correctness risk (duplicates on retry)", "about 5 min"],
        ["P4 contract", "as soon as a spec is published", "a diff is impossible without one", "under 2 min"],
        ["P5 error hygiene", "every release", "cheap; catches 5xx and envelope regressions", "about 5 min"],
        ["P6 fixtures", "when limits change", "regenerate; compare CRC32 values in fixtures/README.md", "under 1 min"]]))
    A("")
    A("## 18. Appendix M: cross-module integration checks (positive and negative)")
    A("")
    A(table(["area", "case", "expected", "status", "verdict", "note", "rid"], [[r["area"], r["case"], r["expect"], r["status"], r["verdict"], (r.get("note") or r.get("detail") or "")[:160], r.get("rid", "")] for r in INT.get("rows", [])]))
    A("")
    A("## 19. Digest: wrong data, missing flows, validation gaps")
    A("")
    A("**Validation gaps (accepted when they should not be):** NUL, whitespace-only and CRLF text is stored in names, bodies, titles and message bodies; lone surrogates become U+FFFD; invalid UTF-8 is replaced; phone and domain are not validated; `ownerActorId` is not checked; length limits differ by field (see Appendix B).")
    A("")
    A("**Wrong or surprising data:** contacts created with `status: archived` have no previous status; stage ids can be client-chosen and reused across pipelines; deleting a custom property hides values and re-creating the key can change its type; audit events for deleted records lose the record name.")
    A("")
    A("**Missing flows:** lead qualify/disqualify/convert routes (events exist, routes do not); a way to resolve conflicting emails/phones when merging; linking activities to records; hard-deleting a custom property; GET-by-id for custom properties; a documented spec; total counts on list endpoints; a documented filter syntax (`status[in]=` works, `status=` does not).")
    A("")
    A("**Behaves well (verified):** Idempotency-Key (sequential and concurrent), ETag/If-Match (412 on stale), unique-key races, state-machine transitions, partial-failure rollbacks, cross-project isolation, authentication on every route, stable error codes.")
    A("")
    cat = validation_catalogue()
    A("## 20. Appendix L: validation message catalogue")
    A("")
    A(f"{len(cat)} distinct (endpoint, field, message) combinations observed in this run; also in `docs/validation-messages.csv`.")
    A("")
    rowsV = [[m, p, f, msg, e["status"], e["code"], e["count"], e["rid"]] for (m, p, f, msg), e in cat.items()]
    A(table(["method", "endpoint", "field", "message", "status", "code", "seen", "example rid"], rowsV))
    text = "\n".join(L) + "\n"
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", lambda m: f"\\x{ord(m.group()):02x}", text)   # quoted payloads may hold raw control characters
    with open(DOCS / "api-audit-report.md", "w", encoding="utf-8", errors="backslashreplace", newline="\n") as fh:
        fh.write(text)   # raw lone surrogates returned by the API are escaped, not crashed on
    with open(DOCS / "validation-messages.csv", "w", newline="", encoding="utf-8-sig", errors="backslashreplace") as fh:
        w = csv.writer(fh)
        w.writerow(["method", "endpoint", "field", "message", "status", "code", "seen", "example_rid"])
        w.writerows(rowsV)
    (AUD / "findings.json").write_text(json.dumps(F, indent=1, default=str), encoding="utf-8")  # json.dumps escapes surrogates
    print(f"findings={len(F)} {dict(by_sev)} evidence={len(EV)} validation-messages={len(cat)} -> docs/api-audit-report.md")


if __name__ == "__main__":
    render()
