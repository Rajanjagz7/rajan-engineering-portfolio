# Fixtures

Deterministic, re-runnable. Regenerate with `python scripts/gen_fixtures.py`; compare the CRC32 values below to detect drift.

- Generator seed (pinned for any generated token): `20261002`. This version uses no random values, so output is byte-identical every run.
- Length limits: discovered by the audit matrix for: activities.create.appointment.title, activities.create.call.title, activities.create.document.fileName, activities.create.document.title, activities.create.document.url, activities.create.meeting.title, activities.create.note.body, activities.create.note.title, activities.create.task.description, activities.create.task.title, automation-rules.create.action.fields.title, automation-rules.create.name, catalog-products.create.description, catalog-products.create.name, catalog-products.create.priceEntries, catalog-products.create.priceEntries.0.label, catalog-products.patch.description, catalog-products.patch.name, close-reasons.put.reasons, close-reasons.put.reasons.0.code, close-reasons.put.reasons.0.label, companies.create.domain, companies.create.name, companies.create.phone, companies.patch.domain, companies.patch.name, companies.patch.phone, contact-properties.create.key, contact-properties.create.label, contacts.create.customProperties.lead_source, contacts.create.email, contacts.create.firstName, contacts.create.lastName, contacts.create.phone, contacts.patch.customProperties.lead_source, contacts.patch.email, contacts.patch.firstName, contacts.patch.lastName, contacts.patch.phone, deals.create.lineItems.lineItems, deals.create.title, deals.patch.title, files.create.fileName, messages.create.body, messages.create.subject, pipelines.create.name, pipelines.create.stages, pipelines.create.stages.0.name, pipelines.patch.name, pipelines.stages.add.name. Text fields not listed have no `max` rows yet (run audit/run_matrix.py, then regenerate).
- Columns: `field, raw_input_as_user_typed, utf8_hex, normalised_form, expected_validator_result, category, reason, source`. Control characters are shown as `\uXXXX`; `utf8_hex` is the exact byte sequence.
- `expected_validator_result` is the *recommended* behaviour; where the product rule is a policy decision it says `accept-or-reject-by-policy` / `implementation-defined`.
- `au_reference.csv` has no matching CRM field today (ABN/TFN/BSB/postcode/GST); kept for future forms.

| file | rows | CRC32 | sources used |
|---|---:|---|---|
| firstName.csv | 31 | `d2bcf134` | AU given names (live UI examples); OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 8259 JSON (strings, numbers); Unicode UAX #15 normalization forms (NFC/NFD); data-fixtures brief, |
| lastName.csv | 31 | `ae86ff5c` | AU family names incl. apostrophe; OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 8259 JSON (strings, numbers); Unicode UAX #15 normalization forms (NFC/NFD); data-fixtures brief,  |
| companyName.csv | 31 | `973530ba` | AU business names; OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 8259 JSON (strings, numbers); Unicode UAX #15 normalization forms (NFC/NFD); data-fixtures brief, Step 2 (AU defa |
| dealTitle.csv | 31 | `02043a17` | OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 8259 JSON (strings, numbers); Unicode UAX #15 normalization forms (NFC/NFD); data-fixtures brief, Step 2 (AU default domain library) |
| productName.csv | 31 | `b36759cb` | OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 8259 JSON (strings, numbers); Unicode UAX #15 normalization forms (NFC/NFD); catalog names; data-fixtures brief, Step 2 (AU default  |
| email.csv | 31 | `e5418ce5` | OWASP Web Security Testing Guide, input validation (WSTG-INPV); RFC 3696 section 3 (local part max 64, domain max 255, address max 254); RFC 5322 section 3.4.1 (addr-spec); RFC 5890 (IDNA 2008); RFC 6 |
| phone.csv | 27 | `b932c11f` | ITU-T E.164 (max 15 digits); data-fixtures brief, Step 2 (AU default domain library) |
| domain.csv | 20 | `c8da3a48` | RFC 1035 section 2.3.1 / RFC 1123 section 2.1 (hostnames) |
| amount.csv | 30 | `1d1aa019` | IEEE 754 binary64 / ECMAScript Number.MAX_SAFE_INTEGER; RFC 8259 JSON (strings, numbers); data-fixtures brief, Step 2 (AU default domain library); live UI walkthrough 2026-10-01 (Contacts, Companies,  |
| currency.csv | 15 | `0e1bd8de` | ISO 4217 (currency codes) |
| date.csv | 23 | `777e5800` | ISO 8601-1 calendar dates |
| datetime.csv | 19 | `e5499088` | RFC 3339 section 5.6 (date-time) |
| au_reference.csv | 13 | `cbcb0ce5` | A New Tax System (Goods and Services Tax) Act 1999 (Cth) s 9-70; ATO ABN check-digit algorithm; ATO ABN check-digit algorithm (abr.business.gov.au); ATO TFN algorithm; AusPayNet BSB database; Australi |

## Source key

- Brief: data-fixtures brief, Step 2 (AU default domain library)
- RFC 5322 section 3.4.1 (addr-spec)
- RFC 3696 section 3 (local part max 64, domain max 255, address max 254)
- example.com (a public disposable-mailbox service used for all test addresses; never put real customer data in it)
- ITU-T E.164 (max 15 digits)
- ISO 4217 (currency codes)
- RFC 3339 section 5.6 (date-time)
- ISO 8601-1 calendar dates
- Unicode UAX #15 normalization forms (NFC/NFD)
- OWASP Web Security Testing Guide, input validation (WSTG-INPV)
- RFC 8259 JSON (strings, numbers)
- IEEE 754 binary64 / ECMAScript Number.MAX_SAFE_INTEGER
- live UI walkthrough 2026-10-01 (Contacts, Companies, Deals, Pipelines, Catalog products, Activities)
