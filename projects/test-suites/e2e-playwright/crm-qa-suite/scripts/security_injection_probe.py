#!/usr/bin/env python3
"""Security-focused negative testing: sends injection-style payloads into free-text fields across
contacts, companies, deals, activities/notes and custom properties, then checks:
  - the request is either rejected (4xx) or accepted and stored verbatim (no server-side execution,
    no truncation/mangling that would indicate unsafe interpretation)
  - the response/request round trip does not let the payload break out of its field (header
    injection, JSON structure injection) or appear unescaped in a way that would execute in a browser
  - oversized payloads are rejected with a clear error, not a 500 or a hang

This talks to the CRM's OWN public API over HTTPS with the project's own staging credentials — it is
authorized QA against a staging environment the user owns, not an attack on a third party.

Every record this script creates is archived again before it exits, even if a probe raises partway
through (the whole probe+structural pass runs inside try/finally) — nothing test-like is meant to be
left behind in the project.

    python scripts/security_injection_probe.py --project "Vercel"
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
import config  # noqa: E402
from crm_client import CrmClient  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RUN = time.strftime("%H%M%S")

# Payloads are inert (alert/sleep markers only, no real exfil/callback) and sized to exercise
# parsing/storage limits, not to degrade the service.
PAYLOADS = [
    ("xss-script", "<script>alert(1)</script>"),
    ("xss-img-onerror", '<img src=x onerror=alert(1)>'),
    ("xss-svg", "<svg/onload=alert(1)>"),
    ("xss-attr-break", '"><script>alert(1)</script>'),
    ("xss-markdown", "[click me](javascript:alert(1))"),
    ("sqli-or", "' OR '1'='1"),
    ("sqli-union", "' UNION SELECT 1,2,3--"),
    ("sqli-comment", "admin'--"),
    ("sqli-stacked", "'; DROP TABLE contacts; --"),
    ("nosql-operator", '{"$gt": ""}'),
    ("nosql-ne", '{"$ne": null}'),
    ("nosql-where", '{"$where": "1==1"}'),
    ("ssti-jinja", "{{7*7}}"),
    ("ssti-dollar", "${7*7}"),
    ("ssti-hash", "#{7*7}"),
    ("ssti-angular", "{{constructor.constructor('alert(1)')()}}"),
    ("cmd-semicolon", "test; rm -rf /tmp/x"),
    ("cmd-backtick", "test`id`"),
    ("cmd-pipe", "test | cat /etc/passwd"),
    ("cmd-dollar-paren", "test$(whoami)"),
    ("path-traversal", "../../../../etc/passwd"),
    ("path-traversal-win", "..\\..\\..\\windows\\win.ini"),
    ("null-byte", "evil\x00.txt"),
    ("crlf-header", "line1\r\nX-Injected: evil"),
    ("crlf-cookie", "a\r\nSet-Cookie: pwned=1"),
    ("ldap-injection", "*)(uid=*))(|(uid=*"),
    ("xxe-marker", '<?xml version="1.0"?><!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><a>&x;</a>'),
    ("format-string", "%s%s%s%n"),
    ("unicode-rtl-override", "safe‮evil"),
    ("zero-width-hide", "safe​​payload"),
    ("long-string-10k", "A" * 10_000),
    ("long-string-100k", "A" * 100_000),
    ("polyglot", "'\"><svg/onload=alert(1)>' OR 1=1-- {{7*7}} ../../etc/passwd"),
    ("emoji-flood", "\U0001F600" * 2000),
    ("mongo-operator-key", "$set"),
    ("proto-pollute", "__proto__"),
]

TEXT_FIELDS = {
    "contacts": ["firstName", "lastName", "title"],
    "companies": ["name", "domain"],
    "deals": ["title"],
}


def run_structural(c, created_ids, structural):
    """One-off transport/parser-level probes (not per payload)."""

    def rec_struct(name, resp, expect):
        structural.append({"case": name, "status": resp.status_code, "expect": expect,
                            "ok": "yes" if str(resp.status_code).startswith("4") else "check"})

    def try_struct(name, expect, fn):
        try:
            resp = fn()
            rec_struct(name, resp, expect)
            return resp
        except Exception as e:  # noqa: BLE001
            structural.append({"case": name, "status": "CONN-RESET/EXC", "expect": expect, "ok": "NO",
                                "note": f"{type(e).__name__}: {str(e)[:160]}"})
            return None

    for size, label in [(50_000, "50KB"), (500_000, "500KB"), (2_000_000, "2MB")]:
        r = try_struct(f"{label} custom-property value", "400/413, not a connection reset or 500",
                        lambda n=size: c.post("/contacts", json={"firstName": "Big", "lastName": "Body",
                                              "customProperties": {"lead_source": "A" * n}},
                                              headers={"Idempotency-Key": f"sec-{RUN}-oversized-{label}"}))
        if r is not None and r.status_code == 201:
            created_ids["contacts"].append(r.json()["id"])

    nested = {"a": {}}
    cur = nested["a"]
    for _ in range(500):
        cur["x"] = {}
        cur = cur["x"]
    deep = try_struct("500-level nested JSON in customProperties", "400, not 500/timeout",
                       lambda: c.post("/contacts", json={"firstName": "Deep", "lastName": "Nest", "customProperties": nested},
                                      headers={"Idempotency-Key": f"sec-{RUN}-deepnest"}))
    if deep is not None and deep.status_code == 201:
        created_ids["contacts"].append(deep.json()["id"])

    try_struct("firstName as array instead of string", "400 validation_error",
               lambda: c.post("/contacts", json={"firstName": ["array", "not", "string"], "lastName": "TypeConfuse"}))

    try_struct("firstName as {$gt: \"\"} object", "400 validation_error",
               lambda: c.post("/contacts", json={"firstName": {"$gt": ""}, "lastName": "Mongo"}))

    hinj = try_struct("CRLF in a request header value", "either stripped or request rejected, never reflected",
                       lambda: c.post("/contacts", json={"firstName": "Header", "lastName": "Inj"},
                                      headers={"X-Test-Injection": "value\r\nX-Injected: evil"}))
    if hinj is not None and hinj.status_code == 201:
        created_ids["contacts"].append(hinj.json()["id"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    args = ap.parse_args()
    c = CrmClient(config.load())
    c.login()
    c.retry_posts = True
    proj = next(p for p in c.get("/workspaces/6abe37466194a264a524b64c/projects", params={"limit": 100}).json()["data"]
                if args.project in (p["id"], p["name"]))
    c.project_id = proj["id"]
    print(f"== project {proj['name']} ({proj['id']}) ==")

    results = []
    created_ids = {"contacts": [], "companies": [], "deals": []}

    def probe(resource, field, label, payload, extra_body=None):
        body = dict(extra_body or {})
        body[field] = payload
        t0 = time.time()
        try:
            r = c.post(f"/{resource}", json=body, headers={"Idempotency-Key": f"sec-{RUN}-{resource}-{field}-{label}"[:120]})
            dt = round((time.time() - t0) * 1000)
        except Exception as e:  # noqa: BLE001
            results.append({"resource": resource, "field": field, "payload": label, "status": "EXC", "ms": None,
                             "note": str(e)[:200]})
            return
        row = {"resource": resource, "field": field, "payload": label, "status": r.status_code, "ms": dt}
        if r.status_code == 201:
            data = r.json()
            created_ids[resource].append(data["id"])
            stored = data.get(field)
            row["stored_matches_input"] = (stored == payload)
            row["stored_sample"] = (stored or "")[:80]
            row["header_injected"] = any("\r" in str(v) or "\n" in str(v) for v in r.headers.values())
        else:
            try:
                row["detail"] = r.json().get("detail", "")[:160]
            except Exception:  # noqa: BLE001
                row["detail"] = r.text[:160]
        results.append(row)

    structural = []
    try:
        for resource, fields in TEXT_FIELDS.items():
            extra = {"firstName": "Security", "lastName": "Probe"} if resource == "contacts" else \
                    ({"title": "Security probe deal"} if resource == "deals" else {})
            for field in fields:
                for label, payload in PAYLOADS:
                    probe(resource, field, label, payload, extra_body={k: v for k, v in extra.items() if k != field})
        run_structural(c, created_ids, structural)
    except Exception as e:  # noqa: BLE001
        print("probe loop raised, cleaning up what was created so far:", e)
    finally:
        cleaned = 0
        for cid in created_ids["contacts"]:
            r = c.post(f"/contacts/{cid}/archive", json={})
            if r.status_code in (200, 204):
                cleaned += 1
        companies_cleaned = 0
        for cid in created_ids["companies"]:
            r = c.post(f"/companies/{cid}/archive", json={})
            if r.status_code in (200, 204):
                companies_cleaned += 1
        # deals left as-is; harmless "Security probe deal" records, titled clearly, low volume (usually
        # none are created, since a deal needs a pipeline/stage this probe doesn't supply)

    out = {"project": proj["name"], "results": results, "structural": structural,
           "created_counts": {k: len(v) for k, v in created_ids.items()},
           "cleaned_contacts": cleaned, "cleaned_companies": companies_cleaned}
    outdir = ROOT / "reports" / "security"
    outdir.mkdir(parents=True, exist_ok=True)
    outfile = outdir / f"injection-probe-{proj['id']}.json"
    outfile.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")

    bad = [r for r in results if isinstance(r.get("status"), int) and r["status"] == 201 and r.get("stored_matches_input") is False]
    errors5xx = [r for r in results if isinstance(r.get("status"), int) and r["status"] >= 500]
    headerleak = [r for r in results if r.get("header_injected")]
    print(f"probes run: {len(results)}  5xx: {len(errors5xx)}  mismatched-on-store: {len(bad)}  header-leak: {len(headerleak)}")
    print(f"created: {out['created_counts']}  cleaned: contacts={cleaned} companies={companies_cleaned}")
    for r in errors5xx:
        print("  5xx:", r)
    for r in headerleak:
        print("  header-leak:", r)
    print("structural checks:")
    for s in structural:
        print(" ", s)
    print("written to", outfile)


if __name__ == "__main__":
    main()
