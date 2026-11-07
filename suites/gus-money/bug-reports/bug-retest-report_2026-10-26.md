# Gus Money - Bug Retest & Verification Report (26 October 2026)

## Executive Summary

A comprehensive automated and live regression test cycle was executed against the **Gus Money** environment (`https://gusdev.softwareco.com` and Staging `https://gusstage.softwareco.com`) covering all defects tracked in the master defect log.

### Highlights & Key Discoveries:
1. **5 Defects Newly Verified as FIXED**:
   - **GUS-FX-0012**: Add product form now validates eligibility criteria client-side; invalid values (negative numbers, decimals, non-numeric strings) trigger field errors and block submission.
   - **GUS-FX-0029**: `/enquiries` API query parameter `sortBy=createdAt` is now accepted with `HTTP 200 OK` (parity with `/users` and `/products`).
   - **GUS-FX-0030**: Enquiry mutation verbs (`PUT /enquiries/:id`) are now mapped in the BFF proxy and cleanly return `HTTP 405 Method Not Allowed` instead of `HTTP 400 'Missing endpoint configuration'`.
   - **GUS-FX-0031**: Enquiries status filter combobox now contains all lifecycle states: `All`, `Submitted`, `In review`, `Info required`, `Approved`, `Declined`, `Withdrawn`.
   - **GUS-FX-0032**: `GET /cms/types` now returns `terms-and-conditions` (`Terms & Conditions`, `isActive: true`) as well as `data-usage-agreement` and `third-party-licenses`.

2. **8 Defects Confirmed Still OPEN**:
   - **GUS-FX-0027** (*P1 High - Deploy Blocker*): Staging environment (`https://gusstage.softwareco.com`) returns `404 Route Not Found` for `GET /api/v1/enquiries`.
   - **GUS-FX-0020** (*P2 Medium*): Term chips remain single-select; editing any chip drops other terms of multi-term products.
   - **GUS-FX-0023** (*P2 Medium*): International phone numbers (India, Australia) are still not validated against national format standards.
   - **GUS-FX-0025** (*P2 Medium*): Pre-existing products without eligibility criteria (`Angelique Morse`, `Standard`) still match all customers.
   - **GUS-FX-0028** (*P2 Medium*): Eligibility engine snapshots echo requested applicant amount/term into `required` on failure.
   - **GUS-FX-0021** (*P3 Low*): Saved eligibility criteria are not rendered in the product detail UI card.
   - **GUS-FX-0024** (*P3 Low*): Lender phone input placeholder remains Australian example (`412 555 012`) regardless of selected country.
   - **GUS-FX-0014** (*P3 Low*): Public `/auth/register/check-email` endpoint still leaks whether an email is registered.

---

## Detailed Bug Status Breakdown

| Bug ID | Module | Severity | Summary | Retest Result | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GUS-FX-0012** | Loan Products | P2 | Add product form silently drops invalid eligibility criteria | Client validation blocks invalid inputs (LP-032 6/6 pass) | **Fixed** |
| **GUS-FX-0029** | Enquiries | P3 | `sortBy=createdAt` rejected with 422 on `/enquiries` | Returns 200 OK with sorted records | **Fixed** |
| **GUS-FX-0030** | Enquiries | P3 | Enquiry mutations return 400 Missing endpoint config | Proxy mapped; returns 405 Method Not Allowed | **Fixed** |
| **GUS-FX-0031** | Enquiries | P3 | Status filter dropdown only offered 'Submitted'/'Withdrawn' | Full enum rendered: `Submitted`, `In review`, `Info required`, `Approved`, `Declined`, `Withdrawn` | **Fixed** |
| **GUS-FX-0032** | CMS | P3 | `GET /cms/types` omitted `terms-and-conditions` | Returns `terms-and-conditions` (`isActive: true`) | **Fixed** |
| **GUS-FX-0001** | Loan Products | P3 | JSON-string body returned 500 | Returns 4xx cleanly | **Fixed** |
| **GUS-FX-0002** | Loan Products | P3 | Malformed JSON returned 500 | Returns 400 cleanly | **Fixed** |
| **GUS-FX-0003** | Loan Products | P3 | NUL byte in product name returned 500 | Returns 422 cleanly | **Fixed** |
| **GUS-FX-0004** | Loan Products | P2 | Products list sort ignored sortBy/sortOrder | Sorting works asc/desc; invalid values return 422 | **Fixed** |
| **GUS-FX-0005** | Loan Products | P2 | Products created under deactivated lenders | Returns 409 LENDER_INACTIVE | **Fixed** |
| **GUS-FX-0007** | Loan Products | P3 | $0.00 - $0.00 amount range accepted | Returns 422 on amount fields | **Fixed** |
| **GUS-FX-0010** | Loan Products | P3 | Add form lacked client-side upper limits | Rates > 100%, names > 120 chars, terms > 600 blocked | **Fixed** |
| **GUS-FX-0011** | Loan Products | P3 | Malformed product ID returned raw validation error | Displays friendly 'Product not found' UI | **Fixed** |
| **GUS-FX-0015** | Lenders | P1 | Logo upload S3 CORS error | Upload proxied through app backend; LV-001 passes | **Fixed** |
| **GUS-FX-0016** | Lenders | P3 | ABN checksum not validated | Form and API reject invalid checksum (LV-002 passes) | **Fixed** |
| **GUS-FX-0017** | Lenders | P3 | Lender product count included deactivated products | UI table reflects active products | **Fixed in UI** |
| **GUS-FX-0019** | Users | P3 | Avatar image gave duplicate accessible name | Decorative image uses `alt=""`; LV-003 passes | **Fixed** |
| **GUS-FX-0027** | Enquiries | P1 | Staging backend returns 404 for `/api/v1/enquiries` | Staging still returns 404 Route Not Found (Dev is 200) | **Open (Deploy Blocker)** |
| **GUS-FX-0020** | Loan Products | P2 | Term chips single-select and collapse on edit | LP-060 and LP-061 confirm data collapse still occurs | **Open** |
| **GUS-FX-0023** | Lenders / Users | P2 | Phone numbers not validated by country rules | Invalid Indian/AU numbers still accepted by UI and API | **Open** |
| **GUS-FX-0025** | Loan Products | P2 | Products without criteria match all customers | 'Angelique Morse' & 'Standard' remain with empty criteria | **Open** |
| **GUS-FX-0028** | Enquiries | P2 | Snapshot echoes actual into required on failure | Snapshot still reports `required == actual` with `met: false` | **Open** |
| **GUS-FX-0021** | Loan Products | P3 | Saved criteria not shown on detail page | LP-062 confirms detail page omits criteria card | **Open** |
| **GUS-FX-0024** | Lenders | P3 | Phone placeholder always Australian | PHONE-XX-002 confirms placeholder does not adapt | **Open** |
| **GUS-FX-0014** | Authentication | P3 | Public `/auth/register/check-email` leaks registrations | UI fixed, endpoint still leaks registration status | **Partially fixed** |
| **GUS-FX-0018** | Platform | P3 | Duplicated security response headers | Reduced from 3 to 2 duplicate headers; still duplicated | **Partially fixed** |
| **GUS-FX-0013** | Platform | P2 | Writes rate limit (100/hr) includes rejected requests | Rate-limiting architecture remains unchanged | **Open (Needs decision)** |
| **GUS-FX-0026** | Loan Products | P3 | Race condition on simultaneous product deletes | Concurrency window intermittently allows 2x 200 OK | **Open** |

---

## Test Execution Artifacts

- Updated master defect CSV: `gus-money/GUS_BUG_LIST_2026-10-26_v8.csv`
- HTML API Report: `gus-money/reports/api-report.html`
- JUnit API Results: `gus-money/reports/junit-api.xml`
- JUnit UI Results: `gus-money/reports/junit-ui.xml`
