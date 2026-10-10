"""Extra evidence for findings discovered while triaging (one process, one prefix, so request ids are unique).
Appends entries to reports/audit/known.json."""
import concurrent.futures as cf
import json
import time

RUN = time.strftime("%Y%m%d%H%M%S")

from core import OUT, Audit


def main():
    a = Audit(prefix="E")
    k = json.loads((OUT / "known.json").read_text(encoding="utf-8")) if (OUT / "known.json").exists() else []

    def rec(key, title, expect, rs, verdict, note):
        k[:] = [x for x in k if x["key"] != key]
        k.append(dict(key=key, title=title, expect=expect, rids=[r.rid for r in rs], statuses=[r.status for r in rs],
                      bodies=[r.text[:160] for r in rs], verdict=verdict, note=note))

    # K23: stage ids are client-controllable and reusable across pipelines
    pa = a.make("pipelines", {"name": "E stage-id A", "stages": [{"name": "a"}]})
    pb = a.make("pipelines", {"name": "E stage-id B", "stages": [{"name": "b"}]})
    sid = pa["stages"][0]["id"]
    s1 = a.call("POST", f"/pipelines/{pa['id']}/stages", {"name": "client id", "id": "fixed-stage-id-1"})
    s2 = a.call("POST", f"/pipelines/{pa['id']}/stages", {"name": "same id again", "id": "fixed-stage-id-1"})
    s3 = a.call("POST", f"/pipelines/{pb['id']}/stages", {"name": "reuses A's stage id", "id": sid})
    s4 = a.call("POST", f"/pipelines/{pb['id']}/stages", {"name": "unknown key", "totallyMadeUp": 1})
    gb = a.call("GET", f"/pipelines/{pb['id']}")
    reused = any(x["id"] == sid for x in gb.json()["stages"])
    rec("K23", "POST /pipelines/{id}/stages accepts a client-supplied id (every other unknown key is rejected) and the id can be reused by another pipeline",
        "server-generated ids only, or ids unique across the project", [s1, s2, s3, s4, gb], "BUG" if (s1.status == 201 and reused) else "OK",
        f"client id accepted: {s1.status}; duplicate in same pipeline: {s2.status}; pipeline B stage re-uses pipeline A's stage id: {s3.status} "
        f"(read-back shows reused={reused}); unknown key rejected elsewhere: {s4.status}")

    # K24: custom property DELETE archives; re-create revives the SAME row, can change its type; values hidden
    key = "e_type_swap"
    p = a.call("POST", "/contacts/custom-properties", {"key": key, "label": "Type swap", "type": "text"})
    c = a.make("contacts", {"firstName": "E TypeSwap", "customProperties": {key: "important value"}})
    g0 = a.call("GET", f"/contacts/{c['id']}")
    pt = a.call("PATCH", f"/contacts/custom-properties/{p.json()['id']}", {"type": "number"})
    dl = a.call("DELETE", f"/contacts/custom-properties/{p.json()['id']}")
    g1 = a.call("GET", f"/contacts/{c['id']}")
    p2 = a.call("POST", "/contacts/custom-properties", {"key": key, "label": "Type swap", "type": "number"})
    g2 = a.call("GET", f"/contacts/{c['id']}")
    rec("K24", "DELETE of a custom property only archives it; re-creating the key revives the same row and can change its type; values are hidden, not migrated or removed",
        "a documented hard delete, or a warning that values disappear", [p, g0, pt, dl, g1, p2, g2], "DESIGN-QUESTION",
        f"before: {g0.json()['customProperties']}; PATCH type -> {pt.status} ('{pt.detail()[:90]}...'); after DELETE (204) value shown: {g1.json()['customProperties']}; "
        f"re-created as number: same row id={p2.json().get('id') == p.json().get('id')} type={p2.json().get('type')}; contact now shows: {g2.json()['customProperties']}")
    a.call("DELETE", f"/contacts/custom-properties/{p2.json()['id']}", throttle=False)

    # K25: ETag / If-Match is supported
    c2 = a.make("contacts", {"firstName": "E Etag"})
    e0 = a.call("GET", f"/contacts/{c2['id']}")
    et = e0.headers.get("etag")
    u1 = a.call("PATCH", f"/contacts/{c2['id']}", {"lastName": "v1"}, headers={"If-Match": et})
    u2 = a.call("PATCH", f"/contacts/{c2['id']}", {"lastName": "stale"}, headers={"If-Match": et})
    u3 = a.call("PATCH", f"/contacts/{c2['id']}", {"lastName": "no-precondition"})
    rec("K25", "optimistic locking via ETag / If-Match", "stale If-Match refused", [e0, u1, u2, u3], "OK",
        f"GET ETag {et}; PATCH with current ETag -> {u1.status} (new ETag {u1.headers.get('etag')}); stale -> {u2.status} '{u2.detail()[:80]}'; "
        f"no If-Match -> {u3.status} (last write wins)")

    # K26: Idempotency-Key under 10 parallel requests
    before = a.count("contacts")
    res = list(cf.ThreadPoolExecutor(10).map(lambda i: a.call("POST", "/contacts", {"firstName": "E ConcIdem", "email": "e.conc.idem@example.com"},
                                                             headers={"Idempotency-Key": f"audit-e-conc-contact-{RUN}"}, throttle=False), range(10)))
    ids = {r.json()["id"] for r in res if r.status == 201}
    for i in ids:
        a.track("contacts", i)
    delta = a.count("contacts") - before
    rec("K26", "Idempotency-Key under 10 parallel requests (contacts)", "one row", res, "OK" if (len(ids) == 1 and delta == 1) else "BUG",
        f"statuses {sorted(r.status for r in res)}; distinct ids {len(ids)}; true row delta {delta}")

    # K27: a replay is not signalled; a different body under the same key is not rejected
    r1 = a.call("POST", "/pipelines", {"name": "E replay header", "stages": [{"name": "a"}]}, headers={"Idempotency-Key": f"audit-e-replay-{RUN}"})
    r2 = a.call("POST", "/pipelines", {"name": "E replay header", "stages": [{"name": "a"}]}, headers={"Idempotency-Key": f"audit-e-replay-{RUN}"})
    r3 = a.call("POST", "/pipelines", {"name": "E replay header DIFFERENT BODY", "stages": [{"name": "a"}]}, headers={"Idempotency-Key": f"audit-e-replay-{RUN}"})
    for r in (r1, r2, r3):
        if r.status == 201:
            a.track("pipelines", r.json()["id"])
    hdrs = [h for h in r2.headers if "idemp" in h.lower() or "replay" in h.lower()]
    same_id = r3.status == 201 and r1.status == 201 and r3.json().get("id") == r1.json().get("id")
    rec("K27", "an idempotent replay is not signalled, and a different body under the same key is not rejected",
        "a replay header; 409/422 for a different body under the same key", [r1, r2, r3],
        "BUG" if (not hdrs or r3.status in (200, 201)) else "OK",
        f"replay statuses {r1.status}/{r2.status}; replay/idempotency headers: {hdrs or 'none'}; same key + different body -> {r3.status} (returned the first record: {same_id})")

    # K28: a replayed key answers for a record that no longer exists
    kk = f"audit-e-deleted-replay-{RUN}"
    d1 = a.call("POST", "/companies", {"name": "E replay of a deleted record"}, headers={"Idempotency-Key": kk})
    dd = a.call("DELETE", f"/companies/{d1.json()['id']}")
    d2 = a.call("POST", "/companies", {"name": "E replay of a deleted record"}, headers={"Idempotency-Key": kk})
    g = a.call("GET", f"/companies/{d1.json()['id']}")
    rec("K28", "an idempotent replay returns a 'created' response for a record that has since been deleted",
        "a fresh create, or a clear error, once the original record is gone", [d1, dd, d2, g],
        "BUG" if (d2.status == 201 and g.status == 404) else "OK",
        f"first create {d1.status} id {d1.json().get('id')}; DELETE {dd.status}; same key again -> {d2.status} id {d2.json().get('id') if d2.status < 300 else ''}; GET that id -> {g.status}")
    (OUT / "known.json").write_text(json.dumps(k, indent=1, default=str), encoding="utf-8")
    a.cleanup()
    print("extra evidence recorded; requests", a.n)


if __name__ == "__main__":
    main()
