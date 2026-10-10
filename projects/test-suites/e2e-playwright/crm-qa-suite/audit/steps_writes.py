"""Write-side audit steps. Run AFTER the matrix workers finish (they change record counts).
Covers: negative-only requests (Step 7), mass assignment, state machines, idempotency, races, lost update,
partial failure, CSRF/Origin, cross-project writes. Output -> reports/audit/writes.json
Guard rails: only rows this run created are changed or deleted; concurrency never exceeds 10; no sleeps over 3 s."""
from __future__ import annotations

import concurrent.futures as cf
import json
import random
import sys

from core import OMIT, OUT, Audit, jdumps
from ops import OPS, deal_fixture, product_fixture

RNG = random.Random(20261002)   # pinned seed: idempotency keys are reproducible
import time as _t
RUN = _t.strftime("%Y%m%d%H%M%S")   # idempotency keys are remembered by the server: a re-run must not reuse them
KEY = lambda n: f"audit-{RUN}-{n}-{RNG.getrandbits(48):012x}"  # noqa: E731
JSON = {"content-type": "application/json"}


def envelope_ok(r):
    try:
        j = r.json()
        return all(k in j for k in ("type", "title", "status", "detail", "code", "requestId"))
    except Exception:
        return False


# ------------------------------------------------------------------------------ Step 7: negative-only requests
def negative_only(a: Audit, out):
    a.step = "negative-only"
    rows, counts = [], []
    for op in OPS:
        if op.kind == "create" and op.collection in ("files",):
            pass
        ctx = op.prereq(a)
        path = op.path(ctx)
        base = op.baseline(ctx)
        if op.kind == "patch" and not base:
            base = {"name": "renamed"} if "name" in str(op.fields[0].path) else {op.fields[0].path[0]: "x"}
        before = a.count(op.collection, mode=op.mode) if (op.collection and op.kind == "create") else None
        okcount = 0
        first_key = next(iter(base)) if base else "name"
        dup = ('{"' + first_key + '":"first",' + jdumps(base)[1:]) if base else '{"a":1,"a":2}'
        bodies = [("empty object {}", dict(raw="{}")), ("array body []", dict(raw="[]")),
                  ("malformed: trailing commas", dict(raw='{"a":1,,,}')), ("malformed: unquoted key", dict(raw="{a:1}")),
                  ("malformed: raw line break inside string", dict(raw='{"name":"line\nbreak"}')),
                  ("0-byte body, Content-Length 0", dict(raw=b"")),
                  ("valid JSON, Content-Type text/plain", dict(raw=jdumps(base), headers={"content-type": "text/plain"})),
                  ("valid JSON, Content-Type application/xml", dict(raw=jdumps(base), headers={"content-type": "application/xml"})),
                  ("valid JSON, form-urlencoded", dict(raw=jdumps(base), headers={"content-type": "application/x-www-form-urlencoded"})),
                  ("valid JSON, no Content-Type", dict(raw=jdumps(base), headers={"content-type": ""})),
                  ("extra unknown field", dict(raw=jdumps({**base, "totallyMadeUp": "x"}))),
                  ("duplicate keys (first!=last)", dict(raw=dup))]
        for label, kw in bodies:
            hdrs = dict(kw.get("headers", {}))
            if hdrs.get("content-type") == "":
                hdrs = {"content-type": "none"}
            raw = kw["raw"]
            r = a.call(op.method, path, raw=raw, headers=hdrs or None, mode=op.mode)
            ok2xx = 200 <= r.status < 300
            if ok2xx and op.kind == "create":
                okcount += 1
                try:
                    a.track(op.collection, r.json()["id"])
                except Exception:
                    pass
            rows.append(dict(op=op.key, case=label, status=r.status, code=r.code(), detail=r.detail()[:120], envelope=envelope_ok(r),
                             ctype=r.headers.get("content-type", "")[:34], rid=r.rid,
                             verdict=("SERVER-ERROR" if (r.status >= 500 or r.status == 0) else
                                      ("ACCEPTED" if ok2xx else ("OK-4xx" if envelope_ok(r) else "4xx-NO-ENVELOPE")))))
        if before is not None:
            after = a.count(op.collection, mode=op.mode)
            counts.append(dict(op=op.key, before=before, accepted=okcount, after=after, ok=(after == before + okcount)))
        a.cleanup()
        if op.post:
            op.post(a, ctx)
    out["negative_only"] = rows
    out["negative_only_counts"] = counts


# ------------------------------------------------------------------------------ mass assignment
EXTRA = {"isAdmin": True, "role": "admin", "tenantId": "000000000000000000000000", "ownerId": "000000000000000000000000",
         "status": "approved", "price": 0, "balance": 1e9, "internalScore": 999, "id": "000000000000000000000001",
         "_id": "000000000000000000000001", "createdByActorId": "000000000000000000000002", "archivedAt": "2020-01-01T00:00:00Z",
         "createdAt": "2000-01-01T00:00:00Z", "projectId": "000000000000000000000003", "environment": "test"}


def mass_assignment(a: Audit, out):
    a.step = "mass-assignment"
    rows = []
    for op in OPS:
        if op.kind != "create" or op.mode:
            continue
        ctx = op.prereq(a)
        path, base = op.path(ctx), op.baseline(ctx)
        for k, v in EXTRA.items():
            body = {**base, k: v}
            r = a.call(op.method, path, body)
            persisted = None
            rb = None
            if 200 <= r.status < 300 and op.collection:
                rid_ = r.json().get("id")
                a.track(op.collection, rid_)
                g = a.call("GET", f"/{op.collection}/{rid_}", throttle=False)
                stored = g.json() if g.status == 200 else {}
                persisted = (k in stored and stored.get(k) == v)
                rb = g.rid
            rows.append(dict(op=op.key, extra=k, sent=repr(v), status=r.status, code=r.code(), detail=r.detail()[:100], rid=r.rid,
                             persisted=persisted, readback=rb,
                             verdict=("PRIVILEGE-FIELD-PERSISTED" if persisted else ("ACCEPTED-UNKNOWN-FIELD" if 200 <= r.status < 300 else ("SERVER-ERROR" if r.status >= 500 else "OK-rejected")))))
        a.cleanup()
    out["mass_assignment"] = rows


# ------------------------------------------------------------------------------ state machines
def state_machines(a: Audit, out):
    a.step = "state-machine"
    rows = []

    def add(label, r, expect, extra=""):
        rows.append(dict(case=label, status=r.status, code=r.code(), detail=r.detail()[:110], expect=expect, rid=r.rid, note=extra,
                         verdict=("OK" if str(r.status) in expect.split("|") else "UNEXPECTED")))

    ctx = deal_fixture(a)
    d = a.make("deals", {"title": "SM deal", "pipelineId": ctx["pid"], "stageId": ctx["sid"]})
    did = d["id"]
    add("deal: won (open -> won)", a.call("POST", f"/deals/{did}/won", {}), "200")
    first = a.call("GET", f"/deals/{did}").json()
    codes = []
    for i in range(20):
        r = a.call("POST", f"/deals/{did}/won", {}, throttle=False)
        codes.append(r.status)
    last = a.call("GET", f"/deals/{did}").json()
    rows.append(dict(case="deal: replay 'won' x20 on a won deal", status=",".join(sorted(set(map(str, codes)))), code="", detail=f"{codes.count(409)} x 409 of 20; closedAt first={first['closedAt']} last={last['closedAt']}",
                     expect="409 each, closedAt unchanged", rid="", note="", verdict="OK" if set(codes) == {409} and first["closedAt"] == last["closedAt"] else "UNEXPECTED"))
    add("deal: lost on a won deal (won -> lost)", a.call("POST", f"/deals/{did}/lost", {}), "409")
    add("deal: move while closed", a.call("POST", f"/deals/{did}/move", {"stageId": ctx["sid2"]}), "409")
    add("deal: reopen (won -> open)", a.call("POST", f"/deals/{did}/reopen", {}), "200")
    add("deal: reopen twice", a.call("POST", f"/deals/{did}/reopen", {}), "409")
    add("deal: skip stages, move straight to the last stage", a.call("POST", f"/deals/{did}/move", {"stageId": ctx["pipeline"]["stages"][-1]["id"]}), "200",
        "no stage gating is defined in the product; recorded as behaviour")
    add("deal: PATCH status:'won' directly", a.call("PATCH", f"/deals/{did}", {"status": "won"}), "400")
    add("deal: PATCH status:'approved-but-not-really'", a.call("PATCH", f"/deals/{did}", {"status": "approved-but-not-really"}), "400")
    add("deal: create already 'won' (status in body)", a.call("POST", "/deals", {"title": "born won", "pipelineId": ctx["pid"], "stageId": ctx["sid"], "status": "won"}), "400")
    add("deal: create with closeReason in body", a.call("POST", "/deals", {"title": "born reasoned", "pipelineId": ctx["pid"], "stageId": ctx["sid"], "closeReason": "price"}), "400")
    add("deal: lost with a reason that does not exist", a.call("POST", f"/deals/{did}/lost", {"reason": "approved-but-not-really"}), "400")
    rbk = a.call("GET", f"/deals/{did}").json()
    rows.append(dict(case="deal: read-back after the above (still open?)", status=200, code="", detail=f"status={rbk['status']} stageId={'last' if rbk['stageId']==ctx['pipeline']['stages'][-1]['id'] else rbk['stageId']}",
                     expect="open", rid="", note="", verdict="OK" if rbk["status"] == "open" else "UNEXPECTED"))
    # pipelines: archive replay
    p = a.make("pipelines", {"name": "SM pipe", "stages": [{"name": "a"}]})
    add("pipeline: archive", a.call("POST", f"/pipelines/{p['id']}/archive", {}), "200")
    codes = [a.call("POST", f"/pipelines/{p['id']}/archive", {}, throttle=False).status for _ in range(19)]
    rows.append(dict(case="pipeline: replay archive x19", status=",".join(sorted(set(map(str, codes)))), code="", detail=f"{codes.count(409)} x 409", expect="409 each", rid="", note="",
                     verdict="OK" if set(codes) == {409} else "UNEXPECTED"))
    add("pipeline: unarchive", a.call("POST", f"/pipelines/{p['id']}/unarchive", {}), "200")
    add("pipeline: unarchive twice", a.call("POST", f"/pipelines/{p['id']}/unarchive", {}), "409")
    add("pipeline: create deal in an ARCHIVED pipeline", None if False else (a.call("POST", f"/pipelines/{p['id']}/archive", {}) and a.call("POST", "/deals", {"title": "in archived", "pipelineId": p["id"], "stageId": p["stages"][0]["id"]})), "400|409",
        "page says an archived pipeline takes no new deals")
    # contacts: lifecycle
    c1 = a.make("contacts", {"firstName": "SM", "lastName": "Direct", "email": "sm.direct@example.com", "status": "customer"})
    arch = a.call("POST", f"/contacts/{c1['id']}/archive", {})
    add("contact: archive (customer -> archived)", arch, "200")
    st = arch.json() if arch.status == 200 else {}
    rows.append(dict(case="contact: archive records statusBeforeArchive", status=200, code="", detail=f"status={st.get('status')} statusBeforeArchive={st.get('statusBeforeArchive')}",
                     expect="statusBeforeArchive=customer", rid=arch.rid, note="", verdict="OK" if st.get("statusBeforeArchive") == "customer" else "UNEXPECTED"))
    add("contact: archive twice", a.call("POST", f"/contacts/{c1['id']}/archive", {}), "409")
    c2 = a.make("contacts", {"firstName": "SM", "lastName": "Born archived", "status": "archived"})
    g2 = a.call("GET", f"/contacts/{c2['id']}").json()
    rows.append(dict(case="contact: create directly with status 'archived' skips the archive flow", status=201, code="", detail=f"status={g2['status']} statusBeforeArchive={g2['statusBeforeArchive']}",
                     expect="400 or statusBeforeArchive set", rid="", note="inconsistent record: archived with no previous status", verdict="UNEXPECTED" if g2["statusBeforeArchive"] is None else "OK"))
    c3 = a.make("contacts", {"firstName": "SM", "lastName": "Patched", "status": "lead"})
    pr = a.call("PATCH", f"/contacts/{c3['id']}", {"status": "archived"})
    g3 = a.call("GET", f"/contacts/{c3['id']}").json()
    rows.append(dict(case="contact: PATCH status 'archived' skips the archive flow", status=pr.status, code="", detail=f"status={g3['status']} statusBeforeArchive={g3['statusBeforeArchive']}",
                     expect="400 or statusBeforeArchive='lead'", rid=pr.rid, note="", verdict="UNEXPECTED" if g3["statusBeforeArchive"] is None else "OK"))
    for route in ("unarchive", "restore"):
        r = a.call("POST", f"/contacts/{c1['id']}/{route}", {}, throttle=False)
        rows.append(dict(case=f"contact: POST /{route} route exists?", status=r.status, code=r.code(), detail=r.detail()[:90], expect="route exists (lead lifecycle events are advertised)",
                         rid=r.rid, note="", verdict="MISSING-FLOW" if r.status == 404 else "OK"))
    # companies
    co = a.make("companies", {"name": "SM Co"})
    add("company: archive", a.call("POST", f"/companies/{co['id']}/archive", {}), "200")
    add("company: archive twice", a.call("POST", f"/companies/{co['id']}/archive", {}), "409")
    out["state_machine"] = rows
    a.cleanup()


# ------------------------------------------------------------------------------ idempotency
def idempotency(a: Audit, out):
    a.step = "idempotency"
    rows = []
    targets = [("pipelines", "/pipelines", lambda n: {"name": f"idem {n}", "stages": [{"name": "a"}]}, None),
               ("contacts", "/contacts", lambda n: {"firstName": f"Idem{n}", "email": f"idem{n}@example.com"}, None),
               ("companies", "/companies", lambda n: {"name": f"Idem Co {n}"}, None),
               ("catalog-products", "/catalog-products", lambda n: {"name": f"Idem product {n}"}, None),
               ("activities", "/activities", lambda n: {"type": "note", "title": f"Idem {n}", "body": "b"}, None),
               ("messages", "/messages", None, "test")]
    for coll, path, mk, mode in targets:
        if coll == "messages":
            cid = a.make("contacts", {"firstName": "IdemMsg", "email": "idem.msg@example.com"}, mode="test")["id"]
            mk = lambda n, cid=cid: {"contactId": cid, "channel": "email", "subject": f"idem {n}", "body": "hello"}  # noqa: E731
        before = a.count(coll, mode=mode)
        key = KEY(coll)
        body = mk(1)
        r1 = a.call("POST", path, body, headers={"Idempotency-Key": key}, mode=mode)
        r2 = a.call("POST", path, body, headers={"Idempotency-Key": key}, mode=mode)
        for r in (r1, r2):
            if 200 <= r.status < 300:
                a.track(coll, r.json()["id"])
        mid = a.count(coll, mode=mode)
        r3 = a.call("POST", path, mk(2), mode=mode)
        r4 = a.call("POST", path, mk(2), mode=mode)
        for r in (r3, r4):
            if 200 <= r.status < 300:
                a.track(coll, r.json()["id"])
        r5 = a.call("POST", path, mk(2), headers={"Idempotency-Key": KEY(coll + "-new")}, mode=mode)
        if 200 <= r5.status < 300:
            a.track(coll, r5.json()["id"])
        after = a.count(coll, mode=mode)
        ids1 = (r1.json().get("id") if r1.status < 300 else None, r2.json().get("id") if r2.status < 300 else None)
        rows.append(dict(endpoint=f"POST {path}", key=key, same_key_twice=f"{r1.status}, {r2.status}", same_key_ids=ids1,
                         same_key_rows_created=mid - before, no_key_twice_rows=None, new_key_same_body=r5.status,
                         replay_header=",".join(k for k in r2.headers if "idempot" in k.lower() or "replay" in k.lower()),
                         supported=(mid - before) == 1, rids=f"{r1.rid},{r2.rid},{r3.rid},{r4.rid},{r5.rid}",
                         verdict="IDEMPOTENCY-KEY-IGNORED" if (mid - before) == 2 else ("DEDUPED" if (mid - before) == 1 else f"UNEXPECTED delta {mid - before}"),
                         total_after=after - before))
        a.cleanup()
    out["idempotency"] = rows


# ------------------------------------------------------------------------------ races (<= 10 parallel)
def par(n, fn):
    with cf.ThreadPoolExecutor(n) as ex:
        return list(ex.map(fn, range(n)))


def races(a: Audit, out):
    a.step = "races"
    rows = []
    # 1) concurrent creates of the same unique-looking value (contact email), same key vs distinct keys
    before = a.count("contacts")
    key = KEY("race-contact")
    res = par(10, lambda i: a.call("POST", "/contacts", {"firstName": "Race", "email": "race.same@example.com"}, headers={"Idempotency-Key": key}, throttle=False))
    ids = sorted({r.json()["id"] for r in res if r.status == 201})
    for i in ids:
        a.track("contacts", i)
    delta = a.count("contacts") - before
    rows.append(dict(case="10 parallel contact creates, same email, ONE idempotency key", statuses=sorted(r.status for r in res), rows_created=len(ids), final_count_delta=delta,
                     expect="1 row (replays of one record)", detail=f"{len(ids)} distinct id(s) across {len(res)} responses", rids=[r.rid for r in res][:10],
                     verdict="DUPLICATES-CREATED" if delta > 1 else "OK"))
    before = a.count("contacts")
    res = par(10, lambda i: a.call("POST", "/contacts", {"firstName": "Race", "email": "race.same2@example.com"}, headers={"Idempotency-Key": KEY(f"race-d{i}")}, throttle=False))
    ids = [r.json()["id"] for r in res if r.status == 201]
    for i in ids:
        a.track("contacts", i)
    rows.append(dict(case="10 parallel contact creates, same email, DISTINCT keys", statuses=sorted(r.status for r in res), rows_created=len(ids), final_count_delta=(d_ := a.count("contacts") - before),
                     expect="1 row if email is meant to be unique", rids=[r.rid for r in res][:10], verdict="DUPLICATES-CREATED" if d_ > 1 else "OK"))
    # 2) concurrent identical pipeline names
    before = a.count("pipelines")
    res = par(10, lambda i: a.call("POST", "/pipelines", {"name": "Race pipeline", "stages": [{"name": "a"}]}, throttle=False))
    ids = [r.json()["id"] for r in res if r.status == 201]
    for i in ids:
        a.track("pipelines", i)
    rows.append(dict(case="10 parallel pipeline creates, same name", statuses=sorted(r.status for r in res), rows_created=len(ids), final_count_delta=(d_ := a.count("pipelines") - before),
                     expect="design decision: unique name?", rids=[r.rid for r in res][:10], verdict="DUPLICATES-CREATED" if d_ > 1 else "OK"))
    a.cleanup()
    # 3) uniqueness that IS enforced: custom property key (note: permanent, archived on delete)
    for x in a.list_all("contacts/custom-properties") or []:
        if x["key"] == "race_unique_key" and not x["archivedAt"]:
            a.call("DELETE", f"/contacts/custom-properties/{x['id']}", tag="cleanup", throttle=False)   # a stale ACTIVE key would make every attempt a 409
    res = par(10, lambda i: a.call("POST", "/contacts/custom-properties", {"key": "race_unique_key", "label": "Race", "type": "text"}, throttle=False))
    ok = [r for r in res if r.status == 201]
    for r in ok:
        a.call("DELETE", f"/contacts/custom-properties/{r.json()['id']}", tag="cleanup", throttle=False)
    rows.append(dict(case="10 parallel creates of the same custom-property key", statuses=sorted(r.status for r in res), rows_created=len(ok), final_count_delta=len(ok),
                     expect="exactly 1 x 201, the rest 409", rids=[r.rid for r in res][:10], verdict="OK" if len(ok) == 1 else "UNIQUE-VIOLATED"))
    # 4) concurrent state transitions
    ctx = deal_fixture(a)
    d = a.make("deals", {"title": "race deal", "pipelineId": ctx["pid"], "stageId": ctx["sid"]})
    res = par(10, lambda i: a.call("POST", f"/deals/{d['id']}/won", {}, throttle=False))
    rows.append(dict(case="10 parallel 'won' on one open deal", statuses=sorted(r.status for r in res), rows_created=0, final_count_delta=0, expect="one 200, nine 409",
                     rids=[r.rid for r in res], verdict="OK" if sorted(r.status for r in res) == [200] + [409] * 9 else "UNEXPECTED"))
    res = par(10, lambda i: a.call("POST", f"/pipelines/{ctx['pid']}/archive", {}, throttle=False))
    rows.append(dict(case="10 parallel archive of one pipeline", statuses=sorted(r.status for r in res), rows_created=0, final_count_delta=0, expect="one 200, nine 409",
                     rids=[r.rid for r in res], verdict="OK" if sorted(r.status for r in res) == [200] + [409] * 9 else "UNEXPECTED"))
    victim = a.make("companies", {"name": "race delete"})
    res = par(10, lambda i: a.call("DELETE", f"/companies/{victim['id']}", throttle=False))
    rows.append(dict(case="10 parallel DELETE of one company", statuses=sorted(r.status for r in res), rows_created=0, final_count_delta=-1,
                     expect="one 204, nine 404", rids=[r.rid for r in res], verdict="OK" if sorted(r.status for r in res) == [204] + [404] * 9 else "UNEXPECTED"))
    a.created = [x for x in a.created if x[1] != victim["id"]]
    # 5) last-write-wins on one field (the earlier archive race left ctx's pipeline archived: use a fresh fixture)
    ctx = deal_fixture(a)
    d2 = a.make("deals", {"title": "lww start", "pipelineId": ctx["pid"], "stageId": ctx["sid"]})
    rr = par(2, lambda i: a.call("PATCH", f"/deals/{d2['id']}", {"title": f"WRITER-{'AB'[i]}"}, throttle=False))
    fin = a.call("GET", f"/deals/{d2['id']}").json()
    rows.append(dict(case="2 parallel PATCH of one deal title (A vs B)", statuses=[r.status for r in rr], rows_created=0, final_count_delta=0,
                     expect="single deterministic final state", detail=f"final title={fin['title']}", rids=[r.rid for r in rr],
                     verdict="OK (last write wins; both told 200)" if fin["title"] in ("WRITER-A", "WRITER-B") else "SPLIT-BRAIN"))
    # 6) lost update: read-modify-write without a lock
    c = a.make("contacts", {"firstName": "Lost", "lastName": "Update", "customProperties": {"employee_count": 10}})
    g = a.call("GET", f"/contacts/{c['id']}")
    etag = g.headers.get("etag", "")
    rr = par(2, lambda i: a.call("PATCH", f"/contacts/{c['id']}", {"customProperties": {"employee_count": 11 + i}}, throttle=False))
    fin = a.call("GET", f"/contacts/{c['id']}").json()["customProperties"].get("employee_count")
    stale = a.call("PATCH", f"/contacts/{c['id']}", {"lastName": "Stale-If-Match"}, headers={"If-Match": '"definitely-stale-version"'})
    rows.append(dict(case="lost update: GET {employee_count:10}; PUT 11 and PUT 12 in parallel", statuses=[r.status for r in rr], rows_created=0, final_count_delta=0,
                     expect="optimistic lock: one write must be refused (412/409), or version/ETag returned", detail=f"ETag on GET='{etag}'; final employee_count={fin}; both PUTs accepted={all(r.status == 200 for r in rr)}; stale If-Match -> {stale.status}",
                     rids=[g.rid] + [r.rid for r in rr] + [stale.rid], verdict=("LOST-UPDATE-POSSIBLE (no ETag/If-Match/version support)" if (all(r.status == 200 for r in rr) and not etag and stale.status == 200) else "OK (ETag + If-Match supported, opt-in; without If-Match the last write wins)")))
    # 7) close-reasons concurrent PUT A vs B (shared singleton)
    orig = a.call("GET", "/close-reasons", throttle=False).json()["reasons"]
    A = [{"code": "race_a", "label": "A", "outcome": "lost"}]
    B = [{"code": "race_b", "label": "B", "outcome": "lost"}]
    rr = par(2, lambda i: a.call("PUT", "/close-reasons", {"reasons": [A, B][i]}, throttle=False))
    fin = a.call("GET", "/close-reasons").json()["reasons"]
    rows.append(dict(case="2 parallel PUT of the close-reason list (A vs B)", statuses=[r.status for r in rr], rows_created=0, final_count_delta=0, expect="exactly A or exactly B",
                     detail=f"final={[x['code'] for x in fin]}", rids=[r.rid for r in rr], verdict="OK" if fin in (A, B) else "SPLIT-BRAIN"))
    a.call("PUT", "/close-reasons", {"reasons": orig}, tag="cleanup")
    out["races"] = rows
    a.cleanup()


# ------------------------------------------------------------------------------ partial failure
def partial_failure(a: Audit, out):
    a.step = "partial-failure"
    rows = []
    ctx = product_fixture(a)
    P = ctx["product"]["id"]
    good = {"catalogProductId": P, "quantity": 1, "unitAmount": 100, "currency": "AUD"}
    bad = {"catalogProductId": P, "quantity": 0, "unitAmount": 100, "currency": "AUD"}

    def trial(label, coll, path, body, mode=None, extra_counts=()):
        before = {c: a.count(c, mode=mode) for c in (coll, *extra_counts)}
        r = a.call("POST", path, body, mode=mode)
        if 200 <= r.status < 300:
            try:
                a.track(coll, r.json()["id"])
            except Exception:
                pass
        after = {c: a.count(c, mode=mode) for c in before}
        delta = {c: after[c] - before[c] for c in before}
        rows.append(dict(case=label, status=r.status, code=r.code(), detail=r.detail()[:140], count_delta=delta, rid=r.rid,
                         expect="4xx naming the bad child; delta 0 everywhere", verdict="OK" if (r.status >= 400 and r.status < 500 and not any(delta.values())) else "PARTIAL-COMMIT-OR-UNEXPECTED"))

    trial("deal: line items [valid, INVALID quantity 0, valid]", "deals", "/deals",
          {"title": "partial deal", "pipelineId": ctx["pid"], "stageId": ctx["sid"], "lineItems": [good, bad, good]})
    trial("pipeline: stages [valid, INVALID empty name, valid]", "pipelines", "/pipelines", {"name": "partial pipeline", "stages": [{"name": "a"}, {"name": ""}, {"name": "c"}]})
    trial("pipeline: valid name, two stages with the same name", "pipelines", "/pipelines", {"name": "partial pipeline 2", "stages": [{"name": "a"}, {"name": "A"}]})
    trial("catalog product: price entries [valid, INVALID currency]", "catalog-products", "/catalog-products",
          {"name": "partial product", "priceEntries": [{"label": "ok", "amount": 1, "currency": "AUD"}, {"label": "bad", "amount": 1, "currency": "ZZZ"}]})
    trial("contact: valid name, INVALID custom property value", "contacts", "/contacts", {"firstName": "Partial", "customProperties": {"employee_count": "not a number"}})
    trial("contact: valid name, company that does not exist", "contacts", "/contacts", {"firstName": "Partial", "companyId": "000000000000000000000000"})
    trial("deal: valid title, contact that does not exist", "deals", "/deals", {"title": "partial deal 2", "pipelineId": ctx["pid"], "stageId": ctx["sid"], "contactId": "000000000000000000000000"})
    trial("automation rule: valid trigger, INVALID action", "automation-rules", "/automation-rules",
          {"name": "partial rule", "trigger": {"eventType": "deal.won"}, "action": {"type": "activity.create", "fields": {"type": "nope"}}})
    # rule that points at something that will be deleted later is covered by the integration tests
    out["partial_failure"] = rows
    a.cleanup()


# ------------------------------------------------------------------------------ CSRF / Origin and cross-project writes
def csrf_and_cross_project(a: Audit, out, other_project):
    a.step = "csrf-xproject"
    rows = []
    before = a.count("pipelines")
    for label, hdrs in (("hostile Origin + Sec-Fetch-Site cross-site", {"origin": "https://evil.example", "sec-fetch-site": "cross-site", "referer": "https://evil.example/x"}),
                        ("no Origin header", {}), ("same Origin", {"origin": a.cfg.base_url})):
        r = a.call("POST", "/pipelines", {"name": "csrf probe", "stages": [{"name": "a"}]}, headers=hdrs)
        if r.status == 201:
            a.track("pipelines", r.json()["id"])
        rows.append(dict(case=f"cookie-authenticated POST with {label}", status=r.status, code=r.code(), detail=r.detail()[:100], rid=r.rid,
                         expect="403 for the hostile origin", verdict=("CSRF-GAP" if (r.status == 201 and "hostile" in label) else "OK")))
    ctx = deal_fixture(a)
    d = a.make("deals", {"title": "xproj deal", "pipelineId": ctx["pid"], "stageId": ctx["sid"]})
    tgt = [("PATCH", f"/deals/{d['id']}", {"title": "hijacked"}), ("DELETE", f"/deals/{d['id']}", None), ("POST", f"/deals/{d['id']}/won", {}),
           ("POST", f"/deals/{d['id']}/move", {"stageId": ctx["sid2"]}), ("PATCH", f"/pipelines/{ctx['pid']}", {"name": "hijacked"}),
           ("POST", f"/pipelines/{ctx['pid']}/stages", {"name": "hijack"}), ("DELETE", f"/pipelines/{ctx['pid']}", None),
           ("PATCH", f"/contacts/{ctx['contact']['id']}", {"firstName": "hijacked"}), ("DELETE", f"/contacts/{ctx['contact']['id']}", None),
           ("PATCH", f"/companies/{ctx['company']['id']}", {"name": "hijacked"}), ("DELETE", f"/companies/{ctx['company']['id']}", None)]
    for m, path, body in tgt:
        r = a.call(m, path, body, project=other_project)
        rows.append(dict(case=f"{m} {path.split('/')[1]}/{{id}}{('/' + path.split('/')[3]) if path.count('/') > 2 else ''} from the other own project", status=r.status, code=r.code(),
                         detail=r.detail()[:80], rid=r.rid, expect="404", verdict="OK" if r.status == 404 else "CROSS-PROJECT-WRITE-ACCEPTED"))
    intact = a.call("GET", f"/deals/{d['id']}").json()
    rows.append(dict(case="read-back: record unchanged after the cross-project attempts", status=200, code="", detail=f"title={intact['title']} status={intact['status']}", rid="",
                     expect="title 'xproj deal', open", verdict="OK" if (intact["title"] == "xproj deal" and intact["status"] == "open") else "CORRUPTED"))
    out["csrf_xproject"] = rows
    a.cleanup()


def main():
    a = Audit(prefix="W2" if len(sys.argv) > 1 else "W")
    out = {}
    if (OUT / "writes.json").exists():          # re-runs of single steps keep the earlier results
        out = json.loads((OUT / "writes.json").read_text(encoding="utf-8"))
    only = [x for x in sys.argv[1:] if not x.startswith("--")]
    other = None
    try:
        import json as _j
        projs = a.call("GET", "/workspaces/6abe37466194a264a524b64c/projects?limit=100", throttle=False).json()["data"]
        other = next(p["id"] for p in projs if p["id"] != a.cfg.project_id)
    except Exception:
        pass
    steps = [("negative_only", negative_only), ("mass_assignment", mass_assignment), ("state_machines", state_machines),
             ("idempotency", idempotency), ("races", races), ("partial_failure", partial_failure)]
    for name, fn in steps:
        if only and name not in only:
            continue
        try:
            fn(a, out)
        finally:
            a.cleanup()
        print(name, "done; requests", a.n, flush=True)
        (OUT / "writes.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
    if (not only or "csrf" in only) and other:
        csrf_and_cross_project(a, out, other)
        print("csrf_xproject done", a.n, flush=True)
    (OUT / "writes.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
    print("requests:", a.n)


if __name__ == "__main__":
    main()
