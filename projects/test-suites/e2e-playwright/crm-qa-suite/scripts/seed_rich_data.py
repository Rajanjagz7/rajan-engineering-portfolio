#!/usr/bin/env python3
"""Fills ONE project with a rich, realistic, deterministic data set that touches every module.

    python scripts/seed_rich_data.py --project "Vercel"        # by name or id
    python scripts/seed_rich_data.py --project "Vercel 2" --industry retail

Everything is created through the public API. Existing pipelines, products, properties and companies are kept and
skipped (names are unique or matched), so it can be run again on a project that already has data.
Email addresses use example.com (a PUBLIC inbox: demo text only). Company domains are proper business domains.
Phones use Australia's fictional 0491 570 xxx range. Outbox messages are real sends to those example addresses."""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
import config  # noqa: E402
import requests  # noqa: E402
from crm_client import CrmClient  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
now = datetime.now(timezone.utc).replace(microsecond=0, second=0)
RUN = time.strftime("%H%M%S")   # keys must be unique per run: a retry with a different body under an old key is (rightly) refused
iso = lambda d: d.isoformat().replace("+00:00", "Z")  # noqa: E731

FIRST = ["Olivia", "Noah", "Mia", "Jack", "Charlotte", "Liam", "Amelia", "Oliver", "Isla", "William", "Ava", "Lucas", "Grace", "Ethan", "Chloe", "Mason", "Ruby", "Henry",
         "Sophie", "Archie", "Priya", "Arjun", "Mei", "Wei", "Hana", "Kenji", "Aisha", "Omar", "Sofia", "Mateo", "Lucia", "Tomás", "Ingrid", "Lars", "Fatima", "Yusuf", "Zoe", "Max", "Ella", "Leo"]
LAST = ["Nguyen", "Smith", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson", "Thompson", "Walker", "Harris", "Lee", "Ryan", "Robinson", "Kelly", "King",
        "Chen", "Wang", "Sharma", "Patel", "Singh", "Khan", "Tanaka", "Kim", "Rossi", "García", "Müller", "Fernandes", "O'Connor", "McDonald", "Papadopoulos", "Nikolaidis", "Hassan", "Cohen", "Murphy", "Campbell", "Stewart", "Baker"]
SOURCES = ["Website form", "Webinar", "Referral", "Google Ads", "Trade show", "Cold outreach", "Conference", "LinkedIn", "Partner", "Walk-in"]
INDUSTRIES = {
    "software": (["Cloud", "Data", "Pixel", "Quantum", "Nimbus", "Vector", "Beacon", "Lattice", "Orbit", "Cobalt", "Tidal", "Ember", "Atlas", "Zenith", "Relay", "Prism", "Anchor", "Kinetic", "Lumen", "Helix", "Apex", "Mosaic", "Summit", "Harbour"],
                 ["Systems Pty Ltd", "Analytics", "Software Pty Ltd", "Labs", "Digital", "Networks", "Cyber Pty Ltd", "Platforms", "Consulting Group", "Technologies"]),
    "retail": (["Bondi", "Coogee", "Fitzroy", "Southbank", "Newtown", "Paddington", "Brighton", "Manly", "Cottesloe", "Kangaroo", "Eucalypt", "Wattle", "Banksia", "Boomerang", "Outback", "Coastal", "Gumtree", "Ironbark", "Jarrah", "Lyrebird", "Magpie", "Quokka", "Wombat", "Kookaburra"],
               ["Retail Group", "Hospitality Pty Ltd", "Builders", "Wholesale", "Cafés Pty Ltd", "Furniture", "Constructions", "Hardware", "Outfitters", "Trading Co"]),
    "mixed": (["Northwind", "Bluebird", "Harbour", "Summit", "Kiwi", "Acme", "Redgum", "Sunrise", "Pinnacle", "Evergreen", "Silverline", "Goldfield", "Riverbend", "Stonebridge", "Clearwater", "Highland", "Meridian", "Crossroads", "Bayside", "Windmill", "Fairview", "Lakeside", "Ridgeway", "Seabreeze"],
              ["Logistics", "Dental Group", "Foods", "Fintech", "Industries Pty Ltd", "Health Services", "Freight", "Medical Centre", "Finance", "Energy"]),
}
PRODUCTS = [("CRM Starter (per seat / month)", "Up to 5 seats, email support", [("Monthly", 4900), ("Annual", 49000)]), ("CRM Pro (per seat / month)", "Automation, reports, API access", [("Monthly", 12900), ("Annual", 129000)]),
            ("CRM Enterprise (per seat / month)", "SSO, audit log, priority SLA", [("Monthly", 49900), ("Annual", 499000)]), ("Onboarding package", "Two-week guided setup", [("One-off", 250000)]),
            ("Premium support", "24/7 phone and chat", [("Monthly", 9900)]), ("Data migration", "Import and clean up to 50k records", [("One-off", 150000)]),
            ("Training workshop (half day)", "On-site or remote, up to 12 people", [("One-off", 120000)]), ("API add-on", "Higher rate limits and webhooks", [("Monthly", 19900), ("Annual", 199000)]),
            ("Extra storage 100 GB", "File storage add-on", [("Monthly", 2900)]), ("Custom reporting pack", "Five tailored dashboards", [("One-off", 350000)]),
            ("SMS credits (1,000)", "Pre-paid text messages", [("One-off", 9000)]), ("Legacy Basic plan (retired)", "No longer sold", [("Monthly", 2900)])]
REASONS = [("price", "Price too high", "lost"), ("competitor", "Chose a competitor", "lost"), ("no_budget", "No budget this year", "lost"), ("no_response", "Stopped responding", "lost"),
           ("bad_timing", "Bad timing", "lost"), ("missing_feature", "Missing a feature", "lost"), ("referral", "Won through referral", "won"), ("upsell", "Upsell to existing customer", "won"),
           ("fast_track", "Fast-tracked by champion", "won"), ("best_fit", "Best fit for requirements", "won")]
PROPS = [("lead_source", "Lead source", "text"), ("employee_count", "Employee count", "number"), ("vip", "VIP customer", "boolean"), ("renewal_date", "Renewal date", "date"),
         ("industry", "Industry", "text"), ("preferred_contact", "Preferred contact method", "text")]
PIPES = {"Enterprise Sales": ["Lead", "Qualified", "Proposal", "Negotiation", "Contract"], "SMB Quick Sale": ["New", "Demo", "Trial", "Decision"], "Renewals and Upsell": ["Upcoming", "Contacted", "Quoted", "Renewed"]}
NOTE_BODIES = ["Discovery call: wants SSO and a staged migration. Budget approved for the next quarter.", "Sent the revised pricing. Waiting on legal to review the data-processing terms.",
               "Champion is on leave until the 20th; follow up with the finance contact in the meantime.", "Demo went well. Asked for a reference customer in the same industry.",
               "Competitor is offering 15% off. Needs a response before Friday.", "Customer asked for an invoice split by cost centre.", "Onboarding kickoff booked. Two admins to be trained.",
               "Renewal due in 60 days; usage is up 40% year on year, good upsell candidate."]
TASKS = ["Send revised pricing", "Chase signed order form", "Book onboarding kickoff", "Prepare QBR deck", "Review security questionnaire", "Call about renewal", "Send case study",
         "Update contact details", "Confirm training dates", "Follow up on trial feedback", "Send contract for signature", "Check invoice was paid"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, help="project name or id")
    ap.add_argument("--industry", choices=sorted(INDUSTRIES), default=None)
    ap.add_argument("--contacts", type=int, default=70)
    ap.add_argument("--deals", type=int, default=45)
    ap.add_argument("--no-messages", action="store_true", help="skip the real outbox sends")
    args = ap.parse_args()

    cfg = config.load()
    c = CrmClient(cfg)
    c.login()
    c.retry_posts = True
    projs = c.get("/workspaces/6abe37466194a264a524b64c/projects", params={"limit": 100}).json()["data"]
    proj = next(p for p in projs if args.project in (p["id"], p["name"]))
    c.project_id = proj["id"]
    industry = args.industry or {"Vercel": "software", "Vercel 2": "retail"}.get(proj["name"], "mixed")
    # include RUN (wall-clock) so re-running this on an already-seeded project draws a fresh sequence
    # instead of regenerating the exact same names (which would all collide with existing emails and
    # cause every "already exists" skip, as happened once before re-running on the same project).
    rnd = random.Random(f"seed-{proj['id']}-{industry}-{RUN}")
    me = c.get("/auth/me").json()["id"]
    tag = proj["id"][-4:]
    print(f"seeding project {proj['name']} ({proj['id']}) industry={industry}")
    seq = [0]

    def post(path, body, **kw):
        body = {k: v for k, v in body.items() if v is not None}   # optional fields must be omitted, not null
        seq[0] += 1
        r = c.post(path, json=body, headers={"Idempotency-Key": f"rich-{tag}-{RUN}-{seq[0]}"}, **kw)
        if r.status_code not in (200, 201, 202):
            raise RuntimeError(f"POST {path} -> {r.status_code}: {r.text[:240]}  body={json.dumps(body)[:200]}")
        return r.json()

    # ---- rules that fire on contact creation must not flood the data: pause them while seeding
    paused = []
    for r in c.get("/automation-rules?limit=100").json()["data"]:
        if r["enabled"] and not r["suspendedAt"]:
            c.patch(f"/automation-rules/{r['id']}", json={"enabled": False})
            paused.append(r["id"])

    # ---- properties and close reasons (per project)
    have = {p["key"] for p in c.get("/contacts/custom-properties?limit=100").json()["data"] if not p["archivedAt"]}
    for key, label, typ in PROPS:
        if key not in have:
            post("/contacts/custom-properties", {"key": key, "label": label, "type": typ})
    cur = c.get("/close-reasons").json()["reasons"]
    codes = {x["code"] for x in cur}
    c.put("/close-reasons", json={"reasons": cur + [{"code": a, "label": b, "outcome": o} for a, b, o in REASONS if a not in codes]}).raise_for_status()
    outcomes = {a: o for a, _, o in REASONS}

    # ---- pipelines
    pipes = {p["name"]: p for p in c.get("/pipelines?limit=100&include_archived=true").json()["data"]}
    for name, stages in PIPES.items():
        if name not in pipes:
            pipes[name] = post("/pipelines", {"name": name, "stages": [{"name": s} for s in stages]})
    if "Legacy 2024 pipeline" not in pipes:
        lp = post("/pipelines", {"name": "Legacy 2024 pipeline", "stages": [{"name": "Open"}, {"name": "Closed"}]})
        c.post(f"/pipelines/{lp['id']}/archive", json={})
    active = [p for n, p in pipes.items() if n in PIPES]

    # ---- products
    prods = {p["name"]: p for p in c.get("/catalog-products?limit=100&include_archived=true").json()["data"]}
    for name, desc, prices in PRODUCTS:
        if name not in prods:
            prods[name] = post("/catalog-products", {"name": name, "description": desc, "priceEntries": [{"label": l, "amount": a, "currency": "AUD"} for l, a in prices]})
    legacy = prods["Legacy Basic plan (retired)"]
    if not legacy.get("archivedAt"):
        r = c.post(f"/catalog-products/{legacy['id']}/archive", json={})
        print("  archive legacy product ->", r.status_code)
    sellable = [p for n, p in prods.items() if "retired" not in n]

    # ---- companies
    pre, suf = INDUSTRIES[industry]
    have_co = {x["name"]: x for x in c.get("/companies?limit=100").json()["data"]}
    names = []
    while len(names) < 24:
        n = f"{rnd.choice(pre)} {rnd.choice(suf)}"
        if n not in names:
            names.append(n)
    companies = []
    for i, n in enumerate(names):
        if n in have_co:
            companies.append(have_co[n])
            continue
        slug = "".join(ch for ch in n.lower().replace(" pty ltd", "").replace("é", "e") if ch.isalnum())
        tld = rnd.choice([".com.au", ".com.au", ".com", ".co.nz", ".net.au"])
        companies.append(post("/companies", {"name": n, "domain": slug + tld, "phone": f"+61491571{i:03d}", "ownerActorId": me if i % 4 else None}))
    for co in companies[-2:]:
        c.post(f"/companies/{co['id']}/archive", json={})
    live_co = companies[:-2]

    # ---- contacts
    existing_emails = {(x.get("email") or "").lower() for x in c.get("/contacts?limit=100").json()["data"]}
    people, used = [], set()
    n_new = args.contacts
    for i in range(n_new):
        for _ in range(40):
            fn, ln = rnd.choice(FIRST), rnd.choice(LAST)
            local = f"{fn}.{ln}".lower().replace("'", "").replace("á", "a").replace("ü", "u").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ã", "a")
            if local not in used:
                used.add(local)
                break
        co = rnd.choice(live_co) if rnd.random() > 0.08 else None
        roll = rnd.random()
        status = "lead" if roll < 0.46 else "qualified" if roll < 0.72 else "customer" if roll < 0.94 else "lead"
        body = {"firstName": fn, "lastName": ln, "status": status, "ownerActorId": me if rnd.random() > 0.15 else None,
                "customProperties": {"lead_source": rnd.choice(SOURCES), "industry": industry.title(), "preferred_contact": rnd.choice(["Email", "Phone", "SMS"]),
                                     "vip": rnd.random() < 0.15, "employee_count": rnd.choice([5, 12, 40, 85, 130, 210, 420, 1200]),
                                     "renewal_date": iso(now + timedelta(days=rnd.randint(20, 400)))[:10]}}
        if rnd.random() > 0.1:
            body["email"] = f"{local}@example.com"
        if rnd.random() > 0.12:
            body["phone"] = f"+61491570{(i * 7 + 100) % 900 + 100:03d}"
        if co:
            body["companyId"] = co["id"]
        if body.get("email") and body["email"] in existing_emails:
            continue
        ct = post("/contacts", body)
        people.append(ct)
        existing_emails.add((body.get("email") or "").lower())
    archive_n = min(6, max(len(people) - 10, 0))  # keep at least 10 live contacts even on a thin run
    for ct in people[len(people) - archive_n:]:
        c.post(f"/contacts/{ct['id']}/archive", json={})
    people = people[:len(people) - archive_n]
    if not people:
        raise RuntimeError(f"no new contacts were created (all {n_new} candidate emails already existed in this project) "
                            f"-- try a higher --contacts count or a different industry")
    emailed = [p for p in people if p.get("email")]

    # ---- deals (line items; won/lost with reasons)
    wr = [k for k, v in outcomes.items() if v == "won"]
    lr = [k for k, v in outcomes.items() if v == "lost"]
    deals = []
    for i in range(args.deals):
        pl = rnd.choice(active)
        st = rnd.choice(pl["stages"])
        ct = rnd.choice(people)
        co_id = ct.get("companyId") or (rnd.choice(live_co)["id"] if rnd.random() > 0.2 else None)
        co_name = next((x["name"] for x in live_co if x["id"] == co_id), ct["firstName"] + " " + ct["lastName"])
        items = []
        for _ in range(rnd.choice([0, 1, 1, 2, 3])):
            pr = rnd.choice(sellable)
            pe = pr["priceEntries"][0]
            items.append({"catalogProductId": pr["id"], "quantity": rnd.choice([1, 1, 2, 5, 10, 25]), "unitAmount": pe["amount"], "currency": "AUD"})
        body = {"title": f"{co_name.split(' Pty')[0]} - {rnd.choice(sellable)['name'].split(' (')[0]}", "pipelineId": pl["id"], "stageId": st["id"], "contactId": ct["id"],
                "ownerActorId": me if rnd.random() > 0.2 else None}
        if co_id:
            body["companyId"] = co_id
        if items:
            body["lineItems"] = items
        elif rnd.random() > 0.5:
            body["amount"] = {"amount": rnd.choice([150000, 480000, 1250000, 3000000]), "currency": "AUD"}
        d = post("/deals", body)
        roll = rnd.random()
        if roll < 0.2:
            c.post(f"/deals/{d['id']}/won", json={"reason": rnd.choice(wr)})
        elif roll < 0.38:
            c.post(f"/deals/{d['id']}/lost", json={"reason": rnd.choice(lr)})
        deals.append(d)

    # ---- activities of every type; some tasks completed, some overdue
    for i in range(48):
        kind = ["task", "task", "task", "note", "note", "call", "meeting", "appointment", "document"][i % 9]
        t = f"{rnd.choice(TASKS)}" if kind == "task" else None
        if kind == "task":
            days = rnd.choice([-6, -3, -1, 0, 1, 2, 5, 9, 14])
            body = {"type": "task", "title": t, "priority": rnd.choice(["low", "normal", "normal", "high"]), "dueAt": iso(now + timedelta(days=days, hours=rnd.randint(0, 8))),
                    "description": rnd.choice(NOTE_BODIES), "assigneeActorId": me if rnd.random() > 0.3 else None}
        elif kind == "note":
            body = {"type": "note", "title": rnd.choice(["Call summary", "Meeting notes", "Customer feedback", "Internal note", "Next steps"]) + f" ({rnd.choice(live_co)['name'].split(' ')[0]})", "body": rnd.choice(NOTE_BODIES)}
        elif kind == "call":
            body = {"type": "call", "title": f"Call with {rnd.choice(people)['firstName']} {rnd.choice(LAST)}", "direction": rnd.choice(["inbound", "outbound"]), "outcome": rnd.choice(["connected", "no_answer", "voicemail", "busy"])}
        elif kind == "meeting":
            s = now + timedelta(days=rnd.randint(-10, 20), hours=rnd.randint(0, 6))
            body = {"type": "meeting", "title": f"Quarterly review: {rnd.choice(live_co)['name']}", "startsAt": iso(s), "endsAt": iso(s + timedelta(hours=1))}
        elif kind == "appointment":
            s = now + timedelta(days=rnd.randint(1, 25), hours=rnd.randint(0, 6))
            body = {"type": "appointment", "title": f"Product demo for {rnd.choice(live_co)['name']}", "startsAt": iso(s), "endsAt": iso(s + timedelta(minutes=45)), "timeZone": rnd.choice(["Australia/Sydney", "Australia/Perth", "Australia/Brisbane"])}
        else:
            co = rnd.choice(live_co)
            body = {"type": "document", "title": f"{co['name'].split(' ')[0]} master services agreement", "url": f"https://{co['domain']}/docs/msa-{i}.pdf", "fileName": f"msa-{i}.pdf"}
        a = post("/activities", body)
        if kind == "task" and rnd.random() < 0.35:
            c.post(f"/activities/{a['id']}/complete", json={})

    # ---- files (real uploads), an import with some bad rows, exports
    def upload(name, ctype, data: bytes):
        f = post("/files", {"fileName": name, "contentType": ctype, "byteSize": len(data)})
        up = f["upload"]
        requests.request(up.get("method", "PUT"), up["url"], data=data, headers=up.get("headers") or {}, timeout=60).raise_for_status()
        c.post(f"/files/{f['id']}/complete", json={})
        return f["id"]
    upload("price-list-2026.csv", "text/csv", b"sku,name,price_aud\nCRM-S,Starter,49.00\nCRM-P,Pro,129.00\nCRM-E,Enterprise,499.00\n")
    upload("onboarding-checklist.txt", "text/plain", b"1. Kickoff call\n2. Import contacts\n3. Connect email\n4. Train admins\n5. Go live\n")
    upload("security-whitepaper.pdf", "application/pdf", b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")
    # an import file made of real-looking people (plus three rows that are invalid on purpose, so the import history shows failures)
    imp_names = [("Eleanor", "Whitfield"), ("Rohan", "Mehta"), ("Chiara", "Bianchi"), ("Darcy", "Maguire"), ("Imogen", "Prescott"), ("Hamid", "Rahimi"), ("Talia", "Goldberg"),
                 ("Callum", "Fraser"), ("Marisol", "Vega"), ("Declan", "Hartnett"), ("Anika", "Bergström"), ("Jun", "Takahashi"), ("Beatrix", "Lindqvist"), ("Kofi", "Mensah")]
    rows = ["firstName,lastName,email,phone"]
    for i, (fn, ln) in enumerate(imp_names):
        local = f"{fn}.{ln}".lower().replace("ö", "o")
        rows.append(f"{fn},{ln},{local}.{tag}@example.com,+61491572{i:03d}")
    rows += [",Whitaker,hannah.whitaker@example.com,+61491572900", "Marcus,Delaney,marcus.delaney-at-example.com,+61491572901", "Priyanka,Desai,priyanka.desai@example.com,call me"]
    imp_id = upload("contacts-import.csv", "text/csv", ("\n".join(rows) + "\n").encode())
    imp = post("/imports", {"resource": "contacts", "fileId": imp_id})
    for r in ("contacts", "companies", "deals"):
        post("/exports", {"resource": r})

    # ---- automation rules (restore the paused ones, add a set)
    for rid in paused:
        c.patch(f"/automation-rules/{rid}", json={"enabled": True})
    have_rules = {r["name"] for r in c.get("/automation-rules?limit=100").json()["data"]}
    RULES = [("Won deal: schedule onboarding", "deal.won", {"type": "activity.create", "fields": {"type": "task", "title": "Schedule onboarding kickoff"}}),
             ("Lost deal: plan win-back", "deal.lost", {"type": "activity.create", "fields": {"type": "task", "title": "Review lost deal and plan win-back"}}),
             ("New deal: qualification checklist", "deal.created", {"type": "activity.create", "fields": {"type": "note", "title": "Qualification checklist", "body": "Budget, authority, need, timing."}}),
             ("New contact: welcome note", "contact.created", {"type": "activity.create", "fields": {"type": "note", "title": "New contact created", "body": "Check lead source and assign an owner."}}),
             ("Draft: stage change alert (disabled)", "deal.stage_changed", {"type": "activity.create", "fields": {"type": "task", "title": "Stage changed: review"}})]
    for name, ev, act in RULES:
        if name in have_rules:
            continue
        r = post("/automation-rules", {"name": name, "trigger": {"eventType": ev}, "action": act})
        if "disabled" in name:
            c.patch(f"/automation-rules/{r['id']}", json={"enabled": False})

    # ---- outbox: a handful of real emails to the example demo addresses
    sent = 0
    if not args.no_messages:
        for ct in emailed[:6]:
            post("/messages", {"contactId": ct["id"], "channel": "email", "subject": f"Welcome to the CRM demo, {ct['firstName']}",
                               "body": "Hi, this is a demo message from the CRM staging environment. No action needed."})
            sent += 1

    summary = {k: len(c.get(f"/{k}?limit=100" + ("&include_archived=true" if k in ("pipelines", "catalog-products") else "")).json()["data"]) for k in
               ("pipelines", "catalog-products", "companies", "contacts", "deals", "activities", "automation-rules", "files", "messages")}
    print(json.dumps({"project": proj["name"], "created_this_run": {"contacts": len(people) + 6, "deals": len(deals), "messages": sent}, "now_in_project(first page max 100)": summary}, indent=1))
    (ROOT / "reports").mkdir(exist_ok=True)
    (ROOT / "reports" / f"seed-rich-{proj['name'].replace(' ', '-').lower()}.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
