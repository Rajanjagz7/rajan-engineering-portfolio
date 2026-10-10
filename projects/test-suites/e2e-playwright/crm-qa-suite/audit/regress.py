"""Regression re-check of every previously reported bug. Verdicts: FIXED / STILL-OPEN / CHANGED (behaviour differs
from both the old bug and the expected behaviour). Evidence ids go to reports/audit/evidence_RG.jsonl.
Output: reports/regress/recheck.json"""
from __future__ import annotations

import json
import time

import requests

from core import ROOT, Audit

OUT = ROOT / "reports" / "regress"
OUT.mkdir(parents=True, exist_ok=True)
a = Audit(prefix="RG")
RES = []
RUN = time.strftime("%H%M%S")


def rec(bid, title, fixed, rs, note="", expected=""):
    """fixed: True / False / None (None = CHANGED / cannot decide)."""
    RES.append(dict(id=bid, title=title, verdict="FIXED" if fixed else ("STILL-OPEN" if fixed is False else "CHANGED"), rids=[r.rid for r in rs if r],
                    statuses=[r.status for r in rs if r], note=note, expected=expected))


def ok2(r):
    return 200 <= r.status < 300


# ---------------------------------------------------------------- round-1 list (BUG-01 .. BUG-20)
r = [a.call("GET", f"/{c}?q=a%00b") for c in ("contacts", "companies", "deals", "files")]
rec("BUG-01", "null byte in search returns 500", all(x.status < 500 for x in r), r, f"statuses {[x.status for x in r]}")

# BUG-02 is UI (checked in the browser step)

x = a.call("POST", "/contacts", {"firstName": f"RG{RUN}", "phone": "abc"})
if ok2(x): a.track("contacts", x.json()["id"])
y = a.call("POST", "/companies", {"name": f"RG co {RUN}", "phone": "xyz", "domain": "not a domain"})
if ok2(y): a.track("companies", y.json()["id"])
rec("BUG-03", "contact phone not validated", x.status == 400, [x], f"phone 'abc' -> {x.status}")
rec("BUG-04", "company phone/domain not validated", y.status == 400, [y], f"phone 'xyz' + domain 'not a domain' -> {y.status}")
w = a.call("POST", "/contacts", {"firstName": "   "})
if ok2(w): a.track("contacts", w.json()["id"])
rec("BUG-05", "whitespace-only first name accepted", w.status == 400, [w], f"-> {w.status}")
o = a.call("POST", "/contacts", {"firstName": f"RG{RUN}", "ownerActorId": "nope"})
if ok2(o): a.track("contacts", o.json()["id"])
rec("BUG-06", "ownerActorId not verified", o.status in (400, 404), [o], f"-> {o.status}")
l1 = a.call("POST", "/companies", {"name": "N" * 300})
if ok2(l1): a.track("companies", l1.json()["id"])
l2 = a.call("POST", "/contacts", {"firstName": "x", "email": "a" * 64 + "@" + "b" * 63 + "." + "c" * 63 + "." + "d" * 60 + ".com"})
if ok2(l2): a.track("contacts", l2.json()["id"])
rec("BUG-07", "inconsistent length limits (300-char company name, >254 email)", l1.status == 400 and l2.status == 400, [l1, l2], f"company 300 -> {l1.status}; email >254 -> {l2.status}")
c = a.call("POST", "/pipelines", {"name": "a\u0000b", "stages": [{"name": "s"}]})
if ok2(c): a.track("pipelines", c.json()["id"])
rec("BUG-08", "control characters accepted in names", c.status == 400, [c], f"NUL in pipeline name -> {c.status}")
u = a.call("POST", "/pipelines", raw=b'{"name":"RG \xff\xfe","stages":[{"name":"a"}]}')
if ok2(u): a.track("pipelines", u.json()["id"])
rec("BUG-09", "invalid UTF-8 silently replaced", u.status == 400, [u], f"-> {u.status}")
e = a.call("POST", "/pipelines", {"name": "\U0001F600" * 100, "stages": [{"name": "a"}]})
if ok2(e): a.track("pipelines", e.json()["id"])
rec("BUG-10", "120 limit counts UTF-16 units (100 emoji refused)", e.status == 201, [e], f"100 emoji -> {e.status}")
big = '{"pad":"' + "A" * 2_000_000 + '"}'
rs = [a.call("POST", "/pipelines", raw=big) for _ in range(6)]
rec("BUG-11", "intermittent empty 502 instead of 413 on oversized body", all(x.status == 413 for x in rs), rs, f"statuses {[x.status for x in rs]}")
t = a.call("TRACE", "/pipelines")
rec("BUG-12", "TRACE returns bare 500", t.status in (404, 405), [t], f"-> {t.status} {t.headers.get('content-type', '')}")
tp = a.call("POST", "/pipelines", raw='{"name":"RG text plain","stages":[{"name":"a"}]}', headers={"content-type": "text/plain"})
if ok2(tp): a.track("pipelines", tp.json()["id"])
rec("BUG-13", "text/plain body parsed as JSON", tp.status in (400, 415), [tp], f"-> {tp.status}")
hostile = a.call("POST", "/pipelines", {"name": "RG hostile origin", "stages": [{"name": "a"}]}, headers={"origin": "https://evil.example", "sec-fetch-site": "cross-site"})
if ok2(hostile): a.track("pipelines", hostile.json()["id"])
rec("BUG-13b", "cookie-authenticated write accepted from hostile Origin", hostile.status == 403, [hostile], f"-> {hostile.status}")
p3 = a.make("pipelines", {"name": f"RG order {RUN}", "stages": [{"name": "a"}, {"name": "b"}, {"name": "c"}]})
d = a.call("DELETE", f"/pipelines/{p3['id']}/stages/{p3['stages'][1]['id']}")
g = a.call("GET", f"/pipelines/{p3['id']}")
orders = [s["order"] for s in g.json()["stages"]]
rec("BUG-14", "stage order gaps after delete", orders == [0, 1], [d, g], f"orders {orders}")
org = a.call("GET", "/pipelines?limit=1", headers={"crm-org-id": "no-such-org"})
rec("BUG-15", "unknown Crm-Org-Id accepted", org.status in (400, 403, 404), [org], f"-> {org.status}")
a.call("POST", f"/pipelines/{p3['id']}/archive", {})
st = a.call("POST", f"/pipelines/{p3['id']}/stages", {"name": "late"})
rec("BUG-DQ2", "stage can be added to an archived pipeline", st.status in (400, 409), [st], f"-> {st.status}")

# ---------------------------------------------------------------- audit findings
# numeric precision
pr = a.call("POST", "/contacts/custom-properties", {"key": f"rg_n_{RUN}", "label": "RG num", "type": "number"})
if ok2(pr): a.track("contacts/custom-properties", pr.json()["id"])
cn = a.call("POST", "/contacts", {"firstName": "RGnum", "customProperties": {f"rg_n_{RUN}": 9223372036854775807}})
if ok2(cn):
    a.track("contacts", cn.json()["id"])
    gv = a.call("GET", f"/contacts/{cn.json()['id']}")
    stored = gv.json()["customProperties"].get(f"rg_n_{RUN}")
    rec("FX-NUMPREC", "number custom property rounds integers beyond 2^53", False if stored != 9223372036854775807 else True, [cn, gv], f"sent 9223372036854775807 stored {stored}")
else:
    rec("FX-NUMPREC", "number custom property rounds integers beyond 2^53", True, [cn], f"now rejected: {cn.status}")
# text hygiene
nl = a.call("POST", "/activities", {"type": "note", "title": f"RG{RUN} a\u0000b", "body": "x"})
if ok2(nl): a.track("activities", nl.json()["id"])
ws = a.call("POST", "/messages", {"contactId": "000000000000000000000000", "channel": "email", "body": "   "}, mode="test")
rec("FX-NUL", "NUL accepted in activity title", nl.status == 400, [nl], f"-> {nl.status}")
msgc = a.make("contacts", {"firstName": "RGmsg", "email": f"rg{RUN}@example.com"}, mode="test")
wsb = a.call("POST", "/messages", {"contactId": msgc["id"], "channel": "email", "subject": "RG", "body": "   "}, mode="test")
rec("FX-BLANKMSG", "whitespace-only message body accepted", wsb.status == 400, [wsb], f"-> {wsb.status}")
# stage id
pa = a.make("pipelines", {"name": f"RG sid A {RUN}", "stages": [{"name": "a"}]})
pb = a.make("pipelines", {"name": f"RG sid B {RUN}", "stages": [{"name": "b"}]})
s1 = a.call("POST", f"/pipelines/{pb['id']}/stages", {"name": "steal", "id": pa["stages"][0]["id"]})
rec("FX-STAGEID", "client-supplied stage id accepted / reusable across pipelines", s1.status in (400, 422), [s1], f"-> {s1.status}")
# archive twice
c1 = a.make("contacts", {"firstName": f"RGarch{RUN}"})
a.call("POST", f"/contacts/{c1['id']}/archive", {})
ar2 = a.call("POST", f"/contacts/{c1['id']}/archive", {})
rec("FX-ARCH2", "archiving twice: contacts 200 vs pipelines 409", ar2.status == 409, [ar2], f"contact archive again -> {ar2.status}")
cb = a.call("POST", "/contacts", {"firstName": f"RGborn{RUN}", "status": "archived"})
if ok2(cb):
    a.track("contacts", cb.json()["id"])
    cg = a.call("GET", f"/contacts/{cb.json()['id']}")
    rec("FX-BORNARCH", "contact created archived has no statusBeforeArchive", cg.json().get("statusBeforeArchive") is not None, [cb, cg], f"statusBeforeArchive={cg.json().get('statusBeforeArchive')}")
else:
    rec("FX-BORNARCH", "contact created archived has no statusBeforeArchive", True, [cb], f"now rejected: {cb.status}")
# lifecycle routes
lr = [a.call("POST", f"/leads/{c1['id']}/{rt}", {}, throttle=False) for rt in ("qualify", "disqualify", "convert")]
rec("FX-LEADROUTES", "lead lifecycle routes /leads/{id}/qualify|disqualify|convert exist", all(x.status != 404 for x in lr), lr, f"statuses {[x.status for x in lr]}")
# idempotency
k = f"rg-replay-{RUN}"
ia = a.call("POST", "/companies", {"name": f"RG idem {RUN}"}, headers={"Idempotency-Key": k})
ib = a.call("POST", "/companies", {"name": f"RG idem {RUN}"}, headers={"Idempotency-Key": k})
hdr = [h for h in ib.headers if "idemp" in h.lower() or "replay" in h.lower()]
rec("FX-IDEMHDR", "replay carries no marker header", bool(hdr), [ia, ib], f"headers {hdr or 'none'}")
if ok2(ia):
    a.call("DELETE", f"/companies/{ia.json()['id']}")
    ic = a.call("POST", "/companies", {"name": f"RG idem {RUN}"}, headers={"Idempotency-Key": k})
    gg = a.call("GET", f"/companies/{ia.json()['id']}")
    rec("FX-IDEMDEL", "replayed key returns 'created' for a deleted record", not (ic.status == 201 and gg.status == 404), [ic, gg], f"replay -> {ic.status}, GET original -> {gg.status}")
# custom property delete semantics
kp = f"rg_p_{RUN}"
p1 = a.call("POST", "/contacts/custom-properties", {"key": kp, "label": "RG", "type": "text"})
cc = a.make("contacts", {"firstName": "RGprop", "customProperties": {kp: "value"}})
dl = a.call("DELETE", f"/contacts/custom-properties/{p1.json()['id']}")
lst = a.list_all("contacts/custom-properties") or []
still = any(x["key"] == kp for x in lst)
rec("FX-PROPDEL", "DELETE of a custom property only archives it (still listed)", not still, [p1, dl], f"still listed after 204: {still}")
# filter syntax
fa = a.call("GET", "/contacts?status=archived")
rec("FX-FILTER", "status=archived rejected, only status[in]= works", fa.status == 200, [fa], f"-> {fa.status}: {fa.detail()[:80]}")
# misc
act = a.call("POST", "/activities", {"type": "task", "title": "Follow-up on pricing", "attachments": [{"kind": "contact", "id": c1["id"]}]})
if ok2(act): a.track("activities", act.json()["id"])
rec("FX-ACTLINK", "activity can be linked via attachments", ok2(act), [act], f"-> {act.status}")
imp = a.call("POST", "/imports", {"resource": "contacts", "fileId": "x", "onDuplicate": "update"})
rec("FX-IMPUPD", "import has no update/skip duplicate mode", imp.status != 400 or "onDuplicate" not in imp.detail(), [imp], f"-> {imp.status} {imp.detail()[:80]}")
mv = a.call("POST", f"/deals/{a.make('deals', {'title': 'RG mv', 'pipelineId': pa['id'], 'stageId': pa['stages'][0]['id']})['id']}/move", {"stageId": pa["stages"][0]["id"]})
rec("FX-MOVESAME", "move to the same stage returns 200", mv.status != 200, [mv], f"-> {mv.status}")
pm = [a.call("PUT", "/pipelines", {}), a.call("DELETE", "/pipelines"), a.call("PATCH", "/pipelines", {})]
rec("FX-405", "PUT/DELETE/PATCH on collection returns 404, not 405", all(x.status == 405 for x in pm), pm, f"statuses {[x.status for x in pm]}")
dk = a.call("POST", "/pipelines", raw='{"name":"first","name":"RG dup keys","stages":[{"name":"a"}]}')
if ok2(dk): a.track("pipelines", dk.json()["id"])
rec("FX-DUPKEYS", "duplicate JSON keys accepted", dk.status == 400, [dk], f"-> {dk.status}")
ct = a.call("POST", "/pipelines", raw='{"name":"RG ct xml","stages":[{"name":"a"}]}', headers={"content-type": "application/xml"})
if ok2(ct): a.track("pipelines", ct.json()["id"])
rec("FX-CTYPE", "wrong Content-Type accepted", ct.status in (400, 415), [ct], f"xml -> {ct.status}")
lu = a.call("GET", f"/pipelines/{'a' * 5000}")
rec("FX-ENVELOPE", "over-long URL error uses a different envelope (names framework)", "FST_ERR" not in lu.text, [lu], f"-> {lu.status} {lu.text[:100]}")
base = a.cfg.base_url
sd = [a.client.session.get(base + p, timeout=30, allow_redirects=False) for p in ("/api/docs", "/api/openapi.json", "/api/v1/pipelines")]
rec("FX-SOFT404", "unknown /api/* paths return 200 HTML", all(x.status_code == 404 for x in sd), [], f"statuses {[x.status_code for x in sd]}")
tz = a.call("POST", "/activities", {"type": "appointment", "title": "RG tz", "startsAt": "2026-12-01T09:00:00+11:00", "endsAt": "2026-12-01T10:00:00+11:00", "timeZone": "australia/sydney"})
if ok2(tz): a.track("activities", tz.json()["id"])
rec("FX-TZ", "timeZone accepts lower-case non-canonical name", tz.status == 400, [tz], f"-> {tz.status}")
mr = a.make("contacts", {"firstName": "RGm1", "email": f"rgm1{RUN}@example.com"}); ms = a.make("contacts", {"firstName": "RGm2", "email": f"rgm2{RUN}@example.com"})
mg = a.call("POST", f"/contacts/{mr['id']}/merge", {"sourceId": ms["id"]})
rec("FX-MERGE", "merge with conflicting emails has no way to choose", ok2(mg) or ("keep" in mg.detail().lower() and mg.status != 409), [mg], f"-> {mg.status} {mg.detail()[:90]}")
ev = a.call("GET", "/events?limit=100")
dele = [e for e in ev.json()["data"] if e["type"].endswith(".deleted")]
rec("FX-AUDITNAME", "deleted-record audit events carry no name", bool(dele) and all((e.get("data") or {}).get("name") or (e.get("data") or {}).get("title") or (e.get("data") or {}).get("firstName") for e in dele[:10]), [ev], f"sample data keys {list((dele[0].get('data') or {}).keys())[:8] if dele else 'none'}")
rl = [a.call("GET", "/pipelines?limit=1", throttle=False) for _ in range(3)]
hh = {k.lower(): v for k, v in rl[-1].headers.items()}
rec("FX-HEADERS", "Via header discloses proxy; no rate-limit headers", ("via" not in hh) and any("ratelimit" in k or "retry" in k for k in hh), rl[-1:], f"via={hh.get('via')} ratelimit={[k for k in hh if 'ratelimit' in k]}")
# automation delay: not re-timed here (takes minutes); recorded as UNCHANGED-UNTESTED
rec("FX-AUTOMDELAY", "automation runs ~2 min after the event", None, [], "not re-timed in this run (needs a 4-minute wait); covered by the integration step if run")

a.cleanup()
(OUT / "recheck.json").write_text(json.dumps(RES, indent=1, default=str), encoding="utf-8")
import collections
print(dict(collections.Counter(x["verdict"] for x in RES)), "requests", a.n)
for x in RES:
    print(f"{x['verdict']:10} {x['id']:14} {x['title'][:70]:70} | {x['note'][:80]}")
