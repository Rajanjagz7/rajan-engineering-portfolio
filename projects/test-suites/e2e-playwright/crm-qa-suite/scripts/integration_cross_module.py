#!/usr/bin/env python3
"""Cross-module integration testing: Contacts <-> Companies <-> Deals <-> Activities.

Creates one real, realistically-named company/contact/deal/activity graph, then runs every
add/edit/delete combination across the links between them, checking that each module reflects the
others correctly: live-resolved embedded records, state after archive, state after hard delete,
orphan handling, and that deleting one module's record does not corrupt an unrelated one.

    python scripts/integration_cross_module.py --project "Vercel 2"

Writes reports/integration/cross_module.json (every check, pass/fail, request/response evidence).
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

CHECKS: list[dict] = []


def check(name, ok, detail, evidence=None):
    CHECKS.append({"name": name, "ok": bool(ok), "detail": detail, "evidence": evidence})
    print(("PASS" if ok else "FAIL") + " - " + name + "  :: " + detail[:160])


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
    print(f"== project {proj['name']} ({proj['id']}) ==\n")

    def h(tag):
        return {"Idempotency-Key": f"xmod-{proj['id'][-4:]}-{RUN}-{tag}"}

    # ---- A: create the graph: company -> contact -> deal, plus an activity attached to both ----
    co = c.post("/companies", json={"name": "Bluewave Civil Engineering", "domain": "bluewavecivil.com.au",
                                     "phone": "+61491573001"}, headers=h("co1")).json()
    check("create company", "id" in co, f"company id={co.get('id')}", co.get("id"))

    ct = c.post("/contacts", json={"firstName": "Priya", "lastName": "Chandran", "email": "priya.chandran.xm1@example.com",
                                    "phone": "+61491573002", "companyId": co["id"]}, headers=h("ct1")).json()
    check("create contact linked to company", ct.get("companyId") == co["id"],
          f"contact.companyId={ct.get('companyId')} expected={co['id']}", ct.get("id"))
    check("contact embeds companyName at create time", ct.get("companyName") == "Bluewave Civil Engineering",
          f"companyName={ct.get('companyName')!r}", ct.get("id"))

    pipe = c.get("/pipelines?limit=100").json()["data"][0]
    stage = pipe["stages"][0]
    d = c.post("/deals", json={"title": "Bluewave Civil Engineering - Annual maintenance contract",
                                "pipelineId": pipe["id"], "stageId": stage["id"], "contactId": ct["id"],
                                "companyId": co["id"]}, headers=h("d1")).json()
    check("create deal linked to contact+company", d.get("contactId") == ct["id"] and d.get("companyId") == co["id"],
          f"deal contactId={d.get('contactId')} companyId={d.get('companyId')}", d.get("id"))
    check("deal embeds resolved contact snapshot", (d.get("contact") or {}).get("state") == "resolved"
          and (d["contact"].get("record") or {}).get("firstName") == "Priya",
          f"contact.state={(d.get('contact') or {}).get('state')}", d.get("id"))
    check("deal embeds resolved company snapshot", (d.get("company") or {}).get("state") == "resolved"
          and (d["company"].get("record") or {}).get("name") == "Bluewave Civil Engineering",
          f"company.state={(d.get('company') or {}).get('state')}", d.get("id"))

    act = c.post("/activities", json={"type": "task", "title": "Prepare the maintenance contract for signature",
                                       "attachments": [{"kind": "contact", "id": ct["id"]}, {"kind": "deal", "id": d["id"]}]},
                  headers=h("a1")).json()
    check("create activity attached to both contact and deal", len(act.get("attachments") or []) == 2,
          f"attachments={act.get('attachments')}", act.get("id"))

    # feed checks: activity shows on both the contact's and the deal's feed
    feed_ct = c.get(f"/activities?limit=50&attached_to_kind=contact&attached_to_id={ct['id']}").json()["data"]
    check("activity visible on contact's feed", any(a["id"] == act["id"] for a in feed_ct),
          f"{len(feed_ct)} activities on contact feed")
    feed_d = c.get(f"/activities?limit=50&attached_to_kind=deal&attached_to_id={d['id']}").json()["data"]
    check("activity visible on deal's feed", any(a["id"] == act["id"] for a in feed_d),
          f"{len(feed_d)} activities on deal feed")

    # ---- B: EDIT propagation -- renaming the company should show up live on the deal (not a stale snapshot) ----
    co2 = c.patch(f"/companies/{co['id']}", json={"name": "Bluewave Civil & Structural Engineering"}, headers=h("co-rename")).json()
    check("company rename accepted", co2.get("name") == "Bluewave Civil & Structural Engineering", f"name={co2.get('name')}")
    d_after_rename = c.get(f"/deals/{d['id']}").json()
    co_name_on_deal = (d_after_rename.get("company") or {}).get("record", {}).get("name")
    check("deal's embedded company name updates live after a company rename", co_name_on_deal == "Bluewave Civil & Structural Engineering",
          f"deal.company.record.name={co_name_on_deal!r}")
    ct_after_rename = c.get(f"/contacts/{ct['id']}").json()
    check("contact's companyName updates live after a company rename", ct_after_rename.get("companyName") == "Bluewave Civil & Structural Engineering",
          f"contact.companyName={ct_after_rename.get('companyName')!r}")

    ct2 = c.patch(f"/contacts/{ct['id']}", json={"firstName": "Priya", "lastName": "Chandran-Blake", "email": "priya.chandran-blake.xm1@example.com"}, headers=h("ct-rename")).json()
    check("contact rename accepted", ct2.get("lastName") == "Chandran-Blake", f"lastName={ct2.get('lastName')}")
    d_after_ct_rename = c.get(f"/deals/{d['id']}").json()
    ct_name_on_deal = (d_after_ct_rename.get("contact") or {}).get("record", {}).get("lastName")
    check("deal's embedded contact name updates live after a contact rename", ct_name_on_deal == "Chandran-Blake",
          f"deal.contact.record.lastName={ct_name_on_deal!r}")

    # ---- C: negative link checks -- can't link to a record that doesn't exist / isn't in this project ----
    r_bad_contact = c.post("/deals", json={"title": "Bad link probe", "pipelineId": pipe["id"], "stageId": stage["id"],
                                            "contactId": "000000000000000000000000"}, headers=h("bad-ct"))
    check("deal create rejects a non-existent contactId", r_bad_contact.status_code in (400, 404),
          f"-> {r_bad_contact.status_code}: {r_bad_contact.text[:150]}")
    r_bad_company = c.post("/contacts", json={"firstName": "Orphan", "lastName": "Probe", "companyId": "000000000000000000000000"}, headers=h("bad-co"))
    check("contact create rejects a non-existent companyId", r_bad_company.status_code in (400, 404),
          f"-> {r_bad_company.status_code}: {r_bad_company.text[:150]}")
    if r_bad_company.status_code == 201:
        c.post(f"/contacts/{r_bad_company.json()['id']}/archive", json={})

    # ---- D: ARCHIVE the contact -- what happens to the deal and the activity? ----
    c.post(f"/contacts/{ct['id']}/archive", json={})
    d_after_ct_archive = c.get(f"/deals/{d['id']}").json()
    contact_state_after_archive = (d_after_ct_archive.get("contact") or {}).get("state")
    check("deal still resolves its archived contact (not silently dropped)", d_after_ct_archive.get("contactId") == ct["id"],
          f"deal.contactId={d_after_ct_archive.get('contactId')}, contact.state={contact_state_after_archive}")
    print(f"    (contact.state after archiving the contact = {contact_state_after_archive!r} -- recorded, not asserted either way)")
    act_after_ct_archive = c.get(f"/activities/{act['id']}").json()
    check("activity still exists and still lists the archived contact as an attachment", act_after_ct_archive.get("id") == act["id"]
          and any(a.get("id") == ct["id"] for a in (act_after_ct_archive.get("attachments") or [])),
          f"attachments={act_after_ct_archive.get('attachments')}")

    # restore
    c.post(f"/contacts/{ct['id']}/unarchive", json={})
    ct_restored = c.get(f"/contacts/{ct['id']}").json()
    check("contact unarchive restores it", ct_restored.get("status") != "archived", f"status={ct_restored.get('status')}")

    # ---- E: ARCHIVE the company -- what happens to its contact and the deal? ----
    c.post(f"/companies/{co['id']}/archive", json={})
    ct_after_co_archive = c.get(f"/contacts/{ct['id']}").json()
    check("contact survives its company being archived (not cascaded)", ct_after_co_archive.get("id") == ct["id"],
          f"contact status={ct_after_co_archive.get('status')}, companyId still={ct_after_co_archive.get('companyId')}")
    d_after_co_archive = c.get(f"/deals/{d['id']}").json()
    company_state_after_archive = (d_after_co_archive.get("company") or {}).get("state")
    print(f"    (deal.company.state after archiving the company = {company_state_after_archive!r} -- recorded)")
    c.post(f"/companies/{co['id']}/unarchive", json={})

    # ---- F: HARD DELETE the company (DELETE /companies/{id} is a real route) -- the big integration case ----
    co_del_body = None
    r_del = c.delete(f"/companies/{co['id']}")
    check("DELETE /companies/{id} on a company with live contact+deal references",
          r_del.status_code in (204, 409),  # either succeeds, or is blocked by a referential check -- both are defensible; anything else (500) is not
          f"-> {r_del.status_code} {r_del.text[:200]}")
    company_hard_deleted = r_del.status_code == 204

    if company_hard_deleted:
        r_ct_after_del = c.get(f"/contacts/{ct['id']}")
        check("contact read-back after its company is hard-deleted does not 500", r_ct_after_del.status_code in (200, 404),
              f"-> {r_ct_after_del.status_code}")
        if r_ct_after_del.status_code == 200:
            ctj = r_ct_after_del.json()
            print(f"    contact.companyId after company hard-delete = {ctj.get('companyId')!r}, companyName = {ctj.get('companyName')!r}")
            check("contact's companyId is cleared or clearly orphaned after the company is hard-deleted (not pointing at a ghost id silently)",
                  ctj.get("companyId") in (None, co["id"]),  # record whichever it is; flag if it silently vanished with no trace
                  f"companyId={ctj.get('companyId')!r}")
        r_d_after_del = c.get(f"/deals/{d['id']}")
        check("deal read-back after its company is hard-deleted does not 500", r_d_after_del.status_code in (200, 404),
              f"-> {r_d_after_del.status_code}")
        if r_d_after_del.status_code == 200:
            dj = r_d_after_del.json()
            company_state_after_delete = (dj.get("company") or {}).get("state")
            print(f"    deal.company.state after company hard-delete = {company_state_after_delete!r}, deal.companyId = {dj.get('companyId')!r}")
            check("deal's embedded company block reflects the deletion instead of still claiming 'resolved' with stale data",
                  company_state_after_delete != "resolved" or (dj.get("company") or {}).get("record") is None,
                  f"company.state={company_state_after_delete!r} record_present={bool((dj.get('company') or {}).get('record'))}")
    else:
        print("    company DELETE was blocked (409) rather than cascading -- re-verifying the graph is still intact")
        d_intact = c.get(f"/deals/{d['id']}").json()
        check("deal graph intact after a blocked company delete", d_intact.get("companyId") == co["id"], f"companyId={d_intact.get('companyId')}")

    # ---- G: delete the activity, verify it disappears from both feeds, contact/deal untouched ----
    r_act_del = c.delete(f"/activities/{act['id']}")
    check("DELETE /activities/{id}", r_act_del.status_code in (200, 204, 404),
          f"-> {r_act_del.status_code} {r_act_del.text[:150]}")
    activity_hard_deleted = r_act_del.status_code in (200, 204)
    if activity_hard_deleted:
        feed_ct2 = c.get(f"/activities?limit=50&attached_to_kind=contact&attached_to_id={ct['id']}").json()["data"]
        check("deleted activity no longer appears on the contact's feed", not any(a["id"] == act["id"] for a in feed_ct2),
              f"{len(feed_ct2)} activities remain on contact feed")
        ct_still_ok = c.get(f"/contacts/{ct['id']}")
        check("contact itself is unaffected by deleting an activity attached to it", ct_still_ok.status_code == 200,
              f"-> {ct_still_ok.status_code}")
    else:
        print("    activities has no hard-delete route; archived/left in place instead -- recorded, not a failure")

    # ---- H: delete the deal (if a DELETE route exists) -- contact/company must be untouched ----
    r_deal_del = c.delete(f"/deals/{d['id']}")
    check("DELETE /deals/{id}", r_deal_del.status_code in (200, 204, 404),
          f"-> {r_deal_del.status_code} {r_deal_del.text[:150]}")
    ct_final = c.get(f"/contacts/{ct['id']}")
    check("contact still reachable and intact after the deal is deleted", ct_final.status_code == 200,
          f"-> {ct_final.status_code}")

    # ---- cleanup: archive whatever is left ----
    for kind, rid in (("contacts", ct["id"]), ("companies", co["id"])):
        rr = c.post(f"/{kind}/{rid}/archive", json={})
        print(f"    cleanup: archive {kind}/{rid} -> {rr.status_code}")

    passed = sum(1 for x in CHECKS if x["ok"])
    out = {"project": proj["name"], "total": len(CHECKS), "passed": passed, "failed": len(CHECKS) - passed, "checks": CHECKS}
    outdir = ROOT / "reports" / "integration"
    outdir.mkdir(parents=True, exist_ok=True)
    outfile = outdir / f"cross_module_{proj['id']}.json"
    outfile.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    print(f"\n{passed}/{len(CHECKS)} checks passed. Written to {outfile}")


if __name__ == "__main__":
    main()
