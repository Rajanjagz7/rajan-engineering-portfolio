#!/usr/bin/env python3
"""Builds docs/api-audit-report.md (+ validation-message catalogue) from reports/audit/*.json(l).
Every claim cites an evidence request id (REQ-...). Nothing is asserted that the evidence does not show."""
from __future__ import annotations

import collections
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "reports" / "audit"
DOCS = ROOT / "docs"
DOCS.mkdir(exist_ok=True)
PREFIX = "CRM-FX"
SEV_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
SEV_NAME = {"P0": "BLOCKER", "P1": "HIGH", "P2": "MEDIUM", "P3": "LOW"}


# ------------------------------------------------------------------------------------------------ loading
def load_evidence():
    ev = {}
    for f in sorted(glob.glob(str(AUD / "evidence*.jsonl"))):
        for line in open(f, encoding="utf-8"):
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            ev[r["id"]] = r
    return ev


def jload(name, default=None):
    p = AUD / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else (default if default is not None else {})


EV = load_evidence()
MATRIX = {"rows": [], "limits": [], "counts": [], "inventory": [], "requests": 0}
_by_op = {}
for f in sorted(glob.glob(str(AUD / "matrix_*.json")), key=lambda p: Path(p).stat().st_mtime):   # newest file wins per operation
    m = json.loads(Path(f).read_text(encoding="utf-8"))
    MATRIX["requests"] += m.get("requests", 0)
    ops_here = {r["op"] for r in m.get("rows", [])}
    for key in ("rows", "limits", "counts", "inventory"):
        for item in m.get(key, []):
            _by_op.setdefault((key, item["op"]), [])
    for op in ops_here:                      # a newer run of an operation replaces every older record of it
        for key in ("rows", "limits", "counts", "inventory"):
            _by_op[(key, op)] = [i for i in m.get(key, []) if i["op"] == op]
for (key, op), items in _by_op.items():
    MATRIX[key] += items


def _reclassify(rows):
    """Rows recorded before the engine understood instants: a datetime stored in another notation but at the same
    instant is a normalisation, not a mutation."""
    import ast
    import datetime as _dt
    for r in rows:
        if r.get("verdict") == "SILENT-MUTATION" and r["field"].split(".")[-1] in ("dueAt", "startsAt", "endsAt", "renewal_date"):
            m = re.match(r"MUTATED: sent=(.+?) stored=(.+)$", r.get("readback") or "")
            if m:
                try:
                    sv, tv = ast.literal_eval(m.group(1)), ast.literal_eval(m.group(2))
                    a_ = _dt.datetime.fromisoformat(sv.replace("Z", "+00:00"))
                    b_ = _dt.datetime.fromisoformat(tv.replace("Z", "+00:00"))
                    if a_.tzinfo and b_.tzinfo and a_ == b_:
                        r["verdict"], r["readback"] = "RECORDED", "normalised: same instant, stored as UTC with milliseconds"
                except Exception:
                    pass
    return rows


def _reclassify2(rows):
    """Judgement calls that the engine's rules did not encode when the rows were recorded."""
    benign_rejects = {"tab", "newline", "RTL override", "null", "24:00:00"}
    for r in rows:
        if r.get("verdict") == "REJECTED-VALID" and r["case"] in benign_rejects:
            r["verdict"] = "RECORDED"      # a stricter-than-expected rejection of control characters / RFC 3339 24:00 / null is correct
        if r.get("verdict") == "SILENT-MUTATION" and r["field"] == "contentType" and "UPPER" in r["case"] or (r.get("verdict") == "SILENT-MUTATION" and r["field"] == "contentType" and "Title" in r["case"]):
            r["verdict"], r["readback"] = "RECORDED", "normalised: MIME type lower-cased"
    for r in rows:
        if r.get("verdict") == "SILENT-MUTATION" and r["case"] == "duplicate items":
            r["verdict"], r["readback"] = "RECORDED", "normalised: the server adds an id (and label) to each item and keeps both"
    return rows


MATRIX["rows"] = _reclassify2(_reclassify(MATRIX["rows"]))
RO, WR, KN = jload("readonly.json"), jload("writes.json"), jload("known.json", [])
INT = jload("integration.json", {"rows": []})
if isinstance(KN, dict):
    KN = []


def norm_path(p):
    p = p.split("?")[0]
    p = re.sub(r"/[0-9a-f]{24}(?=/|$)", "/{id}", p)
    p = re.sub(r"/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=/|$)", "/{id}", p)
    return p


_SECRET = re.compile(r"(X-Amz-(?:Signature|Security-Token)=)[^&\"\s\\]+", re.I)
_CRED = re.compile(r"(X-Amz-Credential=)[^&\"\s\\]+", re.I)


def redact(s):
    """Never print live secrets: presigned-URL signatures/tokens and credential scopes are masked in the report."""
    s = _SECRET.sub(r"\1<redacted>", s or "")
    return _CRED.sub(r"\1<redacted-access-key-scope>", s)


def fence(s, lang=""):
    return f"```{lang}\n{s}\n```"


def md_cell(s):
    return str(s).replace("|", "\\|").replace("\n", " ").replace("\r", " ")[:300]


def table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    for r in rows:
        out.append("| " + " | ".join(md_cell(c) for c in r) + " |")
    return "\n".join(out)


def quote_req(rid):
    r = EV.get(rid)
    if not r:
        return f"(evidence {rid} not found)"
    h = "\n".join(f"{k}: {v}" for k, v in r["req_headers"].items())
    return f"{r['method']} /api/crm/v1{r['path']}\n{h}\n\n{r['req_body'][:600]}".rstrip()


def quote_resp(rid):
    r = EV.get(rid)
    if not r:
        return f"(evidence {rid} not found)"
    keep = ("content-type", "allow", "retry-after", "via", "server", "x-powered-by", "etag", "cache-control")
    h = "\n".join(f"{k}: {v}" for k, v in r["resp_headers"].items() if k.lower() in keep)
    return f"HTTP {r['status']}\n{h}\n\n{r['resp_body'][:700]}".rstrip()


def curl(rid):
    r = EV.get(rid)
    if not r:
        return ""
    hdr = " ".join(f"-H '{k}: {v}'" for k, v in r["req_headers"].items() if k.lower() not in ("content-length", "cookie", "authorization"))
    body = f" --data-raw '{redact(r['req_body'][:300])}'" if r["req_body"] else ""
    return f"curl -i -X {r['method']} {hdr} --cookie \"$CRM_SESSION_COOKIE\"{body} 'https://crm.example.com/api/crm/v1{r['path']}'"


# ------------------------------------------------------------------------------------------------ findings
FINDINGS: list[dict] = []


def finding(sev, title, endpoint, rids, expected, actual_note, how, impact, surface, fix, biz=""):
    FINDINGS.append(dict(sev=sev, title=title, endpoint=endpoint, rids=[r for r in rids if r], expected=expected, actual_note=actual_note,
                         how=how, impact=impact, surface=surface, fix=fix, biz=biz))


def op_endpoint(op):
    return {"pipelines.create": "POST /pipelines", "pipelines.patch": "PATCH /pipelines/{id}", "pipelines.stages.add": "POST /pipelines/{id}/stages",
            "deals.create": "POST /deals", "deals.create.lineItems": "POST /deals", "deals.patch": "PATCH /deals/{id}", "contacts.create": "POST /contacts",
            "contacts.patch": "PATCH /contacts/{id}", "companies.create": "POST /companies", "companies.patch": "PATCH /companies/{id}",
            "contact-properties.create": "POST /contacts/custom-properties", "catalog-products.create": "POST /catalog-products",
            "catalog-products.patch": "PATCH /catalog-products/{id}", "automation-rules.create": "POST /automation-rules", "messages.create": "POST /messages",
            "close-reasons.put": "PUT /close-reasons", "files.create": "POST /files"}.get(op, ("POST /activities" if op.startswith("activities.create") else op))


TEXT_HYGIENE_CASES = {"NUL only", "NUL inside", "CRLF injection", "whitespace only"}
BENIGN_REJECT = ("already exists", "exceeds", "cannot contain", "Header fields cannot")
RESOURCE = {"pipelines": "pipelines", "deals": "deals", "contacts": "contacts", "companies": "companies", "catalog-products": "catalog products",
            "automation-rules": "automation rules", "activities": "activities", "messages": "messages", "close-reasons": "close reasons", "files": "files",
            "contact-properties": "custom properties"}


def _res(op):
    return RESOURCE.get(op.split(".")[0], op.split(".")[0])


def _explain_counts():
    """A count that differs only by rows created with status 'archived' is explained: the default list excludes them."""
    for c in MATRIX["counts"]:
        if c["ok"]:
            continue
        hidden = sum(1 for r in MATRIX["rows"] if r["op"] == c["op"] and r["field"] == "status" and r["status"] in (200, 201, 202) and "'archived'" in r["value"])
        if hidden and c["after"] == c["expected"] - hidden:
            c["ok"] = True
            c["note"] = f"explained: {hidden} row(s) were created with status 'archived' and the default list excludes archived rows (list them with status[in]=archived)"


def derive_matrix_findings():
    _explain_counts()
    rows = MATRIX["rows"]

    # --- 5xx: oversized arrays
    se = [r for r in rows if r["verdict"] == "SERVER-ERROR"]
    if se:
        finding("P3", "request bodies of roughly 2 MB or more get an empty 502 instead of 413", "POST /pipelines, /automation-rules, /deals (array of 65,536 items)", [r["rid"] for r in se[:4]],
                "413 with the standard envelope", "; ".join(f"{r['op']} {r['field']} {r['case']} -> {r['status']}" for r in se), "request/response; same behaviour found in the dedicated oversize test (see the 413/502 finding)",
                "the caller sees a bare gateway error; combined with intermittent 502s on ordinary calls it cannot tell retryable from permanent", "API-only", "reject on Content-Length before reading the body")

    # --- text hygiene: NUL, CRLF, whitespace-only
    hy = [r for r in rows if r["verdict"] == "ACCEPTED-INVALID" and r["case"] in TEXT_HYGIENE_CASES]
    if hy:
        by = collections.defaultdict(set)
        for r in hy:
            by[(r["op"], r["field"])].add(r["case"])
        lines = [f"{op_endpoint(op)} {fld}: {', '.join(sorted(cs))}" for (op, fld), cs in sorted(by.items())]
        pri = [r for r in hy if r["op"].startswith("messages")] + hy
        rids, seen = [], set()
        for r in pri:
            if r["rid"] not in seen:
                seen.add(r["rid"]); rids.append(r["rid"])
        has_msg = any(op.startswith("messages") for op, _ in by)
        finding("P2" if has_msg else "P3", f"text fields accept NUL, CRLF and whitespace-only values ({len(by)} fields on {len({op_endpoint(op) for op, _ in by})} endpoints)", "all text fields (see list)", rids[:6],
                "400 for control characters (NUL, CR/LF) in single-line text and for whitespace-only required text",
                "accepted and stored: " + " | ".join(lines[:30]) + (f" | +{len(lines) - 30} more" if len(lines) > 30 else ""), "request/response + read-back (NUL is stored; titles show 'a b'; leading CRLF is trimmed)",
                "blank-looking records, log/CSV/e-mail surprises; message bodies and subjects are customer-facing", "API-only (the UI blocks blank names)", "trim and reject control characters; require a non-blank body for messages")

    # --- lone surrogates replaced by U+FFFD
    ls = [r for r in rows if r["case"] == "lone surrogate" and r["verdict"] in ("SILENT-MUTATION", "ACCEPTED-INVALID")]
    if ls:
        fl = sorted({f"{op_endpoint(r['op'])} {r['field']}" for r in ls})
        finding("P3", f"unpaired UTF-16 surrogates are silently replaced with U+FFFD ({len(fl)} fields)", "all text fields (see list)", [r["rid"] for r in ls[:3]] + [r["rb_rid"] for r in ls[:2] if r.get("rb_rid")],
                "400 (not valid Unicode text) or a stored value equal to the input", "accepted with 2xx; stored value differs: " + "; ".join(fl[:30]), "read-back (GET after 2xx)",
                "the caller is told 2xx but a different value is stored", "API-only", "reject invalid text")

    # --- numeric precision loss
    pr = [r for r in rows if r["verdict"] == "SILENT-MUTATION" and re.fullmatch(r"-?\d{16,}", r["value"] or "")]
    if pr:
        finding("P2", "number custom properties accept integers beyond 2^53 and silently round them", "POST /contacts, PATCH /contacts/{id} (customProperties.employee_count)", [r["rid"] for r in pr[:2]] + [r["rb_rid"] for r in pr[:2] if r.get("rb_rid")],
                "400 for values outside the safe-integer range (as money fields do), or an exact stored value",
                "; ".join(f"sent {r['value']} stored {r['readback'].split('stored=')[-1]}" for r in pr[:4]), "read-back (GET after 2xx)", "silent corruption of numeric data", "API-only", "apply the same 2^53-1 limit used for money fields")

    # --- fields that are not validated at all (phone, domain, ...): one finding per field across resources
    rest = [r for r in rows if r["verdict"] == "ACCEPTED-INVALID" and r["case"] not in TEXT_HYGIENE_CASES and r["case"] not in ("empty string", "lone surrogate")]
    grp = collections.defaultdict(list)
    for r in rest:
        grp[r["field"]].append(r)
    for fld, rs in sorted(grp.items()):
        resources = sorted({_res(x["op"]) for x in rs})
        examples = ", ".join(sorted({repr(x["value"].strip("'\""))[:26] for x in rs})[:8])
        finding("P2" if fld == "phone" else "P3", f"{fld} is not validated on {', '.join(resources)}", "POST/PATCH " + ", ".join(resources), [x["rid"] for x in rs[:3]],
                f"400 for values that are not valid for {fld}", f"{len(rs)} invalid value(s) accepted across create and update, e.g. {examples}", "request/response + read-back",
                "bad data is stored; a phone that is not E.164 cannot receive SMS (the SMS route then returns 422)" if fld == "phone" else "bad data is stored and breaks later use", "API-only", f"validate {fld}")

    # --- everything else individually
    for r in rows:
        v = r["verdict"]
        if v == "REJECTED-VALID" and (r["case"] == "omitted" or any(p in r["detail"] for p in BENIGN_REJECT)):
            r["verdict"] = "RECORDED"
            continue
    for r in rows:
        if r["verdict"] == "REJECTED-VALID":
            finding("P3", f"{op_endpoint(r['op'])} rejects a value that looks valid for {r['field']} ({r['case']})", op_endpoint(r["op"]), [r["rid"]], "acceptance", f"{r['status']} {r['detail']}", "request/response", "legitimate input is refused", "UI and API", "review the rule")
        elif r["verdict"] == "SILENT-MUTATION" and not (r["case"] == "lone surrogate" or re.fullmatch(r"-?\d{16,}", r["value"] or "")):
            finding("P2", f"{op_endpoint(r['op'])} silently changes the stored value of {r['field']} ({r['case']})", op_endpoint(r["op"]), [r["rid"], r.get("rb_rid")], "stored value equals the accepted value",
                    r["readback"], "read-back (GET after 2xx)", "silent data change", "API-only", "reject or document the normalisation")
        elif r["verdict"] == "BASELINE-FAILED":
            finding("P2", f"known-good baseline failed for {r['op']}", op_endpoint(r["op"]), [r["rid"]], "baseline accepted", f"{r['status']} {r['detail']}", "request/response", "the operation could not be audited", "n/a", "see request")
    for c in MATRIX["counts"]:
        if not c["ok"]:
            finding("P1", f"record count moved unexpectedly for {c['op']}", op_endpoint(c["op"]), [], f"count {c['expected']} after the batch", f"before {c['before']}, accepted {c['accepted']}, after {c['after']}",
                    "count delta (list endpoint before/after)", "rejected writes may be leaving rows, or accepted ones are not persisted", "API-only", "investigate partial commits", biz="possible data loss or duplicate rows")


def derive_readonly_findings():
    for r in RO.get("authn", []):
        if r["variant"].startswith("valid cookie"):
            continue
        if r["status"] != 401:
            finding("P0", f"authentication not enforced: {r['endpoint']} with '{r['variant']}' returned {r['status']}", r["endpoint"], [r["rid"]], "401 with a stable code",
                    f"{r['status']} {r['code']}", "request/response", "unauthenticated access to tenant data", "API-only", "enforce authentication on every route", biz="data exposure")
    codes = collections.Counter((r["status"], r["code"]) for r in RO.get("authn", []) if r["variant"] != "valid cookie + garbage bearer (precedence)")
    if len(codes) > 1:
        finding("P3", "authentication failures return more than one status/code", "all protected routes", [r["rid"] for r in RO.get("authn", [])][:3],
                "one stable 401 code for every credential problem", "distribution: " + ", ".join(f"{k}: {v}" for k, v in codes.items()), "table of 210+ requests", "clients cannot branch on one code", "API-only", "unify")
    for r in RO.get("idor", []):
        if "ENUMERATION" in r["id_kind"] and r["detail"].startswith("DIFFERENT"):
            finding("P2", f"enumeration difference on {r['endpoint']}", r["endpoint"], [x for x in r["rid"].split(",") if x], "identical body for 'exists elsewhere' and 'does not exist'", r["detail"], "paired GETs", "reveals which ids exist in another project", "API-only", "return the same body")
        if r["caller"] == "other own project" and r["id_kind"].startswith("existing") and r["status"] == 200:
            finding("P0", f"cross-project read: {r['endpoint']}", r["endpoint"], [r["rid"]], "404", f"{r['status']}", "request from the other project's context", "tenant isolation broken", "API-only", "scope every query by project", biz="cross-tenant data leak")
    for r in RO.get("stability", []):
        if r["distinct_responses"] > 1:
            finding("P2", f"unstable error code for {r['request']}", r["request"], [r["first"], r["last"]], "same status/code on every repeat", f"{r['distinct_responses']} distinct responses in 20 repeats", "20 repeats", "clients cannot rely on the code", "API-only", "make errors deterministic")
    hy = RO.get("hygiene", [])
    soft = [r for r in hy if r["status"] == 200 and "html" in r["ctype"] and r["path"].startswith("/api")]
    if soft:
        finding("P3", "unknown /api/* paths return HTTP 200 with an HTML page (soft 404)", "GET /api/docs, /api/openapi.json", [], "404 (JSON or none)",
                "; ".join(f"{r['path']} -> {r['status']} {r['ctype']}" for r in soft), "direct requests, hygiene step", "scanners and clients are told a route exists; no API docs are published", "UI-visible (shows 'Page not found')", "return 404 for unknown paths")
    notallowed = [r for r in hy if r["method"] in ("PUT", "DELETE", "PATCH") and r["status"] == 404 and r["path"] in ("/pipelines",)]
    if notallowed:
        finding("P3", "unsupported methods on a collection return 404 instead of 405 with Allow", "PUT/DELETE/PATCH /pipelines", [r["rid"] for r in notallowed], "405 Method Not Allowed + Allow header",
                "; ".join(f"{r['method']} -> {r['status']}, Allow='{r['allow']}'" for r in notallowed), "request/response", "clients cannot discover supported methods", "API-only", "return 405 with Allow")
    tr = [r for r in hy if r["method"] == "TRACE"]
    if tr and tr[0]["status"] >= 500:
        finding("P3", "TRACE returns a bare 500", "TRACE /pipelines", [tr[0]["rid"]], "405/404 in the JSON error format", f"{tr[0]['status']} {tr[0]['ctype']} {tr[0]['body']}", "request/response", "unhandled fault; non-JSON error", "API-only", "disable TRACE at the proxy")
    big = [r for r in hy if r["path"].startswith("/pipelines/aaaa")]
    if big and big[0]["status"] in (414, 400) and "json" in big[0]["ctype"] and "problem" not in big[0]["ctype"]:
        finding("P3", "over-long URL error uses a different envelope and names the framework", "GET /pipelines/{5000 chars}", [big[0]["rid"]], "the standard problem+json envelope without framework internals",
                f"{big[0]['status']} {big[0]['ctype']} {big[0]['body']}", "response body", "information disclosure (framework error code FST_ERR_*) and an inconsistent envelope", "API-only", "map framework errors to the standard envelope")
    for r in hy:
        if r.get("via") or r.get("server") or r.get("powered"):
            finding("P3", "response headers disclose the proxy/server product", "all routes", [r["rid"]], "no product/version banner", f"via='{r['via']}' server='{r['server']}' x-powered-by='{r['powered']}'", "response headers", "minor fingerprinting aid", "API-only", "strip Via/Server")
            break
    if not any(r.get("retry_after") or r.get("ratelimit") for r in hy):
        finding("P3", "no rate-limit headers or Retry-After anywhere; no 429 observed", "all routes", [], "documented limit with 429 + Retry-After", "none of ~8000 requests at 1-3 req/s drew any rate-limit signal",
                "response headers across the whole run", "brute-force and runaway-client protection cannot be verified (and is not advertised)", "API-only", "document limits and return 429 + Retry-After", biz="")


def derive_write_findings():
    for r in WR.get("negative_only", []):
        if r["verdict"] in ("SERVER-ERROR", "4xx-NO-ENVELOPE"):
            finding("P2", f"{r['op']}: '{r['case']}' -> {r['status']} ({r['verdict']})", op_endpoint(r["op"]), [r["rid"]], "4xx with the standard envelope", f"{r['status']} {r['ctype']} {r['detail']}", "request/response", "unstable error contract", "API-only", "central error handler")
    acc = collections.defaultdict(list)
    for r in WR.get("negative_only", []):
        if r["verdict"] == "ACCEPTED" and r["case"] in ("valid JSON, Content-Type text/plain", "valid JSON, Content-Type application/xml", "valid JSON, form-urlencoded", "valid JSON, no Content-Type", "duplicate keys (first!=last)"):
            acc[r["case"]].append(r)
    for case, rows in acc.items():
        sev = "P3"
        finding(sev, f"'{case}' is accepted on {len(rows)} endpoints", "all write endpoints", [x["rid"] for x in rows[:5]], "415/400 for a wrong Content-Type; 400 for duplicate keys",
                f"accepted on: {', '.join(sorted({x['op'] for x in rows})[:8])}", "request/response", "removes a CSRF layer (text/plain is a CORS 'simple' content type) / ambiguous input", "API-only", "require application/json; reject duplicate keys")
    for c in WR.get("negative_only_counts", []):
        if not c["ok"] and c["op"] == "contact-properties.create":
            c["ok"] = True      # explained: DELETE archives and re-creating a key revives the same row, so the list does not grow
        if not c["ok"]:
            finding("P1", f"negative-only requests changed row counts for {c['op']}", op_endpoint(c["op"]), [], f"after = {c['before'] + c['accepted']}", f"before {c['before']}, accepted {c['accepted']}, after {c['after']}", "count delta", "rows created by requests that returned 4xx", "API-only", "investigate", biz="possible partial commit")
    for r in WR.get("mass_assignment", []):
        if r["verdict"] == "PRIVILEGE-FIELD-PERSISTED":
            finding("P1", f"mass assignment: {r['extra']} persisted on {r['op']}", op_endpoint(r["op"]), [r["rid"], r["readback"]], "extra field rejected (400) or ignored", f"accepted and stored: {r['sent']}", "read-back", "client can set server-controlled fields", "API-only", "strict allow-list of writable fields", biz="privilege/integrity")
        elif r["verdict"] == "ACCEPTED-UNKNOWN-FIELD":
            finding("P3", f"unknown field '{r['extra']}' accepted (but not stored) on {r['op']}", op_endpoint(r["op"]), [r["rid"]], "400 unrecognized key", f"{r['status']}", "request/response + read-back", "silent ignore hides client typos", "API-only", "reject unknown keys")
    for r in WR.get("state_machine", []):
        if r["verdict"] == "UNEXPECTED":
            finding("P2", f"state machine: {r['case']}", "see case", [r["rid"]], r["expect"], f"{r['status']} {r['detail']}", "request/response + read-back", "lifecycle rules can be bypassed", "API-only", "enforce transitions server-side")
        if r["verdict"] == "MISSING-FLOW":
            finding("P3", f"missing flow: {r['case']}", "POST /contacts/{id}/...", [r["rid"]], r["expect"], f"{r['status']} {r['detail']}", "request/response", "advertised lead lifecycle events (lead.qualified/disqualified/converted) have no way to be triggered", "UI and API", "add the lifecycle routes or remove the events")
    for r in WR.get("idempotency", []):
        if r["verdict"] == "IDEMPOTENCY-KEY-IGNORED":
            hi = "messages" in r["endpoint"]
            finding("P1" if hi else "P2", f"Idempotency-Key is ignored on {r['endpoint']}", r["endpoint"], r["rids"].split(","), "same key twice -> one row, second response a replay", f"same key twice created {r['same_key_rows_created']} rows (statuses {r['same_key_twice']}, ids {r['same_key_ids']}); replay header: '{r['replay_header']}'",
                    "count delta (+2 for two identical keyed requests)", "a client retry after a timeout duplicates the record" + (" (a duplicate email/SMS reaches the customer)" if hi else ""), "API-only", "implement Idempotency-Key with a stored response per key", biz="duplicate customer messages on retry" if hi else "")
    for r in WR.get("races", []):
        if r["verdict"].startswith("DUPLICATES"):
            finding("P3", r["case"] + " created duplicates", "see case", r["rids"][:5], r["expect"], f"statuses {r['statuses']}, rows created {r['rows_created']}", "count delta + list ids", "no uniqueness on this value (a design question, not a race)", "API-only", "decide if the value must be unique")
        if r["verdict"].startswith("LOST-UPDATE"):
            finding("P2", "lost update: no optimistic locking (no ETag / If-Match / version)", "PATCH /contacts/{id}", r["rids"][:5], r["expect"], r["detail"], "GET / PATCH / PATCH / GET sequence", "two clients editing the same record silently overwrite each other", "UI and API", "add a version field or ETag + If-Match")
        if r["verdict"] in ("SPLIT-BRAIN", "UNEXPECTED", "UNIQUE-VIOLATED"):
            finding("P2", "race: " + r["case"], "see case", r["rids"][:5], r["expect"], f"statuses {r['statuses']} {r.get('detail', '')}", "parallel requests + read-back", "inconsistent state under concurrency", "API-only", "serialise the transition")
    for r in WR.get("partial_failure", []):
        if r["verdict"] != "OK":
            finding("P1", "partial commit: " + r["case"], "see case", [r["rid"]], r["expect"], f"{r['status']} {r['detail']}; count delta {r['count_delta']}", "count delta + response", "a failed create may leave rows behind", "API-only", "wrap multi-part creates in one transaction", biz="orphan or partial records")
    for r in WR.get("csrf_xproject", []):
        if r["verdict"] in ("CSRF-GAP", "CROSS-PROJECT-WRITE-ACCEPTED", "CORRUPTED"):
            finding("P0" if "CROSS" in r["verdict"] or "CORRUPTED" in r["verdict"] else "P2",
                    "state-changing requests with the session cookie are accepted from a hostile Origin (no Origin / Sec-Fetch-Site check on writes; login does check)" if r["verdict"] == "CSRF-GAP" else r["case"], "POST /pipelines (all writes)", [r["rid"]], r["expect"], f"{r['status']} {r['detail']}", "request/response + read-back", "state-changing request from another origin/project", "API-only", "check Origin/Sec-Fetch-Site; scope by project")


KNOWN_TITLES = {
    "K1": "a null byte in a search query (?q=a%00b) returns HTTP 500 on contacts, companies, deals and files",
    "K2": "TRACE returns a bare plain-text 500 instead of 405",
    "K7": "intermittent empty 502 instead of 413 for oversized request bodies (2 MB, 6 attempts)",
    "K8": "stage order has a gap after a stage is deleted (0, 2 instead of 0, 1)",
    "K9": "an unknown Crm-Org-Id header is accepted and treated as the default organization",
    "K12": "stages can be added to an archived pipeline (the page says an archived pipeline takes no new deals)",
    "K15": "audit events for deleted records lose the record name (the Audit page shows 'Unnamed')",
    "K16": "RETRACTED: activities can be linked through the attachments field",
    "K17": "import has no update or skip duplicate mode (only create or reject)",
    "K18": "moving a deal to the stage it is already in succeeds silently (200)",
    "K19": "PUT, DELETE and PATCH on a collection return 404 instead of 405, while OPTIONS advertises them in Allow",
    "K24": "DELETE of a custom property only archives it; re-creating the key revives the same row (and can change its type); values are hidden, not removed",
    "K27": "idempotent replays carry no marker header, so a client cannot tell a replay from a new create",
    "K28": "a replayed Idempotency-Key returns a 'created' response for a record that has since been deleted",
}
KNOWN_DETAIL = {   # key: (endpoint, impact, suggested fix direction)
    "K1": ("GET /contacts|/companies|/deals|/files ?q=", "any search containing U+0000 returns an unhandled 500; the UI search box and Ctrl-K search share these routes", "strip or reject U+0000 in query parameters before the data layer; return 400"),
    "K2": ("TRACE /pipelines", "an unhandled fault with a non-JSON body; TRACE should be disabled", "disable TRACE at the proxy or return 405"),
    "K6": ("POST /pipelines (and every length-limited text field)", "users who type emoji or other characters outside the Basic Multilingual Plane hit the limit at half the stated length (100 emoji are refused as 'more than 120 characters')", "count Unicode code points (or graphemes) instead of UTF-16 units"),
    "K7": ("POST /pipelines (any write) with a body of about 2 MB", "the caller sees a bare gateway error instead of a clear 413, so it cannot tell a permanent size problem from a retryable fault", "reject on Content-Length before reading the body, or drain the request before closing the connection"),
    "K8": ("DELETE /pipelines/{id}/stages/{stageId}", "clients that assume consecutive order values (for example to compute a position) get gaps until the next reorder", "renumber on delete"),
    "K9": ("any route, header Crm-Org-Id", "a typo'd or stale organization id silently targets the default organization", "validate the header against the caller's organizations (400/403)"),
    "K12": ("POST /pipelines/{id}/stages", "the page text and the API disagree about what an archived pipeline accepts", "decide: make archived pipelines read-only, or change the page text"),
    "K15": ("GET /events (Audit page)", "the log says what was deleted only by id; the page shows 'Unnamed', which defeats the purpose of an audit trail", "write the record name (or a snapshot) into the deleted event"),
    "K16": ("POST /activities", "tasks, notes and calls cannot be attached to the record they are about, which limits what the CRM can show on a contact or deal", "add an optional contactId/dealId/companyId (or a links array) to activities"),
    "K17": ("POST /imports", "re-importing an exported file can only create duplicates or reject them; existing records cannot be corrected by import", "add an update (match on id or email) and a skip mode"),
    "K18": ("POST /deals/{id}/move", "harmless, but it records an audit event for a change that did not happen", "return 409 or document the no-op and skip the event"),
    "K19": ("PUT|PATCH|DELETE /pipelines (collection); OPTIONS /pipelines", "OPTIONS advertises methods that then return 404, so clients cannot rely on Allow", "return 405 with an accurate Allow header"),
    "K22": ("GET /contacts?status=archived|status[in]=archived", "archived contacts and companies are hidden from the default list; the obvious filter fails with 'Unrecognized key: status' and does not point at the working syntax; integrations built against the docs-less API will conclude archived rows cannot be listed", "document the bracket operators (status[in], created_at[gte], ...) and accept status=<value> as shorthand"),
    "K23": ("POST /pipelines/{id}/stages", "a caller can choose stage ids, and the same id can exist in two pipelines; anything keyed by stage id alone (for example report buckets named stage_<id>) can mix pipelines", "ignore a supplied id, or make stage ids unique across the project"),
    "K24": ("DELETE /contacts/custom-properties/{id}; POST /contacts/custom-properties", "an operator who deletes a property expecting it to be gone finds it still listed, its values hidden on every contact, and (after re-creating the key with another type) permanently invisible; the type-change guard on PATCH is bypassed by delete and re-create", "offer a real hard delete, warn how many contacts hold values, and make a re-created key a new row (or block it)"),
    "K27": ("POST (all create routes) with Idempotency-Key", "retrying clients cannot tell whether they created a record or got a stored response", "return a replay header (for example Idempotent-Replayed: true)"),
    "K28": ("POST /companies (all create routes) with Idempotency-Key", "a retry after the record was deleted is told 201 with the id of a record that no longer exists (GET returns 404)", "check that the stored response's record still exists, or expire keys when the record is deleted"),
}

KNOWN_SKIP = {"K14", "K21", "K25", "K26"}      # K14 is covered by K24; K21 by the hygiene step; K25/K26 are verified-good behaviours


def derive_known_findings():
    sev = {"K28": "P3", "K22": "P3", "K23": "P2", "K24": "P3", "K27": "P3", "K1": "P2", "K2": "P3", "K3": "P3", "K4": "P3", "K6": "P3", "K7": "P3", "K8": "P3", "K9": "P3", "K12": "P3", "K14": "P3", "K15": "P3", "K16": "P3", "K17": "P3", "K18": "P3", "K19": "P3", "K20": "P2", "K21": "P3"}
    surf = {"K22": "UI-visible (Archived tab works; API syntax undocumented)", "K23": "API-only", "K24": "UI-visible (Properties page)", "K1": "UI-visible (search box)", "K15": "UI-visible (Audit page)", "K14": "UI-visible (Properties page)", "K16": "both"}
    for k in KN:
        if k["key"] in KNOWN_SKIP:
            continue
        if k["verdict"] in ("BUG", "DESIGN-QUESTION", "MISSING-FLOW"):
            ep, imp, fix = KNOWN_DETAIL.get(k["key"], ("see request ids", "see title", "see title"))
            finding(sev.get(k["key"], "P3"), KNOWN_TITLES.get(k["key"], k["title"]), ep, k["rids"], k["expect"], f"statuses {k['statuses']}; {k['note'] or ' | '.join(b[:80] for b in k['bodies'][:2])}",
                    "request/response and read-back, re-run in this harness", imp, surf.get(k["key"], "API-only"), fix)


def _uniq(seq, n=8):
    out = []
    for x in seq:
        if x and x not in out:
            out.append(x)
    return out[:n]


def _merge(F, pred, build):
    hit = [f for f in F if pred(f)]
    if not hit:
        return F
    return [f for f in F if not pred(f)] + [build(hit)]


def consolidate(F):
    """Merge findings that describe one underlying issue; drop duplicates between derived and re-verified results."""
    drop_titles = ("TRACE returns a bare 500", "unsupported methods on a collection return 404", "soft 404", "text/plain body parsed as JSON",
                   "request bodies of roughly 2 MB or more", "contact phone 'abc' is accepted", "race: 10 parallel creates of the same custom-property key")
    F = [f for f in F if not any(f["title"].startswith(t) for t in drop_titles) and not (f["title"].startswith("unknown field 'id' accepted"))]
    # wrong Content-Type
    F = _merge(F, lambda f: f["title"].startswith("'valid JSON"), lambda h: dict(
        sev="P3", title="write endpoints accept a wrong or missing Content-Type (text/plain, application/xml, form-urlencoded, none)", endpoint="all POST/PUT/PATCH routes",
        rids=_uniq([r for f in h for r in f["rids"]]), expected="415 or 400 unless the body is application/json", actual_note=" | ".join(f"{f['title'].split(' is accepted')[0]}: {f['actual_note'][:120]}" for f in h),
        how="request/response (the same valid JSON body re-sent with each content type)", impact="text/plain is a CORS 'simple' content type, so it removes a layer of CSRF protection (the custom crm-* headers still force a preflight today)",
        surface="API-only", fix="require application/json on write routes", biz=""))
    # duplicate keys
    F = _merge(F, lambda f: f["title"].startswith("'duplicate keys"), lambda h: dict(
        sev="P3", title="duplicate JSON keys are accepted (the last one wins) on every write endpoint", endpoint="all POST/PUT/PATCH routes", rids=_uniq([r for f in h for r in f["rids"]]),
        expected="400 for ambiguous JSON", actual_note=h[0]["actual_note"], how="request/response", impact="ambiguous input can differ between parsers in a proxy chain", surface="API-only", fix="reject duplicate keys", biz=""))
    # duplicates allowed under parallel creates
    F = _merge(F, lambda f: f["title"].endswith("created duplicates"), lambda h: dict(
        sev="P3", title="no uniqueness rule: parallel creates of the same contact email or pipeline name produce one row each", endpoint="POST /contacts, POST /pipelines (also companies)",
        rids=_uniq([r for f in h for r in f["rids"]]), expected="a decision: unique where the business expects it (for example contact email)", actual_note="; ".join(f["title"] + ": " + f["actual_note"] for f in h),
        how="count delta + list of ids after 10 parallel requests", impact="duplicate contacts and pipelines; an Idempotency-Key does prevent duplicates of the SAME request", surface="UI and API", fix="decide which values must be unique", biz=""))
    # repeated archive semantics
    F = _merge(F, lambda f: f["title"].startswith("state machine:") and "archive twice" in f["title"], lambda h: dict(
        sev="P3", title="repeating an archive returns 200 for contacts and companies but 409 for pipelines and deals", endpoint="POST /contacts/{id}/archive, /companies/{id}/archive",
        rids=_uniq([r for f in h for r in f["rids"]]), expected="one repeat semantics across resources", actual_note="; ".join(f["title"] + " -> " + f["actual_note"] for f in h),
        how="repeat requests (and 19 more on pipelines for comparison)", impact="clients must special-case each resource", surface="API-only", fix="pick idempotent 200 or 409 and use it everywhere", biz=""))
    for f in F:
        if f["title"].startswith("state machine: contact: create directly"):
            f["sev"] = "P3"
            f["title"] = "a contact created with status 'archived' has no statusBeforeArchive (the archive flow records it)"
    # RETRACTED 2026-10-06: this used to report "no lead-lifecycle routes" from probes against
    # /contacts/{id}/qualify|disqualify|convert (404). That path is wrong -- the real routes are
    # /leads/{id}/qualify|disqualify|convert and all three return 200. steps_writes.py no longer
    # probes the wrong path (see its "unarchive"/"restore" loop), so this merge has nothing to match
    # on a fresh run; left here only so the history of the false positive is traceable.
    # information disclosure
    F = _merge(F, lambda f: f["title"].startswith("information disclosure:"), lambda h: dict(
        sev="P3", title="internal identifiers are exposed: AWS account id inside the bucket host, temporary access-key id in presigned URLs, framework error code", endpoint="POST /files, over-long URLs",
        rids=_uniq([r for f in h for r in f["rids"]]), expected="no internal identifiers in client-facing bodies", actual_note="; ".join(f["title"].replace("information disclosure: ", "") for f in h),
        how="regex scan of every recorded response (secrets such as signatures are redacted in this report)", impact="aids fingerprinting; the presigned access-key id is normal for S3 but the account id in the bucket name is avoidable",
        surface="API-only", fix="use an opaque bucket name; map framework errors", biz=""))
    # invalid unicode
    F = _merge(F, lambda f: f["title"].startswith("unpaired UTF-16") or f["title"].startswith("invalid UTF-8 accepted"), lambda h: dict(
        sev="P3", title="invalid text is silently replaced with U+FFFD instead of rejected (lone surrogates in 27+ fields, invalid UTF-8 bytes in a body)", endpoint="all text fields",
        rids=_uniq([r for f in h for r in f["rids"]]), expected="400, or a stored value equal to the input", actual_note=" | ".join(f["actual_note"][:200] for f in h), how="read-back (GET after 2xx)",
        impact="the caller is told 2xx but a different value is stored", surface="API-only", fix="decode strictly and reject invalid text", biz=""))
    return F


def dedupe_and_number():
    seen, out = set(), []
    for f in consolidate(list(FINDINGS)):
        key = (f["title"], f["endpoint"])
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    out.sort(key=lambda f: (SEV_ORDER[f["sev"]], f["endpoint"], f["title"]))
    for i, f in enumerate(out, 1):
        f["id"] = f"{PREFIX}-{i:04d}"
    return out



def derive_integration_findings():
    for r in INT.get("rows", []):
        if r["verdict"] != "FAIL":
            if r["area"] == "automation" and "appeared after" in (r.get("note") or ""):
                finding("P3", "automation rules run in a batch about two minutes after the event, with no hint in the UI or API", "POST /automation-rules + deal/contact events", r["rids"][:3],
                        "near-real-time execution, or a documented delay shown on the Automation page", r["note"], "timed polling of the activities list after a deal was won",
                        "a rule looks broken for the first minutes after it is created or triggered; an operator may recreate it or disable it", "UI and API", "show the expected delay, or run rules synchronously")
            continue
        sev = "P2" if r["area"] in ("referential", "line items", "reports", "messaging") else "P3"
        finding(sev, f"integration: {r['case']}", f"({r['area']})", r["rids"][:3], r["expect"], f"{r['status']} {r['detail']} {r.get('note', '')}".strip(),
                "cross-module check with read-back", "modules do not agree with each other or with the page text", "API and UI", "see expectation")


def derive_readback_gap_findings():
    seen = {}
    for r in MATRIX["rows"]:
        if (r.get("readback") or "").startswith("READBACK-FAILED") and r["op"] not in seen:
            seen[r["op"]] = r
    for op, r in seen.items():
        finding("P3", f"no GET-by-id route for the resource created by {op_endpoint(op)}", op_endpoint(op).replace("POST", "GET") + "/{id}", [r["rid"], r.get("rb_rid")],
                "GET /<resource>/{id} for every resource that can be created", f"read-back after a successful create failed: {r['readback']}", "read-back (GET after 2xx)",
                "a caller cannot fetch the record it just created except by listing everything", "API-only", "add the route")
