"""Cross-module integration checks (positive + negative). Run AFTER the matrix workers finish.
Output -> reports/audit/integration.json. Only rows created here are changed/deleted; messages use test mode.

    python audit/steps_integration.py"""
from __future__ import annotations

import json
import time

from core import OUT, Audit


def main():
    a = Audit(prefix="I")
    rows = []

    def wait_for(pred, seconds=240, every=15):
        """Automation runs in a batch about 2 minutes after the event; poll instead of guessing."""
        t = time.time()
        while time.time() - t < seconds:
            time.sleep(every)
            v = pred()
            if v:
                return int(time.time() - t), v
        return None, None

    def count_titled(title):
        return len([x for x in (a.list_all("activities") or []) if x["title"] == title])

    def add(area, case, expect, r, ok, note="", extra_rids=()):
        rows.append(dict(area=area, case=case, expect=expect, status=r.status if hasattr(r, "status") else r, rid=getattr(r, "rid", ""),
                         detail=(r.detail()[:140] if hasattr(r, "detail") else ""), verdict="PASS" if ok else "FAIL", note=note, rids=[getattr(r, "rid", "")] + list(extra_rids)))

    # ---------------------------------------------------------------- fixtures
    pl = a.make("pipelines", {"name": "INT pipeline", "stages": [{"name": "Lead"}, {"name": "Qualified"}, {"name": "Won"}]})
    co = a.make("companies", {"name": "INT Company"})
    ct = a.make("contacts", {"firstName": "Int", "lastName": "Contact", "email": "int.contact@example.com", "phone": "+61491570006", "companyId": co["id"],
                             "customProperties": {"lead_source": "Webinar", "employee_count": 25, "vip": True, "renewal_date": "2027-03-01"}})
    prod = a.make("catalog-products", {"name": "INT product", "priceEntries": [{"label": "Monthly", "amount": 5000, "currency": "AUD"}]})
    S = [s["id"] for s in pl["stages"]]

    # ---------------------------------------------------------------- I1 referential integrity
    d = a.make("deals", {"title": "INT deal", "pipelineId": pl["id"], "stageId": S[0], "contactId": ct["id"], "companyId": co["id"],
                         "lineItems": [{"catalogProductId": prod["id"], "quantity": 3, "unitAmount": 5000, "currency": "AUD"}]})
    g = a.call("GET", f"/deals/{d['id']}")
    j = g.json()
    add("referential", "deal exposes the linked contact and company", "contact and company objects present", g,
        bool(j.get("contact")) and bool(j.get("company")), f"contact={j.get('contact') and j['contact'].get('firstName')} company={j.get('company') and j['company'].get('name')}")
    add("line items", "deal amount is derived from line items (3 x 5000)", "amount.amount == 15000", g, (j.get("amount") or {}).get("amount") == 15000, f"amount={j.get('amount')}")
    c2 = a.call("GET", f"/contacts/{ct['id']}")
    add("referential", "contact shows its company name", "companyName == 'INT Company'", c2, c2.json().get("companyName") == "INT Company")
    r = a.call("DELETE", f"/contacts/{ct['id']}")
    add("referential", "delete a contact that a deal references", "409 (or the link is cleared and documented)", r, r.status == 409, "")
    r = a.call("DELETE", f"/companies/{co['id']}")
    add("referential", "delete a company that a deal and contact reference", "409", r, r.status == 409)
    r = a.call("DELETE", f"/catalog-products/{prod['id']}")
    add("line items", "delete a catalog product that a deal line item references", "409 or soft-archive with the line preserved", r, r.status in (409, 204), f"status {r.status}")
    after = a.call("GET", f"/deals/{d['id']}")
    add("line items", "deal line items survive the product delete attempt", "line item still present", after, bool(after.json().get("lineItems")))
    # price change must not rewrite history
    pp = a.call("PATCH", f"/catalog-products/{prod['id']}", {"priceEntries": [{"label": "Monthly", "amount": 9999, "currency": "AUD"}]})
    after2 = a.call("GET", f"/deals/{d['id']}")
    li = (after2.json().get("lineItems") or [{}])[0]
    add("line items", "changing the product price does not change an existing deal's line", "unitAmount stays 5000", after2, li.get("unitAmount") == 5000, f"patch {pp.status}; unitAmount={li.get('unitAmount')}", [pp.rid])
    r = a.call("POST", "/deals", {"title": "mixed ccy", "pipelineId": pl["id"], "stageId": S[0],
                                  "lineItems": [{"catalogProductId": prod["id"], "quantity": 1, "unitAmount": 100, "currency": "AUD"}, {"catalogProductId": prod["id"], "quantity": 1, "unitAmount": 100, "currency": "USD"}]})
    if r.status == 201:
        a.track("deals", r.json()["id"])
    add("line items", "line items in two currencies on one deal", "400 (single currency) or a documented multi-currency total", r, r.status == 400, f"status {r.status}; amount={r.json().get('amount') if r.status == 201 else ''}")
    r = a.call("POST", "/deals", {"title": "unknown product", "pipelineId": pl["id"], "stageId": S[0],
                                  "lineItems": [{"catalogProductId": "000000000000000000000000", "quantity": 1, "unitAmount": 100, "currency": "AUD"}]})
    add("line items", "line item for a product that does not exist", "404/400", r, r.status in (400, 404))
    r = a.call("POST", "/deals", {"title": "amount and lines", "pipelineId": pl["id"], "stageId": S[0], "amount": {"amount": 1, "currency": "AUD"},
                                  "lineItems": [{"catalogProductId": prod["id"], "quantity": 1, "unitAmount": 100, "currency": "AUD"}]})
    add("line items", "amount AND line items together", "400 (amount is derived)", r, r.status == 400, r.detail())

    # ---------------------------------------------------------------- I3 stages
    r = a.call("DELETE", f"/pipelines/{pl['id']}/stages/{S[0]}")
    add("pipeline", "delete a stage that holds an open deal", "409", r, r.status == 409)
    mv = a.call("POST", f"/deals/{d['id']}/move", {"stageId": S[1]})
    add("pipeline", "move the deal to the next stage", "200", mv, mv.status == 200)
    st = a.call("DELETE", f"/pipelines/{pl['id']}/stages/{S[0]}")
    add("pipeline", "delete the now-empty first stage", "200", st, st.status == 200)

    # ---------------------------------------------------------------- I5 automation
    rule = a.make("automation-rules", {"name": "INT won -> task", "trigger": {"eventType": "deal.won"},
                                       "action": {"type": "activity.create", "fields": {"type": "task", "title": "INT follow-up after win"}}})
    before_n = count_titled("INT follow-up after win")
    w = a.call("POST", f"/deals/{d['id']}/won", {})
    secs, n_after = wait_for(lambda: (count_titled("INT follow-up after win") - before_n) >= 1)
    add("automation", "winning a deal fires a deal.won rule that creates a task (polled up to 4 min)", "exactly one new task", w, secs is not None and count_titled("INT follow-up after win") - before_n == 1,
        f"task appeared after ~{secs}s (rules run in a batch; the page gives no hint of the delay)" if secs else "no task within 240 s")
    runs = a.call("GET", f"/automation-rules/{rule['id']}/runs", throttle=False)
    add("automation", "the firing is recorded as a run", "one run record for the rule", runs, runs.status == 200 and len(runs.json().get("data", [])) >= 1, f"runs={len(runs.json().get('data', [])) if runs.status == 200 else runs.status}")
    a.call("POST", f"/deals/{d['id']}/reopen", {}, throttle=False)
    dis = a.call("PATCH", f"/automation-rules/{rule['id']}", {"enabled": False})
    t0 = count_titled("INT follow-up after win")
    a.call("POST", f"/deals/{d['id']}/won", {}, throttle=False)
    time.sleep(170)           # longer than one batch interval (~135 s observed)
    t1 = count_titled("INT follow-up after win")
    add("automation", "a DISABLED rule does not fire (waited 170 s, longer than a batch)", "task count unchanged", dis, dis.status == 200 and t1 == t0, f"patch {dis.status}; tasks {t0} -> {t1}")
    r = a.call("POST", "/automation-rules", {"name": "bad trigger", "trigger": {"eventType": "deal.exploded"}, "action": {"type": "activity.create", "fields": {"type": "task", "title": "x"}}})
    add("automation", "rule with an event type that does not exist", "400 listing valid triggers", r, r.status == 400)
    r = a.call("POST", "/automation-rules", {"name": "dangling deal.move", "trigger": {"eventType": "contact.created"}, "action": {"type": "deal.move", "fields": {"dealId": "000000000000000000000000", "stageId": "000000000000000000000000"}}})
    if r.status == 201:
        a.track("automation-rules", r.json()["id"])
    add("automation", "rule whose action points at records that do not exist", "400 at save time", r, r.status == 400, f"status {r.status}: static ids are not validated" if r.status == 201 else "")
    # loop guard: strictly bounded. Rules run in ~2-minute batches, so growth is at most one generation per batch;
    # the rule is deleted after two batches and every stray row is removed.
    loop = a.call("POST", "/automation-rules", {"name": "INT loop guard probe", "trigger": {"eventType": "activity.created"},
                                                 "action": {"type": "activity.create", "fields": {"type": "note", "title": "INT loop note", "body": "loop"}}})
    if loop.status == 201:
        lid = loop.json()["id"]
        a.call("POST", "/activities", {"type": "note", "title": "INT loop seed", "body": "seed"})
        time.sleep(150)
        g1 = count_titled("INT loop note")
        time.sleep(150)
        g2 = count_titled("INT loop note")
        a.call("DELETE", f"/automation-rules/{lid}")
        add("automation", "rule triggered by activity.created that creates an activity (loop)", "growth stops (loop guard) - not one new note per batch", loop, g2 <= g1 and g2 <= 2,
            f"loop notes after ~2.5 min: {g1}; after ~5 min: {g2}; rule deleted after the second check")
        for x in a.list_all("activities") or []:
            if x["title"] in ("INT loop note", "INT loop seed"):
                a.track("activities", x["id"])
    for x in a.list_all("activities") or []:
        if x["title"] == "INT follow-up after win":
            a.track("activities", x["id"])

    # ---------------------------------------------------------------- I6 messaging (test mode)
    mct = a.make("contacts", {"firstName": "Msg", "lastName": "Ok", "email": "msg.ok@example.com", "phone": "+61491570007"}, mode="test")
    nomail = a.make("contacts", {"firstName": "Msg", "lastName": "NoEmail"}, mode="test")
    m1 = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "email", "subject": "INT hello", "body": "Hello from the audit"}, mode="test")
    add("messaging", "email to a contact with an address (test mode)", "202 queued", m1, m1.status == 202, f"status field={m1.json().get('status') if m1.status < 300 else ''}")
    time.sleep(3)
    mg = a.call("GET", f"/messages/{m1.json()['id']}", mode="test") if m1.status < 300 else None
    if mg is not None:
        add("messaging", "message progresses beyond 'queued' in test mode", "sent/delivered or a documented terminal state", mg, mg.status == 200 and mg.json().get("status") != "queued", f"status={mg.json().get('status') if mg.status == 200 else mg.status}")
    r = a.call("POST", "/messages", {"contactId": nomail["id"], "channel": "email", "body": "x"}, mode="test")
    add("messaging", "email to a contact with no address", "422/400", r, r.status in (400, 422), r.detail())
    r = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "sms", "body": "INT sms"}, mode="test")
    add("messaging", "sms to a contact with an E.164 number (test mode)", "202", r, r.status == 202, r.detail())
    r = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "email", "templateId": "000000000000000000000000"}, mode="test")
    add("messaging", "email with a template id that does not exist", "404/400", r, r.status in (400, 404), r.detail())
    r = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "email", "body": "x", "templateId": "000000000000000000000000"}, mode="test")
    add("messaging", "both templateId and body", "400 (exactly one)", r, r.status == 400, r.detail())
    r = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "email", "subject": "line1\r\nBcc: victim@example.com", "body": "x"}, mode="test")
    add("messaging", "CRLF header injection in the subject", "400 or stripped", r, r.status == 400 or (r.status == 202 and "\r" not in (r.json().get("subject") or "")), f"stored subject={r.json().get('subject')!r}" if r.status < 300 else "")
    r = a.call("POST", "/messages", {"contactId": mct["id"], "channel": "email", "body": "x" * 200000}, mode="test")
    add("messaging", "200,000-character email body", "400 with a documented limit", r, r.status == 400, f"status {r.status}: {r.detail()}")
    live = a.call("GET", "/messages?limit=100")
    add("messaging", "test-mode messages do not appear in the live environment", "0 of the test messages in live", live, not any(x.get("contactId") == mct["id"] for x in live.json()["data"]) if live.status == 200 else False)

    # ---------------------------------------------------------------- I7 reports versus ground truth
    deals = a.list_all("deals") or []
    stage_truth = {}
    for x in deals:
        if x["pipelineId"] == pl["id"]:
            stage_truth[x["stageId"]] = stage_truth.get(x["stageId"], 0) + 1
    rep = a.call("GET", f"/reports/deals.by_stage?pipeline_id={pl['id']}")
    got = {e["id"].replace("stage_", ""): e["count"] for e in rep.json()["data"] if e["count"]} if rep.status == 200 else {}
    add("reports", "deals.by_stage matches the deals list for a pipeline", "same counts per stage", rep, got == stage_truth, f"truth={stage_truth} report={got}")
    all_deals = deals
    owners = {}
    for x in all_deals:
        owners[x.get("ownerActorId") or "unassigned"] = owners.get(x.get("ownerActorId") or "unassigned", 0) + 1
    rep = a.call("GET", "/reports/deals.by_owner")
    got = {e["id"].replace("owner_", ""): e["count"] for e in rep.json()["data"]} if rep.status == 200 else {}
    add("reports", "deals.by_owner matches the deals list", "same counts per owner", rep, got == owners, f"truth={owners} report={got}")
    cts = a.list_all("contacts") or []
    stat = {}
    for x in cts:
        stat[x["status"]] = stat.get(x["status"], 0) + 1
    rep = a.call("GET", "/reports/contacts.by_status")
    got = {e["id"].replace("status_", ""): e["count"] for e in rep.json()["data"]} if rep.status == 200 else {}
    add("reports", "contacts.by_status matches the contacts list", "same counts per status", rep, got == stat, f"truth={stat} report={got}")
    won = [x for x in all_deals if x["status"] == "won"]
    rep = a.call("GET", "/reports/deals.won_lost?closed_at[gte]=2026-01-01T00:00:00Z&closed_at[lte]=2026-12-31T23:59:59Z")
    wl = {e["id"].replace("status_", ""): e["count"] for e in rep.json()["data"]} if rep.status == 200 else {}
    lost = [x for x in all_deals if x["status"] == "lost"]
    add("reports", "deals.won_lost matches won/lost deals closed in 2026", "same counts", rep, wl.get("won", 0) == len(won) and wl.get("lost", 0) == len(lost), f"truth won={len(won)} lost={len(lost)} report={wl}")

    # ---------------------------------------------------------------- I10 merge
    ma = a.make("contacts", {"firstName": "Merge", "lastName": "Target", "email": "merge.target@example.com"})
    mb = a.make("contacts", {"firstName": "Merge", "lastName": "Source", "phone": "+61491570008"})
    mc = a.make("contacts", {"firstName": "Merge", "lastName": "Conflict", "email": "merge.conflict@example.com"})
    md = a.make("deals", {"title": "deal of the source contact", "pipelineId": pl["id"], "stageId": S[1], "contactId": mb["id"]})
    r = a.call("POST", f"/contacts/{ma['id']}/merge", {"sourceId": ma["id"]})
    add("merge", "merge a contact into itself", "400 or 409", r, r.status in (400, 409), r.detail())
    r = a.call("POST", f"/contacts/{ma['id']}/merge", {"sourceId": "000000000000000000000000"})
    add("merge", "merge a source that does not exist", "404 (a missing referenced contact is 404 on POST /deals)", r, r.status == 404, f"status {r.status}: {r.detail()}")
    rc = a.call("POST", f"/contacts/{ma['id']}/merge", {"sourceId": mc["id"]})
    add("merge", "merge two contacts that each have a different email", "200 with a way to choose which email to keep", rc, rc.status == 200, f"status {rc.status}: {rc.detail()[:150]} (no request field exists to choose)")
    r = a.call("POST", f"/contacts/{ma['id']}/merge", {"sourceId": mb["id"]})
    add("merge", "merge source into target", "200", r, r.status == 200, r.detail())
    if r.status == 200:
        gs = a.call("GET", f"/contacts/{mb['id']}")
        gd = a.call("GET", f"/deals/{md['id']}")
        gt = a.call("GET", f"/contacts/{ma['id']}")
        add("merge", "source contact is gone or archived after the merge", "404 or archived", gs, gs.status == 404 or gs.json().get("status") == "archived", f"status {gs.status}")
        add("merge", "the source's deal now points at the target contact", "deal.contactId == target", gd, gd.json().get("contactId") == ma["id"], f"contactId={gd.json().get('contactId')}")
        add("merge", "target keeps/gains the source's phone number", "phone +61491570008 present", gt, gt.json().get("phone") == "+61491570008", f"phone={gt.json().get('phone')}")

    # ---------------------------------------------------------------- I11 audit trail completeness
    ev = a.call("GET", "/events?limit=100")
    types = collections.Counter(e["type"] for e in ev.json()["data"]) if ev.status == 200 else {}
    for want in ("pipeline.created", "company.created", "contact.created", "deal.created", "deal.won", "deal.stage_changed", "deal.reopened", "contact.merged", "automation.rule.created",
                 "automation.rule.deleted", "catalog_product.created", "activity.created", "message.queued", "contact.deleted"):
        rows.append(dict(area="audit trail", case=f"event '{want}' recorded in the last 100 events", expect="present", status=ev.status, rid=ev.rid, detail=str(types.get(want, 0)),
                         verdict="PASS" if types.get(want, 0) else "INFO", note="INFO = not in the last 100 events (the log is shared with other steps; check /events filters)", rids=[ev.rid]))
    out = json.dumps(dict(rows=rows), indent=1, default=str)
    (OUT / "integration.json").write_text(out, encoding="utf-8")
    a.cleanup()
    p = sum(1 for r in rows if r["verdict"] == "PASS")
    f = sum(1 for r in rows if r["verdict"] == "FAIL")
    print(f"integration: {len(rows)} checks, {p} pass, {f} fail, {len(rows) - p - f} info; requests {a.n}")
    for r in rows:
        if r["verdict"] == "FAIL":
            print("  FAIL:", r["area"], "|", r["case"], "|", r["status"], r["detail"][:90], "|", r["note"][:120])


import collections  # noqa: E402

if __name__ == "__main__":
    main()
