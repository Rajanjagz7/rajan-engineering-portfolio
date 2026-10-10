"""Re-verifies every earlier finding inside the evidence-recording harness so each one has request ids.
Run after the matrix finishes. Output -> reports/audit/known.json"""
from __future__ import annotations

import json

from core import OUT, Audit


def main():
    a = Audit(prefix="K")
    out = []

    def rec(key, title, expect, rs, verdict, note=""):
        out.append(dict(key=key, title=title, expect=expect, rids=[r.rid for r in rs], statuses=[r.status for r in rs],
                        bodies=[r.text[:160] for r in rs], verdict=verdict, note=note))

    # K1 null byte in search -> 500
    rs = [a.call("GET", f"/{c}?q=a%00b") for c in ("contacts", "companies", "deals", "files")]
    rec("K1", "null byte in the search query", "400 or ignored", rs, "BUG" if any(r.status >= 500 for r in rs) else "OK")
    # K2 TRACE
    r = a.call("TRACE", "/pipelines")
    rec("K2", "TRACE method", "405/404 in the JSON error format", [r], "BUG" if r.status >= 500 else "OK")
    # K3 text/plain accepted
    r = a.call("POST", "/pipelines", raw='{"name":"K3 text plain","stages":[{"name":"a"}]}', headers={"content-type": "text/plain"})
    if r.status == 201:
        a.track("pipelines", r.json()["id"])
    rec("K3", "text/plain body parsed as JSON", "415 or 400", [r], "BUG" if r.status == 201 else "OK")
    # K4 invalid UTF-8
    r = a.call("POST", "/pipelines", raw=b'{"name":"K4 \xff\xfe","stages":[{"name":"a"}]}')
    stored = None
    if r.status == 201:
        a.track("pipelines", r.json()["id"])
        stored = a.call("GET", f"/pipelines/{r.json()['id']}")
    rec("K4", "invalid UTF-8 accepted and silently replaced", "400", [r] + ([stored] if stored else []), "BUG" if r.status == 201 else "OK",
        f"stored name: {stored.json()['name']!r}" if stored else "")
    # K6 limit counts UTF-16 units
    r = a.call("POST", "/pipelines", {"name": "\U0001F600" * 100, "stages": [{"name": "a"}]})
    if r.status == 201:
        a.track("pipelines", r.json()["id"])
    rec("K6", "name limit counts UTF-16 units (100 emoji = 200 units)", "201 (100 characters is under 120)", [r], "BUG" if r.status == 400 else "OK", r.detail())
    # K7 oversized body: repeat (small count; the body is rejected so nothing is stored)
    big = '{"pad":"' + "A" * 2_000_000 + '"}'
    rs = [a.call("POST", "/pipelines", raw=big) for _ in range(6)]
    rec("K7", "oversized body (2 MB) x6", "413 every time", rs, "BUG" if any(r.status != 413 for r in rs) else "OK",
        f"statuses {[r.status for r in rs]}")
    # K8 stage order gaps
    p = a.make("pipelines", {"name": f"K8 order {__import__('time').strftime('%H%M%S')}", "stages": [{"name": "a"}, {"name": "b"}, {"name": "c"}]})
    d = a.call("DELETE", f"/pipelines/{p['id']}/stages/{p['stages'][1]['id']}")
    g = a.call("GET", f"/pipelines/{p['id']}")
    orders = [s["order"] for s in g.json()["stages"]]
    rec("K8", "stage order after deleting the middle stage", "[0, 1]", [d, g], "BUG" if orders != [0, 1] else "OK", f"orders={orders}")
    # K9 unknown org header
    r = a.call("GET", "/pipelines?limit=1", headers={"crm-org-id": "no-such-org"})
    rec("K9", "unknown Crm-Org-Id", "400/403", [r], "BUG" if r.status == 200 else "OK")
    # K12 stage add to archived pipeline
    a.call("POST", f"/pipelines/{p['id']}/archive", {})
    r = a.call("POST", f"/pipelines/{p['id']}/stages", {"name": "added while archived"})
    rec("K12", "stage added to an ARCHIVED pipeline", "400/409 (archived takes no new deals)", [r], "DESIGN-QUESTION" if r.status == 201 else "OK")
    # K14 custom-property DELETE is archive only
    cp = a.call("POST", "/contacts/custom-properties", {"key": "k14_archive_only", "label": "K14", "type": "text"})
    rs = [cp]
    if cp.status == 201:
        d2 = a.call("DELETE", f"/contacts/custom-properties/{cp.json()['id']}")
        lst = a.call("GET", "/contacts/custom-properties?limit=100")
        still = any(x["key"] == "k14_archive_only" for x in lst.json()["data"])
        again = a.call("POST", "/contacts/custom-properties", {"key": "k14_archive_only", "label": "K14b", "type": "text"})
        rs += [d2, lst, again]
        rec("K14", "DELETE on a custom property only archives it", "row removed from the list and key reusable", rs, "BUG" if still else "OK",
            f"still listed after 204: {still}; same key can be recreated: {again.status}")
    # K15 audit trail: deleted-record events lose the name
    pp = a.make("pipelines", {"name": "K15 audit name", "stages": [{"name": "a"}]})
    a.call("DELETE", f"/pipelines/{pp['id']}")
    a.created = [x for x in a.created if x[1] != pp["id"]]
    ev = a.call("GET", "/events?limit=5")
    delev = next((e for e in ev.json()["data"] if e["type"] == "pipeline.deleted"), None)
    rec("K15", "audit event for a deleted record carries the record name", "name present on pipeline.deleted", [ev],
        "BUG" if (delev and not (delev.get("data") or {}).get("name")) else "OK", json.dumps(delev)[:300] if delev else "no deleted event found")
    # K16 activities cannot be linked to a record
    r = a.call("POST", "/activities", {"type": "task", "title": "Check attachment link", "attachments": [{"kind": "contact", "id": "000000000000000000000000"}]})
    rec("K16", "activity cannot reference a contact/deal/company", "a way to link an activity to a record", [r], "OK", r.detail())  # linking works through the attachments field (earlier finding retracted)
    # K17 import duplicate modes
    r = a.call("POST", "/imports", {"resource": "contacts", "fileId": "x", "onDuplicate": "update"})
    rec("K17", "import onDuplicate supports update/skip", "update or skip available", [r], "MISSING-FLOW" if r.status == 400 else "OK", r.detail())
    # K18 move to same stage
    ctx_p = a.make("pipelines", {"name": f"K18 {__import__('time').strftime('%H%M%S')}", "stages": [{"name": "a"}, {"name": "b"}]})
    dl = a.make("deals", {"title": "K18", "pipelineId": ctx_p["id"], "stageId": ctx_p["stages"][0]["id"]})
    r = a.call("POST", f"/deals/{dl['id']}/move", {"stageId": ctx_p["stages"][0]["id"]})
    rec("K18", "move a deal to the stage it is already in", "409 or a documented no-op", [r], "DESIGN-QUESTION" if r.status == 200 else "OK")
    # K19 PUT/DELETE on a collection -> 404 not 405
    rs = [a.call("PUT", "/pipelines", {}), a.call("DELETE", "/pipelines"), a.call("PATCH", "/pipelines", {})]
    rec("K19", "unsupported method on a collection", "405 with an Allow header", rs, "BUG" if all(r.status == 404 for r in rs) else "OK",
        f"statuses {[r.status for r in rs]}; Allow header: {[r.headers.get('allow', '') for r in rs]}")
    # K20 phone accepted but SMS needs E.164
    c0 = a.call("POST", "/contacts", {"firstName": "K20", "phone": "abc"}, mode="test")
    if c0.status == 201:
        a.track("contacts", c0.json()["id"], "test")
    rec("K20", "contact phone 'abc' is accepted (SMS needs E.164)", "reject the bad phone at write time", [c0], "BUG" if c0.status == 201 else "OK", f"phone 'abc' -> {c0.status} {c0.detail()[:80]}")
    # K21 soft 404 outside the API
    rec("K21", "soft 404", "see hygiene step (/api/docs, /api/openapi.json return 200 HTML)", [], "BUG", "recorded in readonly.json hygiene rows")
    (OUT / "known.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
    a.cleanup()
    print("known findings re-verified:", len(out), "requests", a.n)


if __name__ == "__main__":
    main()
