#!/usr/bin/env python3
"""Loads a realistic demo dataset through the public API so every module has data to exercise:
properties, close reasons, pipelines, catalog products, companies, contacts, deals (with line items),
activities and automation rules.

    python scripts/seed_demo_data.py            # seed (needs the env vars from .env.example)
    python scripts/seed_demo_data.py --wipe     # remove EVERYTHING in the target project (asks to confirm)

All e-mail addresses use example.com; company domains are proper business domains and phone numbers use Australia's fictional
0491 570 xxx range, so nothing here can reach a real person. Writes reports/seed-manifest.json (ids only)."""
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
import config  # noqa: E402
from crm_client import CrmClient  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
now = datetime.now(timezone.utc).replace(microsecond=0)
iso = lambda d: d.isoformat().replace("+00:00", "Z")  # noqa: E731

PROPERTIES = [("lead_source", "Lead source", "text"), ("employee_count", "Employee count", "number"),
              ("vip", "VIP customer", "boolean"), ("renewal_date", "Renewal date", "date")]
REASONS = [("price", "Price too high", "lost"), ("competitor", "Chose a competitor", "lost"),
           ("no_budget", "No budget this year", "lost"), ("no_response", "Stopped responding", "lost"),
           ("referral", "Won through referral", "won"), ("upsell", "Upsell to existing customer", "won"),
           ("fast_track", "Fast-tracked by champion", "won")]
PIPELINES = {"Enterprise Sales": ["Lead", "Qualified", "Proposal", "Negotiation"],
             "SMB Quick Sale": ["New", "Demo", "Decision"]}
PRODUCTS = [("CRM Starter (per seat / month)", "Up to 5 seats, email support", [("Monthly", 4900), ("Annual", 49000)]),
            ("CRM Pro (per seat / month)", "Automation, reports, API access", [("Monthly", 12900), ("Annual", 129000)]),
            ("CRM Enterprise (per seat / month)", "SSO, audit log, priority SLA", [("Monthly", 49900), ("Annual", 499000)]),
            ("Onboarding package", "Two-week guided setup", [("One-off", 250000)]),
            ("Premium support", "24/7 phone and chat", [("Monthly", 9900)]),
            ("Data migration", "Import and clean up to 50k records", [("One-off", 150000)])]
DOMAINS = {"Acme Industries Pty Ltd": "acmeindustries.com.au", "Northwind Logistics": "northwindlogistics.com.au",
           "Bluebird Dental Group": "bluebirddental.com.au", "Harbour City Foods": "harbourcityfoods.com.au",
           "Summit Fintech": "summitfintech.com.au", "Kiwi Builders Ltd": "kiwibuilders.co.nz"}
COMPANIES = ["Acme Industries Pty Ltd", "Northwind Logistics", "Bluebird Dental Group", "Harbour City Foods",
             "Summit Fintech", "Kiwi Builders Ltd"]
# first, last, email-local, company index, status, lead_source, employees, vip
CONTACTS = [("Priya", "Sharma", "priya.sharma", 0, "qualified", "Webinar", 420, True),
            ("Liam", "O'Connor", "liam.oconnor", 0, "lead", "Website form", 420, False),
            ("Mei", "Chen", "mei.chen", 1, "customer", "Referral", 85, True),
            ("Tomás", "García", "tomas.garcia", 1, "lead", "Trade show", 85, False),
            ("Aisha", "Khan", "aisha.khan", 2, "qualified", "Google Ads", 40, False),
            ("Noah", "Williams", "noah.williams", 2, "lead", "Cold outreach", 40, False),
            ("Sofia", "Rossi", "sofia.rossi", 3, "customer", "Referral", 210, True),
            ("Jack", "Nguyen", "jack.nguyen", 3, "qualified", "Webinar", 210, False),
            ("Olivia", "Brown", "olivia.brown", 4, "lead", "Website form", 130, False),
            ("Ethan", "Müller", "ethan.muller", 4, "qualified", "Conference", 130, True),
            ("Hana", "Tanaka", "hana.tanaka", 5, "customer", "Referral", 60, False),
            ("Lucas", "Fernandes", "lucas.fernandes", 5, "lead", "Google Ads", 60, False),
            ("Zoe", "Anderson", None, None, "lead", "Walk-in", None, False)]  # no company, no email: negative-path data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wipe", action="store_true")
    ap.add_argument("--yes", action="store_true", help="skip the confirmation prompt for --wipe")
    args = ap.parse_args()
    cfg = config.load()
    c = CrmClient(cfg)
    c.login()
    c.retry_posts = True  # seeding tolerates the rare duplicate better than a half-loaded project
    me = c.get("/auth/me").json()["id"]

    if args.wipe:
        if not args.yes and input(f"Delete ALL data in project {cfg.project_id}? type the project id to confirm: ").strip() != cfg.project_id:
            sys.exit("not confirmed")
        for res in ("automation-rules", "activities", "deals", "contacts", "companies", "catalog-products", "pipelines", "files"):
            for _ in range(30):
                items = c.get(f"/{res}?limit=100" + ("&include_archived=true" if res in ("pipelines", "catalog-products") else "")).json()["data"]
                if not items:
                    break
                for it in items:
                    c.delete(f"/{res}/{it['id']}")
        print("wiped")
        return

    m = {"properties": [], "pipelines": {}, "products": {}, "companies": [], "contacts": {}, "deals": [], "activities": [], "rules": []}
    for key, label, typ in PROPERTIES:
        if not any(p["key"] == key for p in c.get("/contacts/custom-properties?limit=100").json()["data"]):
            c.create("contacts/custom-properties", {"key": key, "label": label, "type": typ})
        m["properties"].append(key)
    c.put("/close-reasons", json={"reasons": [{"code": a, "label": b, "outcome": o} for a, b, o in REASONS]}).raise_for_status()
    for name, stages in PIPELINES.items():
        p = c.make_pipeline(name, stages)
        m["pipelines"][name] = {"id": p["id"], "stages": {s["name"]: s["id"] for s in p["stages"]}}
    for name, desc, prices in PRODUCTS:
        pr = c.create("catalog-products", {"name": name, "description": desc,
                                           "priceEntries": [{"label": l, "amount": a, "currency": "AUD"} for l, a in prices]})
        m["products"][name] = {"id": pr["id"], "price": prices[0][1]}
    cos = [c.create("companies", {"name": n, "domain": DOMAINS[n],
                                   "phone": f"+6149157{i:04d}"}) for i, n in enumerate(COMPANIES, start=1)]
    m["companies"] = [x["id"] for x in cos]
    for i, (fn, ln, local, ci, status, src, emp, vip) in enumerate(CONTACTS):
        body = {"firstName": fn, "lastName": ln, "status": status, "ownerActorId": me,
                "customProperties": {"lead_source": src, "vip": vip, "renewal_date": iso(now + timedelta(days=90 + i * 10))[:10]}}
        if emp is not None:
            body["customProperties"]["employee_count"] = emp
        if local:
            body["email"] = f"{local}@example.com"  # example.com is a public inbox: demo data only, test mode for any sending
            body["phone"] = f"+61491570{i + 100:03d}"
            body["companyId"] = cos[ci]["id"]
        ct = c.create("contacts", body)
        m["contacts"][f"{fn} {ln}"] = ct["id"]

    ent, smb = m["pipelines"]["Enterprise Sales"], m["pipelines"]["SMB Quick Sale"]
    P = m["products"]
    def li(name, qty): return {"catalogProductId": P[name]["id"], "quantity": qty, "unitAmount": P[name]["price"], "currency": "AUD"}
    def total(items): return sum(i["quantity"] * i["unitAmount"] for i in items)
    C = m["contacts"]
    DEALS = [  # title, pipeline, stage, contact, company idx, line items, outcome (None/won/lost), reason
        ("Acme - CRM Enterprise rollout", ent, "Negotiation", "Priya Sharma", 0, [li("CRM Enterprise (per seat / month)", 40), li("Onboarding package", 1)], None, None),
        ("Acme - Premium support add-on", ent, "Proposal", "Liam O'Connor", 0, [li("Premium support", 1)], None, None),
        ("Northwind - Pro licences", ent, "Qualified", "Mei Chen", 1, [li("CRM Pro (per seat / month)", 25)], "won", "referral"),
        ("Northwind - Data migration", ent, "Lead", "Tomás García", 1, [li("Data migration", 1)], None, None),
        ("Bluebird Dental - Starter pack", smb, "Demo", "Aisha Khan", 2, [li("CRM Starter (per seat / month)", 8)], None, None),
        ("Bluebird Dental - Onboarding", smb, "New", "Noah Williams", 2, [li("Onboarding package", 1)], "lost", "no_budget"),
        ("Harbour City Foods - Pro + support", ent, "Proposal", "Sofia Rossi", 3, [li("CRM Pro (per seat / month)", 60), li("Premium support", 1)], "won", "upsell"),
        ("Harbour City Foods - Migration", ent, "Qualified", "Jack Nguyen", 3, [li("Data migration", 1)], None, None),
        ("Summit Fintech - Enterprise pilot", ent, "Negotiation", "Ethan Müller", 4, [li("CRM Enterprise (per seat / month)", 15)], "lost", "competitor"),
        ("Summit Fintech - Starter trial", smb, "Decision", "Olivia Brown", 4, [li("CRM Starter (per seat / month)", 5)], None, None),
        ("Kiwi Builders - Pro rollout", smb, "Demo", "Hana Tanaka", 5, [li("CRM Pro (per seat / month)", 12)], "lost", "price"),
        ("Walk-in enquiry (no company)", smb, "New", "Zoe Anderson", None, [], None, None)]
    for title, pl, stage, contact, ci, items, outcome, reason in DEALS:
        body = {"title": title, "pipelineId": pl["id"], "stageId": pl["stages"][stage], "contactId": C[contact], "ownerActorId": me}
        if ci is not None:
            body["companyId"] = cos[ci]["id"]
        if items:
            body["lineItems"] = items  # the amount is derived from the line items; sending both is rejected
        d = c.create("deals", body)
        if outcome:
            r = c.post(f"/deals/{d['id']}/{outcome}", json={"reason": reason})
            assert r.status_code == 200, r.text[:200]
        m["deals"].append(d["id"])

    ACT = [{"type": "task", "title": "Send Acme the revised pricing", "dueAt": iso(now + timedelta(days=2)), "priority": "high"},
           {"type": "task", "title": "Chase Bluebird Dental for signed order form", "dueAt": iso(now - timedelta(days=1)), "priority": "normal"},
           {"type": "note", "title": "Discovery call summary: Northwind", "body": "Wants SSO and a staged migration. Budget approved for Q4."},
           {"type": "call", "title": "Intro call with Summit Fintech", "direction": "outbound", "outcome": "connected"},
           {"type": "call", "title": "Missed call from Harbour City Foods", "direction": "inbound", "outcome": "no_answer"},
           {"type": "meeting", "title": "Quarterly business review: Kiwi Builders", "startsAt": iso(now + timedelta(days=7)), "endsAt": iso(now + timedelta(days=7, hours=1))},
           {"type": "appointment", "title": "Product demo for Bluebird Dental", "startsAt": iso(now + timedelta(days=3)), "endsAt": iso(now + timedelta(days=3, minutes=45)), "timeZone": "Australia/Sydney"},
           {"type": "document", "title": "Acme master services agreement", "url": "https://acmeindustries.com.au/docs/acme-msa.pdf", "fileName": "acme-msa.pdf"}]
    m["activities"] = [c.create("activities", a)["id"] for a in ACT]

    RULES = [("Won deal: schedule onboarding task", "deal.won", {"type": "activity.create", "fields": {"type": "task", "title": "Schedule onboarding kickoff"}}),
             ("Lost deal: log follow-up", "deal.lost", {"type": "activity.create", "fields": {"type": "task", "title": "Review lost deal and plan win-back"}}),
             ("New contact: welcome note", "contact.created", {"type": "activity.create", "fields": {"type": "note", "title": "New contact created", "body": "Check lead source and assign an owner."}})]
    for name, ev, action in RULES:
        m["rules"].append(c.create("automation-rules", {"name": name, "trigger": {"eventType": ev}, "action": action})["id"])

    (ROOT / "reports").mkdir(exist_ok=True)
    (ROOT / "reports" / "seed-manifest.json").write_text(json.dumps(m, indent=2), encoding="utf-8")
    print({k: (len(v) if hasattr(v, "__len__") else v) for k, v in m.items()})


if __name__ == "__main__":
    main()
