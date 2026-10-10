#!/usr/bin/env python3
"""Adds realistic tasks, notes and calls ATTACHED to real contacts, deals and companies (they then show on those records'
activity feeds and on the My work page).   python scripts/seed_tasks.py --project "Vercel"   (name or id)"""
import argparse
import json
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
import config  # noqa: E402
from crm_client import CrmClient  # noqa: E402

now = datetime.now(timezone.utc).replace(microsecond=0, second=0, minute=0)
iso = lambda d: d.isoformat().replace("+00:00", "Z")  # noqa: E731
RUN = time.strftime("%H%M%S")

CONTACT_TASKS = ["Send {name} the revised pricing", "Call {name} about the renewal", "Book a product demo with {name}", "Send {name} the security questionnaire answers",
                 "Follow up with {name} on the trial feedback", "Confirm {name}'s onboarding dates", "Send {name} a case study from their industry", "Check {name} received the invoice",
                 "Introduce {name} to customer success", "Ask {name} for a referral"]
DEAL_TASKS = ["Send the contract for signature: {t}", "Get legal sign-off on terms: {t}", "Prepare the proposal deck: {t}", "Confirm the budget owner: {t}", "Schedule the kickoff call: {t}",
              "Review the discount request: {t}", "Collect the purchase order: {t}"]
COMPANY_TASKS = ["Prepare the quarterly business review for {n}", "Update the account plan for {n}", "Review usage and upsell options for {n}", "Renewal health check for {n}"]
NOTES = ["Spoke with the finance contact; invoices need a PO number on every line.", "Asked about single sign-on; sending the SSO setup guide.", "Happy with the trial, wants to add two more users before signing.",
         "Procurement needs the vendor security form completed first.", "Wants a staged rollout starting with the sales team."]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--count", type=int, default=36)
    args = ap.parse_args()
    c = CrmClient(config.load())
    c.login()
    c.retry_posts = True
    proj = next(p for p in c.get("/workspaces/6abe37466194a264a524b64c/projects", params={"limit": 100}).json()["data"] if args.project in (p["id"], p["name"]))
    c.project_id = proj["id"]
    me = c.get("/auth/me").json()["id"]
    rnd = random.Random(f"tasks-{proj['id']}-{RUN}")
    contacts = [x for x in c.get("/contacts?limit=100").json()["data"] if x.get("firstName")]
    deals = [d for d in c.get("/deals?limit=100").json()["data"] if d["status"] == "open"]
    companies = c.get("/companies?limit=100").json()["data"]
    seq = [0]

    def make(body):
        seq[0] += 1
        r = c.post("/activities", json=body, headers={"Idempotency-Key": f"tasks-{proj['id'][-4:]}-{RUN}-{seq[0]}"})
        if r.status_code != 201:
            raise RuntimeError(f"{r.status_code} {r.text[:200]} {json.dumps(body)[:160]}")
        return r.json()

    made = {"task": 0, "note": 0, "call": 0, "completed": 0}
    for i in range(args.count):
        kind = rnd.choice(["contact", "contact", "deal", "deal", "company"])
        if kind == "contact":
            ct = rnd.choice(contacts)
            title, att = rnd.choice(CONTACT_TASKS).format(name=ct["firstName"]), [{"kind": "contact", "id": ct["id"]}]
        elif kind == "deal":
            d = rnd.choice(deals)
            title, att = rnd.choice(DEAL_TASKS).format(t=d["title"]), [{"kind": "deal", "id": d["id"]}]
            if d.get("contactId") and rnd.random() > 0.5:
                att.append({"kind": "contact", "id": d["contactId"]})
        else:
            co = rnd.choice(companies)
            title, att = rnd.choice(COMPANY_TASKS).format(n=co["name"]), [{"kind": "company", "id": co["id"]}]
        days = rnd.choice([-8, -4, -2, -1, 0, 0, 1, 2, 3, 6, 10, 21])
        body = {"type": "task", "title": title[:200], "priority": rnd.choice(["low", "normal", "normal", "high", "high"]), "dueAt": iso(now + timedelta(days=days, hours=rnd.randint(1, 9))),
                "assigneeActorId": me, "attachments": att, "description": rnd.choice(NOTES)}
        a = make(body)
        made["task"] += 1
        if rnd.random() < 0.3:
            c.post(f"/activities/{a['id']}/complete", json={})
            made["completed"] += 1
        if i % 5 == 0:
            ct = rnd.choice(contacts)
            make({"type": "note", "title": f"Notes from the call with {ct['firstName']} {ct.get('lastName') or ''}".strip(), "body": rnd.choice(NOTES), "attachments": [{"kind": "contact", "id": ct["id"]}]})
            made["note"] += 1
        if i % 7 == 0:
            ct = rnd.choice(contacts)
            make({"type": "call", "title": f"Intro call with {ct['firstName']}", "direction": rnd.choice(["inbound", "outbound"]), "outcome": rnd.choice(["connected", "connected", "no_answer", "voicemail"]),
                  "attachments": [{"kind": "contact", "id": ct["id"]}]})
            made["call"] += 1
    print(json.dumps({"project": proj["name"], **made}))


if __name__ == "__main__":
    main()
