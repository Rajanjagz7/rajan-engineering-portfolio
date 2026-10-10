#!/usr/bin/env python3
"""Load/volume testing: fills every long-text field on a sample of existing records with large,
realistic (non-garbage) content, and adds many activities per record, to see how list/detail views
and pagination behave with heavier-than-normal records. Does NOT create new contacts/companies —
it enriches a sample of what's already there, so names/emails stay the realistic ones already seeded.

    python scripts/seed_load_fields.py --project "Vercel" --sample 15
"""
from __future__ import annotations

import argparse
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api"))
import config  # noqa: E402
from crm_client import CrmClient  # noqa: E402

RUN = time.strftime("%H%M%S")

LONG_NOTE = (
    "Account history and context carried over from the previous CRM during migration. "
    "The account has been through three commercial cycles: an initial pilot with five seats, an "
    "expansion to the full sales team after the pilot's renewal, and a recent request to add the "
    "customer success team as read-only users. Procurement requires a signed data-processing addendum "
    "before any contract renewal, and the security team re-reviews our SOC 2 report annually in "
    "February. Primary technical contact prefers written summaries over calls and usually replies "
    "within one business day. Billing is consolidated at the parent company level; do not invoice the "
    "subsidiary directly. Historical discount: 12% multi-year, approved by finance in writing. "
) * 6  # ~1.1k chars repeated to ~6.5k chars — realistic prose, not random characters


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--sample", type=int, default=15, help="how many contacts/deals/companies to enrich")
    args = ap.parse_args()
    c = CrmClient(config.load())
    c.login()
    c.retry_posts = True
    proj = next(p for p in c.get("/workspaces/6abe37466194a264a524b64c/projects", params={"limit": 100}).json()["data"]
                if args.project in (p["id"], p["name"]))
    c.project_id = proj["id"]
    rnd = random.Random(f"load-{proj['id']}-{RUN}")
    print(f"== project {proj['name']} ({proj['id']}) ==")

    contacts = [x for x in c.get("/contacts?limit=100").json()["data"] if x.get("firstName") and not x.get("archivedAt")]
    deals = [d for d in c.get("/deals?limit=100").json()["data"] if d["status"] == "open"]
    companies = [x for x in c.get("/companies?limit=100").json()["data"] if not x.get("archivedAt")]

    made_notes = made_tasks = 0
    sample_contacts = rnd.sample(contacts, min(args.sample, len(contacts)))
    for ct in sample_contacts:
        # a long note attached to the contact
        r = c.post("/activities", json={"type": "note", "title": f"Account history for {ct['firstName']} {ct.get('lastName') or ''}".strip(),
                                         "body": LONG_NOTE, "attachments": [{"kind": "contact", "id": ct["id"]}]},
                    headers={"Idempotency-Key": f"load-{proj['id'][-4:]}-{RUN}-note-{ct['id']}"})
        if r.status_code == 201:
            made_notes += 1
        # 8-12 tasks on the same contact to stress the activity feed / My work list
        for i in range(rnd.randint(8, 12)):
            title = f"Follow-up #{i+1} with {ct['firstName']}: " + rnd.choice([
                "confirm the renewal date", "send updated pricing", "check the security questionnaire status",
                "review usage against plan limits", "schedule the quarterly business review",
                "confirm the billing contact details", "follow up on the open support ticket",
                "share the new feature rollout notes", "ask about expanding to another team",
                "verify the integration is still connected",
            ])
            rr = c.post("/activities", json={"type": "task", "title": title[:200], "priority": rnd.choice(["low", "normal", "high"]),
                                              "attachments": [{"kind": "contact", "id": ct["id"]}]},
                        headers={"Idempotency-Key": f"load-{proj['id'][-4:]}-{RUN}-task-{ct['id']}-{i}"})
            if rr.status_code == 201:
                made_tasks += 1

    made_deal_notes = 0
    sample_deals = rnd.sample(deals, min(args.sample, len(deals)))
    for d in sample_deals:
        r = c.post("/activities", json={"type": "note", "title": f"Deal background: {d['title']}", "body": LONG_NOTE,
                                         "attachments": [{"kind": "deal", "id": d["id"]}]},
                    headers={"Idempotency-Key": f"load-{proj['id'][-4:]}-{RUN}-dealnote-{d['id']}"})
        if r.status_code == 201:
            made_deal_notes += 1

    made_co_notes = 0
    sample_co = rnd.sample(companies, min(args.sample, len(companies)))
    for co in sample_co:
        r = c.post("/activities", json={"type": "note", "title": f"Company background: {co['name']}", "body": LONG_NOTE,
                                         "attachments": [{"kind": "company", "id": co["id"]}]},
                    headers={"Idempotency-Key": f"load-{proj['id'][-4:]}-{RUN}-conote-{co['id']}"})
        if r.status_code == 201:
            made_co_notes += 1

    print({"contacts_enriched": len(sample_contacts), "notes_on_contacts": made_notes, "tasks_added": made_tasks,
           "deal_notes": made_deal_notes, "company_notes": made_co_notes})


if __name__ == "__main__":
    main()
