"""The write-endpoint catalogue: baseline bodies, fields, kinds and enums (audit Step 1 inventory source).
Field facts here are what the live UI sends plus what validation messages revealed; limits are NOT assumed:
the matrix discovers them."""
from __future__ import annotations

from matrix import Field, Op

OID = "000000000000000000000000"
F = Field


import time as _time


def _u():
    """Pipeline names are unique project-wide now, so every fixture gets its own suffix."""
    _u.n = getattr(_u, "n", 0) + 1
    return f"{_time.strftime('%H%M%S')}-{_u.n}"


def pipeline_fixture(a):
    p = a.make("pipelines", {"name": f"AUD fixture pipeline {_u()}", "stages": [{"name": "Lead"}, {"name": "Qualified"}, {"name": "Won"}]})
    return {"pipeline": p, "pid": p["id"], "sid": p["stages"][0]["id"], "sid2": p["stages"][1]["id"]}


def deal_fixture(a):
    ctx = pipeline_fixture(a)
    ctx["contact"] = a.make("contacts", {"firstName": "Fixture", "lastName": "Contact", "email": "fixture.contact@example.com"})
    ctx["company"] = a.make("companies", {"name": "Fixture Company"})
    return ctx


def product_fixture(a):
    ctx = deal_fixture(a)
    ctx["product"] = a.make("catalog-products", {"name": "Fixture product", "priceEntries": [{"label": "Monthly", "amount": 1000, "currency": "AUD"}]})
    return ctx


def contact_target(a):
    return {"id": a.make("contacts", {"firstName": "Patch", "lastName": "Target", "email": "patch.target@example.com"})["id"]}


def company_target(a):
    return {"id": a.make("companies", {"name": "Patch target company"})["id"]}


def deal_target(a):
    ctx = deal_fixture(a)
    d = a.make("deals", {"title": "Patch target deal", "pipelineId": ctx["pid"], "stageId": ctx["sid"]})
    ctx["id"] = d["id"]
    return ctx


def product_target(a):
    return {"id": a.make("catalog-products", {"name": "Patch target product"})["id"]}


def pipeline_target(a):
    ctx = pipeline_fixture(a)
    ctx["id"] = ctx["pid"]
    return ctx


def message_fixture(a):
    return {"cid": a.make("contacts", {"firstName": "Msg", "lastName": "Target", "email": "msg.target@example.com"}, mode="test")["id"]}


def reasons_fixture(a):
    return {"orig": a.call("GET", "/close-reasons", throttle=False).json()["reasons"]}


def reasons_restore(a, ctx):
    a.call("PUT", "/close-reasons", {"reasons": ctx["orig"]}, tag="cleanup", throttle=False)


CONTACT_FIELDS = [
    F(("firstName",), "str", optional=False), F(("lastName",), "str"), F(("email",), "email"), F(("phone",), "phone"),
    F(("companyId",), "id"), F(("status",), "enum", enum=["lead", "qualified", "customer", "archived"]),
    F(("ownerActorId",), "id"), F(("customProperties",), "obj", readback=False),
    F(("customProperties", "lead_source"), "str"), F(("customProperties", "employee_count"), "num"),
    F(("customProperties", "vip"), "bool"), F(("customProperties", "renewal_date"), "date"),
]
CONTACT_BASE = lambda ctx: {"firstName": "Test", "lastName": "Case", "email": "t.case@example.com", "phone": "0412345678",
                            "status": "lead", "customProperties": {"lead_source": "Web", "employee_count": 10, "vip": False, "renewal_date": "2027-01-31"}}

COMPANY_FIELDS = [F(("name",), "str", optional=False), F(("domain",), "domain"), F(("phone",), "phone"),
                  F(("status",), "enum", enum=["active", "archived"]), F(("ownerActorId",), "id")]
COMPANY_BASE = lambda ctx: {"name": "Audit Co", "domain": "auditco.com.au", "phone": "0412345678", "status": "active"}


def activity_op(kind, base, fields):
    return Op(f"activities.create.{kind}", "POST", lambda c: "/activities", lambda c: dict(type=kind, **base), fields,
              collection="activities")


OPS: list[Op] = [
    Op("pipelines.create", "POST", lambda c: "/pipelines", lambda c: {"name": "Audit pipeline", "stages": [{"name": "Lead"}, {"name": "Won"}]},
       [F(("name",), "str", optional=False), F(("stages",), "array", optional=False, item=lambda i: {"name": f"S{i}"}),
        F(("stages", 0, "name"), "str", optional=False)], collection="pipelines"),
    Op("pipelines.patch", "PATCH", lambda c: f"/pipelines/{c['id']}", lambda c: {}, [F(("name",), "str", optional=False)],
       kind="patch", collection="pipelines", prereq=pipeline_target, target=lambda c: c["id"]),
    Op("pipelines.stages.add", "POST", lambda c: f"/pipelines/{c['pid']}/stages", lambda c: {"name": "Extra stage"},
       [F(("name",), "str", optional=False)], collection=None, prereq=pipeline_fixture,
       note="read-back for stages is done in the state-machine step"),
    Op("deals.create", "POST", lambda c: "/deals",
       lambda c: {"title": "Audit deal", "pipelineId": c["pid"], "stageId": c["sid"], "contactId": c["contact"]["id"],
                  "companyId": c["company"]["id"], "amount": {"amount": 1000, "currency": "AUD"}},
       [F(("title",), "str", optional=False), F(("pipelineId",), "id", optional=False), F(("stageId",), "id", optional=False),
        F(("contactId",), "id"), F(("companyId",), "id"), F(("ownerActorId",), "id"),
        F(("amount", "amount"), "int"), F(("amount", "currency"), "currency")], collection="deals", prereq=deal_fixture),
    Op("deals.create.lineItems", "POST", lambda c: "/deals",
       lambda c: {"title": "Audit deal with lines", "pipelineId": c["pid"], "stageId": c["sid"],
                  "lineItems": [{"catalogProductId": c["product"]["id"], "quantity": 2, "unitAmount": 1000, "currency": "AUD"}]},
       [F(("lineItems",), "array", item=lambda i: {"catalogProductId": "__PID__", "quantity": 1, "unitAmount": 100, "currency": "AUD"}, judge=False),
        F(("lineItems", 0, "catalogProductId"), "id"), F(("lineItems", 0, "quantity"), "qty"),
        F(("lineItems", 0, "unitAmount"), "int"), F(("lineItems", 0, "currency"), "currency")],
       collection="deals", prereq=product_fixture),
    Op("deals.patch", "PATCH", lambda c: f"/deals/{c['id']}", lambda c: {},
       [F(("title",), "str", optional=False), F(("contactId",), "id"), F(("companyId",), "id"), F(("ownerActorId",), "id")],
       kind="patch", collection="deals", prereq=deal_target, target=lambda c: c["id"]),
    Op("contacts.create", "POST", lambda c: "/contacts", CONTACT_BASE, CONTACT_FIELDS, collection="contacts"),
    Op("contacts.patch", "PATCH", lambda c: f"/contacts/{c['id']}", lambda c: {}, [x for x in CONTACT_FIELDS if x.path != ("firstName",)] + [F(("firstName",), "str", optional=False)],
       kind="patch", collection="contacts", prereq=contact_target, target=lambda c: c["id"]),
    Op("companies.create", "POST", lambda c: "/companies", COMPANY_BASE, COMPANY_FIELDS, collection="companies"),
    Op("companies.patch", "PATCH", lambda c: f"/companies/{c['id']}", lambda c: {}, COMPANY_FIELDS,
       kind="patch", collection="companies", prereq=company_target, target=lambda c: c["id"]),
    Op("contact-properties.create", "POST", lambda c: "/contacts/custom-properties", lambda c: {"key": "audit_u", "label": "Audit prop", "type": "text"},
       [F(("key",), "key", optional=False), F(("label",), "str", optional=False),
        F(("type",), "enum", optional=False, enum=["text", "number", "boolean", "date"])],
       collection="contacts/custom-properties", skip_count=True,
       after_create=lambda a, i: a.call("DELETE", f"/contacts/custom-properties/{i}", tag="cleanup", throttle=False),
       note="DELETE only archives, and re-creating a key revives the same row, so every accepted row is deleted at once and the key is reused"),
    Op("catalog-products.create", "POST", lambda c: "/catalog-products",
       lambda c: {"name": "Audit product", "description": "A description", "priceEntries": [{"label": "Monthly", "amount": 4900, "currency": "AUD"}]},
       [F(("name",), "str", optional=False), F(("description",), "text"),
        F(("priceEntries",), "array", item=lambda i: {"label": f"P{i}", "amount": 100, "currency": "AUD"}),
        F(("priceEntries", 0, "label"), "str", optional=False), F(("priceEntries", 0, "amount"), "int", optional=False),
        F(("priceEntries", 0, "currency"), "currency", optional=False)], collection="catalog-products"),
    Op("catalog-products.patch", "PATCH", lambda c: f"/catalog-products/{c['id']}", lambda c: {},
       [F(("name",), "str", optional=False), F(("description",), "text")], kind="patch", collection="catalog-products",
       prereq=product_target, target=lambda c: c["id"]),
    Op("automation-rules.create", "POST", lambda c: "/automation-rules",
       lambda c: {"name": "Audit rule", "trigger": {"eventType": "deal.won"},
                  "action": {"type": "activity.create", "fields": {"type": "task", "title": "Audit task"}}},
       [F(("name",), "str", optional=False),
        F(("trigger", "eventType"), "enum", optional=False, enum=["deal.won", "deal.lost", "contact.created", "deal.created", "message.sent"]),
        F(("action", "type"), "enum", optional=False, enum=["activity.create", "contact.update", "deal.move", "message.queue"], judge=False),
        F(("action", "fields", "type"), "enum", optional=False, enum=["task", "note", "appointment", "document"], judge=False),
        F(("action", "fields", "title"), "str", optional=False),
        F(("conditions",), "array", item=lambda i: {"field": "amount", "operator": "gt", "value": i}, judge=False)],
       collection="automation-rules"),
    activity_op("task", {"title": "Audit task", "dueAt": "2026-12-01T09:00:00Z", "priority": "normal"},
                [F(("title",), "str", optional=False), F(("description",), "text"), F(("dueAt",), "datetime"),
                 F(("priority",), "enum", enum=["low", "normal", "high"], judge=False)]),
    activity_op("note", {"title": "Audit note", "body": "Body text"},
                [F(("title",), "str", optional=False), F(("body",), "text", optional=False)]),
    activity_op("call", {"title": "Audit call", "direction": "outbound", "outcome": "connected"},
                [F(("title",), "str", optional=False), F(("direction",), "enum", optional=False, enum=["inbound", "outbound"]),
                 F(("outcome",), "enum", optional=False, enum=["connected", "no_answer", "voicemail", "busy"])]),
    activity_op("meeting", {"title": "Audit meeting", "startsAt": "2026-12-01T09:00:00Z", "endsAt": "2026-12-01T10:00:00Z"},
                [F(("title",), "str", optional=False), F(("startsAt",), "datetime", optional=False, judge=False),
                 F(("endsAt",), "datetime", optional=False, judge=False)]),
    activity_op("appointment", {"title": "Audit appt", "startsAt": "2026-12-01T09:00:00+11:00", "endsAt": "2026-12-01T10:00:00+11:00", "timeZone": "Australia/Sydney"},
                [F(("title",), "str", optional=False), F(("startsAt",), "datetime", optional=False, judge=False),
                 F(("endsAt",), "datetime", optional=False, judge=False), F(("timeZone",), "tz", optional=False)]),
    activity_op("document", {"title": "Audit doc", "url": "https://acme.com.au/a.pdf", "fileName": "a.pdf"},
                [F(("title",), "str", optional=False), F(("url",), "url", optional=False), F(("fileName",), "str", optional=False)]),
    Op("messages.create", "POST", lambda c: "/messages", lambda c: {"contactId": c["cid"], "channel": "email", "subject": "Audit", "body": "Hello from the audit (test mode)"},
       [F(("contactId",), "id", optional=False), F(("channel",), "enum", optional=False, enum=["email", "sms"], judge=False),
        F(("subject",), "str"), F(("body",), "text", optional=False)],
       collection="messages", prereq=message_fixture, mode="test", note="test environment mode only; example.com addresses"),
    Op("close-reasons.put", "PUT", lambda c: "/close-reasons", lambda c: {"reasons": [{"code": "price", "label": "Price", "outcome": "lost"}]},
       [F(("reasons",), "array", optional=False, item=lambda i: {"code": f"c{i}", "label": f"L{i}", "outcome": "lost"}, judge=False),
        F(("reasons", 0, "code"), "key", optional=False, judge=False), F(("reasons", 0, "label"), "str", optional=False),
        F(("reasons", 0, "outcome"), "enum", optional=False, enum=["won", "lost"])],
       kind="put", collection=None, prereq=reasons_fixture, post=reasons_restore),
    Op("files.create", "POST", lambda c: "/files", lambda c: {"fileName": "audit.csv", "contentType": "text/csv", "byteSize": 10},
       [F(("fileName",), "str", optional=False),
        F(("contentType",), "enum", optional=False, judge=False,
          enum=["text/csv", "text/plain", "application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"]),
        F(("byteSize",), "int", optional=False, judge=False)], collection="files"),
]
