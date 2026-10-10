# CRM API audit report

- **Target:** https://crm.example.com/api/crm/v1 (staging); authorised owner test tenant; both own projects used for isolation checks.
- **Evidence:** 10400 recorded requests (`reports/audit/evidence*.jsonl`, ids `REQ-...`). Every claim cites a request id.
- **Guard rails kept:** own tenant only; no cross-tenant access; no load (two to three sequential streams at 1-2 req/s each, at most 10 parallel and only in the race step); deletes only for rows created by this run; messages only in `test` environment mode to `example.com` addresses (one earlier probe ran in live mode, see Open questions); no brute-force.
- **ID prefix:** `CRM-FX-####` (the brief's `RBM8-FX` belongs to another project).
- **No spec:** the API publishes no OpenAPI/Swagger/Postman file, so contract rows are live-only.

## 1. Summary

| Severity | Count |
|---|---|
| BLOCKER (P0) | 0 |
| HIGH (P1) | 0 |
| MEDIUM (P2) | 6 |
| LOW (P3) | 32 |
| RETRACTED | 2 |

Total findings: **40** raised, **2 retracted** (false positives from probes that used the wrong URL path — see CRM-FX-0018 and CRM-FX-0023), **38 standing**. Matrix: **4692** cases, **23** write operations, **103** fields.


## 2. Coverage table (mandatory)

`covered-by`: P1 validation/boundary, P2 authn/authz/mass-assignment/state, P3 idempotency/race/partial, P5 error hygiene. `not-tested` lists applicable prompts with no evidence for that endpoint. P4 (contract) has no per-endpoint evidence because no spec exists.

| endpoint | method | auth | covered-by | statuses seen | not-tested | blocked-by | kind |
|---|---|---|---|---|---|---|---|
| /activities | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /activities | POST | yes | P1,P2,P3 | 201,400 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /activities/{id} | GET | yes | P1,P2 | 200,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /auth/me | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /automation-rules | GET | yes | P1,P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /automation-rules | POST | yes | P1,P2 | 201,400,502 | P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /automation-rules/{id} | GET | yes | P1 | 200 | P2,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /catalog-products | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /catalog-products | POST | yes | P1,P2,P3 | 201,400,413 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /catalog-products/{id} | GET | yes | P1,P2 | 200,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /catalog-products/{id} | PATCH | yes | P1 | 200,400 | P2,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /close-reasons | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /close-reasons | PUT | yes | P1,P2,P3 | 200,400,401,413 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /companies | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /companies | POST | yes | P1,P2,P3 | 201,400,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /companies/{id} | DELETE | yes | P3 | 204,404 | P1,P2,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /companies/{id} | GET | yes | P1,P2 | 200,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /companies/{id} | PATCH | yes | P1 | 200,400 | P2,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /companies/{id}/archive | POST | yes | P2 | 200 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /contacts | GET | yes | P1,P2,P3 | 200,400,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /contacts | POST | yes | P1,P2,P3,P5 | 201,400,401,404 | - | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /contacts/custom-properties | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /contacts/custom-properties | POST | yes | P1,P2,P3 | 201,400,409 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /contacts/custom-properties/{id} | GET | yes | P1 | 404 | P2,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /contacts/{id} | GET | yes | P1,P2,P3 | 200,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /contacts/{id} | PATCH | yes | P1,P2,P3 | 200,400,404,412 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /contacts/{id}/archive | POST | yes | P2 | 200 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /contacts/{id}/convert | POST | yes | P2 | 404 | P1,P3,P5 | wrong path — real route is /leads/{id}/convert, see below | write |
| /contacts/{id}/disqualify | POST | yes | P2 | 404 | P1,P3,P5 | wrong path — real route is /leads/{id}/disqualify, see below | write |
| /contacts/{id}/qualify | POST | yes | P2 | 404 | P1,P3,P5 | wrong path — real route is /leads/{id}/qualify, see below | write |
| /contacts/{id}/restore | POST | yes | P2 | 404 | P1,P3,P5 | no /leads/{id}/restore either; POST /contacts/{id}/unarchive (200, row above) covers this | write |
| /leads/{id}/qualify | POST | yes | P2 | 200 | P1,P3,P5 | re-verified 2026-10-06; correct path for the lead.qualified trigger | write |
| /leads/{id}/disqualify | POST | yes | P2 | 200 | P1,P3,P5 | re-verified 2026-10-06; correct path for the lead.disqualified trigger | write |
| /leads/{id}/convert | POST | yes | P2 | 200 (409 if the lead is archived first) | P1,P3,P5 | re-verified 2026-10-06; correct path for the lead.converted trigger | write |
| /contacts/{id}/unarchive | POST | yes | P2 | 200 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals | GET | yes | P1,P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /deals | POST | yes | P1,P2,P3,P5 | 201,400,404,409,502 | - | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals/{id} | GET | yes | P1,P2,P3 | 200,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /deals/{id} | PATCH | yes | P1,P2,P3 | 200,400,404 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals/{id}/lost | POST | yes | P2 | 400,409 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals/{id}/move | POST | yes | P2 | 200,409 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals/{id}/reopen | POST | yes | P2 | 200,409 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /deals/{id}/won | POST | yes | P2,P3 | 200,409 | P1,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /definitely-not-a-route | GET | yes | P5 | 404 | P2 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /events | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /exports | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /files | GET | yes | P1,P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /files | POST | yes | P1,P2 | 201,400 | P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /files/{id} | GET | yes | P1 | 200 | P2,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /imports | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /messages | GET | yes | P1,P2,P3 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /messages | POST | yes | P1,P2,P3 | 202,400,401,404,422 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /messages/{id} | GET | yes | P1 | 200 | P2,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /pipelines | DELETE | yes | P5 | 404 | P1,P2,P3 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines | GET | yes | P1,P2,P3,P5 | 200,400,401 | - | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /pipelines | HEAD | yes | P5 | 200 | - | P4 spec diff (no published spec) | read |
| /pipelines | OPTIONS | yes | P5 | 204 | - | P4 spec diff (no published spec) | read |
| /pipelines | PATCH | yes | P5 | 404 | P1,P2,P3 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines | POST | yes | P1,P2,P3,P5 | 201,400,401,502 | - | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines | PUT | yes | P5 | 404 | P1,P2,P3 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines | TRACE | yes | P5 | 500 | - | P4 spec diff (no published spec) | read |
| /pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | GET | yes | P5 | 414 | P2 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /pipelines/zzz | GET | yes | P5 | 400 | P2 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /pipelines/{id} | GET | yes | P1,P2,P5 | 200,404 | - | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /pipelines/{id} | PATCH | yes | P1 | 200,400 | P2,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines/{id} | POST | yes | P5 | 404 | P1,P2,P3 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines/{id}/archive | POST | yes | P2,P3 | 200,409 | P1,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines/{id}/stages | POST | yes | P1,P2 | 201,400 | P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /pipelines/{id}/unarchive | POST | yes | P2 | 200,409 | P1,P3,P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | write |
| /reports | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /reports/contacts.by_status | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /workspaces | GET | yes | P2 | 200,401 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |
| /workspaces/{id}/projects | GET | yes | P2 | 200 | P5 | role matrix and cross-user/tenant tokens (single owner account); P4 spec diff (no published spec) | read |

## 3. Findings (ordered by severity)

### CRM-FX-0001 [MEDIUM / P2] a null byte in a search query (?q=a%00b) returns HTTP 500 on contacts, companies, deals and files

- **endpoint:** `GET /contacts|/companies|/deals|/files ?q=`
- **expected:** 400 or ignored
- **actual:** statuses [500, 500, 500, 500]; {"type":"urn:crm:error:internal_error","title":"Internal Server Error","status": | {"type":"urn:crm:error:internal_error","title":"Internal Server Error","status":
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** any search containing U+0000 returns an unhandled 500; the UI search box and Ctrl-K search share these routes
- **surfaces affected:** UI-visible (search box)
- **evidence ids:** `REQ-K00001`, `REQ-K00002`, `REQ-K00003`, `REQ-K00004`
- **request (verbatim):**
```http
GET /api/crm/v1/contacts?q=a%00b
```
- **response (verbatim):**
```http
HTTP 500
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:internal_error","title":"Internal Server Error","status":500,"code":"internal_error","requestId":"d6908ef6-3777-4f9c-b6c2-bf1ddda4bc22"}
```
- **reproducer:**
```bash
curl -i -X GET  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/contacts?q=a%00b'
```
- **suggested fix direction:** strip or reject U+0000 in query parameters before the data layer; return 400

### CRM-FX-0002 [MEDIUM / P2] number custom properties accept integers beyond 2^53 and silently round them

- **endpoint:** `POST /contacts, PATCH /contacts/{id} (customProperties.employee_count)`
- **expected:** 400 for values outside the safe-integer range (as money fields do), or an exact stored value
- **actual:** sent -9223372036854775808 stored -9223372036854776000; sent 9223372036854775807 stored 9223372036854776000; sent -9223372036854775808 stored -9223372036854776000; sent 9223372036854775807 stored 9223372036854776000
- **how-verified:** read-back (GET after 2xx)
- **impact:** silent corruption of numeric data
- **surfaces affected:** API-only
- **evidence ids:** `REQ-A01700`, `REQ-A01718`, `REQ-A01701`, `REQ-A01719`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts
content-type: application/json

{"firstName": "Test", "lastName": "Case", "email": "t.case@example.com", "phone": "0412345678", "status": "lead", "customProperties": {"lead_source": "Web", "employee_count": -9223372036854775808, "vip": false, "renewal_date": "2027-01-31"}}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf8f817e14e534397687d1","firstName":"Test","lastName":"Case","email":"t.case@example.com","phone":"0412345678","companyId":null,"companyName":null,"status":"lead","statusBeforeArchive":null,"disqualifiedReason":null,"ownerActorId":null,"customProperties":{"lead_source":"Web","employee_count":-9223372036854776000,"vip":false,"renewal_date":"2027-01-31"},"captureSource":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:03:29.043Z","updatedAt":"2026-10-02T11:03:29.043Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"firstName": "Test", "lastName": "Case", "email": "t.case@example.com", "phone": "0412345678", "status": "lead", "customProperties": {"lead_source": "Web", "employee_count": -9223372036854775808, "vip": false, "renewal_date": "2027-01-31"}}' 'https://crm.example.com/api/crm/v1/contacts'
```
- **suggested fix direction:** apply the same 2^53-1 limit used for money fields

### CRM-FX-0003 [MEDIUM / P2] state-changing requests with the session cookie are accepted from a hostile Origin (no Origin / Sec-Fetch-Site check on writes; login does check)

- **endpoint:** `POST /pipelines (all writes)`
- **expected:** 403 for the hostile origin
- **actual:** 201 
- **how-verified:** request/response + read-back
- **impact:** state-changing request from another origin/project
- **surfaces affected:** API-only
- **evidence ids:** `REQ-W200173`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines/6abf9e147e14e5343976997a/archive
content-type: application/json

{}
```
- **response (verbatim):**
```http
HTTP 409
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:conflict","title":"Conflict","status":409,"detail":"Pipeline is already archived","code":"conflict","requestId":"d4c65022-1e6b-4933-ba2c-2f536bc004b8"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{}' 'https://crm.example.com/api/crm/v1/pipelines/6abf9e147e14e5343976997a/archive'
```
- **suggested fix direction:** check Origin/Sec-Fetch-Site; scope by project

### CRM-FX-0004 [MEDIUM / P2] POST /pipelines/{id}/stages accepts a client-supplied id (every other unknown key is rejected) and the id can be reused by another pipeline

- **endpoint:** `POST /pipelines/{id}/stages`
- **expected:** server-generated ids only, or ids unique across the project
- **actual:** statuses [201, 400, 201, 400, 200]; client id accepted: 201; duplicate in same pipeline: 400; pipeline B stage re-uses pipeline A's stage id: 201 (read-back shows reused=True); unknown key rejected elsewhere: 400
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** a caller can choose stage ids, and the same id can exist in two pipelines; anything keyed by stage id alone (for example report buckets named stage_<id>) can mix pipelines
- **surfaces affected:** API-only
- **evidence ids:** `REQ-E00003`, `REQ-E00004`, `REQ-E00005`, `REQ-E00006`, `REQ-E00007`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines/6abf9e2e7e14e534397699a3/stages
content-type: application/json

{"name": "client id", "id": "fixed-stage-id-1"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9e2e7e14e534397699a3","name":"E stage-id A","stages":[{"id":"895b6505-d810-4e06-8a85-225fa316c7a0","name":"a","order":0,"archivedAt":null},{"id":"fixed-stage-id-1","name":"client id","order":1,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T12:06:06.794Z","updatedAt":"2026-10-02T12:06:08.047Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "client id", "id": "fixed-stage-id-1"}' 'https://crm.example.com/api/crm/v1/pipelines/6abf9e2e7e14e534397699a3/stages'
```
- **suggested fix direction:** ignore a supplied id, or make stage ids unique across the project

### CRM-FX-0005 [MEDIUM / P2] phone is not validated on companies, contacts

- **endpoint:** `POST/PATCH companies, contacts`
- **expected:** 400 for values that are not valid for phone
- **actual:** 40 invalid value(s) accepted across create and update, e.g. ' OR 1=1 --', '+61 4', '0412ABC678', '1', '9999999999999999999999999, '<script>alert(1)</script>, 'false', 'no'
- **how-verified:** request/response + read-back
- **impact:** bad data is stored; a phone that is not E.164 cannot receive SMS (the SMS route then returns 422)
- **surfaces affected:** API-only
- **evidence ids:** `REQ-A01383`, `REQ-A01385`, `REQ-A01387`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts
content-type: application/json

{"firstName": "Test", "lastName": "Case", "email": "t.case@example.com", "phone": "true", "status": "lead", "customProperties": {"lead_source": "Web", "employee_count": 10, "vip": false, "renewal_date": "2027-01-31"}}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf8ebf7e14e53439768652","firstName":"Test","lastName":"Case","email":"t.case@example.com","phone":"true","companyId":null,"companyName":null,"status":"lead","statusBeforeArchive":null,"disqualifiedReason":null,"ownerActorId":null,"customProperties":{"lead_source":"Web","employee_count":10,"vip":false,"renewal_date":"2027-01-31"},"captureSource":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:00:15.571Z","updatedAt":"2026-10-02T11:00:15.571Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"firstName": "Test", "lastName": "Case", "email": "t.case@example.com", "phone": "true", "status": "lead", "customProperties": {"lead_source": "Web", "employee_count": 10, "vip": false, "renewal_date": "2027-01-31"}}' 'https://crm.example.com/api/crm/v1/contacts'
```
- **suggested fix direction:** validate phone

### CRM-FX-0006 [MEDIUM / P2] text fields accept NUL, CRLF and whitespace-only values (41 fields on 17 endpoints)

- **endpoint:** `all text fields (see list)`
- **expected:** 400 for control characters (NUL, CR/LF) in single-line text and for whitespace-only required text
- **actual:** accepted and stored: POST /activities title: CRLF injection, NUL inside, NUL only | POST /activities title: CRLF injection, NUL inside, NUL only | POST /activities fileName: CRLF injection, NUL inside, NUL only, whitespace only | POST /activities title: CRLF injection, NUL inside, NUL only | POST /activities title: CRLF injection, NUL inside, NUL only | POST /activities body: CRLF injection, NUL inside, NUL only, whitespace only | POST /activities title: CRLF injection, NUL inside, NUL only | POST /activities description: CRLF injection, NUL inside, NUL only, whitespace only | POST /activities title: CRLF injection, NUL inside, NUL only | POST /automation-rules action.fields.title: CRLF injection, NUL inside, NUL only, whitespace only | POST /automation-rules name: CRLF injection, NUL inside, NUL only, whitespace only | POST /catalog-products description: CRLF injection, NUL inside, NUL only, whitespace only | POST /catalog-products name: CRLF injection, NUL inside, NUL only | POST /catalog-products priceEntries.0.label: CRLF injection, NUL inside, NUL only | PATCH /catalog-products/{id} description: CRLF injection, NUL inside, NUL only, whitespace only | PATCH /catalog-products/{id} name: CRLF injection, NUL inside, NUL only | PUT /close-reasons reasons.0.label: CRLF injection, NUL inside, NUL only | POST /companies domain: whitespace only | POST /companies name: CRLF injection, NUL inside, NUL only, whitespace only | POST /companies phone: whitespace only | PATCH /companies/{id} domain: whitespace only | PATCH /companies/{id} name: CRLF injection, NUL inside, NUL only, whitespace only | PATCH /companies/{id} phone: whitespace only | POST /contacts/custom-properties label: CRLF injection, NUL inside, NUL only, whitespace only | POST /contacts customProperties.lead_source: CRLF injection, NUL inside, NUL only, whitespace only | POST /contacts firstName: CRLF injection, NUL inside, NUL only, whitespace only | POST /contacts lastName: CRLF injection, NUL inside, NUL only, whitespace only | POST /contacts phone: whitespace only | PATCH /contacts/{id} customProperties.lead_source: CRLF injection, NUL inside, NUL only, whitespace only | PATCH /contacts/{id} firstName: CRLF injection, NUL inside, NUL only, whitespace only | +11 more
- **how-verified:** request/response + read-back (NUL is stored; titles show 'a b'; leading CRLF is trimmed)
- **impact:** blank-looking records, log/CSV/e-mail surprises; message bodies and subjects are customer-facing
- **surfaces affected:** API-only (the UI blocks blank names)
- **evidence ids:** `REQ-B02565`, `REQ-B02676`, `REQ-B02707`, `REQ-B02709`, `REQ-B02737`, `REQ-00068`
- **request (verbatim):**
```http
POST /api/crm/v1/messages
crm-env-mode: test
content-type: application/json

{"contactId": "6abf91067e14e53439768b1f", "channel": "email", "subject": "   ", "body": "Hello from the audit (test mode)"}
```
- **response (verbatim):**
```http
HTTP 202
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf91477e14e53439768bb4","channel":"email","contactId":"6abf91067e14e53439768b1f","to":{"address":"msg.target@example.com"},"templateId":null,"templateVersion":null,"subject":"   ","body":"Hello from the audit (test mode)","html":null,"status":"queued","sendAt":"2026-10-02T11:11:03.192Z","providerMessageId":null,"route":null,"attempts":0,"lastError":null,"statusReason":null,"resentFromMessageId":null,"resentAsMessageId":null,"queuedByActorId":"6abe269787e4ad1cd534cb09","queuedByKeyId":null,"createdAt":"2026-10-02T11:11:03.193Z","updatedAt":"2026-10-02T11:11:03.193Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'crm-env-mode: test' -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"contactId": "6abf91067e14e53439768b1f", "channel": "email", "subject": "   ", "body": "Hello from the audit (test mode)"}' 'https://crm.example.com/api/crm/v1/messages'
```
- **suggested fix direction:** trim and reject control characters; require a non-blank body for messages

### CRM-FX-0007 [LOW / P3] integration: rule whose action points at records that do not exist

- **endpoint:** `(automation)`
- **expected:** 400 at save time
- **actual:** 201  status 201: static ids are not validated
- **how-verified:** cross-module check with read-back
- **impact:** modules do not agree with each other or with the page text
- **surfaces affected:** API and UI
- **evidence ids:** `REQ-I00039`
- **request (verbatim):**
```http
POST /api/crm/v1/automation-rules
content-type: application/json

{"name": "dangling deal.move", "trigger": {"eventType": "contact.created"}, "action": {"type": "deal.move", "fields": {"dealId": "000000000000000000000000", "stageId": "000000000000000000000000"}}}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9bda7e14e534397697e1","name":"dangling deal.move","enabled":true,"trigger":{"eventType":"contact.created"},"conditions":[],"action":{"type":"deal.move","fields":{"dealId":"000000000000000000000000","stageId":"000000000000000000000000"}},"suspendedAt":null,"suspendedReason":null,"resumedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:56:10.890Z","updatedAt":"2026-10-02T11:56:10.890Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "dangling deal.move", "trigger": {"eventType": "contact.created"}, "action": {"type": "deal.move", "fields": {"dealId": "000000000000000000000000", "stageId": "000000000000000000000000"}}}' 'https://crm.example.com/api/crm/v1/automation-rules'
```
- **suggested fix direction:** see expectation

### CRM-FX-0008 [LOW / P3] integration: merge a source that does not exist

- **endpoint:** `(merge)`
- **expected:** 404 (a missing referenced contact is 404 on POST /deals)
- **actual:** 409 Source contact not found status 409: Source contact not found
- **how-verified:** cross-module check with read-back
- **impact:** modules do not agree with each other or with the page text
- **surfaces affected:** API and UI
- **evidence ids:** `REQ-I00069`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts/6abf9d197e14e534397697f8/merge
content-type: application/json

{"sourceId": "000000000000000000000000"}
```
- **response (verbatim):**
```http
HTTP 409
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:conflict","title":"Conflict","status":409,"detail":"Source contact not found","code":"conflict","requestId":"e9566fd8-95ae-45e5-9c26-1a35f1aad686"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"sourceId": "000000000000000000000000"}' 'https://crm.example.com/api/crm/v1/contacts/6abf9d197e14e534397697f8/merge'
```
- **suggested fix direction:** see expectation

### CRM-FX-0009 [LOW / P3] integration: merge two contacts that each have a different email

- **endpoint:** `(merge)`
- **expected:** 200 with a way to choose which email to keep
- **actual:** 409 Both contacts have a different email, and a contact keeps only one of each. Email: this contact has merge.target@example.com, Merge Conflict status 409: Both contacts have a different email, and a contact keeps only one of each. Email: this contact has merge.target@example.com, Merge Conflict has merge (no request field exists to choose)
- **how-verified:** cross-module check with read-back
- **impact:** modules do not agree with each other or with the page text
- **surfaces affected:** API and UI
- **evidence ids:** `REQ-I00070`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts/6abf9d197e14e534397697f8/merge
content-type: application/json

{"sourceId": "6abf9d1a7e14e534397697fc"}
```
- **response (verbatim):**
```http
HTTP 409
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:conflict","title":"Conflict","status":409,"detail":"Both contacts have a different email, and a contact keeps only one of each. Email: this contact has merge.target@example.com, Merge Conflict has merge.conflict@example.com. Choose which to keep; the other is deleted with Merge Conflict.","code":"conflict","requestId":"19beb998-6971-4694-9457-3ceba285c20c"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"sourceId": "6abf9d1a7e14e534397697fc"}' 'https://crm.example.com/api/crm/v1/contacts/6abf9d197e14e534397697f8/merge'
```
- **suggested fix direction:** see expectation

### CRM-FX-0010 [LOW / P3] DELETE of a custom property only archives it; re-creating the key revives the same row (and can change its type); values are hidden, not removed

- **endpoint:** `DELETE /contacts/custom-properties/{id}; POST /contacts/custom-properties`
- **expected:** a documented hard delete, or a warning that values disappear
- **actual:** statuses [201, 200, 400, 204, 200, 201, 200]; before: {'e_type_swap': 'important value'}; PATCH type -> 400 ('Custom property "e_type_swap" cannot change type from "text" to "number": stored values ar...'); after DELETE (204) value shown: {}; re-created as number: same row id=True type=number; contact now shows: {}
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** an operator who deletes a property expecting it to be gone finds it still listed, its values hidden on every contact, and (after re-creating the key with another type) permanently invisible; the type-change guard on PATCH is bypassed by delete and re-create
- **surfaces affected:** UI-visible (Properties page)
- **evidence ids:** `REQ-E00008`, `REQ-E00010`, `REQ-E00011`, `REQ-E00012`, `REQ-E00013`, `REQ-E00014`, `REQ-E00015`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts/custom-properties
content-type: application/json

{"key": "e_type_swap", "label": "Type swap", "type": "text"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9d647e14e53439769881","key":"e_type_swap","label":"Type swap","type":"text","archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T12:02:44.215Z","updatedAt":"2026-10-02T12:06:10.901Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"key": "e_type_swap", "label": "Type swap", "type": "text"}' 'https://crm.example.com/api/crm/v1/contacts/custom-properties'
```
- **suggested fix direction:** offer a real hard delete, warn how many contacts hold values, and make a re-created key a new row (or block it)

### CRM-FX-0011 [LOW / P3] stage order has a gap after a stage is deleted (0, 2 instead of 0, 1)

- **endpoint:** `DELETE /pipelines/{id}/stages/{stageId}`
- **expected:** [0, 1]
- **actual:** statuses [200, 200]; orders=[0, 2]
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** clients that assume consecutive order values (for example to compute a position) get gaps until the next reorder
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00017`, `REQ-K00018`
- **request (verbatim):**
```http
DELETE /api/crm/v1/pipelines/6abf957f7e14e53439769342/stages/f34a3d4b-acb6-4539-8ecb-2cee4ddabe36
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf957f7e14e53439769342","name":"K8 order","stages":[{"id":"3f896687-80cf-4f1c-bc15-e4bf3c8dbe92","name":"a","order":0,"archivedAt":null},{"id":"d922fed2-6f65-42a8-94e3-8aa3f146d446","name":"c","order":2,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:29:03.878Z","updatedAt":"2026-10-02T11:29:04.432Z"}
```
- **reproducer:**
```bash
curl -i -X DELETE  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/pipelines/6abf957f7e14e53439769342/stages/f34a3d4b-acb6-4539-8ecb-2cee4ddabe36'
```
- **suggested fix direction:** renumber on delete

### CRM-FX-0012 [LOW / P3] unknown /api/* paths return HTTP 200 with an HTML page (soft 404)

- **endpoint:** `GET /api/docs, /api/openapi.json`
- **expected:** 404 (JSON or none)
- **actual:** /api/docs -> 200 text/html; charset=utf-8; /api/openapi.json -> 200 text/html; charset=utf-8; /api/crm -> 200 text/html; charset=utf-8; /api/v1/pipelines -> 200 text/html; charset=utf-8
- **how-verified:** direct requests, hygiene step
- **impact:** scanners and clients are told a route exists; no API docs are published
- **surfaces affected:** UI-visible (shows 'Page not found')
- **evidence ids:** (aggregate; see appendix tables)
- **suggested fix direction:** return 404 for unknown paths

### CRM-FX-0013 [LOW / P3] no GET-by-id route for the resource created by POST /contacts/custom-properties

- **endpoint:** `GET /contacts/custom-properties/{id}`
- **expected:** GET /<resource>/{id} for every resource that can be created
- **actual:** read-back after a successful create failed: READBACK-FAILED status 404
- **how-verified:** read-back (GET after 2xx)
- **impact:** a caller cannot fetch the record it just created except by listing everything
- **surfaces affected:** API-only
- **evidence ids:** `REQ-D00056`, `REQ-D00057`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts/custom-properties
content-type: application/json

{"key": "true", "label": "Audit prop", "type": "text"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf8b327e14e53439767f7b","key":"true","label":"Audit prop","type":"text","archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T10:45:06.755Z","updatedAt":"2026-10-02T11:30:36.242Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"key": "true", "label": "Audit prop", "type": "text"}' 'https://crm.example.com/api/crm/v1/contacts/custom-properties'
```
- **suggested fix direction:** add the route

### CRM-FX-0014 [LOW / P3] archived contacts: the obvious filter status=archived is rejected; only the undocumented bracket form status[in]=archived works

- **endpoint:** `GET /contacts?status=archived|status[in]=archived`
- **expected:** a documented filter; an error that points at the right syntax
- **actual:** statuses [400, 200, 400, 400, 400, 200, 400]; status=archived -> 400 'querystring: Unrecognized key: "status"'; status[in]=archived -> 200, archived row listed: True; default list contains the archived row: False; other operators: [eq]->400, [in]=zzz->400, [ne]->400, created_at[gte]->200, [in]=lead,customer->400
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** archived contacts and companies are hidden from the default list; the obvious filter fails with 'Unrecognized key: status' and does not point at the working syntax; integrations built against the docs-less API will conclude archived rows cannot be listed
- **surfaces affected:** UI-visible (Archived tab works; API syntax undocumented)
- **evidence ids:** `REQ-F00002`, `REQ-F00003`, `REQ-F00005`, `REQ-F00006`, `REQ-F00007`, `REQ-F00008`, `REQ-F00009`
- **request (verbatim):**
```http
GET /api/crm/v1/contacts?status=archived
```
- **response (verbatim):**
```http
HTTP 400
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:validation_error","title":"Validation failed","status":400,"detail":"querystring: Unrecognized key: \"status\"","code":"validation_error","requestId":"adf7cca0-5db1-4f55-953a-a242b98dfc13"}
```
- **reproducer:**
```bash
curl -i -X GET  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/contacts?status=archived'
```
- **suggested fix direction:** document the bracket operators (status[in], created_at[gte], ...) and accept status=<value> as shorthand

### CRM-FX-0015 [LOW / P3] audit events for deleted records lose the record name (the Audit page shows 'Unnamed')

- **endpoint:** `GET /events (Audit page)`
- **expected:** name present on pipeline.deleted
- **actual:** statuses [200]; {"v": 1, "id": "6abf95857e14e5343976934e", "type": "pipeline.deleted", "createdAt": "2026-10-02T11:29:09.877Z", "data": {"id": "6abf95857e14e5343976934c"}, "actorId": "6abe269787e4ad1cd534cb09", "orgId": "default", "subject": {"kind": "pipeline", "id": "6abf95857e14e5343976934c"}, "origin": null}
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** the log says what was deleted only by id; the page shows 'Unnamed', which defeats the purpose of an audit trail
- **surfaces affected:** UI-visible (Audit page)
- **evidence ids:** `REQ-K00028`
- **request (verbatim):**
```http
GET /api/crm/v1/events?limit=5
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"data":[{"v":1,"id":"6abf95857e14e5343976934e","type":"pipeline.deleted","createdAt":"2026-10-02T11:29:09.877Z","data":{"id":"6abf95857e14e5343976934c"},"actorId":"6abe269787e4ad1cd534cb09","orgId":"default","subject":{"kind":"pipeline","id":"6abf95857e14e5343976934c"},"origin":null},{"v":1,"id":"6abf95857e14e5343976934d","type":"pipeline.created","createdAt":"2026-10-02T11:29:09.337Z","data":{"id":"6abf95857e14e5343976934c","name":"K15 audit name","stages":[{"id":"63a45d02-c73f-4d25-84c9-59e63b35978f","name":"a","order":0,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByAct
```
- **reproducer:**
```bash
curl -i -X GET  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/events?limit=5'
```
- **suggested fix direction:** write the record name (or a snapshot) into the deleted event

### CRM-FX-0016 [LOW / P3] over-long URL error uses a different envelope and names the framework

- **endpoint:** `GET /pipelines/{5000 chars}`
- **expected:** the standard problem+json envelope without framework internals
- **actual:** 414 application/json {"error":"Bad Request","code":"FST_ERR_MAX_PARAM_LENGTH","message":"'/v1/pipelines/aaaaaaaaaaaaaaaaa
- **how-verified:** response body
- **impact:** information disclosure (framework error code FST_ERR_*) and an inconsistent envelope
- **surfaces affected:** API-only
- **evidence ids:** `REQ-R00346`
- **request (verbatim):**
```http
GET /api/crm/v1/pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
- **response (verbatim):**
```http
HTTP 414
Cache-Control: private, no-store
Content-Type: application/json
Via: 1.1 Caddy

{"error":"Bad Request","code":"FST_ERR_MAX_PARAM_LENGTH","message":"'/v1/pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```
- **reproducer:**
```bash
curl -i -X GET  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
```
- **suggested fix direction:** map framework errors to the standard envelope

### CRM-FX-0017 [LOW / P3] idempotent replays carry no marker header, so a client cannot tell a replay from a new create

- **endpoint:** `POST (all create routes) with Idempotency-Key`
- **expected:** a replay header; 409/422 for a different body under the same key
- **actual:** statuses [201, 201, 409]; replay statuses 201/201; replay/idempotency headers: none; same key + different body -> 409 (returned the first record: False)
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** retrying clients cannot tell whether they created a record or got a stored response
- **surfaces affected:** API-only
- **evidence ids:** `REQ-E00034`, `REQ-E00035`, `REQ-E00036`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
Idempotency-Key: audit-e-replay-20261002173603
content-type: application/json

{"name": "E replay header", "stages": [{"name": "a"}]}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9e3e7e14e534397699c2","name":"E replay header","stages":[{"id":"cfcac88d-0be4-46ce-a0ff-5bc249c7fd4c","name":"a","order":0,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T12:06:22.028Z","updatedAt":"2026-10-02T12:06:22.028Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'Idempotency-Key: audit-e-replay-20261002173603' -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "E replay header", "stages": [{"name": "a"}]}' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** return a replay header (for example Idempotent-Replayed: true)

### RETRACTED: activity linking

- Earlier finding "no way to link an activity to a record" was wrong. Activities link through `attachments: [{kind, id}]` (filter with `attached_to_kind` / `attached_to_id`).

### CRM-FX-0019 [LOW / P3] automation rules run in a batch about two minutes after the event, with no hint in the UI or API

- **endpoint:** `POST /automation-rules + deal/contact events`
- **expected:** near-real-time execution, or a documented delay shown on the Automation page
- **actual:** task appeared after ~124s (rules run in a batch; the page gives no hint of the delay)
- **how-verified:** timed polling of the activities list after a deal was won
- **impact:** a rule looks broken for the first minutes after it is created or triggered; an operator may recreate it or disable it
- **surfaces affected:** UI and API
- **evidence ids:** `REQ-I00022`
- **request (verbatim):**
```http
POST /api/crm/v1/deals/6abf9aa37e14e53439769795/won
content-type: application/json

{}
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9aa37e14e53439769795","title":"INT deal","pipelineId":"6abf9aa17e14e5343976978d","stageId":"22fa0ce8-31aa-4a8f-aa83-c46df7a3ee74","contactId":"6abf9aa27e14e53439769791","companyId":"6abf9aa27e14e5343976978f","ownerActorId":null,"lineItems":[{"id":"5d298f10-9027-4675-84f0-622400e85671","catalogProductId":"6abf9aa37e14e53439769793","quantity":3,"unitAmount":5000,"currency":"AUD","label":null}],"amount":{"amount":15000,"currency":"AUD"},"status":"won","closedAt":"2026-10-02T11:51:09.081Z","closeReason":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:50:59.
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{}' 'https://crm.example.com/api/crm/v1/deals/6abf9aa37e14e53439769795/won'
```
- **suggested fix direction:** show the expected delay, or run rules synchronously

### CRM-FX-0020 [LOW / P3] a replayed Idempotency-Key returns a 'created' response for a record that has since been deleted

- **endpoint:** `POST /companies (all create routes) with Idempotency-Key`
- **expected:** a fresh create, or a clear error, once the original record is gone
- **actual:** statuses [201, 204, 201, 404]; first create 201 id 6abf9e3f7e14e534397699c7; DELETE 204; same key again -> 201 id 6abf9e3f7e14e534397699c7; GET that id -> 404
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** a retry after the record was deleted is told 201 with the id of a record that no longer exists (GET returns 404)
- **surfaces affected:** API-only
- **evidence ids:** `REQ-E00037`, `REQ-E00038`, `REQ-E00039`, `REQ-E00040`
- **request (verbatim):**
```http
POST /api/crm/v1/companies
Idempotency-Key: audit-e-deleted-replay-20261002173603
content-type: application/json

{"name": "E replay of a deleted record"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9e3f7e14e534397699c7","name":"E replay of a deleted record","domain":null,"phone":null,"status":"active","ownerActorId":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T12:06:23.648Z","updatedAt":"2026-10-02T12:06:23.648Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'Idempotency-Key: audit-e-deleted-replay-20261002173603' -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "E replay of a deleted record"}' 'https://crm.example.com/api/crm/v1/companies'
```
- **suggested fix direction:** check that the stored response's record still exists, or expire keys when the record is deleted

### CRM-FX-0021 [LOW / P3] no uniqueness rule: parallel creates of the same contact email or pipeline name produce one row each

- **endpoint:** `POST /contacts, POST /pipelines (also companies)`
- **expected:** a decision: unique where the business expects it (for example contact email)
- **actual:** 10 parallel contact creates, same email, DISTINCT keys created duplicates: statuses [201, 201, 201, 201, 201, 201, 201, 201, 201, 201], rows created 10; 10 parallel pipeline creates, same name created duplicates: statuses [201, 201, 201, 201, 201, 201, 201, 201, 201, 201], rows created 10
- **how-verified:** count delta + list of ids after 10 parallel requests
- **impact:** duplicate contacts and pipelines; an Idempotency-Key does prevent duplicates of the SAME request
- **surfaces affected:** UI and API
- **evidence ids:** `REQ-W200098`, `REQ-W200101`, `REQ-W200099`, `REQ-W200103`, `REQ-W200100`, `REQ-W200110`, `REQ-W200111`, `REQ-W200113`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts
Idempotency-Key: audit-20261002173440-race-d0-e0620378fbf0
content-type: application/json

{"firstName": "Race", "email": "race.same2@example.com"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf9e067e14e53439769928","firstName":"Race","lastName":null,"email":"race.same2@example.com","phone":null,"companyId":null,"companyName":null,"status":"lead","statusBeforeArchive":null,"disqualifiedReason":null,"ownerActorId":null,"customProperties":{},"captureSource":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T12:05:26.252Z","updatedAt":"2026-10-02T12:05:26.252Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'Idempotency-Key: audit-20261002173440-race-d0-e0620378fbf0' -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"firstName": "Race", "email": "race.same2@example.com"}' 'https://crm.example.com/api/crm/v1/contacts'
```
- **suggested fix direction:** decide which values must be unique

### CRM-FX-0022 [LOW / P3] repeating an archive returns 200 for contacts and companies but 409 for pipelines and deals

- **endpoint:** `POST /contacts/{id}/archive, /companies/{id}/archive`
- **expected:** one repeat semantics across resources
- **actual:** state machine: contact: archive twice -> 200 ; state machine: company: archive twice -> 200 
- **how-verified:** repeat requests (and 19 more on pipelines for comparison)
- **impact:** clients must special-case each resource
- **surfaces affected:** API-only
- **evidence ids:** `REQ-W00745`, `REQ-W00758`
- **request (verbatim):**
```http
POST /api/crm/v1/contacts/6abf97287e14e53439769578/archive
content-type: application/json

{}
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf97287e14e53439769578","firstName":"SM","lastName":"Direct","email":"sm.direct@example.com","phone":null,"companyId":null,"companyName":null,"status":"archived","statusBeforeArchive":"customer","disqualifiedReason":null,"ownerActorId":null,"customProperties":{},"captureSource":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:36:08.599Z","updatedAt":"2026-10-02T11:36:09.136Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{}' 'https://crm.example.com/api/crm/v1/contacts/6abf97287e14e53439769578/archive'
```
- **suggested fix direction:** pick idempotent 200 or 409 and use it everywhere

### RETRACTED: CRM-FX-0023 — lead-lifecycle routes exist; the original probe used the wrong path

The original finding claimed no route exists for qualify/disqualify/convert because
`POST /contacts/{id}/qualify|disqualify|convert|restore` returns 404. That path is wrong. The real
routes are namespaced under `/leads`, not `/contacts`, and all three work correctly:

- `POST /leads/{id}/qualify` -> 200, status becomes `qualified`
- `POST /leads/{id}/disqualify` -> 200
- `POST /leads/{id}/convert` -> 200, status becomes `customer` (409 `conflict` with "Cannot convert an
  archived lead" if the lead was disqualified/archived first — correct state-machine behaviour, not a bug)

Re-verified 2026-10-06 directly against the live API:
```
POST /api/crm/v1/leads/6ac3952dca2bfb4ed3e5fdfa/qualify   -> 200 {"status":"qualified", ...}
POST /api/crm/v1/leads/6ac3952dca2bfb4ed3e5fdfa/convert   -> 200 {"status":"customer", ...}
```

`restore`/`unarchive` have no `/leads/{id}/...` equivalent, but that is because the generic
`POST /contacts/{id}/unarchive` already covers it (confirmed working in Appendix G) — not a gap.

No fix needed; this was a false positive in the audit harness, not a product defect.

### CRM-FX-0024 [LOW / P3] moving a deal to the stage it is already in succeeds silently (200)

- **endpoint:** `POST /deals/{id}/move`
- **expected:** 409 or a documented no-op
- **actual:** statuses [200]; {"id":"6abf95887e14e53439769351","title":"K18","pipelineId":"6abf95877e14e534397
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** harmless, but it records an audit event for a change that did not happen
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00033`
- **request (verbatim):**
```http
POST /api/crm/v1/deals/6abf95887e14e53439769351/move
content-type: application/json

{"stageId": "ef0a2801-5a75-4dd8-997d-4604848a42e9"}
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf95887e14e53439769351","title":"K18","pipelineId":"6abf95877e14e5343976934f","stageId":"ef0a2801-5a75-4dd8-997d-4604848a42e9","contactId":null,"companyId":null,"ownerActorId":null,"lineItems":[],"amount":null,"status":"open","closedAt":null,"closeReason":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:29:12.516Z","updatedAt":"2026-10-02T11:29:12.516Z","contact":null,"company":null}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"stageId": "ef0a2801-5a75-4dd8-997d-4604848a42e9"}' 'https://crm.example.com/api/crm/v1/deals/6abf95887e14e53439769351/move'
```
- **suggested fix direction:** return 409 or document the no-op and skip the event

### CRM-FX-0025 [LOW / P3] internal identifiers are exposed: AWS account id inside the bucket host, temporary access-key id in presigned URLs, framework error code

- **endpoint:** `POST /files, over-long URLs`
- **expected:** no internal identifiers in client-facing bodies
- **actual:** AWS access key id appears in responses; 12-digit AWS account id in a bucket host appears in responses; framework error code appears in responses
- **how-verified:** regex scan of every recorded response (secrets such as signatures are redacted in this report)
- **impact:** aids fingerprinting; the presigned access-key id is normal for S3 but the account id in the bucket name is avoidable
- **surfaces affected:** API-only
- **evidence ids:** `REQ-B03005`, `REQ-B03007`, `REQ-B03009`, `REQ-B03011`, `REQ-R00346`
- **request (verbatim):**
```http
POST /api/crm/v1/files
content-type: application/json

{"fileName": "audit.csv", "contentType": "text/csv", "byteSize": 10}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf92317e14e53439768ded","fileName":"audit.csv","contentType":"text/csv","byteSize":10,"checksumSha256":null,"status":"pending","createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:14:57.042Z","updatedAt":"2026-10-02T11:14:57.042Z","upload":{"url":"https://assets.example.com/6abe377f6194a264a524b653/live/default/6abf92317e14e53439768ded?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQAODIGNNHCQJZX3E%2F20261002%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Date=20261002T111457Z&X-Amz-Expires=900&X-Amz-Security-Token=IQo
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"fileName": "audit.csv", "contentType": "text/csv", "byteSize": 10}' 'https://crm.example.com/api/crm/v1/files'
```
- **suggested fix direction:** use an opaque bucket name; map framework errors

### CRM-FX-0026 [LOW / P3] import has no update or skip duplicate mode (only create or reject)

- **endpoint:** `POST /imports`
- **expected:** update or skip available
- **actual:** statuses [400]; /fileId: Must be an id as the API writes it: 24 lowercase hex characters; /onDuplicate: Invalid option: expected one of "create"|"reject"
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** re-importing an exported file can only create duplicates or reject them; existing records cannot be corrected by import
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00030`
- **request (verbatim):**
```http
POST /api/crm/v1/imports
content-type: application/json

{"resource": "contacts", "fileId": "x", "onDuplicate": "update"}
```
- **response (verbatim):**
```http
HTTP 400
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:validation_error","title":"Validation failed","status":400,"detail":"/fileId: Must be an id as the API writes it: 24 lowercase hex characters; /onDuplicate: Invalid option: expected one of \"create\"|\"reject\"","code":"validation_error","requestId":"c101ea88-0be8-4f2b-bc3a-5a7d245453ed"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"resource": "contacts", "fileId": "x", "onDuplicate": "update"}' 'https://crm.example.com/api/crm/v1/imports'
```
- **suggested fix direction:** add an update (match on id or email) and a skip mode

### CRM-FX-0027 [LOW / P3] name limit counts UTF-16 units (100 emoji = 200 units)

- **endpoint:** `POST /pipelines (and every length-limited text field)`
- **expected:** 201 (100 characters is under 120)
- **actual:** statuses [400]; /name: Too big: expected string to have <=120 characters
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** users who type emoji or other characters outside the Basic Multilingual Plane hit the limit at half the stated length (100 emoji are refused as 'more than 120 characters')
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00009`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
content-type: application/json

{"name": "\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\u
```
- **response (verbatim):**
```http
HTTP 400
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:validation_error","title":"Validation failed","status":400,"detail":"/name: Too big: expected string to have <=120 characters","code":"validation_error","requestId":"e7f1c710-46d4-4bee-8cc5-ba563ba443db"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\ud83d\ude00\u' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** count Unicode code points (or graphemes) instead of UTF-16 units

### CRM-FX-0028 [LOW / P3] intermittent empty 502 instead of 413 for oversized request bodies (2 MB, 6 attempts)

- **endpoint:** `POST /pipelines (any write) with a body of about 2 MB`
- **expected:** 413 every time
- **actual:** statuses [502, 413, 413, 502, 413, 502]; statuses [502, 413, 413, 502, 413, 502]
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** the caller sees a bare gateway error instead of a clear 413, so it cannot tell a permanent size problem from a retryable fault
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00010`, `REQ-K00011`, `REQ-K00012`, `REQ-K00013`, `REQ-K00014`, `REQ-K00015`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
content-type: application/json

{"pad":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```
- **response (verbatim):**
```http
HTTP 502
Cache-Control: private, no-store
Content-Type: application/json
Via: 1.1 Caddy
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"pad":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** reject on Content-Length before reading the body, or drain the request before closing the connection

### CRM-FX-0029 [LOW / P3] stages can be added to an archived pipeline (the page says an archived pipeline takes no new deals)

- **endpoint:** `POST /pipelines/{id}/stages`
- **expected:** 400/409 (archived takes no new deals)
- **actual:** statuses [201]; {"id":"6abf957f7e14e53439769342","name":"K8 order","stages":[{"id":"3f896687-80c
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** the page text and the API disagree about what an archived pipeline accepts
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00021`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines/6abf957f7e14e53439769342/stages
content-type: application/json

{"name": "added while archived"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf957f7e14e53439769342","name":"K8 order","stages":[{"id":"3f896687-80cf-4f1c-bc15-e4bf3c8dbe92","name":"a","order":0,"archivedAt":null},{"id":"d922fed2-6f65-42a8-94e3-8aa3f146d446","name":"c","order":2,"archivedAt":null},{"id":"6ac750c7-8f22-49ce-9c56-bf477e0a1736","name":"added while archived","order":3,"archivedAt":null}],"archivedAt":"2026-10-02T11:29:06.071Z","createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:29:03.878Z","updatedAt":"2026-10-02T11:29:06.620Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "added while archived"}' 'https://crm.example.com/api/crm/v1/pipelines/6abf957f7e14e53439769342/stages'
```
- **suggested fix direction:** decide: make archived pipelines read-only, or change the page text

### CRM-FX-0030 [LOW / P3] timeZone is not validated on activities

- **endpoint:** `POST/PATCH activities`
- **expected:** 400 for values that are not valid for timeZone
- **actual:** 1 invalid value(s) accepted across create and update, e.g. 'australia/sydney'
- **how-verified:** request/response + read-back
- **impact:** bad data is stored and breaks later use
- **surfaces affected:** API-only
- **evidence ids:** `REQ-B01999`
- **request (verbatim):**
```http
POST /api/crm/v1/activities
content-type: application/json

{"type": "appointment", "title": "Audit appt", "startsAt": "2026-12-01T09:00:00+11:00", "endsAt": "2026-12-01T10:00:00+11:00", "timeZone": "australia/sydney"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf90297e14e53439768926","title":"Audit appt","attachments":[],"assigneeActorId":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:06:17.165Z","updatedAt":"2026-10-02T11:06:17.165Z","type":"appointment","startsAt":"2026-11-30T22:00:00.000Z","endsAt":"2026-11-30T23:00:00.000Z","timeZone":"australia/sydney","location":null,"source":null,"cancelledAt":null}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"type": "appointment", "title": "Audit appt", "startsAt": "2026-12-01T09:00:00+11:00", "endsAt": "2026-12-01T10:00:00+11:00", "timeZone": "australia/sydney"}' 'https://crm.example.com/api/crm/v1/activities'
```
- **suggested fix direction:** validate timeZone

### CRM-FX-0031 [LOW / P3] domain is not validated on companies

- **endpoint:** `POST/PATCH companies`
- **expected:** 400 for values that are not valid for domain
- **actual:** 20 invalid value(s) accepted across create and update, e.g. 'a_b.example.com', 'example.com.', 'example.com/path', 'false', 'https://example.com', 'localhost', 'no', 'not a domain'
- **how-verified:** request/response + read-back
- **impact:** bad data is stored and breaks later use
- **surfaces affected:** API-only
- **evidence ids:** `REQ-A02960`, `REQ-A02962`, `REQ-A02964`
- **request (verbatim):**
```http
POST /api/crm/v1/companies
content-type: application/json

{"name": "Audit Co", "domain": "true", "phone": "0412345678", "status": "active"}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf923b7e14e53439768e1b","name":"Audit Co","domain":"true","phone":"0412345678","status":"active","ownerActorId":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:15:07.220Z","updatedAt":"2026-10-02T11:15:07.220Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "Audit Co", "domain": "true", "phone": "0412345678", "status": "active"}' 'https://crm.example.com/api/crm/v1/companies'
```
- **suggested fix direction:** validate domain

### CRM-FX-0032 [LOW / P3] PUT, DELETE and PATCH on a collection return 404 instead of 405, while OPTIONS advertises them in Allow

- **endpoint:** `PUT|PATCH|DELETE /pipelines (collection); OPTIONS /pipelines`
- **expected:** 405 with an Allow header
- **actual:** statuses [404, 404, 404]; statuses [404, 404, 404]; Allow header: ['', '', '']
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** OPTIONS advertises methods that then return 404, so clients cannot rely on Allow
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00034`, `REQ-K00035`, `REQ-K00036`
- **request (verbatim):**
```http
PUT /api/crm/v1/pipelines
content-type: application/json

{}
```
- **response (verbatim):**
```http
HTTP 404
Cache-Control: private, no-store
Content-Type: application/problem+json; charset=utf-8
Via: 1.1 Caddy

{"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for PUT /v1/pipelines","code":"not_found","requestId":"f8f19503-412a-4341-9741-0049e026dae0"}
```
- **reproducer:**
```bash
curl -i -X PUT -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{}' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** return 405 with an accurate Allow header

### CRM-FX-0033 [LOW / P3] TRACE returns a bare plain-text 500 instead of 405

- **endpoint:** `TRACE /pipelines`
- **expected:** 405/404 in the JSON error format
- **actual:** statuses [500]; Internal Server Error
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** an unhandled fault with a non-JSON body; TRACE should be disabled
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00005`
- **request (verbatim):**
```http
TRACE /api/crm/v1/pipelines
```
- **response (verbatim):**
```http
HTTP 500
Content-Type: text/plain
Etag: "66fci67lppl"
Via: 1.1 Caddy

Internal Server Error
```
- **reproducer:**
```bash
curl -i -X TRACE  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** disable TRACE at the proxy or return 405

### CRM-FX-0034 [LOW / P3] duplicate JSON keys are accepted (the last one wins) on every write endpoint

- **endpoint:** `all POST/PUT/PATCH routes`
- **expected:** 400 for ambiguous JSON
- **actual:** accepted on: activities.create.appointment, activities.create.call, activities.create.document, activities.create.meeting, activities.create.note, activities.create.task, automation-rules.create, catalog-products.create
- **how-verified:** request/response
- **impact:** ambiguous input can differ between parsers in a proxy chain
- **surfaces affected:** API-only
- **evidence ids:** `REQ-W00014`, `REQ-W00033`, `REQ-W00065`, `REQ-W00091`, `REQ-W00117`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
content-type: application/json

{"name":"first","name": "Audit pipeline", "stages": [{"name": "Lead"}, {"name": "Won"}]}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf95987e14e53439769365","name":"Audit pipeline","stages":[{"id":"26d5b168-b5f4-49f1-9bb8-5865be8e2ff5","name":"Lead","order":0,"archivedAt":null},{"id":"69743b73-7d08-44fa-881a-a87ed621d393","name":"Won","order":1,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:29:28.016Z","updatedAt":"2026-10-02T11:29:28.016Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name":"first","name": "Audit pipeline", "stages": [{"name": "Lead"}, {"name": "Won"}]}' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** reject duplicate keys

### CRM-FX-0035 [LOW / P3] write endpoints accept a wrong or missing Content-Type (text/plain, application/xml, form-urlencoded, none)

- **endpoint:** `all POST/PUT/PATCH routes`
- **expected:** 415 or 400 unless the body is application/json
- **actual:** 'valid JSON, Content-Type text/plain': accepted on: activities.create.appointment, activities.create.call, activities.create.document, activities.create.meetin | 'valid JSON, Content-Type application/xml': accepted on: activities.create.appointment, activities.create.call, activities.create.document, activities.create.meetin | 'valid JSON, form-urlencoded': accepted on: activities.create.appointment, activities.create.call, activities.create.document, activities.create.meetin | 'valid JSON, no Content-Type': accepted on: activities.create.appointment, activities.create.call, activities.create.document, activities.create.meetin
- **how-verified:** request/response (the same valid JSON body re-sent with each content type)
- **impact:** text/plain is a CORS 'simple' content type, so it removes a layer of CSRF protection (the custom crm-* headers still force a preflight today)
- **surfaces affected:** API-only
- **evidence ids:** `REQ-W00009`, `REQ-W00028`, `REQ-W00042`, `REQ-W00060`, `REQ-W00086`, `REQ-W00010`, `REQ-W00029`, `REQ-W00061`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
content-type: text/plain

{"name": "Audit pipeline", "stages": [{"name": "Lead"}, {"name": "Won"}]}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf95957e14e5343976935d","name":"Audit pipeline","stages":[{"id":"29a6e6ab-dd21-457a-9094-29c629e2e1d4","name":"Lead","order":0,"archivedAt":null},{"id":"c89d739e-3fdd-4c33-a572-bb1d8b332d77","name":"Won","order":1,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T11:29:25.359Z","updatedAt":"2026-10-02T11:29:25.359Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: text/plain' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "Audit pipeline", "stages": [{"name": "Lead"}, {"name": "Won"}]}' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** require application/json on write routes

### CRM-FX-0036 [LOW / P3] no rate-limit headers or Retry-After anywhere; no 429 observed

- **endpoint:** `all routes`
- **expected:** documented limit with 429 + Retry-After
- **actual:** none of ~8000 requests at 1-3 req/s drew any rate-limit signal
- **how-verified:** response headers across the whole run
- **impact:** brute-force and runaway-client protection cannot be verified (and is not advertised)
- **surfaces affected:** API-only
- **evidence ids:** (aggregate; see appendix tables)
- **suggested fix direction:** document limits and return 429 + Retry-After

### CRM-FX-0037 [LOW / P3] response headers disclose the proxy/server product

- **endpoint:** `all routes`
- **expected:** no product/version banner
- **actual:** via='1.1 Caddy' server='' x-powered-by=''
- **how-verified:** response headers
- **impact:** minor fingerprinting aid
- **surfaces affected:** API-only
- **evidence ids:** `REQ-R00337`
- **request (verbatim):**
```http
GET /api/crm/v1/pipelines?limit=1
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"data":[{"id":"6abf889a7e14e53439767e09","name":"SMB Quick Sale","stages":[{"id":"2b6fbd07-de80-4f7b-b536-07062ddb3777","name":"New","order":0,"archivedAt":null},{"id":"67b61343-7fdd-4b4d-97c6-54f58de98e36","name":"Demo","order":1,"archivedAt":null},{"id":"ecd901ed-b3b1-4d1d-af8d-3e309a431e2b","name":"Decision","order":2,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T10:34:02.849Z","updatedAt":"2026-10-02T10:34:02.849Z"}],"has_more":true,"next_cursor":"AgJrMRV7huyfYTQxEW5GS3cE_Z_jYXAg10ya3oPzerP34_b3xodx03-Fju6wOzeYCatAUUTAhag"}
```
- **reproducer:**
```bash
curl -i -X GET  --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/pipelines?limit=1'
```
- **suggested fix direction:** strip Via/Server

### CRM-FX-0038 [LOW / P3] invalid text is silently replaced with U+FFFD instead of rejected (lone surrogates in 27+ fields, invalid UTF-8 bytes in a body)

- **endpoint:** `all text fields`
- **expected:** 400, or a stored value equal to the input
- **actual:** accepted with 2xx; stored value differs: PATCH /catalog-products/{id} description; PATCH /catalog-products/{id} name; PATCH /companies/{id} name; PATCH /contacts/{id} customProperties.lead_source; PAT | statuses [201, 200]; stored name: 'K4 ��'
- **how-verified:** read-back (GET after 2xx)
- **impact:** the caller is told 2xx but a different value is stored
- **surfaces affected:** API-only
- **evidence ids:** `REQ-00072`, `REQ-00190`, `REQ-D00172`, `REQ-00073`, `REQ-00191`, `REQ-K00007`, `REQ-K00008`
- **request (verbatim):**
```http
POST /api/crm/v1/pipelines
content-type: application/json

{"name": "\ud800", "stages": [{"name": "Lead"}, {"name": "Won"}]}
```
- **response (verbatim):**
```http
HTTP 201
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"id":"6abf8a117e14e53439767e9a","name":"\ud800","stages":[{"id":"213976d7-080e-437b-a007-1c94beb71e82","name":"Lead","order":0,"archivedAt":null},{"id":"2c3edb4b-c53b-4392-93c6-c2d9906b9b24","name":"Won","order":1,"archivedAt":null}],"archivedAt":null,"createdByActorId":"6abe269787e4ad1cd534cb09","createdByActorLabel":null,"updatedByActorId":"6abe269787e4ad1cd534cb09","updatedByActorLabel":null,"createdAt":"2026-10-02T10:40:17.296Z","updatedAt":"2026-10-02T10:40:17.296Z"}
```
- **reproducer:**
```bash
curl -i -X POST -H 'content-type: application/json' --cookie "$CRM_SESSION_COOKIE" --data-raw '{"name": "\ud800", "stages": [{"name": "Lead"}, {"name": "Won"}]}' 'https://crm.example.com/api/crm/v1/pipelines'
```
- **suggested fix direction:** decode strictly and reject invalid text

### CRM-FX-0039 [LOW / P3] an unknown Crm-Org-Id header is accepted and treated as the default organization

- **endpoint:** `any route, header Crm-Org-Id`
- **expected:** 400/403
- **actual:** statuses [200]; {"data":[],"has_more":false,"next_cursor":null}
- **how-verified:** request/response and read-back, re-run in this harness
- **impact:** a typo'd or stale organization id silently targets the default organization
- **surfaces affected:** API-only
- **evidence ids:** `REQ-K00019`
- **request (verbatim):**
```http
GET /api/crm/v1/pipelines?limit=1
crm-org-id: no-such-org
```
- **response (verbatim):**
```http
HTTP 200
Cache-Control: private, no-store
Content-Type: application/json; charset=utf-8
Via: 1.1 Caddy

{"data":[],"has_more":false,"next_cursor":null}
```
- **reproducer:**
```bash
curl -i -X GET -H 'crm-org-id: no-such-org' --cookie "$CRM_SESSION_COOKIE" 'https://crm.example.com/api/crm/v1/pipelines?limit=1'
```
- **suggested fix direction:** validate the header against the caller's organizations (400/403)

### CRM-FX-0040 [LOW / P3] a contact created with status 'archived' has no statusBeforeArchive (the archive flow records it)

- **endpoint:** `see case`
- **expected:** 400 or statusBeforeArchive set
- **actual:** 201 status=archived statusBeforeArchive=None
- **how-verified:** request/response + read-back
- **impact:** lifecycle rules can be bypassed
- **surfaces affected:** API-only
- **evidence ids:** (aggregate; see appendix tables)
- **suggested fix direction:** enforce transitions server-side

## 4. Blockers vs nice-to-have

| id | bucket | title | revenue or safety justification |
|---|---|---|---|
| CRM-FX-0001 | MEDIUM | a null byte in a search query (?q=a%00b) returns HTTP 500 on contacts, companies, deals and files | - |
| CRM-FX-0002 | MEDIUM | number custom properties accept integers beyond 2^53 and silently round them | - |
| CRM-FX-0003 | MEDIUM | state-changing requests with the session cookie are accepted from a hostile Origin (no Origin / Sec-Fetch-Site check on writes; login does check) | - |
| CRM-FX-0004 | MEDIUM | POST /pipelines/{id}/stages accepts a client-supplied id (every other unknown key is rejected) and the id can be reused by another pipeline | - |
| CRM-FX-0005 | MEDIUM | phone is not validated on companies, contacts | - |
| CRM-FX-0006 | MEDIUM | text fields accept NUL, CRLF and whitespace-only values (41 fields on 17 endpoints) | - |
| CRM-FX-0007 | LOW | integration: rule whose action points at records that do not exist | - |
| CRM-FX-0008 | LOW | integration: merge a source that does not exist | - |
| CRM-FX-0009 | LOW | integration: merge two contacts that each have a different email | - |
| CRM-FX-0010 | LOW | DELETE of a custom property only archives it; re-creating the key revives the same row (and can change its type); values are hidden, not removed | - |
| CRM-FX-0011 | LOW | stage order has a gap after a stage is deleted (0, 2 instead of 0, 1) | - |
| CRM-FX-0012 | LOW | unknown /api/* paths return HTTP 200 with an HTML page (soft 404) | - |
| CRM-FX-0013 | LOW | no GET-by-id route for the resource created by POST /contacts/custom-properties | - |
| CRM-FX-0014 | LOW | archived contacts: the obvious filter status=archived is rejected; only the undocumented bracket form status[in]=archived works | - |
| CRM-FX-0015 | LOW | audit events for deleted records lose the record name (the Audit page shows 'Unnamed') | - |
| CRM-FX-0016 | LOW | over-long URL error uses a different envelope and names the framework | - |
| CRM-FX-0017 | LOW | idempotent replays carry no marker header, so a client cannot tell a replay from a new create | - |
| CRM-FX-0018 | RETRACTED | activities do link via the attachments field | - |
| CRM-FX-0019 | LOW | automation rules run in a batch about two minutes after the event, with no hint in the UI or API | - |
| CRM-FX-0020 | LOW | a replayed Idempotency-Key returns a 'created' response for a record that has since been deleted | - |
| CRM-FX-0021 | LOW | no uniqueness rule: parallel creates of the same contact email or pipeline name produce one row each | - |
| CRM-FX-0022 | LOW | repeating an archive returns 200 for contacts and companies but 409 for pipelines and deals | - |
| CRM-FX-0023 | RETRACTED | lead-lifecycle routes exist at /leads/{id}/qualify\|disqualify\|convert — original probe used the wrong path | - |
| CRM-FX-0024 | LOW | moving a deal to the stage it is already in succeeds silently (200) | - |
| CRM-FX-0025 | LOW | internal identifiers are exposed: AWS account id inside the bucket host, temporary access-key id in presigned URLs, framework error code | - |
| CRM-FX-0026 | LOW | import has no update or skip duplicate mode (only create or reject) | - |
| CRM-FX-0027 | LOW | name limit counts UTF-16 units (100 emoji = 200 units) | - |
| CRM-FX-0028 | LOW | intermittent empty 502 instead of 413 for oversized request bodies (2 MB, 6 attempts) | - |
| CRM-FX-0029 | LOW | stages can be added to an archived pipeline (the page says an archived pipeline takes no new deals) | - |
| CRM-FX-0030 | LOW | timeZone is not validated on activities | - |
| CRM-FX-0031 | LOW | domain is not validated on companies | - |
| CRM-FX-0032 | LOW | PUT, DELETE and PATCH on a collection return 404 instead of 405, while OPTIONS advertises them in Allow | - |
| CRM-FX-0033 | LOW | TRACE returns a bare plain-text 500 instead of 405 | - |
| CRM-FX-0034 | LOW | duplicate JSON keys are accepted (the last one wins) on every write endpoint | - |
| CRM-FX-0035 | LOW | write endpoints accept a wrong or missing Content-Type (text/plain, application/xml, form-urlencoded, none) | - |
| CRM-FX-0036 | LOW | no rate-limit headers or Retry-After anywhere; no 429 observed | - |
| CRM-FX-0037 | LOW | response headers disclose the proxy/server product | - |
| CRM-FX-0038 | LOW | invalid text is silently replaced with U+FFFD instead of rejected (lone surrogates in 27+ fields, invalid UTF-8 bytes in a body) | - |
| CRM-FX-0039 | LOW | an unknown Crm-Org-Id header is accepted and treated as the default organization | - |
| CRM-FX-0040 | LOW | a contact created with status 'archived' has no statusBeforeArchive (the archive flow records it) | - |

## 5. Appendix A: field inventory

Built from the live UI/Network walkthrough, validation messages and the matrix (no spec exists). Text `min`/`max` are boundaries *discovered by bisection*, not assumed.

| operation | field | kind | required | min | max | enum | note |
|---|---|---|---|---|---|---|---|
| pipelines.create | name | str | yes | 1 | 120 | - |  |
| pipelines.create | stages | array | yes | 1 | 50 | - |  |
| pipelines.create | stages.0.name | str | yes | 1 | 120 | - |  |
| contact-properties.create | key | key | yes | 1 | 40 | - |  |
| contact-properties.create | label | str | yes | 1 | 120 | - |  |
| contact-properties.create | type | enum | yes | - | - | text,number,boolean,date |  |
| automation-rules.create | name | str | yes | 1 | 200 | - |  |
| automation-rules.create | trigger.eventType | enum | yes | - | - | deal.won,deal.lost,contact.created,deal.created,message.sent |  |
| automation-rules.create | action.type | enum | yes | - | - | activity.create,contact.update,deal.move,message.queue |  |
| automation-rules.create | action.fields.type | enum | yes | - | - | task,note,appointment,document |  |
| automation-rules.create | action.fields.title | str | yes | 1 | 2000 | - |  |
| automation-rules.create | conditions | array | no | 0 | 0 | - |  |
| activities.create.task | title | str | yes | 1 | 200 | - |  |
| activities.create.task | description | text | no | 1 | 19999 | - |  |
| activities.create.task | dueAt | datetime | no | - | - | - |  |
| activities.create.task | priority | enum | no | - | - | low,normal,high |  |
| activities.create.note | title | str | yes | 1 | 200 | - |  |
| activities.create.note | body | text | yes | 1 | 19999 | - |  |
| activities.create.call | title | str | yes | 1 | 200 | - |  |
| activities.create.call | direction | enum | yes | - | - | inbound,outbound |  |
| activities.create.call | outcome | enum | yes | - | - | connected,no_answer,voicemail,busy |  |
| activities.create.meeting | title | str | yes | 1 | 200 | - |  |
| activities.create.meeting | startsAt | datetime | yes | - | - | - |  |
| activities.create.meeting | endsAt | datetime | yes | - | - | - |  |
| activities.create.appointment | title | str | yes | 1 | 200 | - |  |
| activities.create.appointment | startsAt | datetime | yes | - | - | - |  |
| activities.create.appointment | endsAt | datetime | yes | - | - | - |  |
| activities.create.appointment | timeZone | tz | yes | - | - | - |  |
| activities.create.document | title | str | yes | 1 | 200 | - |  |
| activities.create.document | url | url | yes | 21 | 2000 | - |  |
| activities.create.document | fileName | str | yes | 1 | 255 | - |  |
| messages.create | contactId | id | yes | - | - | - |  |
| messages.create | channel | enum | yes | - | - | email,sms |  |
| messages.create | subject | str | no | 1 | 998 | - |  |
| messages.create | body | text | yes | 1 | >= 65536 (no rejection up to 65536) | - |  |
| close-reasons.put | reasons | array | yes | 0 | 50 | - |  |
| close-reasons.put | reasons.0.code | key | yes | 1 | 64 | - |  |
| close-reasons.put | reasons.0.label | str | yes | 1 | 120 | - |  |
| close-reasons.put | reasons.0.outcome | enum | yes | - | - | won,lost |  |
| files.create | fileName | str | yes | 1 | 255 | - |  |
| files.create | contentType | enum | yes | - | - | text/csv,text/plain,application/pdf,image/png,image/jpeg,image/gif,image/webp |  |
| files.create | byteSize | int | yes | - | - | - |  |
| pipelines.patch | name | str | yes | 1 | 120 | - |  |
| pipelines.stages.add | name | str | yes | 1 | 120 | - |  |
| deals.create | title | str | yes | 1 | 200 | - |  |
| deals.create | pipelineId | id | yes | - | - | - |  |
| deals.create | stageId | id | yes | - | - | - |  |
| deals.create | contactId | id | no | - | - | - |  |
| deals.create | companyId | id | no | - | - | - |  |
| deals.create | ownerActorId | id | no | - | - | - |  |
| deals.create | amount.amount | int | no | - | - | - |  |
| deals.create | amount.currency | currency | no | - | - | - |  |
| deals.create.lineItems | lineItems | array | no | 0 | 100 | - |  |
| deals.create.lineItems | lineItems.0.catalogProductId | id | no | - | - | - |  |
| deals.create.lineItems | lineItems.0.quantity | qty | no | - | - | - |  |
| deals.create.lineItems | lineItems.0.unitAmount | int | no | - | - | - |  |
| deals.create.lineItems | lineItems.0.currency | currency | no | - | - | - |  |
| deals.patch | title | str | yes | 1 | 200 | - |  |
| deals.patch | contactId | id | no | - | - | - |  |
| deals.patch | companyId | id | no | - | - | - |  |
| deals.patch | ownerActorId | id | no | - | - | - |  |
| contacts.create | firstName | str | yes | 1 | 200 | - |  |
| contacts.create | lastName | str | no | 1 | 200 | - |  |
| contacts.create | email | email | no | 13 | 320 | - |  |
| contacts.create | phone | phone | no | 1 | 50 | - |  |
| contacts.create | companyId | id | no | - | - | - |  |
| contacts.create | status | enum | no | - | - | lead,qualified,customer,archived |  |
| contacts.create | ownerActorId | id | no | - | - | - |  |
| contacts.create | customProperties | obj | no | - | - | - |  |
| contacts.create | customProperties.lead_source | str | no | 0 | 500 | - |  |
| contacts.create | customProperties.employee_count | num | no | - | - | - |  |
| contacts.create | customProperties.vip | bool | no | - | - | - |  |
| contacts.create | customProperties.renewal_date | date | no | - | - | - |  |
| contacts.patch | lastName | str | no | 1 | 200 | - |  |
| contacts.patch | email | email | no | 13 | 320 | - |  |
| contacts.patch | phone | phone | no | 1 | 50 | - |  |
| contacts.patch | companyId | id | no | - | - | - |  |
| contacts.patch | status | enum | no | - | - | lead,qualified,customer,archived |  |
| contacts.patch | ownerActorId | id | no | - | - | - |  |
| contacts.patch | customProperties | obj | no | - | - | - |  |
| contacts.patch | customProperties.lead_source | str | no | 0 | 500 | - |  |
| contacts.patch | customProperties.employee_count | num | no | - | - | - |  |
| contacts.patch | customProperties.vip | bool | no | - | - | - |  |
| contacts.patch | customProperties.renewal_date | date | no | - | - | - |  |
| contacts.patch | firstName | str | yes | 1 | 200 | - |  |
| companies.create | name | str | yes | 1 | 300 | - |  |
| companies.create | domain | domain | no | 1 | 300 | - |  |
| companies.create | phone | phone | no | 1 | 50 | - |  |
| companies.create | status | enum | no | - | - | active,archived |  |
| companies.create | ownerActorId | id | no | - | - | - |  |
| companies.patch | name | str | yes | 1 | 300 | - |  |
| companies.patch | domain | domain | no | 1 | 300 | - |  |
| companies.patch | phone | phone | no | 1 | 50 | - |  |
| companies.patch | status | enum | no | - | - | active,archived |  |
| companies.patch | ownerActorId | id | no | - | - | - |  |
| catalog-products.create | name | str | yes | 1 | 200 | - |  |
| catalog-products.create | description | text | no | 0 | 2000 | - |  |
| catalog-products.create | priceEntries | array | no | 0 | 4096 | - |  |
| catalog-products.create | priceEntries.0.label | str | yes | 1 | 120 | - |  |
| catalog-products.create | priceEntries.0.amount | int | yes | - | - | - |  |
| catalog-products.create | priceEntries.0.currency | currency | yes | - | - | - |  |
| catalog-products.patch | name | str | yes | 1 | 200 | - |  |
| catalog-products.patch | description | text | no | 0 | 2000 | - |  |

## 6. Appendix B: boundary-value results per field

| operation | field | min-1 | valid-min | valid-max | max+1 | note |
|---|---|---|---|---|---|---|
| pipelines.create | name | 0 -> 400 (REQ-00003) | 1 -> 201 (REQ-00004) | 120 -> 201 (REQ-00020) | 121 -> 400 (REQ-00022) |  |
| pipelines.create | stages | 0 -> 400 (REQ-00102) | 1 -> 201 (REQ-00103) | 50 -> 201 (REQ-00107) | 51 -> 400 (REQ-00108) | array length probe set |
| pipelines.create | stages.0.name | 0 -> 400 (REQ-00121) | 1 -> 201 (REQ-00122) | 120 -> 201 (REQ-00138) | 121 -> 400 (REQ-00140) |  |
| contact-properties.create | key | 0 -> 400 (REQ-D00004) | 1 -> 201 (REQ-D00005) | 40 -> 201 (REQ-D00042) | 41 -> 400 (REQ-D00045) |  |
| contact-properties.create | label | 0 -> 400 (REQ-D00082) | 1 -> 201 (REQ-D00083) | 120 -> 201 (REQ-D00107) | 121 -> 400 (REQ-D00110) |  |
| automation-rules.create | name | 0 -> 400 (REQ-B00178) | 1 -> 201 (REQ-B00179) | 200 -> 201 (REQ-B00201) | 201 -> 400 (REQ-B00203) |  |
| automation-rules.create | action.fields.title | 0 -> 400 (REQ-B00373) | 1 -> 201 (REQ-B00374) | 2000 -> 201 (REQ-B00412) | 2001 -> 400 (REQ-B00428) |  |
| automation-rules.create | conditions | - | 0 -> 201 (REQ-B00495) | 0 -> 201 (REQ-B00495) | 1 -> 400 (REQ-B00496) | array length probe set |
| activities.create.task | title | 0 -> 400 (REQ-B00611) | 1 -> 201 (REQ-B00612) | 200 -> 201 (REQ-B00634) | 201 -> 400 (REQ-B00636) |  |
| activities.create.task | description | 0 -> 400 (REQ-B00713) | 1 -> 201 (REQ-B00714) | 19999 -> 201 (REQ-B00778) | 20002 -> 400 (REQ-B00780) |  |
| activities.create.note | title | 0 -> 400 (REQ-B01030) | 1 -> 201 (REQ-B01031) | 200 -> 201 (REQ-B01053) | 201 -> 400 (REQ-B01055) |  |
| activities.create.note | body | 0 -> 400 (REQ-B01132) | 1 -> 201 (REQ-B01133) | 19999 -> 201 (REQ-B01197) | 20002 -> 400 (REQ-B01199) |  |
| activities.create.call | title | 0 -> 400 (REQ-B01363) | 1 -> 201 (REQ-B01364) | 200 -> 201 (REQ-B01386) | 201 -> 400 (REQ-B01388) |  |
| activities.create.meeting | title | 0 -> 400 (REQ-B01572) | 1 -> 201 (REQ-B01573) | 200 -> 201 (REQ-B01595) | 201 -> 400 (REQ-B01597) |  |
| activities.create.appointment | title | 0 -> 400 (REQ-B01795) | 1 -> 201 (REQ-B01796) | 200 -> 201 (REQ-B01818) | 201 -> 400 (REQ-B01820) |  |
| activities.create.document | title | 0 -> 400 (REQ-B02052) | 1 -> 201 (REQ-B02053) | 200 -> 201 (REQ-B02075) | 201 -> 400 (REQ-B02077) |  |
| activities.create.document | url | 20 -> 400 (REQ-B02213) | 21 -> 201 (REQ-B02208) | 2000 -> 201 (REQ-B02189) | 2001 -> 400 (REQ-B02205) |  |
| activities.create.document | fileName | 0 -> 400 (REQ-B02242) | 1 -> 201 (REQ-B02243) | 255 -> 201 (REQ-B02269) | 256 -> 400 (REQ-B02271) |  |
| messages.create | subject | 0 -> 400 (REQ-B02505) | 1 -> 202 (REQ-B02506) | 998 -> 202 (REQ-B02561) | 999 -> 400 (REQ-B02563) |  |
| messages.create | body | 0 -> 400 (REQ-B02626) | 1 -> 202 (REQ-B02627) | 65536 -> 202 (REQ-B02673) | - | no upper limit found up to 65536 characters |
| close-reasons.put | reasons | - | 0 -> 200 (REQ-B02845) | 50 -> 200 (REQ-B02850) | 51 -> 400 (REQ-B02851) | array length probe set |
| close-reasons.put | reasons.0.code | 0 -> 400 (REQ-B02864) | 1 -> 200 (REQ-B02865) | 64 -> 200 (REQ-B02870) | 65 -> 400 (REQ-B02871) |  |
| close-reasons.put | reasons.0.label | 0 -> 400 (REQ-B02912) | 1 -> 200 (REQ-B02913) | 120 -> 200 (REQ-B02921) | 121 -> 400 (REQ-B02922) |  |
| files.create | fileName | 0 -> 400 (REQ-B03006) | 1 -> 201 (REQ-B03007) | 255 -> 201 (REQ-B03033) | 256 -> 400 (REQ-B03035) |  |
| pipelines.patch | name | 0 -> 400 (REQ-A00002) | 1 -> 200 (REQ-A00003) | 120 -> 200 (REQ-A00019) | 121 -> 400 (REQ-A00021) |  |
| pipelines.stages.add | name | 0 -> 400 (REQ-A00103) | 1 -> 201 (REQ-A00104) | 120 -> 201 (REQ-A00112) | 121 -> 400 (REQ-A00113) |  |
| deals.create | title | 0 -> 400 (REQ-A00208) | 1 -> 201 (REQ-A00209) | 200 -> 201 (REQ-A00231) | 201 -> 400 (REQ-A00233) |  |
| deals.create.lineItems | lineItems | - | 0 -> 201 (REQ-A00620) | 100 -> 201 (REQ-A00627) | 256 -> 400 (REQ-A00628) | array length probe set |
| deals.patch | title | 0 -> 400 (REQ-A00828) | 1 -> 200 (REQ-A00829) | 200 -> 200 (REQ-A00851) | 201 -> 400 (REQ-A00853) |  |
| contacts.create | firstName | 0 -> 400 (REQ-A01033) | 1 -> 201 (REQ-A01034) | 200 -> 201 (REQ-A01056) | 201 -> 400 (REQ-A01058) |  |
| contacts.create | lastName | 0 -> 400 (REQ-A01136) | 1 -> 201 (REQ-A01137) | 200 -> 201 (REQ-A01159) | 201 -> 400 (REQ-A01161) |  |
| contacts.create | email | 12 -> 400 (REQ-A01293) | 13 -> 201 (REQ-A01294) | 320 -> 201 (REQ-A01282) | 321 -> 400 (REQ-A01285) |  |
| contacts.create | phone | 0 -> 400 (REQ-A01334) | 1 -> 201 (REQ-A01335) | 50 -> 201 (REQ-A01369) | 51 -> 400 (REQ-A01371) |  |
| contacts.create | customProperties.lead_source | - | 0 -> 201 (REQ-A01545) | 500 -> 201 (REQ-A01579) | 501 -> 400 (REQ-A01595) |  |
| contacts.patch | lastName | 0 -> 400 (REQ-A02022) | 1 -> 200 (REQ-A02023) | 200 -> 200 (REQ-A02045) | 201 -> 400 (REQ-A02047) |  |
| contacts.patch | email | 12 -> 400 (REQ-A02179) | 13 -> 200 (REQ-A02180) | 320 -> 200 (REQ-A02168) | 321 -> 400 (REQ-A02171) |  |
| contacts.patch | phone | 0 -> 400 (REQ-A02220) | 1 -> 200 (REQ-A02221) | 50 -> 200 (REQ-A02255) | 51 -> 400 (REQ-A02257) |  |
| contacts.patch | customProperties.lead_source | - | 0 -> 200 (REQ-A02429) | 500 -> 200 (REQ-A02463) | 501 -> 400 (REQ-A02479) |  |
| contacts.patch | firstName | 0 -> 400 (REQ-A02672) | 1 -> 200 (REQ-A02673) | 200 -> 200 (REQ-A02695) | 201 -> 400 (REQ-A02697) |  |
| companies.create | name | 0 -> 400 (REQ-A02777) | 1 -> 201 (REQ-A02778) | 300 -> 201 (REQ-A02827) | 301 -> 400 (REQ-A02829) |  |
| companies.create | domain | 0 -> 400 (REQ-A02896) | 1 -> 201 (REQ-A02897) | 300 -> 201 (REQ-A02946) | 301 -> 400 (REQ-A02948) |  |
| companies.create | phone | 0 -> 400 (REQ-A02991) | 1 -> 201 (REQ-A02992) | 50 -> 201 (REQ-A03026) | 51 -> 400 (REQ-A03028) |  |
| companies.patch | name | 0 -> 400 (REQ-A03281) | 1 -> 200 (REQ-A03282) | 300 -> 200 (REQ-A03331) | 301 -> 400 (REQ-A03333) |  |
| companies.patch | domain | 0 -> 400 (REQ-A03399) | 1 -> 200 (REQ-A03400) | 300 -> 200 (REQ-A03449) | 301 -> 400 (REQ-A03451) |  |
| companies.patch | phone | 0 -> 400 (REQ-A03494) | 1 -> 200 (REQ-A03495) | 50 -> 200 (REQ-A03529) | 51 -> 400 (REQ-A03531) |  |
| catalog-products.create | name | 0 -> 400 (REQ-A03656) | 1 -> 201 (REQ-A03657) | 200 -> 201 (REQ-A03679) | 201 -> 400 (REQ-A03681) |  |
| catalog-products.create | description | - | 0 -> 201 (REQ-A03758) | 2000 -> 201 (REQ-A03798) | 2001 -> 400 (REQ-A03814) |  |
| catalog-products.create | priceEntries | - | 0 -> 201 (REQ-A03882) | 4096 -> 201 (REQ-A03892) | 65536 -> 413 (REQ-A03893) | array length probe set |
| catalog-products.create | priceEntries.0.label | 0 -> 400 (REQ-A03901) | 1 -> 201 (REQ-A03902) | 120 -> 201 (REQ-A03918) | 121 -> 400 (REQ-A03920) |  |
| catalog-products.patch | name | 0 -> 400 (REQ-A04227) | 1 -> 200 (REQ-A04228) | 200 -> 200 (REQ-A04250) | 201 -> 400 (REQ-A04252) |  |
| catalog-products.patch | description | - | 0 -> 200 (REQ-A04328) | 2000 -> 200 (REQ-A04368) | 2001 -> 400 (REQ-A04384) |  |

## 7. Appendix C: type and representation results (flagged cases)

231 flagged of 4692 cases; the rest behaved as expected or have no firm expectation (all rows are in `reports/audit/matrix_*.json`).

| op | field | case | sent | status | code | message | verdict | rid | read-back |
|---|---|---|---|---|---|---|---|---|---|
| pipelines.create | name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-00068 |  |
| pipelines.create | name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-00070 |  |
| pipelines.create | name | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-00072 | MUTATED: sent='\ud800' stored='�' |
| pipelines.create | name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-00098 | normalised: trimmed |
| pipelines.create | stages | array length=65536 | <65536 items> | 502 |  |  | SERVER-ERROR | REQ-00113 |  |
| pipelines.create | stages.0.name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-00186 |  |
| pipelines.create | stages.0.name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-00188 |  |
| pipelines.create | stages.0.name | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-00190 | MUTATED: sent='\ud800' stored='�' |
| pipelines.create | stages.0.name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-00216 | normalised: trimmed |
| contact-properties.create | label | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-D00126 | READBACK-FAILED status 404 |
| contact-properties.create | label | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-D00166 | READBACK-FAILED status 404 |
| contact-properties.create | label | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-D00169 | READBACK-FAILED status 404 |
| contact-properties.create | label | lone surrogate | '\ud800' | 201 |  |  | ACCEPTED-INVALID | REQ-D00172 | READBACK-FAILED status 404 |
| contact-properties.create | label | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-D00211 | READBACK-FAILED status 404 |
| automation-rules.create | name | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-B00216 |  |
| automation-rules.create | name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-B00247 |  |
| automation-rules.create | name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-B00249 |  |
| automation-rules.create | name | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-B00251 | MUTATED: sent='\ud800' stored='�' |
| automation-rules.create | name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-B00277 |  |
| automation-rules.create | action.fields.title | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-B00430 |  |
| automation-rules.create | action.fields.title | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-B00461 |  |
| automation-rules.create | action.fields.title | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-B00463 |  |
| automation-rules.create | action.fields.title | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-B00465 | MUTATED: sent='\ud800' stored='�' |
| automation-rules.create | action.fields.title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-B00491 |  |
| automation-rules.create | conditions | array length=65536 | <65536 items> | 502 |  |  | SERVER-ERROR | REQ-B00506 |  |
| activities.create.task | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B00679 |  |
| activities.create.task | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B00681 |  |
| activities.create.task | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B00683 | MUTATED: sent='\ud800' stored='�' |
| activities.create.task | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B00709 | normalised: trimmed |
| activities.create.task | description | whitespace only | '   ' | 201 |  | Audit task | ACCEPTED-INVALID | REQ-B00782 |  |
| activities.create.task | description | NUL only | '\x00' | 201 |  | Audit task | ACCEPTED-INVALID | REQ-B00814 |  |
| activities.create.task | description | NUL inside | 'a\x00b' | 201 |  | Audit task | ACCEPTED-INVALID | REQ-B00816 |  |
| activities.create.task | description | lone surrogate | '\ud800' | 201 |  | Audit task | SILENT-MUTATION | REQ-B00818 | MUTATED: sent='\ud800' stored='�' |
| activities.create.task | description | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Audit task | ACCEPTED-INVALID | REQ-B00844 |  |
| activities.create.note | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B01098 |  |
| activities.create.note | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B01100 |  |
| activities.create.note | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B01102 | MUTATED: sent='\ud800' stored='�' |
| activities.create.note | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B01128 | normalised: trimmed |
| activities.create.note | body | whitespace only | '   ' | 201 |  | Audit note | ACCEPTED-INVALID | REQ-B01201 |  |
| activities.create.note | body | NUL only | '\x00' | 201 |  | Audit note | ACCEPTED-INVALID | REQ-B01232 |  |
| activities.create.note | body | NUL inside | 'a\x00b' | 201 |  | Audit note | ACCEPTED-INVALID | REQ-B01234 |  |
| activities.create.note | body | lone surrogate | '\ud800' | 201 |  | Audit note | SILENT-MUTATION | REQ-B01236 | MUTATED: sent='\ud800' stored='�' |
| activities.create.note | body | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Audit note | ACCEPTED-INVALID | REQ-B01262 |  |
| activities.create.call | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B01431 |  |
| activities.create.call | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B01433 |  |
| activities.create.call | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B01435 | MUTATED: sent='\ud800' stored='�' |
| activities.create.call | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B01461 | normalised: trimmed |
| activities.create.meeting | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B01640 |  |
| activities.create.meeting | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B01642 |  |
| activities.create.meeting | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B01644 | MUTATED: sent='\ud800' stored='�' |
| activities.create.meeting | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B01670 | normalised: trimmed |
| activities.create.appointment | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B01863 |  |
| activities.create.appointment | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B01865 |  |
| activities.create.appointment | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B01867 | MUTATED: sent='\ud800' stored='�' |
| activities.create.appointment | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B01893 | normalised: trimmed |
| activities.create.appointment | timeZone | lower case | 'australia/sydney' | 201 |  | Audit appt | ACCEPTED-INVALID | REQ-B01999 |  |
| activities.create.document | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-B02120 |  |
| activities.create.document | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-B02122 |  |
| activities.create.document | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-B02124 | MUTATED: sent='\ud800' stored='�' |
| activities.create.document | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-B02150 | normalised: trimmed |
| activities.create.document | fileName | whitespace only | '   ' | 201 |  | Audit doc | ACCEPTED-INVALID | REQ-B02282 |  |
| activities.create.document | fileName | NUL only | '\x00' | 201 |  | Audit doc | ACCEPTED-INVALID | REQ-B02313 |  |
| activities.create.document | fileName | NUL inside | 'a\x00b' | 201 |  | Audit doc | ACCEPTED-INVALID | REQ-B02315 |  |
| activities.create.document | fileName | lone surrogate | '\ud800' | 201 |  | Audit doc | SILENT-MUTATION | REQ-B02317 | MUTATED: sent='\ud800' stored='�' |
| activities.create.document | fileName | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Audit doc | ACCEPTED-INVALID | REQ-B02343 |  |
| messages.create | subject | whitespace only | '   ' | 202 |  |  | ACCEPTED-INVALID | REQ-B02565 |  |
| messages.create | subject | lone surrogate | '\ud800' | 202 |  |  | SILENT-MUTATION | REQ-B02598 | MUTATED: sent='\ud800' stored='�' |
| messages.create | body | whitespace only | '   ' | 202 |  |  | ACCEPTED-INVALID | REQ-B02676 |  |
| messages.create | body | NUL only | '\x00' | 202 |  |  | ACCEPTED-INVALID | REQ-B02707 |  |
| messages.create | body | NUL inside | 'a\x00b' | 202 |  |  | ACCEPTED-INVALID | REQ-B02709 |  |
| messages.create | body | lone surrogate | '\ud800' | 202 |  |  | SILENT-MUTATION | REQ-B02711 | MUTATED: sent='\ud800' stored='�' |
| messages.create | body | CRLF injection | '\r\nSet-Cookie: x=y' | 202 |  |  | ACCEPTED-INVALID | REQ-B02737 |  |
| close-reasons.put | reasons.0.label | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-B02960 |  |
| close-reasons.put | reasons.0.label | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-B02961 |  |
| close-reasons.put | reasons.0.label | lone surrogate | '\ud800' | 200 |  |  | ACCEPTED-INVALID | REQ-B02962 |  |
| close-reasons.put | reasons.0.label | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-B02975 |  |
| files.create | fileName | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-B03046 |  |
| files.create | fileName | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-B03079 | MUTATED: sent='\ud800' stored='�' |
| pipelines.patch | name | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A00066 |  |
| pipelines.patch | name | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A00068 |  |
| pipelines.patch | name | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A00070 | MUTATED: sent='\ud800' stored='�' |
| pipelines.patch | name | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A00096 | normalised: trimmed |
| pipelines.stages.add | name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A00151 |  |
| pipelines.stages.add | name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A00152 |  |
| pipelines.stages.add | name | lone surrogate | '\ud800' | 201 |  |  | ACCEPTED-INVALID | REQ-A00153 |  |
| pipelines.stages.add | name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A00166 |  |
| deals.create | title | NUL only | '\x00' | 201 |  | \x00 | ACCEPTED-INVALID | REQ-A00276 |  |
| deals.create | title | NUL inside | 'a\x00b' | 201 |  | a\x00b | ACCEPTED-INVALID | REQ-A00278 |  |
| deals.create | title | lone surrogate | '\ud800' | 201 |  | \ud800 | SILENT-MUTATION | REQ-A00280 | MUTATED: sent='\ud800' stored='�' |
| deals.create | title | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-A00306 | normalised: trimmed |
| deals.create.lineItems | lineItems | array length=65536 | <65536 items> | 502 |  |  | SERVER-ERROR | REQ-A00631 |  |
| deals.patch | title | NUL only | '\x00' | 200 |  | \x00 | ACCEPTED-INVALID | REQ-A00895 |  |
| deals.patch | title | NUL inside | 'a\x00b' | 200 |  | a\x00b | ACCEPTED-INVALID | REQ-A00897 |  |
| deals.patch | title | lone surrogate | '\ud800' | 200 |  | � | SILENT-MUTATION | REQ-A00899 | MUTATED: sent='\ud800' stored='�' |
| deals.patch | title | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  | Set-Cookie: x=y | ACCEPTED-INVALID | REQ-A00925 | normalised: trimmed |
| contacts.create | firstName | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A01071 |  |
| contacts.create | firstName | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A01102 |  |
| contacts.create | firstName | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A01104 |  |
| contacts.create | firstName | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A01106 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | firstName | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A01132 |  |
| contacts.create | lastName | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A01174 |  |
| contacts.create | lastName | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A01205 |  |
| contacts.create | lastName | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A01207 |  |
| contacts.create | lastName | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A01209 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | lastName | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A01235 |  |
| contacts.create | phone | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A01373 |  |
| contacts.create | phone | string "true" | 'true' | 201 |  |  | ACCEPTED-INVALID | REQ-A01383 |  |
| contacts.create | phone | string "false" | 'false' | 201 |  |  | ACCEPTED-INVALID | REQ-A01385 |  |
| contacts.create | phone | string "yes" | 'yes' | 201 |  |  | ACCEPTED-INVALID | REQ-A01387 |  |
| contacts.create | phone | string "no" | 'no' | 201 |  |  | ACCEPTED-INVALID | REQ-A01389 |  |
| contacts.create | phone | prefix only +61 4 | '+61 4' | 201 |  |  | ACCEPTED-INVALID | REQ-A01410 |  |
| contacts.create | phone | letters 0412ABC678 | '0412ABC678' | 201 |  |  | ACCEPTED-INVALID | REQ-A01412 |  |
| contacts.create | phone | one digit | '1' | 201 |  |  | ACCEPTED-INVALID | REQ-A01414 |  |
| contacts.create | phone | 40 digits | '9999999999999999999999999999999999999999' | 201 |  |  | ACCEPTED-INVALID | REQ-A01416 |  |
| contacts.create | phone | SQLi | "' OR 1=1 --" | 201 |  |  | ACCEPTED-INVALID | REQ-A01420 |  |
| contacts.create | phone | XSS | '<script>alert(1)</script>' | 201 |  |  | ACCEPTED-INVALID | REQ-A01422 |  |
| contacts.create | customProperties.lead_source | empty string | '' | 201 |  |  | ACCEPTED-INVALID | REQ-A01596 |  |
| contacts.create | customProperties.lead_source | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A01598 |  |
| contacts.create | customProperties.lead_source | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A01630 |  |
| contacts.create | customProperties.lead_source | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A01632 |  |
| contacts.create | customProperties.lead_source | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A01634 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | customProperties.lead_source | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A01660 |  |
| contacts.create | customProperties.employee_count | -9223372036854775808 | -9223372036854775808 | 201 |  |  | SILENT-MUTATION | REQ-A01700 | MUTATED: sent=-9223372036854775808 stored=-9223372036854776000 |
| contacts.create | customProperties.employee_count | 9223372036854775807 | 9223372036854775807 | 201 |  |  | SILENT-MUTATION | REQ-A01718 | MUTATED: sent=9223372036854775807 stored=9223372036854776000 |
| contacts.patch | lastName | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A02060 |  |
| contacts.patch | lastName | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A02091 |  |
| contacts.patch | lastName | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A02093 |  |
| contacts.patch | lastName | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A02095 | MUTATED: sent='\ud800' stored='�' |
| contacts.patch | lastName | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A02121 |  |
| contacts.patch | phone | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A02259 |  |
| contacts.patch | phone | string "true" | 'true' | 200 |  |  | ACCEPTED-INVALID | REQ-A02269 |  |
| contacts.patch | phone | string "false" | 'false' | 200 |  |  | ACCEPTED-INVALID | REQ-A02271 |  |
| contacts.patch | phone | string "yes" | 'yes' | 200 |  |  | ACCEPTED-INVALID | REQ-A02273 |  |
| contacts.patch | phone | string "no" | 'no' | 200 |  |  | ACCEPTED-INVALID | REQ-A02275 |  |
| contacts.patch | phone | prefix only +61 4 | '+61 4' | 200 |  |  | ACCEPTED-INVALID | REQ-A02296 |  |
| contacts.patch | phone | letters 0412ABC678 | '0412ABC678' | 200 |  |  | ACCEPTED-INVALID | REQ-A02298 |  |
| contacts.patch | phone | one digit | '1' | 200 |  |  | ACCEPTED-INVALID | REQ-A02300 |  |
| contacts.patch | phone | 40 digits | '9999999999999999999999999999999999999999' | 200 |  |  | ACCEPTED-INVALID | REQ-A02302 |  |
| contacts.patch | phone | SQLi | "' OR 1=1 --" | 200 |  |  | ACCEPTED-INVALID | REQ-A02306 |  |
| contacts.patch | phone | XSS | '<script>alert(1)</script>' | 200 |  |  | ACCEPTED-INVALID | REQ-A02308 |  |
| contacts.patch | customProperties.lead_source | empty string | '' | 200 |  |  | ACCEPTED-INVALID | REQ-A02480 |  |
| contacts.patch | customProperties.lead_source | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A02482 |  |
| contacts.patch | customProperties.lead_source | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A02514 |  |
| contacts.patch | customProperties.lead_source | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A02516 |  |
| contacts.patch | customProperties.lead_source | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A02518 | MUTATED: sent='\ud800' stored='�' |
| contacts.patch | customProperties.lead_source | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A02544 |  |
| contacts.patch | customProperties.employee_count | -9223372036854775808 | -9223372036854775808 | 200 |  |  | SILENT-MUTATION | REQ-A02584 | MUTATED: sent=-9223372036854775808 stored=-9223372036854776000 |
| contacts.patch | customProperties.employee_count | 9223372036854775807 | 9223372036854775807 | 200 |  |  | SILENT-MUTATION | REQ-A02602 | MUTATED: sent=9223372036854775807 stored=9223372036854776000 |
| contacts.patch | firstName | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A02710 |  |
| contacts.patch | firstName | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A02740 |  |
| contacts.patch | firstName | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A02742 |  |
| contacts.patch | firstName | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A02744 | MUTATED: sent='\ud800' stored='�' |
| contacts.patch | firstName | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A02770 |  |
| companies.create | name | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A02831 |  |
| companies.create | name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A02862 |  |
| companies.create | name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A02864 |  |
| companies.create | name | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A02866 | MUTATED: sent='\ud800' stored='�' |
| companies.create | name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A02892 |  |
| companies.create | domain | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A02950 |  |
| companies.create | domain | string "true" | 'true' | 201 |  |  | ACCEPTED-INVALID | REQ-A02960 |  |
| companies.create | domain | string "false" | 'false' | 201 |  |  | ACCEPTED-INVALID | REQ-A02962 |  |
| companies.create | domain | string "yes" | 'yes' | 201 |  |  | ACCEPTED-INVALID | REQ-A02964 |  |
| companies.create | domain | string "no" | 'no' | 201 |  |  | ACCEPTED-INVALID | REQ-A02966 |  |
| companies.create | domain | with scheme | 'https://example.com' | 201 |  |  | ACCEPTED-INVALID | REQ-A02977 |  |
| companies.create | domain | with path | 'example.com/path' | 201 |  |  | ACCEPTED-INVALID | REQ-A02979 |  |
| companies.create | domain | spaces | 'not a domain' | 201 |  |  | ACCEPTED-INVALID | REQ-A02981 |  |
| companies.create | domain | trailing dot | 'example.com.' | 201 |  |  | ACCEPTED-INVALID | REQ-A02983 |  |
| companies.create | domain | underscore | 'a_b.example.com' | 201 |  |  | ACCEPTED-INVALID | REQ-A02985 |  |
| companies.create | domain | single label | 'localhost' | 201 |  |  | ACCEPTED-INVALID | REQ-A02987 |  |
| companies.create | phone | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A03030 |  |
| companies.create | phone | string "true" | 'true' | 201 |  |  | ACCEPTED-INVALID | REQ-A03040 |  |
| companies.create | phone | string "false" | 'false' | 201 |  |  | ACCEPTED-INVALID | REQ-A03042 |  |
| companies.create | phone | string "yes" | 'yes' | 201 |  |  | ACCEPTED-INVALID | REQ-A03044 |  |
| companies.create | phone | string "no" | 'no' | 201 |  |  | ACCEPTED-INVALID | REQ-A03046 |  |
| companies.create | phone | prefix only +61 4 | '+61 4' | 201 |  |  | ACCEPTED-INVALID | REQ-A03067 |  |
| companies.create | phone | letters 0412ABC678 | '0412ABC678' | 201 |  |  | ACCEPTED-INVALID | REQ-A03069 |  |
| companies.create | phone | one digit | '1' | 201 |  |  | ACCEPTED-INVALID | REQ-A03071 |  |
| companies.create | phone | 40 digits | '9999999999999999999999999999999999999999' | 201 |  |  | ACCEPTED-INVALID | REQ-A03073 |  |
| companies.create | phone | SQLi | "' OR 1=1 --" | 201 |  |  | ACCEPTED-INVALID | REQ-A03077 |  |
| companies.create | phone | XSS | '<script>alert(1)</script>' | 201 |  |  | ACCEPTED-INVALID | REQ-A03079 |  |
| companies.patch | name | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A03335 |  |
| companies.patch | name | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A03365 |  |
| companies.patch | name | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A03367 |  |
| companies.patch | name | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A03369 | MUTATED: sent='\ud800' stored='�' |
| companies.patch | name | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A03395 |  |
| companies.patch | domain | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A03453 |  |
| companies.patch | domain | string "true" | 'true' | 200 |  |  | ACCEPTED-INVALID | REQ-A03463 |  |
| companies.patch | domain | string "false" | 'false' | 200 |  |  | ACCEPTED-INVALID | REQ-A03465 |  |
| companies.patch | domain | string "yes" | 'yes' | 200 |  |  | ACCEPTED-INVALID | REQ-A03467 |  |
| companies.patch | domain | string "no" | 'no' | 200 |  |  | ACCEPTED-INVALID | REQ-A03469 |  |
| companies.patch | domain | with scheme | 'https://example.com' | 200 |  |  | ACCEPTED-INVALID | REQ-A03480 |  |
| companies.patch | domain | with path | 'example.com/path' | 200 |  |  | ACCEPTED-INVALID | REQ-A03482 |  |
| companies.patch | domain | spaces | 'not a domain' | 200 |  |  | ACCEPTED-INVALID | REQ-A03484 |  |
| companies.patch | domain | trailing dot | 'example.com.' | 200 |  |  | ACCEPTED-INVALID | REQ-A03486 |  |
| companies.patch | domain | underscore | 'a_b.example.com' | 200 |  |  | ACCEPTED-INVALID | REQ-A03488 |  |
| companies.patch | domain | single label | 'localhost' | 200 |  |  | ACCEPTED-INVALID | REQ-A03490 |  |
| companies.patch | phone | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A03533 |  |
| companies.patch | phone | string "true" | 'true' | 200 |  |  | ACCEPTED-INVALID | REQ-A03543 |  |
| companies.patch | phone | string "false" | 'false' | 200 |  |  | ACCEPTED-INVALID | REQ-A03545 |  |
| companies.patch | phone | string "yes" | 'yes' | 200 |  |  | ACCEPTED-INVALID | REQ-A03547 |  |
| companies.patch | phone | string "no" | 'no' | 200 |  |  | ACCEPTED-INVALID | REQ-A03549 |  |
| companies.patch | phone | prefix only +61 4 | '+61 4' | 200 |  |  | ACCEPTED-INVALID | REQ-A03570 |  |
| companies.patch | phone | letters 0412ABC678 | '0412ABC678' | 200 |  |  | ACCEPTED-INVALID | REQ-A03572 |  |
| companies.patch | phone | one digit | '1' | 200 |  |  | ACCEPTED-INVALID | REQ-A03574 |  |
| companies.patch | phone | 40 digits | '9999999999999999999999999999999999999999' | 200 |  |  | ACCEPTED-INVALID | REQ-A03576 |  |
| companies.patch | phone | SQLi | "' OR 1=1 --" | 200 |  |  | ACCEPTED-INVALID | REQ-A03580 |  |
| companies.patch | phone | XSS | '<script>alert(1)</script>' | 200 |  |  | ACCEPTED-INVALID | REQ-A03582 |  |
| catalog-products.create | name | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A03724 |  |
| catalog-products.create | name | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A03726 |  |
| catalog-products.create | name | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A03728 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | name | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A03754 | normalised: trimmed |
| catalog-products.create | description | empty string | '' | 201 |  |  | ACCEPTED-INVALID | REQ-A03815 |  |
| catalog-products.create | description | whitespace only | '   ' | 201 |  |  | ACCEPTED-INVALID | REQ-A03817 |  |
| catalog-products.create | description | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A03848 |  |
| catalog-products.create | description | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A03850 |  |
| catalog-products.create | description | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A03852 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | description | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A03878 |  |
| catalog-products.create | priceEntries.0.label | NUL only | '\x00' | 201 |  |  | ACCEPTED-INVALID | REQ-A03966 |  |
| catalog-products.create | priceEntries.0.label | NUL inside | 'a\x00b' | 201 |  |  | ACCEPTED-INVALID | REQ-A03968 |  |
| catalog-products.create | priceEntries.0.label | lone surrogate | '\ud800' | 201 |  |  | SILENT-MUTATION | REQ-A03970 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | priceEntries.0.label | CRLF injection | '\r\nSet-Cookie: x=y' | 201 |  |  | ACCEPTED-INVALID | REQ-A03996 | normalised: trimmed |
| catalog-products.patch | name | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A04294 |  |
| catalog-products.patch | name | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A04296 |  |
| catalog-products.patch | name | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A04298 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.patch | name | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A04324 | normalised: trimmed |
| catalog-products.patch | description | empty string | '' | 200 |  |  | ACCEPTED-INVALID | REQ-A04385 |  |
| catalog-products.patch | description | whitespace only | '   ' | 200 |  |  | ACCEPTED-INVALID | REQ-A04387 |  |
| catalog-products.patch | description | NUL only | '\x00' | 200 |  |  | ACCEPTED-INVALID | REQ-A04418 |  |
| catalog-products.patch | description | NUL inside | 'a\x00b' | 200 |  |  | ACCEPTED-INVALID | REQ-A04420 |  |
| catalog-products.patch | description | lone surrogate | '\ud800' | 200 |  |  | SILENT-MUTATION | REQ-A04422 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.patch | description | CRLF injection | '\r\nSet-Cookie: x=y' | 200 |  |  | ACCEPTED-INVALID | REQ-A04448 |  |

## 8. Appendix D: read-back evidence (requested vs stored)

1993 accepted writes; each was followed by a GET; 110 showed a difference.

| op | field | case | write rid | read-back rid | difference |
|---|---|---|---|---|---|
| pipelines.create | name | lone surrogate | REQ-00072 | REQ-00073 | MUTATED: sent='\ud800' stored='�' |
| pipelines.create | name | CRLF injection | REQ-00098 | REQ-00099 | normalised: trimmed |
| pipelines.create | stages.0.name | lone surrogate | REQ-00190 | REQ-00191 | MUTATED: sent='\ud800' stored='�' |
| pipelines.create | stages.0.name | CRLF injection | REQ-00216 | REQ-00217 | normalised: trimmed |
| contact-properties.create | key | string "true" | REQ-D00056 | REQ-D00057 | READBACK-FAILED status 404 |
| contact-properties.create | key | string "false" | REQ-D00059 | REQ-D00060 | READBACK-FAILED status 404 |
| contact-properties.create | key | string "yes" | REQ-D00062 | REQ-D00063 | READBACK-FAILED status 404 |
| contact-properties.create | key | string "no" | REQ-D00065 | REQ-D00066 | READBACK-FAILED status 404 |
| contact-properties.create | key | valid | REQ-D00078 | REQ-D00079 | READBACK-FAILED status 404 |
| contact-properties.create | label | whitespace only | REQ-D00126 | REQ-D00127 | READBACK-FAILED status 404 |
| contact-properties.create | label | string "true" | REQ-D00137 | REQ-D00138 | READBACK-FAILED status 404 |
| contact-properties.create | label | string "false" | REQ-D00140 | REQ-D00141 | READBACK-FAILED status 404 |
| contact-properties.create | label | string "yes" | REQ-D00143 | REQ-D00144 | READBACK-FAILED status 404 |
| contact-properties.create | label | string "no" | REQ-D00146 | REQ-D00147 | READBACK-FAILED status 404 |
| contact-properties.create | label | emoji only | REQ-D00154 | REQ-D00155 | READBACK-FAILED status 404 |
| contact-properties.create | label | ZWJ family | REQ-D00157 | REQ-D00158 | READBACK-FAILED status 404 |
| contact-properties.create | label | RTL Arabic | REQ-D00160 | REQ-D00161 | READBACK-FAILED status 404 |
| contact-properties.create | label | combining marks | REQ-D00163 | REQ-D00164 | READBACK-FAILED status 404 |
| contact-properties.create | label | NUL only | REQ-D00166 | REQ-D00167 | READBACK-FAILED status 404 |
| contact-properties.create | label | NUL inside | REQ-D00169 | REQ-D00170 | READBACK-FAILED status 404 |
| contact-properties.create | label | lone surrogate | REQ-D00172 | REQ-D00173 | READBACK-FAILED status 404 |
| contact-properties.create | label | case-fold Aa | REQ-D00175 | REQ-D00176 | READBACK-FAILED status 404 |
| contact-properties.create | label | case-fold AE ligature | REQ-D00178 | REQ-D00179 | READBACK-FAILED status 404 |
| contact-properties.create | label | NFC n-tilde (U+00F1) | REQ-D00181 | REQ-D00182 | READBACK-FAILED status 404 |
| contact-properties.create | label | NFD n-tilde (n + U+0303) | REQ-D00184 | REQ-D00185 | READBACK-FAILED status 404 |
| contact-properties.create | label | RTL override | REQ-D00187 | REQ-D00188 | READBACK-FAILED status 404 |
| contact-properties.create | label | zero-width space | REQ-D00190 | REQ-D00191 | READBACK-FAILED status 404 |
| contact-properties.create | label | tab | REQ-D00193 | REQ-D00194 | READBACK-FAILED status 404 |
| contact-properties.create | label | newline | REQ-D00196 | REQ-D00197 | READBACK-FAILED status 404 |
| contact-properties.create | label | SQLi | REQ-D00199 | REQ-D00200 | READBACK-FAILED status 404 |
| contact-properties.create | label | XSS | REQ-D00202 | REQ-D00203 | READBACK-FAILED status 404 |
| contact-properties.create | label | XML close tag | REQ-D00205 | REQ-D00206 | READBACK-FAILED status 404 |
| contact-properties.create | label | path traversal | REQ-D00208 | REQ-D00209 | READBACK-FAILED status 404 |
| contact-properties.create | label | CRLF injection | REQ-D00211 | REQ-D00212 | READBACK-FAILED status 404 |
| contact-properties.create | label | number-like string 00012 | REQ-D00214 | REQ-D00215 | READBACK-FAILED status 404 |
| contact-properties.create | type | valid text | REQ-D00236 | REQ-D00237 | READBACK-FAILED status 404 |
| contact-properties.create | type | valid number | REQ-D00239 | REQ-D00240 | READBACK-FAILED status 404 |
| contact-properties.create | type | valid boolean | REQ-D00242 | REQ-D00243 | READBACK-FAILED status 404 |
| contact-properties.create | type | valid date | REQ-D00245 | REQ-D00246 | READBACK-FAILED status 404 |
| automation-rules.create | name | lone surrogate | REQ-B00251 | REQ-B00252 | MUTATED: sent='\ud800' stored='�' |
| automation-rules.create | action.fields.title | lone surrogate | REQ-B00465 | REQ-B00466 | MUTATED: sent='\ud800' stored='�' |
| activities.create.task | title | lone surrogate | REQ-B00683 | REQ-B00684 | MUTATED: sent='\ud800' stored='�' |
| activities.create.task | title | CRLF injection | REQ-B00709 | REQ-B00710 | normalised: trimmed |
| activities.create.task | description | lone surrogate | REQ-B00818 | REQ-B00819 | MUTATED: sent='\ud800' stored='�' |
| activities.create.task | dueAt | DST-end literal from brief +09:00 | REQ-B00868 | REQ-B00869 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.task | dueAt | Sydney DST start gap (02:30 does not exist on 2026-10-04) | REQ-B00870 | REQ-B00871 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.task | dueAt | Sydney DST end ambiguous 02:30 on 2026-04-05 | REQ-B00872 | REQ-B00873 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.task | dueAt | epoch one second before | REQ-B00874 | REQ-B00875 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.task | dueAt | epoch | REQ-B00876 | REQ-B00877 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.task | dueAt | year 9999 end | REQ-B00878 | REQ-B00879 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.note | title | lone surrogate | REQ-B01102 | REQ-B01103 | MUTATED: sent='\ud800' stored='�' |
| activities.create.note | title | CRLF injection | REQ-B01128 | REQ-B01129 | normalised: trimmed |
| activities.create.note | body | lone surrogate | REQ-B01236 | REQ-B01237 | MUTATED: sent='\ud800' stored='�' |
| activities.create.call | title | lone surrogate | REQ-B01435 | REQ-B01436 | MUTATED: sent='\ud800' stored='�' |
| activities.create.call | title | CRLF injection | REQ-B01461 | REQ-B01462 | normalised: trimmed |
| activities.create.meeting | title | lone surrogate | REQ-B01644 | REQ-B01645 | MUTATED: sent='\ud800' stored='�' |
| activities.create.meeting | title | CRLF injection | REQ-B01670 | REQ-B01671 | normalised: trimmed |
| activities.create.meeting | startsAt | DST-end literal from brief +09:00 | REQ-B01693 | REQ-B01694 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.meeting | startsAt | Sydney DST start gap (02:30 does not exist on 2026-10-04) | REQ-B01695 | REQ-B01696 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.meeting | startsAt | Sydney DST end ambiguous 02:30 on 2026-04-05 | REQ-B01697 | REQ-B01698 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.meeting | startsAt | epoch one second before | REQ-B01699 | REQ-B01700 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.meeting | startsAt | epoch | REQ-B01701 | REQ-B01702 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.meeting | endsAt | year 9999 end | REQ-B01737 | REQ-B01738 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | title | lone surrogate | REQ-B01867 | REQ-B01868 | MUTATED: sent='\ud800' stored='�' |
| activities.create.appointment | title | CRLF injection | REQ-B01893 | REQ-B01894 | normalised: trimmed |
| activities.create.appointment | startsAt | DST-end literal from brief +09:00 | REQ-B01916 | REQ-B01917 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | startsAt | Sydney DST start gap (02:30 does not exist on 2026-10-04) | REQ-B01918 | REQ-B01919 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | startsAt | Sydney DST end ambiguous 02:30 on 2026-04-05 | REQ-B01920 | REQ-B01921 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | startsAt | epoch one second before | REQ-B01922 | REQ-B01923 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | startsAt | epoch | REQ-B01924 | REQ-B01925 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.appointment | endsAt | year 9999 end | REQ-B01960 | REQ-B01961 | normalised: same instant, stored as UTC with milliseconds |
| activities.create.document | title | lone surrogate | REQ-B02124 | REQ-B02125 | MUTATED: sent='\ud800' stored='�' |
| activities.create.document | title | CRLF injection | REQ-B02150 | REQ-B02151 | normalised: trimmed |
| activities.create.document | fileName | lone surrogate | REQ-B02317 | REQ-B02318 | MUTATED: sent='\ud800' stored='�' |
| messages.create | subject | lone surrogate | REQ-B02598 | REQ-B02599 | MUTATED: sent='\ud800' stored='�' |
| messages.create | body | lone surrogate | REQ-B02711 | REQ-B02712 | MUTATED: sent='\ud800' stored='�' |
| files.create | fileName | lone surrogate | REQ-B03079 | REQ-B03080 | MUTATED: sent='\ud800' stored='�' |
| files.create | contentType | UPPER text/csv | REQ-B03138 | REQ-B03139 | normalised: MIME type lower-cased |
| files.create | contentType | UPPER text/plain | REQ-B03140 | REQ-B03141 | normalised: MIME type lower-cased |
| files.create | contentType | Title text/csv | REQ-B03142 | REQ-B03143 | normalised: MIME type lower-cased |
| files.create | contentType | padded text/csv | REQ-B03145 | REQ-B03146 | normalised: trimmed |
| pipelines.patch | name | lone surrogate | REQ-A00070 | REQ-A00071 | MUTATED: sent='\ud800' stored='�' |
| pipelines.patch | name | CRLF injection | REQ-A00096 | REQ-A00097 | normalised: trimmed |
| deals.create | title | lone surrogate | REQ-A00280 | REQ-A00281 | MUTATED: sent='\ud800' stored='�' |
| deals.create | title | CRLF injection | REQ-A00306 | REQ-A00307 | normalised: trimmed |
| deals.create.lineItems | lineItems | duplicate items | REQ-A00638 | REQ-A00639 | normalised: the server adds an id (and label) to each item and keeps both |
| deals.patch | title | lone surrogate | REQ-A00899 | REQ-A00900 | MUTATED: sent='\ud800' stored='�' |
| deals.patch | title | CRLF injection | REQ-A00925 | REQ-A00926 | normalised: trimmed |
| contacts.create | firstName | lone surrogate | REQ-A01106 | REQ-A01107 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | lastName | lone surrogate | REQ-A01209 | REQ-A01210 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | email | UPPER case | REQ-A01328 | REQ-A01329 | normalised: lower-cased |
| contacts.create | customProperties.lead_source | lone surrogate | REQ-A01634 | REQ-A01635 | MUTATED: sent='\ud800' stored='�' |
| contacts.create | customProperties.employee_count | -9223372036854775808 | REQ-A01700 | REQ-A01701 | MUTATED: sent=-9223372036854775808 stored=-9223372036854776000 |
| contacts.create | customProperties.employee_count | 9223372036854775807 | REQ-A01718 | REQ-A01719 | MUTATED: sent=9223372036854775807 stored=9223372036854776000 |
| contacts.patch | lastName | lone surrogate | REQ-A02095 | REQ-A02096 | MUTATED: sent='\ud800' stored='�' |
| contacts.patch | email | UPPER case | REQ-A02214 | REQ-A02215 | normalised: lower-cased |
| contacts.patch | customProperties.lead_source | lone surrogate | REQ-A02518 | REQ-A02519 | MUTATED: sent='\ud800' stored='�' |
| contacts.patch | customProperties.employee_count | -9223372036854775808 | REQ-A02584 | REQ-A02585 | MUTATED: sent=-9223372036854775808 stored=-9223372036854776000 |
| contacts.patch | customProperties.employee_count | 9223372036854775807 | REQ-A02602 | REQ-A02603 | MUTATED: sent=9223372036854775807 stored=9223372036854776000 |
| contacts.patch | firstName | lone surrogate | REQ-A02744 | REQ-A02745 | MUTATED: sent='\ud800' stored='�' |
| companies.create | name | lone surrogate | REQ-A02866 | REQ-A02867 | MUTATED: sent='\ud800' stored='�' |
| companies.patch | name | lone surrogate | REQ-A03369 | REQ-A03370 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | name | lone surrogate | REQ-A03728 | REQ-A03729 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | name | CRLF injection | REQ-A03754 | REQ-A03755 | normalised: trimmed |
| catalog-products.create | description | lone surrogate | REQ-A03852 | REQ-A03853 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | priceEntries.0.label | lone surrogate | REQ-A03970 | REQ-A03971 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.create | priceEntries.0.label | CRLF injection | REQ-A03996 | REQ-A03997 | normalised: trimmed |
| catalog-products.patch | name | lone surrogate | REQ-A04298 | REQ-A04299 | MUTATED: sent='\ud800' stored='�' |
| catalog-products.patch | name | CRLF injection | REQ-A04324 | REQ-A04325 | normalised: trimmed |
| catalog-products.patch | description | lone surrogate | REQ-A04422 | REQ-A04423 | MUTATED: sent='\ud800' stored='�' |

## 9. Appendix E: count-delta evidence

| operation | collection | before | accepted creates | expected after | after | ok |
|---|---|---|---|---|---|---|
| pipelines.create | pipelines | 2 | 74 | 76 | 76 | yes |
| automation-rules.create | automation-rules | 0 | 94 | 94 | 94 | yes |
| activities.create.task | activities | 16 | 107 | 123 | 123 | yes |
| activities.create.note | activities | 16 | 93 | 109 | 109 | yes |
| activities.create.call | activities | 16 | 44 | 60 | 60 | yes |
| activities.create.meeting | activities | 16 | 44 | 60 | 60 | yes |
| activities.create.appointment | activities | 16 | 48 | 64 | 64 | yes |
| activities.create.document | activities | 16 | 98 | 114 | 114 | yes |
| messages.create | messages | 0 | 100 | 100 | 100 | yes |
| files.create | files | 0 | 48 | 48 | 48 | yes |
| deals.create | deals | 12 | 66 | 78 | 78 | yes |
| deals.create.lineItems | deals | 12 | 26 | 38 | 38 | yes |
| contacts.create | contacts | 13 | 230 | 243 | 242 | yes |
| companies.create | companies | 6 | 127 | 133 | 132 | yes |
| catalog-products.create | catalog-products | 6 | 144 | 150 | 150 | yes |
| pipelines.create (negative-only) | - | 2 | 5 | 7 | 7 | yes |
| deals.create (negative-only) | - | 12 | 5 | 17 | 17 | yes |
| deals.create.lineItems (negative-only) | - | 12 | 5 | 17 | 17 | yes |
| contacts.create (negative-only) | - | 13 | 5 | 18 | 18 | yes |
| companies.create (negative-only) | - | 6 | 5 | 11 | 11 | yes |
| contact-properties.create (negative-only) | - | 23 | 1 | 24 | 23 | yes |
| catalog-products.create (negative-only) | - | 6 | 5 | 11 | 11 | yes |
| automation-rules.create (negative-only) | - | 0 | 5 | 5 | 5 | yes |
| activities.create.task (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| activities.create.note (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| activities.create.call (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| activities.create.meeting (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| activities.create.appointment (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| activities.create.document (negative-only) | - | 16 | 5 | 21 | 21 | yes |
| messages.create (negative-only) | - | 100 | 5 | 105 | 105 | yes |
| files.create (negative-only) | - | 0 | 5 | 5 | 5 | yes |

List endpoints return no `totalCount`; counts come from paging `GET /<resource>?limit=100` with `starting_after`.

## 10. Appendix F: identity, authn, authz

**Identity matrix.** Only one role exists (workspace `owner`). Rows for other roles are BLOCKED: no member or viewer account was issued and no RBAC document was supplied, so testing stops on those rows.

| role | resource | action | expected | status |
|---|---|---|---|---|
| owner | pipelines | read | 200/201/204 | tested |
| owner | pipelines | write | 200/201/204 | tested |
| owner | deals | read | 200/201/204 | tested |
| owner | deals | write | 200/201/204 | tested |
| owner | contacts | read | 200/201/204 | tested |
| owner | contacts | write | 200/201/204 | tested |
| owner | companies | read | 200/201/204 | tested |
| owner | companies | write | 200/201/204 | tested |
| owner | catalog-products | read | 200/201/204 | tested |
| owner | catalog-products | write | 200/201/204 | tested |
| owner | automation-rules | read | 200/201/204 | tested |
| owner | automation-rules | write | 200/201/204 | tested |
| owner | activities | read | 200/201/204 | tested |
| owner | activities | write | 200/201/204 | tested |
| owner | messages | read | 200/201/204 | tested |
| owner | messages | write | 200/201/204 | tested |
| owner | files | read | 200/201/204 | tested |
| owner | files | write | 200/201/204 | tested |
| owner | close-reasons | read | 200/201/204 | tested |
| owner | close-reasons | write | 200/201/204 | tested |
| owner | custom-properties | read | 200/201/204 | tested |
| owner | custom-properties | write | 200/201/204 | tested |
| member / viewer / other | * | * | unknown (no RBAC spec) | BLOCKED |
| a user of ANOTHER tenant | * | * | 403/404 | OUT OF SCOPE (no cross-tenant access) |

**Authn hypotheses** (each variant against every protected route):

| variant | routes tried | responses (status, code): count | example rid | expected |
|---|---|---|---|---|
| no credentials | 23 | 401,unauthorized: 23 | REQ-R00001 | 401, stable code |
| empty bearer | 18 | 401,unauthorized: 18 | REQ-R00002 | 401, stable code |
| garbage bearer | 18 | 401,unauthorized: 18 | REQ-R00003 | 401, stable code |
| API-key shaped bearer | 18 | 401,unauthorized: 18 | REQ-R00004 | 401, stable code |
| JWT alg=none, empty signature, future iat/nbf | 23 | 401,unauthorized: 23 | REQ-R00005 | 401, stable code |
| JWT alg=HS256, bogus signature, future iat/nbf | 18 | 401,unauthorized: 18 | REQ-R00006 | 401, stable code |
| session cookie, last character mutated | 23 | 401,unauthorized: 23 | REQ-R00007 | 401, stable code |
| session cookie, empty value | 18 | 401,unauthorized: 18 | REQ-R00008 | 401, stable code |
| session cookie, JWT alg=none value | 18 | 401,unauthorized: 18 | REQ-R00009 | 401, stable code |
| valid cookie + garbage bearer (precedence) | 18 | 200,: 18 | REQ-R00010 | 200 or 401 |

Replay after logout: `REQ-R00236` -> 401 (replay of cookie after logout (('/api/auth/logout', 200))).

Blocked rows: token for a different user in the same tenant (no second user exists); token for a user in a different tenant (no second tenant user; out of scope by brief); expired token (cannot mint a validly signed expired token; no clock control).

**IDOR (own tenant, two own projects):**

| endpoint | id kind | caller | status | code | detail | rid |
|---|---|---|---|---|---|---|
| GET /pipelines/{id} | existing id of project 1 | own project | 200 |  |  | REQ-R00197 |
| GET /pipelines/{id} | existing id of project 1 | other own project | 404 | not_found | Pipeline not found | REQ-R00198 |
| GET /pipelines/{id} | id that exists nowhere | other own project | 404 | not_found | Pipeline not found | REQ-R00199 |
| GET /pipelines/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00200,REQ-R00199 |
| GET /deals/{id} | existing id of project 1 | own project | 200 |  | Acme - CRM Enterprise rollout | REQ-R00201 |
| GET /deals/{id} | existing id of project 1 | other own project | 404 | not_found | Deal not found | REQ-R00202 |
| GET /deals/{id} | id that exists nowhere | other own project | 404 | not_found | Deal not found | REQ-R00203 |
| GET /deals/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00204,REQ-R00203 |
| GET /contacts/{id} | existing id of project 1 | own project | 200 |  |  | REQ-R00205 |
| GET /contacts/{id} | existing id of project 1 | other own project | 404 | not_found | Contact not found | REQ-R00206 |
| GET /contacts/{id} | id that exists nowhere | other own project | 404 | not_found | Contact not found | REQ-R00207 |
| GET /contacts/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00208,REQ-R00207 |
| GET /companies/{id} | existing id of project 1 | own project | 200 |  |  | REQ-R00209 |
| GET /companies/{id} | existing id of project 1 | other own project | 404 | not_found | Company not found | REQ-R00210 |
| GET /companies/{id} | id that exists nowhere | other own project | 404 | not_found | Company not found | REQ-R00211 |
| GET /companies/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00212,REQ-R00211 |
| GET /catalog-products/{id} | existing id of project 1 | own project | 200 |  |  | REQ-R00213 |
| GET /catalog-products/{id} | existing id of project 1 | other own project | 404 | not_found | Catalog product not found | REQ-R00214 |
| GET /catalog-products/{id} | id that exists nowhere | other own project | 404 | not_found | Catalog product not found | REQ-R00215 |
| GET /catalog-products/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00216,REQ-R00215 |
| GET /activities/{id} | existing id of project 1 | own project | 200 |  | Send Acme the revised pricing | REQ-R00217 |
| GET /activities/{id} | existing id of project 1 | other own project | 404 | not_found | Activity not found | REQ-R00218 |
| GET /activities/{id} | id that exists nowhere | other own project | 404 | not_found | Activity not found | REQ-R00219 |
| GET /activities/{id} | ENUMERATION CHECK: elsewhere-id vs nowhere-id body equal? | other own project | 404 vs 404 | not_found vs not_found | IDENTICAL | REQ-R00220,REQ-R00219 |
| GET /pipelines | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /deals | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /contacts | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /companies | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /catalog-products | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /activities | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /files | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /messages | list in other own project | other own project | 200 |  | rows=0 leaked_project1_rows=0 |  |
| GET /contacts?limit=1000 | role-scope filter probe | owner | 400 | validation_error | /limit: Too big: expected number to be <=100 | REQ-R00229 |
| GET /contacts?offset=-1 | role-scope filter probe | owner | 400 | validation_error | querystring: Unrecognized key: "offset" | REQ-R00230 |
| GET /contacts?page=999999 | role-scope filter probe | owner | 400 | validation_error | querystring: Unrecognized key: "page" | REQ-R00231 |
| GET /contacts?owner=me | role-scope filter probe | owner | 200 |  |  | REQ-R00232 |
| GET /contacts?tenant=mine | role-scope filter probe | owner | 400 | validation_error | querystring: Unrecognized key: "tenant" | REQ-R00233 |
| GET /contacts?role=admin | role-scope filter probe | owner | 400 | validation_error | querystring: Unrecognized key: "role" | REQ-R00234 |
| GET /contacts?limit=100&offset=5 | role-scope filter probe | owner | 400 | validation_error | querystring: Unrecognized key: "offset" | REQ-R00235 |

## 11. Appendix G: mass assignment and state machines

| operation | extra fields tried | outcomes (status, verdict): count |
|---|---|---|
| pipelines.create | 15 | 400,OK-rejected: 15 |
| pipelines.stages.add | 15 | 400,OK-rejected: 14; 201,ACCEPTED-UNKNOWN-FIELD: 1 |
| deals.create | 15 | 400,OK-rejected: 15 |
| deals.create.lineItems | 15 | 400,OK-rejected: 15 |
| contacts.create | 15 | 400,OK-rejected: 15 |
| companies.create | 15 | 400,OK-rejected: 15 |
| contact-properties.create | 15 | 400,OK-rejected: 15 |
| catalog-products.create | 15 | 400,OK-rejected: 15 |
| automation-rules.create | 15 | 400,OK-rejected: 15 |
| activities.create.task | 15 | 400,OK-rejected: 15 |
| activities.create.note | 15 | 400,OK-rejected: 15 |
| activities.create.call | 15 | 400,OK-rejected: 15 |
| activities.create.meeting | 15 | 400,OK-rejected: 15 |
| activities.create.appointment | 15 | 400,OK-rejected: 15 |
| activities.create.document | 15 | 400,OK-rejected: 15 |
| files.create | 15 | 400,OK-rejected: 15 |

| case | status | code | detail | expected | verdict | rid |
|---|---|---|---|---|---|---|
| deal: won (open -> won) | 200 |  | SM deal | 200 | OK | REQ-W00684 |
| deal: replay 'won' x20 on a won deal | 409 |  | 20 x 409 of 20; closedAt first=2026-10-02T11:35:40.473Z last=2026-10-02T11:35:40.473Z | 409 each, closedAt unchanged | OK |  |
| deal: lost on a won deal (won -> lost) | 409 | conflict | Deal is already closed | 409 | OK | REQ-W00707 |
| deal: move while closed | 409 | conflict | A closed deal cannot change stage; reopen it first | 409 | OK | REQ-W00708 |
| deal: reopen (won -> open) | 200 |  | SM deal | 200 | OK | REQ-W00709 |
| deal: reopen twice | 409 | conflict | Deal is not closed | 409 | OK | REQ-W00710 |
| deal: skip stages, move straight to the last stage | 200 |  | SM deal | 200 | OK | REQ-W00711 |
| deal: PATCH status:'won' directly | 400 | validation_error | /: Unrecognized key: "status" | 400 | OK | REQ-W00712 |
| deal: PATCH status:'approved-but-not-really' | 400 | validation_error | /: Unrecognized key: "status" | 400 | OK | REQ-W00713 |
| deal: create already 'won' (status in body) | 400 | validation_error | /: Unrecognized key: "status" | 400 | OK | REQ-W00714 |
| deal: create with closeReason in body | 400 | validation_error | /: Unrecognized key: "closeReason" | 400 | OK | REQ-W00715 |
| deal: lost with a reason that does not exist | 400 | validation_error | The reason must be one of this Organization's lost reasons: price, competitor, no_budget, no_response | 400 | OK | REQ-W00716 |
| deal: read-back after the above (still open?) | 200 |  | status=open stageId=last | open | OK |  |
| pipeline: archive | 200 |  |  | 200 | OK | REQ-W00719 |
| pipeline: replay archive x19 | 409 |  | 19 x 409 | 409 each | OK |  |
| pipeline: unarchive | 200 |  |  | 200 | OK | REQ-W00739 |
| pipeline: unarchive twice | 409 | conflict | Pipeline is not archived | 409 | OK | REQ-W00740 |
| pipeline: create deal in an ARCHIVED pipeline | 409 | conflict | Pipeline is archived; unarchive it before creating deals in it | 400\|409 | OK | REQ-W00742 |
| contact: archive (customer -> archived) | 200 |  |  | 200 | OK | REQ-W00744 |
| contact: archive records statusBeforeArchive | 200 |  | status=archived statusBeforeArchive=customer | statusBeforeArchive=customer | OK | REQ-W00744 |
| contact: archive twice | 200 |  |  | 409 | UNEXPECTED | REQ-W00745 |
| contact: create directly with status 'archived' skips the archive flow | 201 |  | status=archived statusBeforeArchive=None | 400 or statusBeforeArchive set | UNEXPECTED |  |
| contact: PATCH status 'archived' skips the archive flow | 200 |  | status=archived statusBeforeArchive=lead | 400 or statusBeforeArchive='lead' | OK | REQ-W00749 |
| contact: POST /unarchive route exists? | 200 |  |  | route exists (lead lifecycle events are advertised) | OK | REQ-W00751 |
| contact: POST /restore route exists? | 404 | not_found | No route for POST /v1/contacts/6abf97287e14e53439769578/restore | route exists (lead lifecycle events are advertised) | MISSING-FLOW | REQ-W00752 |
| contact: POST /qualify route exists? | 404 | not_found | No route for POST /v1/contacts/6abf97287e14e53439769578/qualify | route exists (lead lifecycle events are advertised) | MISSING-FLOW | REQ-W00753 |
| contact: POST /disqualify route exists? | 404 | not_found | No route for POST /v1/contacts/6abf97287e14e53439769578/disqualify | route exists (lead lifecycle events are advertised) | MISSING-FLOW | REQ-W00754 |
| contact: POST /convert route exists? | 404 | not_found | No route for POST /v1/contacts/6abf97287e14e53439769578/convert | route exists (lead lifecycle events are advertised) | MISSING-FLOW | REQ-W00755 |
| company: archive | 200 |  |  | 200 | OK | REQ-W00757 |
| company: archive twice | 200 |  |  | 409 | UNEXPECTED | REQ-W00758 |

## 12. Appendix H: idempotency, concurrency, lost update, partial failure

| endpoint | same key x2: statuses | rows created by the pair | new key + same body | replay header | verdict | rids |
|---|---|---|---|---|---|---|
| POST /pipelines | 201, 201 | 1 | 201 | (none) | DEDUPED | REQ-W200003,REQ-W200004,REQ-W200006,REQ-W200007,REQ-W200008 |
| POST /contacts | 201, 201 | 1 | 201 | (none) | DEDUPED | REQ-W200016,REQ-W200017,REQ-W200019,REQ-W200020,REQ-W200021 |
| POST /companies | 201, 201 | 1 | 201 | (none) | DEDUPED | REQ-W200029,REQ-W200030,REQ-W200032,REQ-W200033,REQ-W200034 |
| POST /catalog-products | 201, 201 | 1 | 201 | (none) | DEDUPED | REQ-W200042,REQ-W200043,REQ-W200045,REQ-W200046,REQ-W200047 |
| POST /activities | 201, 201 | 1 | 201 | (none) | DEDUPED | REQ-W200055,REQ-W200056,REQ-W200058,REQ-W200059,REQ-W200060 |
| POST /messages | 202, 202 | 1 | 202 | (none) | DEDUPED | REQ-W200070,REQ-W200071,REQ-W200074,REQ-W200075,REQ-W200076 |

| case | statuses | rows created | final count delta | detail | verdict | rids |
|---|---|---|---|---|---|---|
| 10 parallel contact creates, same email, ONE idempotency key | [201, 201, 201, 201, 201, 201, 201, 201, 201, 201] | 1 | 1 | 1 distinct id(s) across 10 responses | OK | REQ-W200086, REQ-W200090, REQ-W200089, REQ-W200093, REQ-W200087, REQ-W200092, REQ-W200091, REQ-W200095, REQ-W200094, REQ-W200088 |
| 10 parallel contact creates, same email, DISTINCT keys | [201, 201, 201, 201, 201, 201, 201, 201, 201, 201] | 10 | 10 |  | DUPLICATES-CREATED | REQ-W200098, REQ-W200101, REQ-W200099, REQ-W200103, REQ-W200100, REQ-W200106, REQ-W200104, REQ-W200105, REQ-W200102, REQ-W200107 |
| 10 parallel pipeline creates, same name | [201, 201, 201, 201, 201, 201, 201, 201, 201, 201] | 10 | 10 |  | DUPLICATES-CREATED | REQ-W200110, REQ-W200111, REQ-W200113, REQ-W200114, REQ-W200115, REQ-W200112, REQ-W200118, REQ-W200117, REQ-W200116, REQ-W200119 |
| 10 parallel creates of the same custom-property key | [201, 409, 409, 409, 409, 409, 409, 409, 409, 409] | 1 | 1 |  | OK | REQ-W200143, REQ-W200146, REQ-W200144, REQ-W200145, REQ-W200147, REQ-W200148, REQ-W200152, REQ-W200151, REQ-W200150, REQ-W200149 |
| 10 parallel 'won' on one open deal | [200, 409, 409, 409, 409, 409, 409, 409, 409, 409] | 0 | 0 |  | OK | REQ-W200160, REQ-W200158, REQ-W200159, REQ-W200162, REQ-W200161, REQ-W200163, REQ-W200164, REQ-W200167, REQ-W200166, REQ-W200165 |
| 10 parallel archive of one pipeline | [200, 409, 409, 409, 409, 409, 409, 409, 409, 409] | 0 | 0 |  | OK | REQ-W200168, REQ-W200177, REQ-W200171, REQ-W200173, REQ-W200169, REQ-W200174, REQ-W200170, REQ-W200175, REQ-W200176, REQ-W200172 |
| 10 parallel DELETE of one company | [204, 404, 404, 404, 404, 404, 404, 404, 404, 404] | 0 | -1 |  | OK | REQ-W200179, REQ-W200187, REQ-W200188, REQ-W200185, REQ-W200180, REQ-W200182, REQ-W200181, REQ-W200183, REQ-W200184, REQ-W200186 |
| 2 parallel PATCH of one deal title (A vs B) | [200, 200] | 0 | 0 | final title=WRITER-A | OK (last write wins; both told 200) | REQ-W200193, REQ-W200194 |
| lost update: GET {employee_count:10}; PUT 11 and PUT 12 in parallel | [200, 200] | 0 | 0 | ETag on GET='"0"'; final employee_count=12; both PUTs accepted=True; stale If-Match -> 412 | OK (ETag + If-Match supported, opt-in; without If-Match the last write wins) | REQ-W200197, REQ-W200198, REQ-W200199, REQ-W200201 |
| 2 parallel PUT of the close-reason list (A vs B) | [200, 200] | 0 | 0 | final=['race_a'] | OK | REQ-W200203, REQ-W200204 |

| case | status | message | count delta | verdict | rid |
|---|---|---|---|---|---|
| deal: line items [valid, INVALID quantity 0, valid] | 400 | /lineItems/1/quantity: Too small: expected number to be >=1 | {'deals': 0} | OK | REQ-W200145 |
| pipeline: stages [valid, INVALID empty name, valid] | 400 | /stages/1/name: Too small: expected string to have >=1 characters | {'pipelines': 0} | OK | REQ-W200148 |
| pipeline: valid name, two stages with the same name | 400 | A stage named "a" already exists in this pipeline | {'pipelines': 0} | OK | REQ-W200151 |
| catalog product: price entries [valid, INVALID currency] | 400 | /priceEntries/1/currency: ZZZ is not a currency code. Use one such as USD, EUR or JPY | {'catalog-products': 0} | OK | REQ-W200154 |
| contact: valid name, INVALID custom property value | 400 | Custom property "employee_count" must be a finite number | {'contacts': 0} | OK | REQ-W200157 |
| contact: valid name, company that does not exist | 404 | Company not found | {'contacts': 0} | OK | REQ-W200160 |
| deal: valid title, contact that does not exist | 404 | Contact not found | {'deals': 0} | OK | REQ-W200163 |
| automation rule: valid trigger, INVALID action | 400 | Automation action "activity.create" has invalid fields — type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| 'docu | {'automation-rules': 0} | OK | REQ-W200166 |

## 13. Appendix I: negative-only requests (every write endpoint)

| operation | case | status | code | message | envelope ok | content-type | verdict | rid |
|---|---|---|---|---|---|---|---|---|
| pipelines.create | empty object {} | 400 | validation_error | /name: Invalid input: expected string, received undefined; /stages: Invalid inpu | True | application/problem+json; charset= | OK-4xx | REQ-W00003 |
| pipelines.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00004 |
| pipelines.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00005 |
| pipelines.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00006 |
| pipelines.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00007 |
| pipelines.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00008 |
| pipelines.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00009 |
| pipelines.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00010 |
| pipelines.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00011 |
| pipelines.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00012 |
| pipelines.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00013 |
| pipelines.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00014 |
| pipelines.patch | empty object {} | 400 | validation_error | /: At least one field must be provided | True | application/problem+json; charset= | OK-4xx | REQ-W00022 |
| pipelines.patch | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00023 |
| pipelines.patch | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00024 |
| pipelines.patch | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00025 |
| pipelines.patch | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00026 |
| pipelines.patch | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00027 |
| pipelines.patch | valid JSON, Content-Type text/plain | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00028 |
| pipelines.patch | valid JSON, Content-Type application/xml | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00029 |
| pipelines.patch | valid JSON, form-urlencoded | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00030 |
| pipelines.patch | valid JSON, no Content-Type | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00031 |
| pipelines.patch | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00032 |
| pipelines.patch | duplicate keys (first!=last) | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00033 |
| pipelines.stages.add | empty object {} | 400 | validation_error | /name: Invalid input: expected string, received undefined | True | application/problem+json; charset= | OK-4xx | REQ-W00036 |
| pipelines.stages.add | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00037 |
| pipelines.stages.add | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00038 |
| pipelines.stages.add | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00039 |
| pipelines.stages.add | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00040 |
| pipelines.stages.add | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00041 |
| pipelines.stages.add | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00042 |
| pipelines.stages.add | valid JSON, Content-Type application/xml | 400 | validation_error | A stage named "Extra stage" already exists in this pipeline | True | application/problem+json; charset= | OK-4xx | REQ-W00043 |
| pipelines.stages.add | valid JSON, form-urlencoded | 400 | validation_error | A stage named "Extra stage" already exists in this pipeline | True | application/problem+json; charset= | OK-4xx | REQ-W00044 |
| pipelines.stages.add | valid JSON, no Content-Type | 400 | validation_error | A stage named "Extra stage" already exists in this pipeline | True | application/problem+json; charset= | OK-4xx | REQ-W00045 |
| pipelines.stages.add | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00046 |
| pipelines.stages.add | duplicate keys (first!=last) | 400 | validation_error | A stage named "Extra stage" already exists in this pipeline | True | application/problem+json; charset= | OK-4xx | REQ-W00047 |
| deals.create | empty object {} | 400 | validation_error | /title: Invalid input: expected string, received undefined; /pipelineId: Invalid | True | application/problem+json; charset= | OK-4xx | REQ-W00054 |
| deals.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00055 |
| deals.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00056 |
| deals.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00057 |
| deals.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00058 |
| deals.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00059 |
| deals.create | valid JSON, Content-Type text/plain | 201 |  | Audit deal | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00060 |
| deals.create | valid JSON, Content-Type application/xml | 201 |  | Audit deal | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00061 |
| deals.create | valid JSON, form-urlencoded | 201 |  | Audit deal | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00062 |
| deals.create | valid JSON, no Content-Type | 201 |  | Audit deal | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00063 |
| deals.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00064 |
| deals.create | duplicate keys (first!=last) | 201 |  | Audit deal | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00065 |
| deals.create.lineItems | empty object {} | 400 | validation_error | /title: Invalid input: expected string, received undefined; /pipelineId: Invalid | True | application/problem+json; charset= | OK-4xx | REQ-W00080 |
| deals.create.lineItems | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00081 |
| deals.create.lineItems | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00082 |
| deals.create.lineItems | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00083 |
| deals.create.lineItems | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00084 |
| deals.create.lineItems | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00085 |
| deals.create.lineItems | valid JSON, Content-Type text/plain | 201 |  | Audit deal with lines | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00086 |
| deals.create.lineItems | valid JSON, Content-Type application/xml | 201 |  | Audit deal with lines | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00087 |
| deals.create.lineItems | valid JSON, form-urlencoded | 201 |  | Audit deal with lines | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00088 |
| deals.create.lineItems | valid JSON, no Content-Type | 201 |  | Audit deal with lines | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00089 |
| deals.create.lineItems | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00090 |
| deals.create.lineItems | duplicate keys (first!=last) | 201 |  | Audit deal with lines | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00091 |
| deals.patch | empty object {} | 400 | validation_error | /: At least one field must be provided | True | application/problem+json; charset= | OK-4xx | REQ-W00106 |
| deals.patch | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00107 |
| deals.patch | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00108 |
| deals.patch | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00109 |
| deals.patch | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00110 |
| deals.patch | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00111 |
| deals.patch | valid JSON, Content-Type text/plain | 200 |  | x | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00112 |
| deals.patch | valid JSON, Content-Type application/xml | 200 |  | x | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00113 |
| deals.patch | valid JSON, form-urlencoded | 200 |  | x | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00114 |
| deals.patch | valid JSON, no Content-Type | 200 |  | x | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00115 |
| deals.patch | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00116 |
| deals.patch | duplicate keys (first!=last) | 200 |  | x | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00117 |
| contacts.create | empty object {} | 400 | validation_error | /firstName: Invalid input: expected string, received undefined | True | application/problem+json; charset= | OK-4xx | REQ-W00123 |
| contacts.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00124 |
| contacts.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00125 |
| contacts.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00126 |
| contacts.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00127 |
| contacts.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00128 |
| contacts.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00129 |
| contacts.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00130 |
| contacts.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00131 |
| contacts.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00132 |
| contacts.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00133 |
| contacts.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00134 |
| contacts.patch | empty object {} | 400 | validation_error | /: At least one field must be provided | True | application/problem+json; charset= | OK-4xx | REQ-W00142 |
| contacts.patch | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00143 |
| contacts.patch | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00144 |
| contacts.patch | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00145 |
| contacts.patch | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00146 |
| contacts.patch | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00147 |
| contacts.patch | valid JSON, Content-Type text/plain | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00148 |
| contacts.patch | valid JSON, Content-Type application/xml | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00149 |
| contacts.patch | valid JSON, form-urlencoded | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00150 |
| contacts.patch | valid JSON, no Content-Type | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00151 |
| contacts.patch | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00152 |
| contacts.patch | duplicate keys (first!=last) | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00153 |
| companies.create | empty object {} | 400 | validation_error | /name: Invalid input: expected string, received undefined | True | application/problem+json; charset= | OK-4xx | REQ-W00156 |
| companies.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00157 |
| companies.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00158 |
| companies.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00159 |
| companies.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00160 |
| companies.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00161 |
| companies.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00162 |
| companies.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00163 |
| companies.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00164 |
| companies.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00165 |
| companies.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00166 |
| companies.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00167 |
| companies.patch | empty object {} | 400 | validation_error | /: At least one field must be provided | True | application/problem+json; charset= | OK-4xx | REQ-W00175 |
| companies.patch | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00176 |
| companies.patch | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00177 |
| companies.patch | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00178 |
| companies.patch | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00179 |
| companies.patch | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00180 |
| companies.patch | valid JSON, Content-Type text/plain | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00181 |
| companies.patch | valid JSON, Content-Type application/xml | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00182 |
| companies.patch | valid JSON, form-urlencoded | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00183 |
| companies.patch | valid JSON, no Content-Type | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00184 |
| companies.patch | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00185 |
| companies.patch | duplicate keys (first!=last) | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00186 |
| contact-properties.create | empty object {} | 400 | validation_error | /key: Invalid input: expected string, received undefined; /label: Invalid input: | True | application/problem+json; charset= | OK-4xx | REQ-W00189 |
| contact-properties.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00190 |
| contact-properties.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00191 |
| contact-properties.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00192 |
| contact-properties.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00193 |
| contact-properties.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00194 |
| contact-properties.create | valid JSON, Content-Type text/plain | 409 | conflict | Custom property "audit_u" already exists in this Organization | True | application/problem+json; charset= | OK-4xx | REQ-W00195 |
| contact-properties.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00196 |
| contact-properties.create | valid JSON, form-urlencoded | 409 | conflict | Custom property "audit_u" already exists in this Organization | True | application/problem+json; charset= | OK-4xx | REQ-W00197 |
| contact-properties.create | valid JSON, no Content-Type | 409 | conflict | Custom property "audit_u" already exists in this Organization | True | application/problem+json; charset= | OK-4xx | REQ-W00198 |
| contact-properties.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00199 |
| contact-properties.create | duplicate keys (first!=last) | 409 | conflict | Custom property "audit_u" already exists in this Organization | True | application/problem+json; charset= | OK-4xx | REQ-W00200 |
| catalog-products.create | empty object {} | 400 | validation_error | /name: Invalid input: expected string, received undefined | True | application/problem+json; charset= | OK-4xx | REQ-W00204 |
| catalog-products.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00205 |
| catalog-products.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00206 |
| catalog-products.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00207 |
| catalog-products.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00208 |
| catalog-products.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00209 |
| catalog-products.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00210 |
| catalog-products.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00211 |
| catalog-products.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00212 |
| catalog-products.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00213 |
| catalog-products.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00214 |
| catalog-products.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00215 |
| catalog-products.patch | empty object {} | 400 | validation_error | /: At least one field must be provided | True | application/problem+json; charset= | OK-4xx | REQ-W00223 |
| catalog-products.patch | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00224 |
| catalog-products.patch | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00225 |
| catalog-products.patch | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00226 |
| catalog-products.patch | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00227 |
| catalog-products.patch | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00228 |
| catalog-products.patch | valid JSON, Content-Type text/plain | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00229 |
| catalog-products.patch | valid JSON, Content-Type application/xml | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00230 |
| catalog-products.patch | valid JSON, form-urlencoded | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00231 |
| catalog-products.patch | valid JSON, no Content-Type | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00232 |
| catalog-products.patch | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00233 |
| catalog-products.patch | duplicate keys (first!=last) | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00234 |
| automation-rules.create | empty object {} | 400 | validation_error | /name: Invalid input: expected string, received undefined; /trigger: Invalid inp | True | application/problem+json; charset= | OK-4xx | REQ-W00237 |
| automation-rules.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00238 |
| automation-rules.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00239 |
| automation-rules.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00240 |
| automation-rules.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00241 |
| automation-rules.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00242 |
| automation-rules.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00243 |
| automation-rules.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00244 |
| automation-rules.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00245 |
| automation-rules.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00246 |
| automation-rules.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00247 |
| automation-rules.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00248 |
| activities.create.task | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00256 |
| activities.create.task | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00257 |
| activities.create.task | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00258 |
| activities.create.task | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00259 |
| activities.create.task | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00260 |
| activities.create.task | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00261 |
| activities.create.task | valid JSON, Content-Type text/plain | 201 |  | Audit task | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00262 |
| activities.create.task | valid JSON, Content-Type application/xml | 201 |  | Audit task | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00263 |
| activities.create.task | valid JSON, form-urlencoded | 201 |  | Audit task | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00264 |
| activities.create.task | valid JSON, no Content-Type | 201 |  | Audit task | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00265 |
| activities.create.task | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00266 |
| activities.create.task | duplicate keys (first!=last) | 201 |  | Audit task | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00267 |
| activities.create.note | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00275 |
| activities.create.note | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00276 |
| activities.create.note | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00277 |
| activities.create.note | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00278 |
| activities.create.note | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00279 |
| activities.create.note | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00280 |
| activities.create.note | valid JSON, Content-Type text/plain | 201 |  | Audit note | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00281 |
| activities.create.note | valid JSON, Content-Type application/xml | 201 |  | Audit note | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00282 |
| activities.create.note | valid JSON, form-urlencoded | 201 |  | Audit note | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00283 |
| activities.create.note | valid JSON, no Content-Type | 201 |  | Audit note | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00284 |
| activities.create.note | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00285 |
| activities.create.note | duplicate keys (first!=last) | 201 |  | Audit note | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00286 |
| activities.create.call | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00294 |
| activities.create.call | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00295 |
| activities.create.call | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00296 |
| activities.create.call | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00297 |
| activities.create.call | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00298 |
| activities.create.call | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00299 |
| activities.create.call | valid JSON, Content-Type text/plain | 201 |  | Audit call | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00300 |
| activities.create.call | valid JSON, Content-Type application/xml | 201 |  | Audit call | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00301 |
| activities.create.call | valid JSON, form-urlencoded | 201 |  | Audit call | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00302 |
| activities.create.call | valid JSON, no Content-Type | 201 |  | Audit call | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00303 |
| activities.create.call | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00304 |
| activities.create.call | duplicate keys (first!=last) | 201 |  | Audit call | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00305 |
| activities.create.meeting | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00313 |
| activities.create.meeting | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00314 |
| activities.create.meeting | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00315 |
| activities.create.meeting | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00316 |
| activities.create.meeting | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00317 |
| activities.create.meeting | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00318 |
| activities.create.meeting | valid JSON, Content-Type text/plain | 201 |  | Audit meeting | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00319 |
| activities.create.meeting | valid JSON, Content-Type application/xml | 201 |  | Audit meeting | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00320 |
| activities.create.meeting | valid JSON, form-urlencoded | 201 |  | Audit meeting | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00321 |
| activities.create.meeting | valid JSON, no Content-Type | 201 |  | Audit meeting | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00322 |
| activities.create.meeting | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00323 |
| activities.create.meeting | duplicate keys (first!=last) | 201 |  | Audit meeting | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00324 |
| activities.create.appointment | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00332 |
| activities.create.appointment | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00333 |
| activities.create.appointment | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00334 |
| activities.create.appointment | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00335 |
| activities.create.appointment | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00336 |
| activities.create.appointment | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00337 |
| activities.create.appointment | valid JSON, Content-Type text/plain | 201 |  | Audit appt | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00338 |
| activities.create.appointment | valid JSON, Content-Type application/xml | 201 |  | Audit appt | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00339 |
| activities.create.appointment | valid JSON, form-urlencoded | 201 |  | Audit appt | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00340 |
| activities.create.appointment | valid JSON, no Content-Type | 201 |  | Audit appt | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00341 |
| activities.create.appointment | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00342 |
| activities.create.appointment | duplicate keys (first!=last) | 201 |  | Audit appt | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00343 |
| activities.create.document | empty object {} | 400 | validation_error | /type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| ' | True | application/problem+json; charset= | OK-4xx | REQ-W00351 |
| activities.create.document | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00352 |
| activities.create.document | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00353 |
| activities.create.document | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00354 |
| activities.create.document | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00355 |
| activities.create.document | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00356 |
| activities.create.document | valid JSON, Content-Type text/plain | 201 |  | Audit doc | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00357 |
| activities.create.document | valid JSON, Content-Type application/xml | 201 |  | Audit doc | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00358 |
| activities.create.document | valid JSON, form-urlencoded | 201 |  | Audit doc | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00359 |
| activities.create.document | valid JSON, no Content-Type | 201 |  | Audit doc | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00360 |
| activities.create.document | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00361 |
| activities.create.document | duplicate keys (first!=last) | 201 |  | Audit doc | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00362 |
| messages.create | empty object {} | 400 | validation_error | /contactId: Invalid input: expected string, received undefined; /channel: Invali | True | application/problem+json; charset= | OK-4xx | REQ-W00371 |
| messages.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00372 |
| messages.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00373 |
| messages.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00374 |
| messages.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00375 |
| messages.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00376 |
| messages.create | valid JSON, Content-Type text/plain | 202 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00377 |
| messages.create | valid JSON, Content-Type application/xml | 202 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00378 |
| messages.create | valid JSON, form-urlencoded | 202 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00379 |
| messages.create | valid JSON, no Content-Type | 202 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00380 |
| messages.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00381 |
| messages.create | duplicate keys (first!=last) | 202 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00382 |
| close-reasons.put | empty object {} | 400 | validation_error | /reasons: Invalid input: expected array, received undefined | True | application/problem+json; charset= | OK-4xx | REQ-W00392 |
| close-reasons.put | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00393 |
| close-reasons.put | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00394 |
| close-reasons.put | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00395 |
| close-reasons.put | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00396 |
| close-reasons.put | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00397 |
| close-reasons.put | valid JSON, Content-Type text/plain | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00398 |
| close-reasons.put | valid JSON, Content-Type application/xml | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00399 |
| close-reasons.put | valid JSON, form-urlencoded | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00400 |
| close-reasons.put | valid JSON, no Content-Type | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00401 |
| close-reasons.put | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00402 |
| close-reasons.put | duplicate keys (first!=last) | 200 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00403 |
| files.create | empty object {} | 400 | validation_error | /fileName: Invalid input: expected string, received undefined; /contentType: Inv | True | application/problem+json; charset= | OK-4xx | REQ-W00406 |
| files.create | array body [] | 400 | validation_error | /: Invalid input: expected object, received array | True | application/problem+json; charset= | OK-4xx | REQ-W00407 |
| files.create | malformed: trailing commas | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00408 |
| files.create | malformed: unquoted key | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00409 |
| files.create | malformed: raw line break inside string | 400 | bad_request | Body is not valid JSON but content-type is set to 'application/json' | True | application/problem+json; charset= | OK-4xx | REQ-W00410 |
| files.create | 0-byte body, Content-Length 0 | 400 | validation_error | /: Invalid input: expected object, received null | True | application/problem+json; charset= | OK-4xx | REQ-W00411 |
| files.create | valid JSON, Content-Type text/plain | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00412 |
| files.create | valid JSON, Content-Type application/xml | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00413 |
| files.create | valid JSON, form-urlencoded | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00414 |
| files.create | valid JSON, no Content-Type | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00415 |
| files.create | extra unknown field | 400 | validation_error | /: Unrecognized key: "totallyMadeUp" | True | application/problem+json; charset= | OK-4xx | REQ-W00416 |
| files.create | duplicate keys (first!=last) | 201 |  |  | False | application/json; charset=utf-8 | ACCEPTED | REQ-W00417 |

## 14. Appendix J: error envelope, stability, hygiene

Envelope baseline (every 4xx/5xx in this run; forced by the audit, as no production traffic is accessible):

| status | content-type | body shape | count |
|---|---|---|---|
| 400 | (none) | other | 8 |
| 400 | (none) | problem+json (type,title,status,detail,code,requestId) | 3299 |
| 401 | (none) | problem+json (type,title,status,detail,code,requestId) | 178 |
| 404 | (none) | other | 1 |
| 404 | (none) | problem+json (type,title,status,detail,code,requestId) | 434 |
| 409 | (none) | problem+json (type,title,status,detail,code,requestId) | 202 |
| 412 | (none) | problem+json (type,title,status,detail,code,requestId) | 4 |
| 413 | (none) | problem+json (type,title,status,detail,code,requestId) | 5 |
| 414 | (none) | other | 1 |
| 422 | (none) | problem+json (type,title,status,detail,code,requestId) | 3 |
| 500 | (none) | other | 6 |
| 502 | (none) | empty body | 6 |

Leak scan over every recorded response body and header:

| pattern | matches | example rids |
|---|---|---|
| stack frame | 0 |  |
| file path | 0 |  |
| SQL/DB error text | 0 |  |
| internal host / IP | 92 | REQ-A02989, REQ-A02990, REQ-A03492 |
| AWS access key id | 53 | REQ-B03005, REQ-B03007, REQ-B03009 |
| 12-digit AWS account id in a bucket host | 53 | REQ-B03005, REQ-B03007, REQ-B03009 |
| framework error code | 1 | REQ-R00346 |
| git commit hash | 8 | REQ-A01416, REQ-A01417, REQ-A02302 |
| environment variable assignment | 0 |  |

Stable codes (same failing request x20):

| request | repeats | distinct responses | status | code | detail |
|---|---|---|---|---|---|
| POST /pipelines | 20 | 1 | 400 | validation_error | /name: Too small: expected string to have >=1 characters |
| GET /pipelines/zzz | 20 | 1 | 400 | validation_error | Invalid pipeline id |
| GET /pipelines/000000000000000000000000 | 20 | 1 | 404 | not_found | Pipeline not found |
| POST /deals | 20 | 1 | 400 | validation_error | /pipelineId: Invalid input: expected string, received undefined; /stageId: Inval |
| POST /contacts | 20 | 1 | 400 | validation_error | /email: Invalid email address |

Status-code accuracy and header hygiene:

| method | path | status | content-type | Allow | Server | Via | X-Powered-By | Retry-After | RateLimit-* | body | rid |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GET | /pipelines?limit=1 | 200 | application/json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"data":[{"id":"6abf889a7e14e53439767e09","name":"SMB Quick Sale","stages":[{"id":"2b6fbd07-de80-4f7 | REQ-R00337 |
| OPTIONS | /pipelines | 204 |  | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT |  | 1.1 Caddy |  |  |  |  | REQ-R00338 |
| HEAD | /pipelines | 200 | application/json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  |  | REQ-R00339 |
| TRACE | /pipelines | 500 | text/plain |  |  | 1.1 Caddy |  |  |  | Internal Server Error | REQ-R00340 |
| PUT | /pipelines | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for PUT /v1/pi | REQ-R00341 |
| DELETE | /pipelines | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for DELETE /v1 | REQ-R00342 |
| PATCH | /pipelines | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for PATCH /v1/ | REQ-R00343 |
| POST | /pipelines/000000000000000000000000 | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for POST /v1/p | REQ-R00344 |
| GET | /definitely-not-a-route | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for GET /v1/de | REQ-R00345 |
| GET | /pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaa | 414 | application/json |  |  | 1.1 Caddy |  |  |  | {"error":"Bad Request","code":"FST_ERR_MAX_PARAM_LENGTH","message":"'/v1/pipelines/aaaaaaaaaaaaaaaaa | REQ-R00346 |
| GET | /pipelines?limit=1&limit=2 | 400 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:validation_error","title":"Validation failed","status":400,"detail":"/limit:  | REQ-R00347 |
| GET | /api/docs | 200 | text/html; charset=utf-8 |  |  | 1.1 Caddy | Next.js |  |  | <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=dev | (direct, unrecorded) |
| GET | /api/openapi.json | 200 | text/html; charset=utf-8 |  |  | 1.1 Caddy | Next.js |  |  | <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=dev | (direct, unrecorded) |
| GET | /api/crm | 200 | text/html; charset=utf-8 |  |  | 1.1 Caddy | Next.js |  |  | <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=dev | (direct, unrecorded) |
| GET | /api/crm/v2/pipelines | 404 | application/problem+json; charset=utf-8 |  |  | 1.1 Caddy |  |  |  | {"type":"urn:crm:error:not_found","title":"Not found","status":404,"detail":"No route for GET /v2/pi | (direct, unrecorded) |
| GET | /api/v1/pipelines | 200 | text/html; charset=utf-8 |  |  | 1.1 Caddy | Next.js |  |  | <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=dev | (direct, unrecorded) |

Wrong-password login (own account, one attempt): {"status": 401, "body": "{\"code\":\"unauthorized\",\"message\":\"Invalid email or password\",\"detail\":\"Invalid email or password\",\"requestId\":\"e290e20a-63fa-4823-a52d-784e83b59a50\"}", "headers": {"Content-Type": "application/json"}}

Session cookie attributes on login: \x01=<redacted>; Path=/; Expires=Sat, 03 Oct 2026 11:44:28 GMT; Max-Age=86400; Secure; HttpOnly; SameSite=lax; \x01=<redacted>; Path=/; Expires=Wed, 31 Mar 2027 11:44:28 GMT; Max-Age=15552000; Secure; HttpOnly; SameSite=lax

Rate limiting: no 429, no `Retry-After` and no `RateLimit-*` header appeared at any point. No limit is documented, so the 10x-over-limit probe was **not run** (blocked).

## 15. Appendix K: contract (live-only, no spec)

`/api/crm/v1/openapi.json`, `openapi.yaml`, `swagger.json`, `docs`, `/api/docs` and `/api/openapi.json` were requested. The first four return 404 JSON; the last two return HTTP 200 HTML (the dashboard shell). **No spec is published**, so every row below is ONLY-IN-LIVE; spec diffs, generated-client drift and breaking-change history are BLOCKED.

| method | path | statuses observed | response content-types | requests | spec row |
|---|---|---|---|---|---|
| GET | /activities | 200,401 |  | 44 | ONLY-IN-LIVE |
| POST | /activities | 201,400 |  | 1136 | ONLY-IN-LIVE |
| DELETE | /activities/{id} | 204 |  | 1 | ONLY-IN-LIVE (found 2026-10-07, cross-module integration pass) |
| GET | /activities/{id} | 200,404 |  | 429 | ONLY-IN-LIVE |
| GET | /auth/me | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /automation-rules | 200,401 |  | 14 | ONLY-IN-LIVE |
| POST | /automation-rules | 201,400,502 |  | 273 | ONLY-IN-LIVE |
| GET | /automation-rules/{id} | 200 |  | 91 | ONLY-IN-LIVE |
| GET | /catalog-products | 200,401 |  | 22 | ONLY-IN-LIVE |
| POST | /catalog-products | 201,400,413 |  | 337 | ONLY-IN-LIVE |
| GET | /catalog-products/{id} | 200,404 |  | 220 | ONLY-IN-LIVE |
| PATCH | /catalog-products/{id} | 200,400 |  | 151 | ONLY-IN-LIVE |
| GET | /close-reasons | 200,401 |  | 14 | ONLY-IN-LIVE |
| PUT | /close-reasons | 200,400,401,413 |  | 176 | ONLY-IN-LIVE |
| GET | /companies | 200,401 |  | 22 | ONLY-IN-LIVE |
| POST | /companies | 201,400,401 |  | 310 | ONLY-IN-LIVE |
| DELETE | /companies/{id} | 204,404 |  | 20 | ONLY-IN-LIVE |
| GET | /companies/{id} | 200,404 |  | 251 | ONLY-IN-LIVE |
| PATCH | /companies/{id} | 200,400 |  | 259 | ONLY-IN-LIVE |
| POST | /companies/{id}/archive | 200 |  | 2 | ONLY-IN-LIVE |
| GET | /contacts | 200,400,401 |  | 38 | ONLY-IN-LIVE |
| POST | /contacts | 201,400,401,404 |  | 661 | ONLY-IN-LIVE |
| GET | /contacts/custom-properties | 200,401 |  | 17 | ONLY-IN-LIVE |
| POST | /contacts/custom-properties | 201,400,409 |  | 491 | ONLY-IN-LIVE |
| GET | /contacts/custom-properties/{id} | 404 |  | 75 | ONLY-IN-LIVE |
| DELETE | /contacts/{id} | 204,409 |  | 2 | ONLY-IN-LIVE (found 2026-10-07; 409 `conflict` if a deal still references it) |
| GET | /contacts/{id} | 200,404 |  | 447 | ONLY-IN-LIVE |
| PATCH | /contacts/{id} | 200,400,404,412 |  | 546 | ONLY-IN-LIVE |
| POST | /contacts/{id}/archive | 200 |  | 2 | ONLY-IN-LIVE |
| POST | /contacts/{id}/convert | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /contacts/{id}/disqualify | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /contacts/{id}/qualify | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /contacts/{id}/restore | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /contacts/{id}/unarchive | 200 |  | 1 | ONLY-IN-LIVE |
| GET | /deals | 200,401 |  | 19 | ONLY-IN-LIVE |
| POST | /deals | 201,400,404,409,502 |  | 517 | ONLY-IN-LIVE |
| DELETE | /deals/{id} | 204 |  | 1 | ONLY-IN-LIVE (found 2026-10-07, cross-module integration pass) |
| GET | /deals/{id} | 200,404 |  | 140 | ONLY-IN-LIVE |
| PATCH | /deals/{id} | 200,400,404 |  | 161 | ONLY-IN-LIVE |
| POST | /deals/{id}/lost | 400,409 |  | 2 | ONLY-IN-LIVE |
| POST | /deals/{id}/move | 200,409 |  | 2 | ONLY-IN-LIVE |
| POST | /deals/{id}/reopen | 200,409 |  | 2 | ONLY-IN-LIVE |
| POST | /deals/{id}/won | 200,409 |  | 41 | ONLY-IN-LIVE |
| GET | /definitely-not-a-route | 404 |  | 1 | ONLY-IN-LIVE |
| GET | /events | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /exports | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /files | 200,401 |  | 15 | ONLY-IN-LIVE |
| POST | /files | 201,400 |  | 165 | ONLY-IN-LIVE |
| GET | /files/{id} | 200 |  | 47 | ONLY-IN-LIVE |
| GET | /imports | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /messages | 200,401 |  | 28 | ONLY-IN-LIVE |
| POST | /messages | 202,400,401,404,422 |  | 219 | ONLY-IN-LIVE |
| GET | /messages/{id} | 200 |  | 98 | ONLY-IN-LIVE |
| DELETE | /pipelines | 404 |  | 1 | ONLY-IN-LIVE |
| GET | /pipelines | 200,400,401 |  | 28 | ONLY-IN-LIVE |
| HEAD | /pipelines | 200 |  | 1 | ONLY-IN-LIVE |
| OPTIONS | /pipelines | 204 |  | 1 | ONLY-IN-LIVE |
| PATCH | /pipelines | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /pipelines | 201,400,401,502 |  | 247 | ONLY-IN-LIVE |
| PUT | /pipelines | 404 |  | 1 | ONLY-IN-LIVE |
| TRACE | /pipelines | 500 |  | 1 | ONLY-IN-LIVE |
| GET | /pipelines/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | 414 |  | 1 | ONLY-IN-LIVE |
| GET | /pipelines/zzz | 400 |  | 20 | ONLY-IN-LIVE |
| GET | /pipelines/{id} | 200,404 |  | 126 | ONLY-IN-LIVE |
| PATCH | /pipelines/{id} | 200,400 |  | 76 | ONLY-IN-LIVE |
| POST | /pipelines/{id} | 404 |  | 1 | ONLY-IN-LIVE |
| POST | /pipelines/{id}/archive | 200,409 |  | 41 | ONLY-IN-LIVE |
| POST | /pipelines/{id}/stages | 201,400 |  | 93 | ONLY-IN-LIVE |
| POST | /pipelines/{id}/unarchive | 200,409 |  | 2 | ONLY-IN-LIVE |
| GET | /reports | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /reports/contacts.by_status | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /workspaces | 200,401 |  | 10 | ONLY-IN-LIVE |
| GET | /workspaces/{id}/projects | 200 |  | 1 | ONLY-IN-LIVE |

Version drift: `/api/crm/v2/pipelines` and `/api/v1/pipelines` were requested (hygiene table); only `/api/crm/v1` is routed.

## 16. Open questions / spec gaps

- No OpenAPI/Swagger/Postman spec exists. Which document is authoritative for field limits, enums and error codes?
- Uniqueness: may two pipelines, companies, close-reason labels or contacts share a name or email? Today all are allowed, and parallel creates make duplicates (race table).
- Archived pipelines: the page text says an archived pipeline 'takes no new deals', yet stages can be added. Intended?
- Retry contract: should POST endpoints honour `Idempotency-Key`? An occasional empty 502 plus no idempotency means a client retry duplicates records or messages.
- Phone and domain formats: E.164 is required to send SMS, but any text is accepted when saving a contact. Which is the rule?
- Role model: only an owner exists. Which actions may members and viewers perform? (Blocks the whole role matrix.)
- Custom properties: DELETE only archives; archived rows stay in the default list, cannot be filtered out and cannot be hard-deleted. Deliberate?
- Activities cannot reference a contact, deal or company in this API version. Is the link modelled elsewhere?
- RETRACTED: lead lifecycle routes exist at `/leads/{id}/qualify|disqualify|convert`; my earlier probe used the wrong path (`/contacts/{id}/...`).
- List endpoints return no total count; is cursor paging the only supported way to count?
- Scope note: one early probe (before the harness) queued two emails to `merge.a@example.com` in live mode; the reserved domain cannot receive mail. All audited message sends used `test` mode.

## 17. Recommended next run

| prompt | re-run when | why | observed runtime |
|---|---|---|---|
| P1 validation matrix | any change to request schemas or validators | re-bisects limits; re-checks read-back and counts | 8474 requests, roughly 1-2 hours at 1-2 req/s per stream |
| P2 authn, authz, mass assignment, state machines | any change to auth, roles or lifecycle routes; add member/viewer accounts first | the role matrix is blocked until a second role exists | about 10 min |
| P3 idempotency, races, partial failure | any change to create/update paths, or after adding Idempotency-Key | largest correctness risk (duplicates on retry) | about 5 min |
| P4 contract | as soon as a spec is published | a diff is impossible without one | under 2 min |
| P5 error hygiene | every release | cheap; catches 5xx and envelope regressions | about 5 min |
| P6 fixtures | when limits change | regenerate; compare CRC32 values in fixtures/README.md | under 1 min |

## 18. Appendix M: cross-module integration checks (positive and negative)

| area | case | expected | status | verdict | note | rid |
|---|---|---|---|---|---|---|
| referential | deal exposes the linked contact and company | contact and company objects present | 200 | PASS | contact=None company=None | REQ-I00006 |
| line items | deal amount is derived from line items (3 x 5000) | amount.amount == 15000 | 200 | PASS | amount={'amount': 15000, 'currency': 'AUD'} | REQ-I00006 |
| referential | contact shows its company name | companyName == 'INT Company' | 200 | PASS |  | REQ-I00007 |
| referential | delete a contact that a deal references | 409 (or the link is cleared and documented) | 409 | PASS | Cannot delete this contact: 1 deal still references it. | REQ-I00008 |
| referential | delete a company that a deal and contact reference | 409 | 409 | PASS | Cannot delete this company: 2 records still reference it. | REQ-I00009 |
| line items | delete a catalog product that a deal line item references | 409 or soft-archive with the line preserved | 409 | PASS | status 409 | REQ-I00010 |
| line items | deal line items survive the product delete attempt | line item still present | 200 | PASS | INT deal | REQ-I00011 |
| line items | changing the product price does not change an existing deal's line | unitAmount stays 5000 | 200 | PASS | patch 200; unitAmount=5000 | REQ-I00013 |
| line items | line items in two currencies on one deal | 400 (single currency) or a documented multi-currency total | 400 | PASS | status 400; amount= | REQ-I00014 |
| line items | line item for a product that does not exist | 404/400 | 404 | PASS | Catalog product(s) 000000000000000000000000 not found; a deal can only sell a catalog product that exists | REQ-I00015 |
| line items | amount AND line items together | 400 (amount is derived) | 400 | PASS | A deal with line items derives its amount from them; remove `amount` or clear `lineItems` | REQ-I00016 |
| pipeline | delete a stage that holds an open deal | 409 | 409 | PASS | Cannot delete a stage that still holds 1 open deal. Move it to another stage first. | REQ-I00017 |
| pipeline | move the deal to the next stage | 200 | 200 | PASS | INT deal | REQ-I00018 |
| pipeline | delete the now-empty first stage | 200 | 200 | PASS |  | REQ-I00019 |
| automation | winning a deal fires a deal.won rule that creates a task (polled up to 4 min) | exactly one new task | 200 | PASS | task appeared after ~124s (rules run in a batch; the page gives no hint of the delay) | REQ-I00022 |
| automation | the firing is recorded as a run | one run record for the rule | 200 | PASS | runs=1 | REQ-I00032 |
| automation | a DISABLED rule does not fire (waited 170 s, longer than a batch) | task count unchanged | 200 | PASS | patch 200; tasks 1 -> 1 | REQ-I00034 |
| automation | rule with an event type that does not exist | 400 listing valid triggers | 400 | PASS | /trigger/eventType: Event type "deal.exploded" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, acti | REQ-I00038 |
| automation | rule whose action points at records that do not exist | 400 at save time | 201 | FAIL | status 201: static ids are not validated | REQ-I00039 |
| automation | rule triggered by activity.created that creates an activity (loop) | growth stops (loop guard) - not one new note per batch | 201 | PASS | loop notes after ~2.5 min: 1; after ~5 min: 1; rule deleted after the second check | REQ-I00040 |
| messaging | email to a contact with an address (test mode) | 202 queued | 202 | PASS | status field=queued | REQ-I00049 |
| messaging | message progresses beyond 'queued' in test mode | sent/delivered or a documented terminal state | 200 | PASS | status=sent | REQ-I00050 |
| messaging | email to a contact with no address | 422/400 | 422 | PASS | Contact 6abf9d0b7e14e534397697ed carries no usable email address | REQ-I00051 |
| messaging | sms to a contact with an E.164 number (test mode) | 202 | 202 | PASS |  | REQ-I00052 |
| messaging | email with a template id that does not exist | 404/400 | 404 | PASS | Template not found | REQ-I00053 |
| messaging | both templateId and body | 400 (exactly one) | 400 | PASS | /: Provide exactly one of templateId or body | REQ-I00054 |
| messaging | CRLF header injection in the subject | 400 or stripped | 400 | PASS | /subject: Header fields cannot contain CR, LF, or NUL | REQ-I00055 |
| messaging | 200,000-character email body | 400 with a documented limit | 400 | PASS | status 400: /body: Too big: expected string to have <=100000 characters | REQ-I00056 |
| messaging | test-mode messages do not appear in the live environment | 0 of the test messages in live | 200 | PASS |  | REQ-I00057 |
| reports | deals.by_stage matches the deals list for a pipeline | same counts per stage | 200 | PASS | truth={'22fa0ce8-31aa-4a8f-aa83-c46df7a3ee74': 1} report={'22fa0ce8-31aa-4a8f-aa83-c46df7a3ee74': 1} | REQ-I00059 |
| reports | deals.by_owner matches the deals list | same counts per owner | 200 | PASS | truth={'unassigned': 1, '6abe269787e4ad1cd534cb09': 12} report={'6abe269787e4ad1cd534cb09': 12, 'unassigned': 1} | REQ-I00060 |
| reports | contacts.by_status matches the contacts list | same counts per status | 200 | PASS | truth={'lead': 7, 'customer': 3, 'qualified': 4} report={'lead': 7, 'qualified': 4, 'customer': 3} | REQ-I00062 |
| reports | deals.won_lost matches won/lost deals closed in 2026 | same counts | 200 | PASS | truth won=3 lost=3 report={'won': 3, 'lost': 3} | REQ-I00063 |
| merge | merge a contact into itself | 400 or 409 | 409 | PASS | Cannot merge a contact into itself | REQ-I00068 |
| merge | merge a source that does not exist | 404 (a missing referenced contact is 404 on POST /deals) | 409 | FAIL | status 409: Source contact not found | REQ-I00069 |
| merge | merge two contacts that each have a different email | 200 with a way to choose which email to keep | 409 | FAIL | status 409: Both contacts have a different email, and a contact keeps only one of each. Email: this contact has merge.target@example.com, Merge Conflict has mer | REQ-I00070 |
| merge | merge source into target | 200 | 200 | PASS |  | REQ-I00071 |
| merge | source contact is gone or archived after the merge | 404 or archived | 404 | PASS | status 404 | REQ-I00072 |
| merge | the source's deal now points at the target contact | deal.contactId == target | 200 | PASS | contactId=6abf9d197e14e534397697f8 | REQ-I00073 |
| merge | target keeps/gains the source's phone number | phone +61491570008 present | 200 | PASS | phone=+61491570008 | REQ-I00074 |
| audit trail | event 'pipeline.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'company.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'contact.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'deal.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'deal.won' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'deal.stage_changed' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'deal.reopened' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'contact.merged' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'automation.rule.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'automation.rule.deleted' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'catalog_product.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'activity.created' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'message.queued' recorded in the last 100 events | present | 200 | INFO | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |
| audit trail | event 'contact.deleted' recorded in the last 100 events | present | 200 | PASS | INFO = not in the last 100 events (the log is shared with other steps; check /events filters) | REQ-I00075 |

## 19. Digest: wrong data, missing flows, validation gaps

**Validation gaps (accepted when they should not be):** NUL, whitespace-only and CRLF text is stored in names, bodies, titles and message bodies; lone surrogates become U+FFFD; invalid UTF-8 is replaced; phone and domain are not validated; `ownerActorId` is not checked; length limits differ by field (see Appendix B).

**Wrong or surprising data:** contacts created with `status: archived` have no previous status; stage ids can be client-chosen and reused across pipelines; deleting a custom property hides values and re-creating the key can change its type; audit events for deleted records lose the record name.

**Missing flows:** a way to resolve conflicting emails/phones when merging; hard-deleting a custom property; GET-by-id for custom properties; a documented spec; total counts on list endpoints; a documented filter syntax (`status[in]=` works, `status=` does not). (Two earlier items here — "lead qualify/disqualify/convert routes" and "linking activities to records" — are retracted: both work, at `/leads/{id}/...` and via `attachments: [{kind, id}]` respectively; see CRM-FX-0023 and CRM-FX-0018.)

**Behaves well (verified):** Idempotency-Key (sequential and concurrent), ETag/If-Match (412 on stale), unique-key races, state-machine transitions, partial-failure rollbacks, cross-project isolation, authentication on every route, stable error codes.

## 20. Appendix L: validation message catalogue

1063 distinct (endpoint, field, message) combinations observed in this run; also in `docs/validation-messages.csv`.

| method | endpoint | field | message | status | code | seen | example rid |
|---|---|---|---|---|---|---|---|
| POST | /pipelines | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 23 | REQ-00003 |
| POST | /pipelines | /name | Too big: expected string to have <=120 characters | 400 | validation_error | 16 | REQ-00022 |
| POST | /pipelines | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-00039 |
| POST | /pipelines | /name | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-00040 |
| POST | /pipelines | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-00041 |
| POST | /pipelines | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-00045 |
| POST | /pipelines | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-00055 |
| POST | /pipelines | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-00055 |
| POST | /pipelines | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-00058 |
| POST | /pipelines | /stages | A pipeline needs at least one stage | 400 | validation_error | 1 | REQ-00102 |
| POST | /pipelines | /stages | A pipeline holds at most 50 stages | 400 | validation_error | 5 | REQ-00108 |
| POST | /pipelines | /stages/0 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-00114 |
| POST | /pipelines | /stages/0 | Invalid input: expected object, received number | 400 | validation_error | 1 | REQ-00115 |
| POST | /pipelines | /stages/1 | Invalid input: expected object, received string | 400 | validation_error | 1 | REQ-00115 |
| POST | /pipelines | /stages/2 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-00115 |
| POST | /pipelines | /stages/3/name | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-00115 |
| POST | /pipelines | /stages/4 | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-00115 |
| POST | /pipelines | /stages | Invalid input: expected array, received string | 400 | validation_error | 1 | REQ-00116 |
| POST | /pipelines | /stages | Invalid input: expected array, received object | 400 | validation_error | 1 | REQ-00117 |
| POST | /pipelines | /stages | Invalid input: expected array, received null | 400 | validation_error | 1 | REQ-00118 |
| POST | /pipelines | /stages | Invalid input: expected array, received undefined | 400 | validation_error | 2 | REQ-00119 |
| POST | /pipelines | (request) | A stage named "S0" already exists in this pipeline | 400 | validation_error | 1 | REQ-00120 |
| POST | /pipelines | /stages/0/name | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-00121 |
| POST | /pipelines | /stages/0/name | Too big: expected string to have <=120 characters | 400 | validation_error | 15 | REQ-00140 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-00157 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-00158 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-00159 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-00163 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-00173 |
| POST | /pipelines | /stages/0/name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-00173 |
| POST | /pipelines | /stages/0/name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-00176 |
| PATCH | /pipelines/{id} | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A00002 |
| PATCH | /pipelines/{id} | /name | Too big: expected string to have <=120 characters | 400 | validation_error | 15 | REQ-A00021 |
| PATCH | /pipelines/{id} | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00038 |
| PATCH | /pipelines/{id} | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00039 |
| PATCH | /pipelines/{id} | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00043 |
| PATCH | /pipelines/{id} | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00053 |
| PATCH | /pipelines/{id} | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00053 |
| PATCH | /pipelines/{id} | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00056 |
| POST | /pipelines/{id}/stages | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A00103 |
| POST | /pipelines/{id}/stages | /name | Too big: expected string to have <=120 characters | 400 | validation_error | 15 | REQ-A00113 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00130 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-A00131 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00132 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00136 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00142 |
| POST | /pipelines/{id}/stages | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00142 |
| POST | /pipelines/{id}/stages | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00145 |
| POST | /pipelines/{id}/stages | (request) | A stage named "aa" already exists in this pipeline | 400 | validation_error | 1 | REQ-A00154 |
| DELETE | /None/{id} | (request) | No route for DELETE /v1/None/<id> | 404 | not_found | 35 | REQ-A00169 |
| POST | /deals | /title | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A00208 |
| POST | /deals | /title | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A00233 |
| POST | /deals | /title | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00247 |
| POST | /deals | /title | Invalid input: expected string, received undefined | 400 | validation_error | 3 | REQ-A00248 |
| POST | /deals | /title | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00249 |
| POST | /deals | /title | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00253 |
| POST | /deals | /title | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00263 |
| POST | /deals | /title | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00263 |
| POST | /deals | /title | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00266 |
| POST | /deals | /pipelineId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00310 |
| POST | /deals | (request) | Invalid pipeline id | 400 | validation_error | 12 | REQ-A00311 |
| POST | /deals | /pipelineId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00312 |
| POST | /deals | /pipelineId | Invalid input: expected string, received undefined | 400 | validation_error | 23 | REQ-A00313 |
| POST | /deals | /pipelineId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00314 |
| POST | /deals | /pipelineId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00318 |
| POST | /deals | /pipelineId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00324 |
| POST | /deals | /pipelineId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00324 |
| POST | /deals | /pipelineId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00327 |
| POST | /deals | (request) | Pipeline not found | 400 | validation_error | 2 | REQ-A00329 |
| POST | /deals | /stageId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00338 |
| POST | /deals | (request) | Stage does not belong to the pipeline | 400 | validation_error | 14 | REQ-A00339 |
| POST | /deals | /stageId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00340 |
| POST | /deals | /stageId | Invalid input: expected string, received undefined | 400 | validation_error | 23 | REQ-A00341 |
| POST | /deals | /stageId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00342 |
| POST | /deals | /stageId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00346 |
| POST | /deals | /stageId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00352 |
| POST | /deals | /stageId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00352 |
| POST | /deals | /stageId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00355 |
| POST | /deals | /contactId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00366 |
| POST | /deals | (request) | Contact not found | 404 | not_found | 14 | REQ-A00367 |
| POST | /deals | /contactId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00368 |
| POST | /deals | /contactId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00370 |
| POST | /deals | /contactId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00374 |
| POST | /deals | /contactId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00380 |
| POST | /deals | /contactId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00380 |
| POST | /deals | /contactId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00383 |
| POST | /deals | /companyId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00394 |
| POST | /deals | (request) | Company not found | 404 | not_found | 14 | REQ-A00395 |
| POST | /deals | /companyId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00396 |
| POST | /deals | /companyId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00398 |
| POST | /deals | /companyId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00402 |
| POST | /deals | /companyId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00408 |
| POST | /deals | /companyId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00408 |
| POST | /deals | /companyId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00411 |
| POST | /deals | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00422 |
| POST | /deals | /ownerActorId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00425 |
| POST | /deals | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00427 |
| POST | /deals | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00431 |
| POST | /deals | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00441 |
| POST | /deals | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00441 |
| POST | /deals | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00444 |
| POST | /deals | /amount/amount | Invalid input: expected number, received string | 400 | validation_error | 14 | REQ-A00464 |
| POST | /deals | /amount/amount | Invalid input: expected number, received null | 400 | validation_error | 1 | REQ-A00466 |
| POST | /deals | /amount/amount | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A00467 |
| POST | /deals | /amount/amount | Too small: expected number to be >=0 | 400 | validation_error | 4 | REQ-A00474 |
| POST | /deals | /amount/amount | Invalid input: expected number, received boolean | 400 | validation_error | 2 | REQ-A00475 |
| POST | /deals | /amount/amount | Invalid input: expected number, received array | 400 | validation_error | 3 | REQ-A00481 |
| POST | /deals | /amount/amount | Invalid input: expected number, received object | 400 | validation_error | 2 | REQ-A00484 |
| POST | /deals | /amount/amount | Invalid input: expected int, received number | 400 | validation_error | 4 | REQ-A00494 |
| POST | /deals | /amount/amount | Too small: expected int to be >=-<n> | 400 | validation_error | 2 | REQ-A00496 |
| POST | /deals | /amount/amount | Too big: expected int to be <=<n> | 400 | validation_error | 3 | REQ-A00500 |
| POST | /deals | /amount/currency | Invalid string: must match pattern /^[A-Z]{3}$/ | 400 | validation_error | 10 | REQ-A00512 |
| POST | /deals | /amount/currency | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00514 |
| POST | /deals | /amount/currency | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A00515 |
| POST | /deals | /amount/currency | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00516 |
| POST | /deals | /amount/currency | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00520 |
| POST | /deals | /amount/currency | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00526 |
| POST | /deals | /amount/currency | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00529 |
| POST | /deals | /amount/currency | XYZ is not a currency code. Use one such as USD, EUR or JPY | 400 | validation_error | 1 | REQ-A00534 |
| POST | /deals | /lineItems | Too big: expected array to have <=100 items | 400 | validation_error | 3 | REQ-A00628 |
| POST | /deals | /lineItems/0 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-A00632 |
| POST | /deals | /lineItems/0 | Invalid input: expected object, received number | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/1 | Invalid input: expected object, received string | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/2 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/3/catalogProductId | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/3/quantity | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/3/unitAmount | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/3/currency | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems/4 | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-A00633 |
| POST | /deals | /lineItems | Invalid input: expected array, received string | 400 | validation_error | 1 | REQ-A00634 |
| POST | /deals | /lineItems | Invalid input: expected array, received object | 400 | validation_error | 1 | REQ-A00635 |
| POST | /deals | /lineItems | Invalid input: expected array, received null | 400 | validation_error | 1 | REQ-A00636 |
| POST | /deals | /lineItems/0/catalogProductId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00640 |
| POST | /deals | (request) | Catalog product(s)     not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00641 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00642 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A00643 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00644 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00648 |
| POST | /deals | (request) | Catalog product(s) true not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00650 |
| POST | /deals | (request) | Catalog product(s) false not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00651 |
| POST | /deals | (request) | Catalog product(s) yes not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00652 |
| POST | /deals | (request) | Catalog product(s) no not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00653 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00654 |
| POST | /deals | /lineItems/0/catalogProductId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00654 |
| POST | /deals | /lineItems/0/catalogProductId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00657 |
| POST | /deals | (request) | Catalog product(s) <id> not found; a deal can only sell a catalog product that exists | 404 | not_found | 3 | REQ-A00659 |
| POST | /deals | (request) | Catalog product(s) aaaaaaaaaaaaaaaaaaaaaaa not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00661 |
| POST | /deals | (request) | Catalog product(s) <id>a not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00662 |
| POST | /deals | (request) | Catalog product(s) gggggggggggggggggggggggg not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00663 |
| POST | /deals | (request) | Catalog product(s) 123e<n>-e89b-12d3-a456-<n> not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00664 |
| POST | /deals | (request) | Catalog product(s) \x00 not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00665 |
| POST | /deals | (request) | Catalog product(s) -1 not found; a deal can only sell a catalog product that exists | 404 | not_found | 1 | REQ-A00666 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received string | 400 | validation_error | 14 | REQ-A00668 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received null | 400 | validation_error | 1 | REQ-A00670 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A00671 |
| POST | /deals | /lineItems/0/quantity | Too small: expected number to be >=1 | 400 | validation_error | 5 | REQ-A00672 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received boolean | 400 | validation_error | 2 | REQ-A00678 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received array | 400 | validation_error | 3 | REQ-A00684 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected number, received object | 400 | validation_error | 2 | REQ-A00687 |
| POST | /deals | /lineItems/0/quantity | Invalid input: expected int, received number | 400 | validation_error | 4 | REQ-A00697 |
| POST | /deals | /lineItems/0/quantity | Too small: expected int to be >=-<n> | 400 | validation_error | 2 | REQ-A00699 |
| POST | /deals | /lineItems/0/quantity | Too big: expected int to be <=<n> | 400 | validation_error | 3 | REQ-A00703 |
| POST | /deals | (request) | The line subtotal (quantity × unitAmount) exceeds <n>, the most minor units a deal can hold | 400 | validation_error | 2 | REQ-A00709 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received string | 400 | validation_error | 14 | REQ-A00714 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received null | 400 | validation_error | 1 | REQ-A00716 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A00717 |
| POST | /deals | /lineItems/0/unitAmount | Too small: expected number to be >=0 | 400 | validation_error | 4 | REQ-A00724 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received boolean | 400 | validation_error | 2 | REQ-A00725 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received array | 400 | validation_error | 3 | REQ-A00731 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected number, received object | 400 | validation_error | 2 | REQ-A00734 |
| POST | /deals | /lineItems/0/unitAmount | Invalid input: expected int, received number | 400 | validation_error | 4 | REQ-A00744 |
| POST | /deals | /lineItems/0/unitAmount | Too small: expected int to be >=-<n> | 400 | validation_error | 2 | REQ-A00746 |
| POST | /deals | /lineItems/0/unitAmount | Too big: expected int to be <=<n> | 400 | validation_error | 3 | REQ-A00750 |
| POST | /deals | /lineItems/0/currency | Invalid string: must match pattern /^[A-Z]{3}$/ | 400 | validation_error | 10 | REQ-A00761 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00763 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A00764 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00765 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00769 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00775 |
| POST | /deals | /lineItems/0/currency | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00778 |
| POST | /deals | /lineItems/0/currency | XYZ is not a currency code. Use one such as USD, EUR or JPY | 400 | validation_error | 1 | REQ-A00783 |
| PATCH | /deals/{id} | /title | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A00828 |
| PATCH | /deals/{id} | /title | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A00853 |
| PATCH | /deals/{id} | /title | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A00867 |
| PATCH | /deals/{id} | /title | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00868 |
| PATCH | /deals/{id} | /title | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00872 |
| PATCH | /deals/{id} | /title | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00882 |
| PATCH | /deals/{id} | /title | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00882 |
| PATCH | /deals/{id} | /title | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00885 |
| PATCH | /deals/{id} | /contactId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00929 |
| PATCH | /deals/{id} | (request) | Contact not found | 404 | not_found | 14 | REQ-A00930 |
| PATCH | /deals/{id} | /contactId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00933 |
| PATCH | /deals/{id} | /contactId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00937 |
| PATCH | /deals/{id} | /contactId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00943 |
| PATCH | /deals/{id} | /contactId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00943 |
| PATCH | /deals/{id} | /contactId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00946 |
| PATCH | /deals/{id} | /companyId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00957 |
| PATCH | /deals/{id} | (request) | Company not found | 404 | not_found | 14 | REQ-A00958 |
| PATCH | /deals/{id} | /companyId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00961 |
| PATCH | /deals/{id} | /companyId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00965 |
| PATCH | /deals/{id} | /companyId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A00971 |
| PATCH | /deals/{id} | /companyId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A00971 |
| PATCH | /deals/{id} | /companyId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A00974 |
| PATCH | /deals/{id} | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A00985 |
| PATCH | /deals/{id} | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A00990 |
| PATCH | /deals/{id} | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A00994 |
| PATCH | /deals/{id} | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01004 |
| PATCH | /deals/{id} | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01004 |
| PATCH | /deals/{id} | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01007 |
| POST | /contacts | /firstName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A01033 |
| POST | /contacts | /firstName | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A01058 |
| POST | /contacts | /firstName | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01073 |
| POST | /contacts | /firstName | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-A01074 |
| POST | /contacts | /firstName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01075 |
| POST | /contacts | /firstName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01079 |
| POST | /contacts | /firstName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01089 |
| POST | /contacts | /firstName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01089 |
| POST | /contacts | /firstName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01092 |
| POST | /contacts | /lastName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A01136 |
| POST | /contacts | /lastName | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A01161 |
| POST | /contacts | /lastName | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01176 |
| POST | /contacts | /lastName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01178 |
| POST | /contacts | /lastName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01182 |
| POST | /contacts | /lastName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01192 |
| POST | /contacts | /lastName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01192 |
| POST | /contacts | /lastName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01195 |
| POST | /contacts | /email | Invalid email address | 400 | validation_error | 42 | REQ-A01239 |
| POST | /contacts | /email | Too big: expected string to have <=320 characters | 400 | validation_error | 14 | REQ-A01268 |
| POST | /contacts | /email | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01298 |
| POST | /contacts | /email | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01300 |
| POST | /contacts | /email | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01304 |
| POST | /contacts | /email | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01310 |
| POST | /contacts | /email | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01313 |
| POST | /contacts | /phone | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A01334 |
| POST | /contacts | /phone | Too big: expected string to have <=50 characters | 400 | validation_error | 23 | REQ-A01343 |
| POST | /contacts | /phone | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01375 |
| POST | /contacts | /phone | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01377 |
| POST | /contacts | /phone | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01381 |
| POST | /contacts | /phone | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01391 |
| POST | /contacts | /phone | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01391 |
| POST | /contacts | /phone | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01394 |
| POST | /contacts | /companyId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A01424 |
| POST | /contacts | (request) | Company not found | 404 | not_found | 14 | REQ-A01425 |
| POST | /contacts | /companyId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01426 |
| POST | /contacts | /companyId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01428 |
| POST | /contacts | /companyId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01432 |
| POST | /contacts | /companyId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01438 |
| POST | /contacts | /companyId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01438 |
| POST | /contacts | /companyId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01441 |
| POST | /contacts | /status | Invalid option: expected one of "lead"\|"qualified"\|"customer"\|"archived" | 400 | validation_error | 24 | REQ-A01452 |
| POST | /contacts | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A01484 |
| POST | /contacts | /ownerActorId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A01487 |
| POST | /contacts | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A01489 |
| POST | /contacts | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A01493 |
| POST | /contacts | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A01503 |
| POST | /contacts | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A01503 |
| POST | /contacts | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A01506 |
| POST | /contacts | /customProperties | Invalid input: expected record, received string | 400 | validation_error | 6 | REQ-A01526 |
| POST | /contacts | /customProperties | Invalid input: expected record, received null | 400 | validation_error | 1 | REQ-A01528 |
| POST | /contacts | /customProperties | Invalid input: expected record, received number | 400 | validation_error | 4 | REQ-A01530 |
| POST | /contacts | /customProperties | Invalid input: expected record, received boolean | 400 | validation_error | 2 | REQ-A01534 |
| POST | /contacts | /customProperties | Invalid input: expected record, received array | 400 | validation_error | 3 | REQ-A01540 |
| POST | /contacts | (request) | Custom property "a" is not defined | 400 | validation_error | 1 | REQ-A01544 |
| POST | /contacts | (request) | Custom property "lead_source" must be at most 500 characters | 400 | validation_error | 15 | REQ-A01581 |
| POST | /contacts | (request) | Custom property "lead_source" must be a string | 400 | validation_error | 6 | REQ-A01603 |
| POST | /contacts | /customProperties/lead_source | Invalid input | 400 | validation_error | 5 | REQ-A01617 |
| POST | /contacts | (request) | Custom property "employee_count" must be a finite number | 400 | validation_error | 16 | REQ-A01664 |
| POST | /contacts | /customProperties/employee_count | Invalid input | 400 | validation_error | 5 | REQ-A01683 |
| POST | /contacts | (request) | Custom property "vip" must be a boolean | 400 | validation_error | 14 | REQ-A01724 |
| POST | /contacts | /customProperties/vip | Invalid input | 400 | validation_error | 5 | REQ-A01741 |
| POST | /contacts | (request) | Custom property "renewal_date" must be an ISO-<n> date | 400 | validation_error | 20 | REQ-A01750 |
| POST | /contacts | /customProperties/renewal_date | Invalid input | 400 | validation_error | 5 | REQ-A01765 |
| PATCH | /contacts/{id} | /lastName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02022 |
| PATCH | /contacts/{id} | /lastName | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A02047 |
| PATCH | /contacts/{id} | /lastName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02064 |
| PATCH | /contacts/{id} | /lastName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02068 |
| PATCH | /contacts/{id} | /lastName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02078 |
| PATCH | /contacts/{id} | /lastName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02078 |
| PATCH | /contacts/{id} | /lastName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02081 |
| PATCH | /contacts/{id} | /email | Invalid email address | 400 | validation_error | 22 | REQ-A02125 |
| PATCH | /contacts/{id} | /email | Too big: expected string to have <=320 characters | 400 | validation_error | 14 | REQ-A02154 |
| PATCH | /contacts/{id} | /email | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02186 |
| PATCH | /contacts/{id} | /email | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02190 |
| PATCH | /contacts/{id} | /email | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02196 |
| PATCH | /contacts/{id} | /email | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02199 |
| PATCH | /contacts/{id} | /phone | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02220 |
| PATCH | /contacts/{id} | /phone | Too big: expected string to have <=50 characters | 400 | validation_error | 23 | REQ-A02229 |
| PATCH | /contacts/{id} | /phone | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02263 |
| PATCH | /contacts/{id} | /phone | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02267 |
| PATCH | /contacts/{id} | /phone | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02277 |
| PATCH | /contacts/{id} | /phone | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02277 |
| PATCH | /contacts/{id} | /phone | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02280 |
| PATCH | /contacts/{id} | /companyId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A02310 |
| PATCH | /contacts/{id} | (request) | Company not found | 404 | not_found | 14 | REQ-A02311 |
| PATCH | /contacts/{id} | /companyId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02314 |
| PATCH | /contacts/{id} | /companyId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02318 |
| PATCH | /contacts/{id} | /companyId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02324 |
| PATCH | /contacts/{id} | /companyId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02324 |
| PATCH | /contacts/{id} | /companyId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02327 |
| PATCH | /contacts/{id} | /status | Invalid option: expected one of "lead"\|"qualified"\|"customer"\|"archived" | 400 | validation_error | 23 | REQ-A02338 |
| PATCH | /contacts/{id} | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A02369 |
| PATCH | /contacts/{id} | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02374 |
| PATCH | /contacts/{id} | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02378 |
| PATCH | /contacts/{id} | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02388 |
| PATCH | /contacts/{id} | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02388 |
| PATCH | /contacts/{id} | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02391 |
| PATCH | /contacts/{id} | /customProperties | Invalid input: expected record, received string | 400 | validation_error | 6 | REQ-A02411 |
| PATCH | /contacts/{id} | /customProperties | Invalid input: expected record, received null | 400 | validation_error | 1 | REQ-A02413 |
| PATCH | /contacts/{id} | /customProperties | Invalid input: expected record, received number | 400 | validation_error | 4 | REQ-A02414 |
| PATCH | /contacts/{id} | /customProperties | Invalid input: expected record, received boolean | 400 | validation_error | 2 | REQ-A02418 |
| PATCH | /contacts/{id} | /customProperties | Invalid input: expected record, received array | 400 | validation_error | 3 | REQ-A02424 |
| PATCH | /contacts/{id} | (request) | Custom property "a" is not defined | 400 | validation_error | 1 | REQ-A02428 |
| PATCH | /contacts/{id} | (request) | Custom property "lead_source" must be at most 500 characters | 400 | validation_error | 15 | REQ-A02465 |
| PATCH | /contacts/{id} | (request) | Custom property "lead_source" must be a string | 400 | validation_error | 6 | REQ-A02487 |
| PATCH | /contacts/{id} | /customProperties/lead_source | Invalid input | 400 | validation_error | 5 | REQ-A02501 |
| PATCH | /contacts/{id} | (request) | Custom property "employee_count" must be a finite number | 400 | validation_error | 16 | REQ-A02548 |
| PATCH | /contacts/{id} | /customProperties/employee_count | Invalid input | 400 | validation_error | 5 | REQ-A02567 |
| PATCH | /contacts/{id} | (request) | Custom property "vip" must be a boolean | 400 | validation_error | 14 | REQ-A02608 |
| PATCH | /contacts/{id} | /customProperties/vip | Invalid input | 400 | validation_error | 5 | REQ-A02625 |
| PATCH | /contacts/{id} | (request) | Custom property "renewal_date" must be an ISO-<n> date | 400 | validation_error | 20 | REQ-A02634 |
| PATCH | /contacts/{id} | /customProperties/renewal_date | Invalid input | 400 | validation_error | 5 | REQ-A02649 |
| PATCH | /contacts/{id} | /firstName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02672 |
| PATCH | /contacts/{id} | /firstName | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A02697 |
| PATCH | /contacts/{id} | /firstName | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A02712 |
| PATCH | /contacts/{id} | /firstName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02713 |
| PATCH | /contacts/{id} | /firstName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02717 |
| PATCH | /contacts/{id} | /firstName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02727 |
| PATCH | /contacts/{id} | /firstName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02727 |
| PATCH | /contacts/{id} | /firstName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02730 |
| POST | /companies | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02777 |
| POST | /companies | /name | Too big: expected string to have <=300 characters | 400 | validation_error | 12 | REQ-A02810 |
| POST | /companies | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A02833 |
| POST | /companies | /name | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-A02834 |
| POST | /companies | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02835 |
| POST | /companies | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02839 |
| POST | /companies | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02849 |
| POST | /companies | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02849 |
| POST | /companies | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02852 |
| POST | /companies | /domain | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02896 |
| POST | /companies | /domain | Too big: expected string to have <=300 characters | 400 | validation_error | 12 | REQ-A02929 |
| POST | /companies | /domain | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A02952 |
| POST | /companies | /domain | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A02954 |
| POST | /companies | /domain | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A02958 |
| POST | /companies | /domain | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A02968 |
| POST | /companies | /domain | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A02968 |
| POST | /companies | /domain | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A02971 |
| POST | /companies | /phone | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A02991 |
| POST | /companies | /phone | Too big: expected string to have <=50 characters | 400 | validation_error | 23 | REQ-A03000 |
| POST | /companies | /phone | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03032 |
| POST | /companies | /phone | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03034 |
| POST | /companies | /phone | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03038 |
| POST | /companies | /phone | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03048 |
| POST | /companies | /phone | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03048 |
| POST | /companies | /phone | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03051 |
| POST | /companies | /status | Invalid option: expected one of "active"\|"archived" | 400 | validation_error | 24 | REQ-A03081 |
| POST | /companies | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A03109 |
| POST | /companies | /ownerActorId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03112 |
| POST | /companies | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03114 |
| POST | /companies | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03118 |
| POST | /companies | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03128 |
| POST | /companies | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03128 |
| POST | /companies | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03131 |
| PATCH | /companies/{id} | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A03281 |
| PATCH | /companies/{id} | /name | Too big: expected string to have <=300 characters | 400 | validation_error | 12 | REQ-A03314 |
| PATCH | /companies/{id} | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03337 |
| PATCH | /companies/{id} | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03338 |
| PATCH | /companies/{id} | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03342 |
| PATCH | /companies/{id} | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03352 |
| PATCH | /companies/{id} | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03352 |
| PATCH | /companies/{id} | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03355 |
| PATCH | /companies/{id} | /domain | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A03399 |
| PATCH | /companies/{id} | /domain | Too big: expected string to have <=300 characters | 400 | validation_error | 12 | REQ-A03432 |
| PATCH | /companies/{id} | /domain | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03457 |
| PATCH | /companies/{id} | /domain | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03461 |
| PATCH | /companies/{id} | /domain | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03471 |
| PATCH | /companies/{id} | /domain | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03471 |
| PATCH | /companies/{id} | /domain | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03474 |
| PATCH | /companies/{id} | /phone | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-A03494 |
| PATCH | /companies/{id} | /phone | Too big: expected string to have <=50 characters | 400 | validation_error | 23 | REQ-A03503 |
| PATCH | /companies/{id} | /phone | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03537 |
| PATCH | /companies/{id} | /phone | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03541 |
| PATCH | /companies/{id} | /phone | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03551 |
| PATCH | /companies/{id} | /phone | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03551 |
| PATCH | /companies/{id} | /phone | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03554 |
| PATCH | /companies/{id} | /status | Invalid option: expected one of "active"\|"archived" | 400 | validation_error | 23 | REQ-A03584 |
| PATCH | /companies/{id} | /ownerActorId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-A03611 |
| PATCH | /companies/{id} | /ownerActorId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03616 |
| PATCH | /companies/{id} | /ownerActorId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03620 |
| PATCH | /companies/{id} | /ownerActorId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03630 |
| PATCH | /companies/{id} | /ownerActorId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03630 |
| PATCH | /companies/{id} | /ownerActorId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03633 |
| POST | /catalog-products | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A03656 |
| POST | /catalog-products | /name | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A03681 |
| POST | /catalog-products | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03695 |
| POST | /catalog-products | /name | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-A03696 |
| POST | /catalog-products | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03697 |
| POST | /catalog-products | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03701 |
| POST | /catalog-products | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03711 |
| POST | /catalog-products | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03711 |
| POST | /catalog-products | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03714 |
| POST | /catalog-products | /description | Too big: expected string to have <=<n> characters | 400 | validation_error | 15 | REQ-A03800 |
| POST | /catalog-products | /description | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03819 |
| POST | /catalog-products | /description | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03821 |
| POST | /catalog-products | /description | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03825 |
| POST | /catalog-products | /description | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03835 |
| POST | /catalog-products | /description | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03838 |
| POST | /catalog-products | (request) | Request body is too large | 413 | payload_too_large | 1 | REQ-A03893 |
| POST | /catalog-products | /priceEntries/0 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-A03894 |
| POST | /catalog-products | /priceEntries/0 | Invalid input: expected object, received number | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/1 | Invalid input: expected object, received string | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/2 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/3/amount | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/3/currency | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/3/label | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries/4 | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-A03895 |
| POST | /catalog-products | /priceEntries | Invalid input: expected array, received string | 400 | validation_error | 1 | REQ-A03896 |
| POST | /catalog-products | /priceEntries | Invalid input: expected array, received object | 400 | validation_error | 1 | REQ-A03897 |
| POST | /catalog-products | /priceEntries | Invalid input: expected array, received null | 400 | validation_error | 1 | REQ-A03898 |
| POST | /catalog-products | /priceEntries/1 | AUD with the label "P0" is listed twice. Each currency and label pair can appear only once | 400 | validation_error | 1 | REQ-A03900 |
| POST | /catalog-products | /priceEntries/0/label | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A03901 |
| POST | /catalog-products | /priceEntries/0/label | Too big: expected string to have <=120 characters | 400 | validation_error | 15 | REQ-A03920 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A03937 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A03938 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A03939 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A03943 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A03953 |
| POST | /catalog-products | /priceEntries/0/label | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A03953 |
| POST | /catalog-products | /priceEntries/0/label | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A03956 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received string | 400 | validation_error | 14 | REQ-A04000 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received null | 400 | validation_error | 1 | REQ-A04002 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received undefined | 400 | validation_error | 1 | REQ-A04003 |
| POST | /catalog-products | /priceEntries/0/amount | Too small: expected number to be >=0 | 400 | validation_error | 4 | REQ-A04010 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received boolean | 400 | validation_error | 2 | REQ-A04011 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received array | 400 | validation_error | 3 | REQ-A04017 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected number, received object | 400 | validation_error | 2 | REQ-A04020 |
| POST | /catalog-products | /priceEntries/0/amount | Invalid input: expected int, received number | 400 | validation_error | 4 | REQ-A04030 |
| POST | /catalog-products | /priceEntries/0/amount | Too small: expected int to be >=-<n> | 400 | validation_error | 2 | REQ-A04032 |
| POST | /catalog-products | /priceEntries/0/amount | Too big: expected int to be <=<n> | 400 | validation_error | 3 | REQ-A04036 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid string: must match pattern /^[A-Z]{3}$/ | 400 | validation_error | 10 | REQ-A04048 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A04050 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-A04051 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A04052 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A04056 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A04062 |
| POST | /catalog-products | /priceEntries/0/currency | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A04065 |
| POST | /catalog-products | /priceEntries/0/currency | XYZ is not a currency code. Use one such as USD, EUR or JPY | 400 | validation_error | 1 | REQ-A04070 |
| PATCH | /catalog-products/{id} | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-A04227 |
| PATCH | /catalog-products/{id} | /name | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-A04252 |
| PATCH | /catalog-products/{id} | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-A04266 |
| PATCH | /catalog-products/{id} | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A04267 |
| PATCH | /catalog-products/{id} | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A04271 |
| PATCH | /catalog-products/{id} | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A04281 |
| PATCH | /catalog-products/{id} | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-A04281 |
| PATCH | /catalog-products/{id} | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A04284 |
| PATCH | /catalog-products/{id} | /description | Too big: expected string to have <=<n> characters | 400 | validation_error | 15 | REQ-A04370 |
| PATCH | /catalog-products/{id} | /description | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-A04391 |
| PATCH | /catalog-products/{id} | /description | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-A04395 |
| PATCH | /catalog-products/{id} | /description | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-A04405 |
| PATCH | /catalog-products/{id} | /description | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-A04408 |
| POST | /contacts/custom-properties | /key | Invalid string: must match pattern /^(?!constructor$)[a-z][a-z0-9_]{0,39}$/ | 400 | validation_error | 87 | REQ-B00003 |
| GET | /contacts/custom-properties/{id} | (request) | No route for GET /v1/contacts/custom-properties/<id> | 404 | not_found | 75 | REQ-B00005 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received null | 400 | validation_error | 3 | REQ-B00040 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received undefined | 400 | validation_error | 4 | REQ-B00041 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received number | 400 | validation_error | 12 | REQ-B00042 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received boolean | 400 | validation_error | 6 | REQ-B00046 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received array | 400 | validation_error | 9 | REQ-B00056 |
| POST | /contacts/custom-properties | /key | Invalid input: expected string, received object | 400 | validation_error | 6 | REQ-B00059 |
| POST | /contacts/custom-properties | /label | Too small: expected string to have >=1 characters | 400 | validation_error | 6 | REQ-B00069 |
| POST | /contacts/custom-properties | (request) | Custom property "audit_prop" already exists in this Organization | 409 | conflict | 39 | REQ-B00070 |
| POST | /contacts/custom-properties | /label | Too big: expected string to have <=120 characters | 400 | validation_error | 45 | REQ-B00079 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received null | 400 | validation_error | 3 | REQ-B00096 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received undefined | 400 | validation_error | 4 | REQ-B00097 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received number | 400 | validation_error | 12 | REQ-B00098 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received boolean | 400 | validation_error | 6 | REQ-B00102 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received array | 400 | validation_error | 9 | REQ-B00108 |
| POST | /contacts/custom-properties | /label | Too small: expected array to have >=1 items | 400 | validation_error | 3 | REQ-B00108 |
| POST | /contacts/custom-properties | /label | Invalid input: expected string, received object | 400 | validation_error | 6 | REQ-B00111 |
| POST | /contacts/custom-properties | /type | Invalid option: expected one of "text"\|"number"\|"boolean"\|"date" | 400 | validation_error | 73 | REQ-B00134 |
| POST | /automation-rules | /name | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B00178 |
| POST | /automation-rules | /name | Too big: expected string to have <=200 characters | 400 | validation_error | 12 | REQ-B00203 |
| POST | /automation-rules | /name | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B00218 |
| POST | /automation-rules | /name | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B00219 |
| POST | /automation-rules | /name | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B00220 |
| POST | /automation-rules | /name | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B00224 |
| POST | /automation-rules | /name | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B00234 |
| POST | /automation-rules | /name | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B00234 |
| POST | /automation-rules | /name | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B00237 |
| POST | /automation-rules | /trigger/eventType | Event type "" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company. | 400 | validation_error | 1 | REQ-B00281 |
| POST | /automation-rules | /trigger/eventType | Event type "   " cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compa | 400 | validation_error | 1 | REQ-B00282 |
| POST | /automation-rules | /trigger/eventType | Event type null cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compan | 400 | validation_error | 1 | REQ-B00283 |
| POST | /automation-rules | /trigger/eventType | Event type undefined cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, c | 400 | validation_error | 1 | REQ-B00284 |
| POST | /automation-rules | /trigger/eventType | Event type 0 cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company.m | 400 | validation_error | 1 | REQ-B00285 |
| POST | /automation-rules | /trigger/eventType | Event type 1 cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company.m | 400 | validation_error | 2 | REQ-B00286 |
| POST | /automation-rules | /trigger/eventType | Event type -1 cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company. | 400 | validation_error | 1 | REQ-B00288 |
| POST | /automation-rules | /trigger/eventType | Event type true cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compan | 400 | validation_error | 1 | REQ-B00289 |
| POST | /automation-rules | /trigger/eventType | Event type false cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compa | 400 | validation_error | 1 | REQ-B00290 |
| POST | /automation-rules | /trigger/eventType | Event type "true" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, comp | 400 | validation_error | 1 | REQ-B00291 |
| POST | /automation-rules | /trigger/eventType | Event type "false" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, com | 400 | validation_error | 1 | REQ-B00292 |
| POST | /automation-rules | /trigger/eventType | Event type "yes" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compa | 400 | validation_error | 1 | REQ-B00293 |
| POST | /automation-rules | /trigger/eventType | Event type "no" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compan | 400 | validation_error | 1 | REQ-B00294 |
| POST | /automation-rules | /trigger/eventType | Event type [] cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company. | 400 | validation_error | 1 | REQ-B00295 |
| POST | /automation-rules | /trigger/eventType | Event type ["a"] cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, compa | 400 | validation_error | 1 | REQ-B00296 |
| POST | /automation-rules | /trigger/eventType | Event type [null] cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, comp | 400 | validation_error | 1 | REQ-B00297 |
| POST | /automation-rules | /trigger/eventType | Event type {} cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, company. | 400 | validation_error | 1 | REQ-B00298 |
| POST | /automation-rules | /trigger/eventType | Event type {"a":1} cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, com | 400 | validation_error | 1 | REQ-B00299 |
| POST | /automation-rules | /trigger/eventType | Event type "DEAL.WON" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted,  | 400 | validation_error | 1 | REQ-B00310 |
| POST | /automation-rules | /trigger/eventType | Event type "DEAL.LOST" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted, | 400 | validation_error | 1 | REQ-B00311 |
| POST | /automation-rules | /trigger/eventType | Event type "Deal.Won" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted,  | 400 | validation_error | 1 | REQ-B00312 |
| POST | /automation-rules | /trigger/eventType | Event type "approved-but-not-really" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, co | 400 | validation_error | 1 | REQ-B00313 |
| POST | /automation-rules | /trigger/eventType | Event type " deal.won " cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.deleted | 400 | validation_error | 1 | REQ-B00314 |
| POST | /automation-rules | /action/type | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-B00315 |
| POST | /automation-rules | (request) | Unknown automation action type "   ". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00316 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B00317 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B00318 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B00319 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B00323 |
| POST | /automation-rules | (request) | Unknown automation action type "true". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00325 |
| POST | /automation-rules | (request) | Unknown automation action type "false". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00326 |
| POST | /automation-rules | (request) | Unknown automation action type "yes". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00327 |
| POST | /automation-rules | (request) | Unknown automation action type "no". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00328 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B00329 |
| POST | /automation-rules | /action/type | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B00329 |
| POST | /automation-rules | /action/type | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B00332 |
| POST | /automation-rules | (request) | Automation action "contact.update" has invalid fields — contactId: Invalid input: expected string, received undefined; (root): Unrecognized keys: "type", "title" | 400 | validation_error | 1 | REQ-B00336 |
| POST | /automation-rules | (request) | Automation action "deal.move" has invalid fields — dealId: Invalid input: expected string, received undefined; stageId: Invalid input: expected string, received undefined; (root): Unrecognized keys: " | 400 | validation_error | 1 | REQ-B00337 |
| POST | /automation-rules | (request) | Automation action "message.queue" has invalid fields — contactId: Invalid input: expected string, received undefined; channel: Invalid input: expected string, received undefined; (root): Unrecognized  | 400 | validation_error | 1 | REQ-B00338 |
| POST | /automation-rules | (request) | Unknown automation action type "ACTIVITY.CREATE". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00339 |
| POST | /automation-rules | (request) | Unknown automation action type "CONTACT.UPDATE". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00340 |
| POST | /automation-rules | (request) | Unknown automation action type "Activity.Create". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00341 |
| POST | /automation-rules | (request) | Unknown automation action type "approved-but-not-really". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00342 |
| POST | /automation-rules | (request) | Unknown automation action type " activity.create ". Registered action types: activity.create, contact.update, deal.move, message.queue | 400 | validation_error | 1 | REQ-B00343 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — type: Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| 'document' | 400 | validation_error | 22 | REQ-B00344 |
| POST | /automation-rules | /action/fields/type | Invalid input | 400 | validation_error | 2 | REQ-B00361 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — body: Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B00365 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — startsAt: Invalid input: expected string, received undefined; endsAt: Invalid input: expected string, received undefined; timeZone: Invalid inp | 400 | validation_error | 1 | REQ-B00366 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — url: Invalid input: expected string, received undefined; fileName: Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B00367 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B00373 |
| POST | /automation-rules | /action/fields/title | Too big: expected string to have <=<n> characters | 400 | validation_error | 15 | REQ-B00414 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B00432 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B00433 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B00434 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B00438 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received array; title: Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B00448 |
| POST | /automation-rules | (request) | Automation action "activity.create" has invalid fields — title: Invalid input: expected string, received array | 400 | validation_error | 2 | REQ-B00449 |
| POST | /automation-rules | /action/fields/title | Invalid input | 400 | validation_error | 2 | REQ-B00451 |
| POST | /automation-rules | /conditions/0/path | Invalid input: expected string, received undefined | 400 | validation_error | 3 | REQ-B00496 |
| POST | /automation-rules | /conditions/0/op | Invalid option: expected one of "eq"\|"neq"\|"in"\|"exists"\|"gt"\|"lt" | 400 | validation_error | 3 | REQ-B00496 |
| POST | /automation-rules | /conditions/0 | Unrecognized keys: "field", "operator" | 400 | validation_error | 3 | REQ-B00496 |
| POST | /automation-rules | /conditions/1/path | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B00497 |
| POST | /automation-rules | /conditions/1/op | Invalid option: expected one of "eq"\|"neq"\|"in"\|"exists"\|"gt"\|"lt" | 400 | validation_error | 2 | REQ-B00497 |
| POST | /automation-rules | /conditions/1 | Unrecognized keys: "field", "operator" | 400 | validation_error | 2 | REQ-B00497 |
| POST | /automation-rules | /conditions/0 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-B00507 |
| POST | /automation-rules | /conditions/0 | Invalid input: expected object, received number | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions/1 | Invalid input: expected object, received string | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions/2 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions/3/path | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions/3/op | Invalid option: expected one of "eq"\|"neq"\|"in"\|"exists"\|"gt"\|"lt" | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions/4 | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-B00508 |
| POST | /automation-rules | /conditions | Invalid input: expected array, received string | 400 | validation_error | 1 | REQ-B00509 |
| POST | /automation-rules | /conditions | Invalid input: expected array, received object | 400 | validation_error | 1 | REQ-B00510 |
| POST | /automation-rules | /conditions | Invalid input: expected array, received null | 400 | validation_error | 1 | REQ-B00511 |
| POST | /activities | /title | Too small: expected string to have >=1 characters | 400 | validation_error | 18 | REQ-B00611 |
| POST | /activities | /title | Too big: expected string to have <=200 characters | 400 | validation_error | 72 | REQ-B00636 |
| POST | /activities | /title | Invalid input: expected string, received null | 400 | validation_error | 6 | REQ-B00650 |
| POST | /activities | /title | Invalid input: expected string, received undefined | 400 | validation_error | 6 | REQ-B00651 |
| POST | /activities | /title | Invalid input: expected string, received number | 400 | validation_error | 24 | REQ-B00652 |
| POST | /activities | /title | Invalid input: expected string, received boolean | 400 | validation_error | 12 | REQ-B00656 |
| POST | /activities | /title | Invalid input: expected string, received array | 400 | validation_error | 18 | REQ-B00666 |
| POST | /activities | /title | Too small: expected array to have >=1 items | 400 | validation_error | 6 | REQ-B00666 |
| POST | /activities | /title | Invalid input: expected string, received object | 400 | validation_error | 12 | REQ-B00669 |
| POST | /activities | /description | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B00713 |
| POST | /activities | /description | Too big: expected string to have <=<n> characters | 400 | validation_error | 9 | REQ-B00760 |
| POST | /activities | /description | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B00787 |
| POST | /activities | /description | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B00791 |
| POST | /activities | /description | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B00801 |
| POST | /activities | /description | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B00801 |
| POST | /activities | /description | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B00804 |
| POST | /activities | /dueAt | Invalid ISO datetime | 400 | validation_error | 15 | REQ-B00848 |
| POST | /activities | /dueAt | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B00853 |
| POST | /activities | /dueAt | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B00857 |
| POST | /activities | /dueAt | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B00863 |
| POST | /activities | /dueAt | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B00866 |
| POST | /activities | /priority | Invalid option: expected one of "low"\|"normal"\|"high" | 400 | validation_error | 23 | REQ-B00889 |
| POST | /activities | /body | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B01132 |
| POST | /activities | /body | Too big: expected string to have <=<n> characters | 400 | validation_error | 9 | REQ-B01179 |
| POST | /activities | /body | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B01203 |
| POST | /activities | /body | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B01204 |
| POST | /activities | /body | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B01205 |
| POST | /activities | /body | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B01209 |
| POST | /activities | /body | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B01219 |
| POST | /activities | /body | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B01219 |
| POST | /activities | /body | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B01222 |
| POST | /activities | /direction | Invalid option: expected one of "inbound"\|"outbound" | 400 | validation_error | 24 | REQ-B01465 |
| POST | /activities | /outcome | Invalid option: expected one of "connected"\|"no_answer"\|"voicemail"\|"busy" | 400 | validation_error | 24 | REQ-B01493 |
| POST | /activities | /startsAt | Invalid ISO datetime | 400 | validation_error | 30 | REQ-B01674 |
| POST | /activities | /endsAt | endsAt must be greater than or equal to startsAt | 400 | validation_error | 58 | REQ-B01674 |
| POST | /activities | /startsAt | Invalid input: expected string, received null | 400 | validation_error | 2 | REQ-B01676 |
| POST | /activities | /startsAt | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B01677 |
| POST | /activities | /startsAt | Invalid input: expected string, received number | 400 | validation_error | 8 | REQ-B01678 |
| POST | /activities | /startsAt | Invalid input: expected string, received boolean | 400 | validation_error | 4 | REQ-B01682 |
| POST | /activities | /startsAt | Invalid input: expected string, received array | 400 | validation_error | 6 | REQ-B01688 |
| POST | /activities | /startsAt | Invalid input: expected string, received object | 400 | validation_error | 4 | REQ-B01691 |
| POST | /activities | /endsAt | Invalid ISO datetime | 400 | validation_error | 30 | REQ-B01713 |
| POST | /activities | /endsAt | Invalid input: expected string, received null | 400 | validation_error | 2 | REQ-B01715 |
| POST | /activities | /endsAt | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B01716 |
| POST | /activities | /endsAt | Invalid input: expected string, received number | 400 | validation_error | 8 | REQ-B01717 |
| POST | /activities | /endsAt | Invalid input: expected string, received boolean | 400 | validation_error | 4 | REQ-B01721 |
| POST | /activities | /endsAt | Invalid input: expected string, received array | 400 | validation_error | 6 | REQ-B01727 |
| POST | /activities | /endsAt | Invalid input: expected string, received object | 400 | validation_error | 4 | REQ-B01730 |
| POST | /activities | /timeZone | Unknown IANA time zone identifier | 400 | validation_error | 9 | REQ-B01971 |
| POST | /activities | /timeZone | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B01973 |
| POST | /activities | /timeZone | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B01974 |
| POST | /activities | /timeZone | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B01975 |
| POST | /activities | /timeZone | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B01979 |
| POST | /activities | /timeZone | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B01985 |
| POST | /activities | /timeZone | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B01988 |
| POST | /activities | /url | Invalid URL | 400 | validation_error | 20 | REQ-B02154 |
| POST | /activities | /url | Too big: expected string to have <=<n> characters | 400 | validation_error | 15 | REQ-B02191 |
| POST | /activities | /url | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02216 |
| POST | /activities | /url | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02217 |
| POST | /activities | /url | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02218 |
| POST | /activities | /url | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02222 |
| POST | /activities | /url | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02228 |
| POST | /activities | /url | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02231 |
| POST | /activities | /fileName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B02242 |
| POST | /activities | /fileName | Too big: expected string to have <=255 characters | 400 | validation_error | 10 | REQ-B02271 |
| POST | /activities | /fileName | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02284 |
| POST | /activities | /fileName | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02285 |
| POST | /activities | /fileName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02286 |
| POST | /activities | /fileName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02290 |
| POST | /activities | /fileName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02300 |
| POST | /activities | /fileName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B02300 |
| POST | /activities | /fileName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02303 |
| POST | /messages | /contactId | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-B02450 |
| POST | /messages | (request) | Contact not found | 404 | not_found | 14 | REQ-B02451 |
| POST | /messages | /contactId | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02452 |
| POST | /messages | /contactId | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B02453 |
| POST | /messages | /contactId | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02454 |
| POST | /messages | /contactId | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02458 |
| POST | /messages | /contactId | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02464 |
| POST | /messages | /contactId | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B02464 |
| POST | /messages | /contactId | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02467 |
| POST | /messages | /channel | Invalid option: expected one of "email"\|"sms" | 400 | validation_error | 25 | REQ-B02478 |
| POST | /messages | (request) | Contact <id> carries no usable sms number: an international number in E.164 form, as in +<n>, is required | 422 | contact_address_missing | 2 | REQ-B02499 |
| POST | /messages | /subject | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B02505 |
| POST | /messages | /subject | Too big: expected string to have <=998 characters | 400 | validation_error | 8 | REQ-B02540 |
| POST | /messages | /subject | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02567 |
| POST | /messages | /subject | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02569 |
| POST | /messages | /subject | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02573 |
| POST | /messages | /subject | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02583 |
| POST | /messages | /subject | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B02583 |
| POST | /messages | /subject | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02586 |
| POST | /messages | /subject | Header fields cannot contain CR, LF, or NUL | 400 | validation_error | 5 | REQ-B02596 |
| POST | /messages | /body | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B02626 |
| POST | /messages | /body | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02678 |
| POST | /messages | / | Provide exactly one of templateId or body | 400 | validation_error | 2 | REQ-B02679 |
| POST | /messages | /subject | subject is only accepted with body; a template supplies its own subject | 400 | validation_error | 1 | REQ-B02679 |
| POST | /messages | /body | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02680 |
| POST | /messages | /body | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02684 |
| POST | /messages | /body | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02694 |
| POST | /messages | /body | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B02694 |
| POST | /messages | /body | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02697 |
| DELETE | /contacts/{id} | (request) | Contact not found | 404 | not_found | 14 | REQ-B02742 |
| DELETE | /messages/{id} | (request) | No route for DELETE /v1/messages/<id> | 404 | not_found | 115 | REQ-B02743 |
| PUT | /close-reasons | /reasons | A reason list holds at most 50 reasons | 400 | validation_error | 5 | REQ-B02851 |
| PUT | /close-reasons | (request) | Request body is too large | 413 | payload_too_large | 1 | REQ-B02856 |
| PUT | /close-reasons | /reasons/0 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-B02857 |
| PUT | /close-reasons | /reasons/0 | Invalid input: expected object, received number | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/1 | Invalid input: expected object, received string | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/2 | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/3/code | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/3/label | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/3/outcome | Invalid option: expected one of "won"\|"lost" | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons/4 | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-B02858 |
| PUT | /close-reasons | /reasons | Invalid input: expected array, received string | 400 | validation_error | 1 | REQ-B02859 |
| PUT | /close-reasons | /reasons | Invalid input: expected array, received object | 400 | validation_error | 1 | REQ-B02860 |
| PUT | /close-reasons | /reasons | Invalid input: expected array, received null | 400 | validation_error | 1 | REQ-B02861 |
| PUT | /close-reasons | /reasons | Invalid input: expected array, received undefined | 400 | validation_error | 2 | REQ-B02862 |
| PUT | /close-reasons | /reasons/1/code | The reason code "c0" is listed twice | 400 | validation_error | 1 | REQ-B02863 |
| PUT | /close-reasons | /reasons/0/code | A reason code is 1 to 64 lower-case letters, digits, hyphens or underscores | 400 | validation_error | 22 | REQ-B02864 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02888 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02889 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02890 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02894 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02900 |
| PUT | /close-reasons | /reasons/0/code | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02903 |
| PUT | /close-reasons | /reasons/0/label | Too small: expected string to have >=1 characters | 400 | validation_error | 3 | REQ-B02912 |
| PUT | /close-reasons | /reasons/0/label | Too big: expected string to have <=120 characters | 400 | validation_error | 15 | REQ-B02922 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B02939 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received undefined | 400 | validation_error | 1 | REQ-B02940 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B02941 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B02945 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B02951 |
| PUT | /close-reasons | /reasons/0/label | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B02951 |
| PUT | /close-reasons | /reasons/0/label | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B02954 |
| PUT | /close-reasons | /reasons/0/outcome | Invalid option: expected one of "won"\|"lost" | 400 | validation_error | 24 | REQ-B02977 |
| POST | /files | /fileName | Too small: expected string to have >=1 characters | 400 | validation_error | 2 | REQ-B03006 |
| POST | /files | /fileName | Too big: expected string to have <=255 characters | 400 | validation_error | 10 | REQ-B03035 |
| POST | /files | /fileName | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B03048 |
| POST | /files | /fileName | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B03049 |
| POST | /files | /fileName | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B03050 |
| POST | /files | /fileName | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B03054 |
| POST | /files | /fileName | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B03064 |
| POST | /files | /fileName | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B03064 |
| POST | /files | /fileName | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B03067 |
| POST | /files | /fileName | A file name cannot contain control characters, line breaks or text-direction overrides | 400 | validation_error | 6 | REQ-B03077 |
| POST | /files | /contentType | Too small: expected string to have >=1 characters | 400 | validation_error | 1 | REQ-B03105 |
| POST | /files | (request) | Content type '   ' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03106 |
| POST | /files | /contentType | Invalid input: expected string, received null | 400 | validation_error | 1 | REQ-B03107 |
| POST | /files | /contentType | Invalid input: expected string, received undefined | 400 | validation_error | 2 | REQ-B03108 |
| POST | /files | /contentType | Invalid input: expected string, received number | 400 | validation_error | 4 | REQ-B03109 |
| POST | /files | /contentType | Invalid input: expected string, received boolean | 400 | validation_error | 2 | REQ-B03113 |
| POST | /files | (request) | Content type 'true' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03115 |
| POST | /files | (request) | Content type 'false' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03116 |
| POST | /files | (request) | Content type 'yes' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03117 |
| POST | /files | (request) | Content type 'no' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03118 |
| POST | /files | /contentType | Invalid input: expected string, received array | 400 | validation_error | 3 | REQ-B03119 |
| POST | /files | /contentType | Too small: expected array to have >=1 items | 400 | validation_error | 1 | REQ-B03119 |
| POST | /files | /contentType | Invalid input: expected string, received object | 400 | validation_error | 2 | REQ-B03122 |
| POST | /files | (request) | Content type 'approved-but-not-really' is not a media type; declare one such as text/plain | 400 | validation_error | 1 | REQ-B03144 |
| POST | /files | /byteSize | Invalid input: expected number, received string | 400 | validation_error | 14 | REQ-B03147 |
| POST | /files | /byteSize | Invalid input: expected number, received null | 400 | validation_error | 1 | REQ-B03149 |
| POST | /files | /byteSize | Invalid input: expected number, received undefined | 400 | validation_error | 2 | REQ-B03150 |
| POST | /files | /byteSize | Too small: expected number to be >0 | 400 | validation_error | 5 | REQ-B03151 |
| POST | /files | /byteSize | Invalid input: expected number, received boolean | 400 | validation_error | 2 | REQ-B03157 |
| POST | /files | /byteSize | Invalid input: expected number, received array | 400 | validation_error | 3 | REQ-B03163 |
| POST | /files | /byteSize | Invalid input: expected number, received object | 400 | validation_error | 2 | REQ-B03166 |
| POST | /files | /byteSize | Invalid input: expected int, received number | 400 | validation_error | 4 | REQ-B03176 |
| POST | /files | /byteSize | Too small: expected int to be >=-<n> | 400 | validation_error | 2 | REQ-B03178 |
| POST | /files | (request) | File is <n> bytes, above the <n> byte limit | 400 | validation_error | 4 | REQ-B03179 |
| POST | /files | /byteSize | Too big: expected int to be <=<n> | 400 | validation_error | 3 | REQ-B03181 |
| POST | /contacts/custom-properties | (request) | Custom property "audit_u" already exists in this Organization | 409 | conflict | 43 | REQ-C00082 |
| POST | /pipelines/{id}/stages | (request) | Stage "fixed-stage-id-1" already exists | 400 | validation_error | 2 | REQ-E00004 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 3 | REQ-E00006 |
| PATCH | /contacts/custom-properties/{id} | (request) | Custom property "e_type_swap" cannot change type from "text" to "number": stored values are never migrated, so delete this definition and create it again with the type you want | 400 | validation_error | 1 | REQ-E00011 |
| PATCH | /contacts/{id} | (request) | The record has changed since that ETag was read; it is now "2" | 412 | precondition_failed | 4 | REQ-E00020 |
| POST | /pipelines | (request) | This Idempotency-Key is in flight or was used with different parameters | 409 | conflict | 3 | REQ-E00036 |
| GET | /companies/{id} | (request) | Company not found | 404 | not_found | 4 | REQ-E00040 |
| DELETE | /pipelines/{id} | (request) | Pipeline not found | 404 | not_found | 3 | REQ-E00047 |
| GET | /contacts | (request) | querystring: Unrecognized key: "status" | 400 | validation_error | 2 | REQ-F00002 |
| GET | /contacts | (request) | querystring: Unrecognized key: "status[eq]" | 400 | validation_error | 1 | REQ-F00005 |
| GET | /contacts | /status[in] | Invalid input | 400 | validation_error | 2 | REQ-F00006 |
| GET | /contacts | (request) | querystring: Unrecognized key: "status[ne]" | 400 | validation_error | 1 | REQ-F00007 |
| DELETE | /contacts/{id} | (request) | Cannot delete this contact: 1 deal still references it. | 409 | conflict | 1 | REQ-I00008 |
| DELETE | /companies/{id} | (request) | Cannot delete this company: 2 records still reference it. | 409 | conflict | 1 | REQ-I00009 |
| DELETE | /catalog-products/{id} | (request) | Cannot delete a catalog product sold by 1 open deal. Close or re-price it first. | 409 | conflict | 1 | REQ-I00010 |
| POST | /deals | (request) | Line items must all use the same currency; a deal has a single amount | 400 | validation_error | 1 | REQ-I00014 |
| POST | /deals | (request) | A deal with line items derives its amount from them; remove `amount` or clear `lineItems` | 400 | validation_error | 1 | REQ-I00016 |
| DELETE | /pipelines/{id}/stages/{id} | (request) | Cannot delete a stage that still holds 1 open deal. Move it to another stage first. | 409 | conflict | 1 | REQ-I00017 |
| POST | /automation-rules | /trigger/eventType | Event type "deal.exploded" cannot trigger a rule. Triggers: activity.completed, activity.created, activity.deleted, activity.reopened, activity.updated, company.archived, company.created, company.dele | 400 | validation_error | 1 | REQ-I00038 |
| POST | /messages | (request) | Contact <id> carries no usable email address | 422 | contact_address_missing | 1 | REQ-I00051 |
| POST | /messages | (request) | Template not found | 404 | not_found | 1 | REQ-I00053 |
| POST | /messages | /body | Too big: expected string to have <=<n> characters | 400 | validation_error | 1 | REQ-I00056 |
| POST | /contacts/{id}/merge | (request) | Cannot merge a contact into itself | 409 | conflict | 1 | REQ-I00068 |
| POST | /contacts/{id}/merge | (request) | Source contact not found | 409 | conflict | 1 | REQ-I00069 |
| POST | /contacts/{id}/merge | (request) | Both contacts have a different email, and a contact keeps only one of each. Email: this contact has merge.target@example.com, Merge Conflict has merge.conflict@example.com. Choose which to keep; the o | 409 | conflict | 1 | REQ-I00070 |
| GET | /contacts/{id} | (request) | Contact not found | 404 | not_found | 5 | REQ-I00072 |
| GET | /automation-runs | (request) | No route for GET /v1/automation-runs | 404 | not_found | 1 | REQ-J00018 |
| GET | /automation-rules/{id}/executions | (request) | No route for GET /v1/automation-rules/<id>/executions | 404 | not_found | 1 | REQ-J00019 |
| POST | /contacts/{id}/merge | (request) | Both contacts have a different email, and a contact keeps only one of each. Email: this contact has mrg.a@example.com, MergeB has mrg.b@example.com. Choose which to keep; the other is deleted with Mer | 409 | conflict | 1 | REQ-J00027 |
| POST | /contacts/{id}/merge | / | Unrecognized key: "email" | 400 | validation_error | 1 | REQ-J00028 |
| POST | /contacts/{id}/merge | / | Unrecognized key: "resolution" | 400 | validation_error | 1 | REQ-J00029 |
| POST | /contacts/{id}/merge | / | Unrecognized key: "preferred" | 400 | validation_error | 1 | REQ-J00030 |
| POST | /contacts/{id}/merge | / | Unrecognized key: "keep" | 400 | validation_error | 1 | REQ-J00031 |
| POST | /contacts/{id}/merge | (request) | Both contacts have a different phone, and a contact keeps only one of each. Phone: this contact has +<n>, MergeD Source has +<n>. Choose which to keep; the other is deleted with MergeD Source. | 409 | conflict | 1 | REQ-J00034 |
| POST | /pipelines | (request) | Request body is too large | 413 | payload_too_large | 3 | REQ-K00011 |
| POST | /activities | / | Unrecognized key: "contactId" | 400 | validation_error | 1 | REQ-K00029 |
| POST | /imports | /fileId | Must be an id as the API writes it: 24 lowercase hex characters | 400 | validation_error | 1 | REQ-K00030 |
| POST | /imports | /onDuplicate | Invalid option: expected one of "create"\|"reject" | 400 | validation_error | 1 | REQ-K00030 |
| PUT | /pipelines | (request) | No route for PUT /v1/pipelines | 404 | not_found | 2 | REQ-K00034 |
| DELETE | /pipelines | (request) | No route for DELETE /v1/pipelines | 404 | not_found | 2 | REQ-K00035 |
| PATCH | /pipelines | (request) | No route for PATCH /v1/pipelines | 404 | not_found | 2 | REQ-K00036 |
| POST | /contacts/custom-properties | (request) | Custom property "race_key_fresh_1" already exists in this Organization | 409 | conflict | 9 | REQ-L00012 |
| POST | /pipelines/{id}/stages | /id | A stage id is 1 to 64 letters, digits, hyphens or underscores | 400 | validation_error | 2 | REQ-L200022 |
| GET | /pipelines | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 10 | REQ-R00001 |
| GET | /deals | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00011 |
| GET | /contacts | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00021 |
| GET | /companies | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00031 |
| GET | /catalog-products | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00041 |
| GET | /automation-rules | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00051 |
| GET | /activities | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00061 |
| GET | /messages | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00071 |
| GET | /files | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00081 |
| GET | /imports | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00091 |
| GET | /exports | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00101 |
| GET | /reports | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00111 |
| GET | /reports/contacts.by_status | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00121 |
| GET | /close-reasons | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00131 |
| GET | /contacts/custom-properties | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00141 |
| GET | /events | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 9 | REQ-R00151 |
| GET | /workspaces | (request) | A Dashboard session is required for this endpoint | 401 | unauthorized | 9 | REQ-R00161 |
| GET | /auth/me | (request) | A Dashboard session is required for this endpoint | 401 | unauthorized | 9 | REQ-R00171 |
| POST | /pipelines | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 3 | REQ-R00181 |
| POST | /contacts | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 3 | REQ-R00184 |
| POST | /companies | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 3 | REQ-R00187 |
| PUT | /close-reasons | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 3 | REQ-R00190 |
| POST | /messages | (request) | A secret API key or Dashboard session is required | 401 | unauthorized | 3 | REQ-R00193 |
| GET | /pipelines/{id} | (request) | Pipeline not found | 404 | not_found | 23 | REQ-R00198 |
| GET | /deals/{id} | (request) | Deal not found | 404 | not_found | 3 | REQ-R00202 |
| GET | /catalog-products/{id} | (request) | Catalog product not found | 404 | not_found | 3 | REQ-R00214 |
| GET | /activities/{id} | (request) | Activity not found | 404 | not_found | 3 | REQ-R00218 |
| GET | /contacts | /limit | Too big: expected number to be <=100 | 400 | validation_error | 1 | REQ-R00229 |
| GET | /contacts | (request) | querystring: Unrecognized key: "offset" | 400 | validation_error | 2 | REQ-R00230 |
| GET | /contacts | (request) | querystring: Unrecognized key: "page" | 400 | validation_error | 1 | REQ-R00231 |
| GET | /contacts | (request) | querystring: Unrecognized key: "tenant" | 400 | validation_error | 1 | REQ-R00233 |
| GET | /contacts | (request) | querystring: Unrecognized key: "role" | 400 | validation_error | 1 | REQ-R00234 |
| GET | /pipelines/zzz | (request) | Invalid pipeline id | 400 | validation_error | 20 | REQ-R00257 |
| POST | /pipelines/{id} | (request) | No route for POST /v1/pipelines/<id> | 404 | not_found | 1 | REQ-R00344 |
| GET | /definitely-not-a-route | (request) | No route for GET /v1/definitely-not-a-route | 404 | not_found | 1 | REQ-R00345 |
| GET | /pipelines | /limit | Invalid input: expected number, received NaN | 400 | validation_error | 1 | REQ-R00347 |
| POST | /pipelines | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00004 |
| POST | /pipelines | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00005 |
| POST | /pipelines | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00008 |
| POST | /pipelines | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00013 |
| PATCH | /pipelines/{id} | / | At least one field must be provided | 400 | validation_error | 1 | REQ-W00022 |
| PATCH | /pipelines/{id} | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00023 |
| PATCH | /pipelines/{id} | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00024 |
| PATCH | /pipelines/{id} | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00027 |
| PATCH | /pipelines/{id} | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00032 |
| POST | /pipelines/{id}/stages | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00037 |
| POST | /pipelines/{id}/stages | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00038 |
| POST | /pipelines/{id}/stages | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00041 |
| POST | /pipelines/{id}/stages | (request) | A stage named "Extra stage" already exists in this pipeline | 400 | validation_error | 4 | REQ-W00043 |
| POST | /deals | / | Invalid input: expected object, received array | 400 | validation_error | 2 | REQ-W00055 |
| POST | /deals | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 6 | REQ-W00056 |
| POST | /deals | / | Invalid input: expected object, received null | 400 | validation_error | 2 | REQ-W00059 |
| POST | /deals | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 2 | REQ-W00064 |
| PATCH | /deals/{id} | / | At least one field must be provided | 400 | validation_error | 1 | REQ-W00106 |
| PATCH | /deals/{id} | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00107 |
| PATCH | /deals/{id} | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00108 |
| PATCH | /deals/{id} | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00111 |
| PATCH | /deals/{id} | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00116 |
| POST | /contacts | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00124 |
| POST | /contacts | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00125 |
| POST | /contacts | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00128 |
| POST | /contacts | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00133 |
| PATCH | /contacts/{id} | / | At least one field must be provided | 400 | validation_error | 1 | REQ-W00142 |
| PATCH | /contacts/{id} | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00143 |
| PATCH | /contacts/{id} | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00144 |
| PATCH | /contacts/{id} | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00147 |
| PATCH | /contacts/{id} | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00152 |
| POST | /companies | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00157 |
| POST | /companies | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00158 |
| POST | /companies | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00161 |
| POST | /companies | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00166 |
| PATCH | /companies/{id} | / | At least one field must be provided | 400 | validation_error | 1 | REQ-W00175 |
| PATCH | /companies/{id} | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00176 |
| PATCH | /companies/{id} | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00177 |
| PATCH | /companies/{id} | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00180 |
| PATCH | /companies/{id} | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00185 |
| POST | /contacts/custom-properties | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00190 |
| POST | /contacts/custom-properties | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00191 |
| POST | /contacts/custom-properties | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00194 |
| POST | /contacts/custom-properties | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00199 |
| POST | /catalog-products | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00205 |
| POST | /catalog-products | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00206 |
| POST | /catalog-products | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00209 |
| POST | /catalog-products | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00214 |
| PATCH | /catalog-products/{id} | / | At least one field must be provided | 400 | validation_error | 1 | REQ-W00223 |
| PATCH | /catalog-products/{id} | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00224 |
| PATCH | /catalog-products/{id} | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00225 |
| PATCH | /catalog-products/{id} | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00228 |
| PATCH | /catalog-products/{id} | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00233 |
| POST | /automation-rules | /trigger | Invalid input: expected object, received undefined | 400 | validation_error | 1 | REQ-W00237 |
| POST | /automation-rules | /action | Invalid input: expected object, received undefined | 400 | validation_error | 1 | REQ-W00237 |
| POST | /automation-rules | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00238 |
| POST | /automation-rules | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00239 |
| POST | /automation-rules | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00242 |
| POST | /automation-rules | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00247 |
| POST | /activities | /type | Invalid discriminator value. Expected 'task' \| 'note' \| 'appointment' \| 'document' \| 'call' \| 'meeting' | 400 | validation_error | 6 | REQ-W00256 |
| POST | /activities | / | Invalid input: expected object, received array | 400 | validation_error | 6 | REQ-W00257 |
| POST | /activities | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 18 | REQ-W00258 |
| POST | /activities | / | Invalid input: expected object, received null | 400 | validation_error | 6 | REQ-W00261 |
| POST | /activities | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 6 | REQ-W00266 |
| POST | /messages | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00372 |
| POST | /messages | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00373 |
| POST | /messages | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00376 |
| POST | /messages | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00381 |
| PUT | /close-reasons | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00393 |
| PUT | /close-reasons | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00394 |
| PUT | /close-reasons | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00397 |
| PUT | /close-reasons | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00402 |
| POST | /files | / | Invalid input: expected object, received array | 400 | validation_error | 1 | REQ-W00407 |
| POST | /files | (request) | Body is not valid JSON but content-type is set to 'application/json' | 400 | bad_request | 3 | REQ-W00408 |
| POST | /files | / | Invalid input: expected object, received null | 400 | validation_error | 1 | REQ-W00411 |
| POST | /files | / | Unrecognized key: "totallyMadeUp" | 400 | validation_error | 1 | REQ-W00416 |
| POST | /pipelines | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00424 |
| POST | /pipelines | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00425 |
| POST | /pipelines | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00426 |
| POST | /pipelines | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00427 |
| POST | /pipelines | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00428 |
| POST | /pipelines | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00429 |
| POST | /pipelines | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00430 |
| POST | /pipelines | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00431 |
| POST | /pipelines | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00432 |
| POST | /pipelines | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00433 |
| POST | /pipelines | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00434 |
| POST | /pipelines | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00435 |
| POST | /pipelines | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00436 |
| POST | /pipelines | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00437 |
| POST | /pipelines | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00438 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00440 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00441 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00442 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00443 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00444 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00445 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00446 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00447 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00449 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00450 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00451 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00452 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00453 |
| POST | /pipelines/{id}/stages | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00454 |
| POST | /deals | / | Unrecognized key: "isAdmin" | 400 | validation_error | 2 | REQ-W00459 |
| POST | /deals | / | Unrecognized key: "role" | 400 | validation_error | 2 | REQ-W00460 |
| POST | /deals | / | Unrecognized key: "tenantId" | 400 | validation_error | 2 | REQ-W00461 |
| POST | /deals | / | Unrecognized key: "ownerId" | 400 | validation_error | 2 | REQ-W00462 |
| POST | /deals | / | Unrecognized key: "status" | 400 | validation_error | 3 | REQ-W00463 |
| POST | /deals | / | Unrecognized key: "price" | 400 | validation_error | 2 | REQ-W00464 |
| POST | /deals | / | Unrecognized key: "balance" | 400 | validation_error | 2 | REQ-W00465 |
| POST | /deals | / | Unrecognized key: "internalScore" | 400 | validation_error | 2 | REQ-W00466 |
| POST | /deals | / | Unrecognized key: "id" | 400 | validation_error | 2 | REQ-W00467 |
| POST | /deals | / | Unrecognized key: "_id" | 400 | validation_error | 2 | REQ-W00468 |
| POST | /deals | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 2 | REQ-W00469 |
| POST | /deals | / | Unrecognized key: "archivedAt" | 400 | validation_error | 2 | REQ-W00470 |
| POST | /deals | / | Unrecognized key: "createdAt" | 400 | validation_error | 2 | REQ-W00471 |
| POST | /deals | / | Unrecognized key: "projectId" | 400 | validation_error | 2 | REQ-W00472 |
| POST | /deals | / | Unrecognized key: "environment" | 400 | validation_error | 2 | REQ-W00473 |
| POST | /contacts | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00500 |
| POST | /contacts | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00501 |
| POST | /contacts | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00502 |
| POST | /contacts | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00503 |
| POST | /contacts | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00505 |
| POST | /contacts | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00506 |
| POST | /contacts | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00507 |
| POST | /contacts | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00508 |
| POST | /contacts | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00509 |
| POST | /contacts | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00510 |
| POST | /contacts | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00511 |
| POST | /contacts | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00512 |
| POST | /contacts | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00513 |
| POST | /contacts | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00514 |
| POST | /companies | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00515 |
| POST | /companies | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00516 |
| POST | /companies | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00517 |
| POST | /companies | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00518 |
| POST | /companies | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00520 |
| POST | /companies | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00521 |
| POST | /companies | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00522 |
| POST | /companies | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00523 |
| POST | /companies | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00524 |
| POST | /companies | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00525 |
| POST | /companies | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00526 |
| POST | /companies | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00527 |
| POST | /companies | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00528 |
| POST | /companies | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00529 |
| POST | /contacts/custom-properties | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00530 |
| POST | /contacts/custom-properties | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00531 |
| POST | /contacts/custom-properties | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00532 |
| POST | /contacts/custom-properties | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00533 |
| POST | /contacts/custom-properties | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00534 |
| POST | /contacts/custom-properties | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00535 |
| POST | /contacts/custom-properties | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00536 |
| POST | /contacts/custom-properties | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00537 |
| POST | /contacts/custom-properties | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00538 |
| POST | /contacts/custom-properties | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00539 |
| POST | /contacts/custom-properties | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00540 |
| POST | /contacts/custom-properties | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00541 |
| POST | /contacts/custom-properties | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00542 |
| POST | /contacts/custom-properties | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00543 |
| POST | /contacts/custom-properties | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00544 |
| POST | /catalog-products | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00545 |
| POST | /catalog-products | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00546 |
| POST | /catalog-products | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00547 |
| POST | /catalog-products | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00548 |
| POST | /catalog-products | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00549 |
| POST | /catalog-products | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00550 |
| POST | /catalog-products | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00551 |
| POST | /catalog-products | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00552 |
| POST | /catalog-products | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00553 |
| POST | /catalog-products | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00554 |
| POST | /catalog-products | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00555 |
| POST | /catalog-products | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00556 |
| POST | /catalog-products | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00557 |
| POST | /catalog-products | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00558 |
| POST | /catalog-products | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00559 |
| POST | /automation-rules | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00560 |
| POST | /automation-rules | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00561 |
| POST | /automation-rules | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00562 |
| POST | /automation-rules | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00563 |
| POST | /automation-rules | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00564 |
| POST | /automation-rules | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00565 |
| POST | /automation-rules | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00566 |
| POST | /automation-rules | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00567 |
| POST | /automation-rules | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00568 |
| POST | /automation-rules | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00569 |
| POST | /automation-rules | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00570 |
| POST | /automation-rules | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00571 |
| POST | /automation-rules | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00572 |
| POST | /automation-rules | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00573 |
| POST | /automation-rules | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00574 |
| POST | /activities | / | Unrecognized key: "isAdmin" | 400 | validation_error | 6 | REQ-W00575 |
| POST | /activities | / | Unrecognized key: "role" | 400 | validation_error | 6 | REQ-W00576 |
| POST | /activities | / | Unrecognized key: "tenantId" | 400 | validation_error | 6 | REQ-W00577 |
| POST | /activities | / | Unrecognized key: "ownerId" | 400 | validation_error | 6 | REQ-W00578 |
| POST | /activities | / | Unrecognized key: "status" | 400 | validation_error | 6 | REQ-W00579 |
| POST | /activities | / | Unrecognized key: "price" | 400 | validation_error | 6 | REQ-W00580 |
| POST | /activities | / | Unrecognized key: "balance" | 400 | validation_error | 6 | REQ-W00581 |
| POST | /activities | / | Unrecognized key: "internalScore" | 400 | validation_error | 6 | REQ-W00582 |
| POST | /activities | / | Unrecognized key: "id" | 400 | validation_error | 6 | REQ-W00583 |
| POST | /activities | / | Unrecognized key: "_id" | 400 | validation_error | 6 | REQ-W00584 |
| POST | /activities | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 6 | REQ-W00585 |
| POST | /activities | / | Unrecognized key: "archivedAt" | 400 | validation_error | 6 | REQ-W00586 |
| POST | /activities | / | Unrecognized key: "createdAt" | 400 | validation_error | 6 | REQ-W00587 |
| POST | /activities | / | Unrecognized key: "projectId" | 400 | validation_error | 6 | REQ-W00588 |
| POST | /activities | / | Unrecognized key: "environment" | 400 | validation_error | 6 | REQ-W00589 |
| POST | /files | / | Unrecognized key: "isAdmin" | 400 | validation_error | 1 | REQ-W00665 |
| POST | /files | / | Unrecognized key: "role" | 400 | validation_error | 1 | REQ-W00666 |
| POST | /files | / | Unrecognized key: "tenantId" | 400 | validation_error | 1 | REQ-W00667 |
| POST | /files | / | Unrecognized key: "ownerId" | 400 | validation_error | 1 | REQ-W00668 |
| POST | /files | / | Unrecognized key: "status" | 400 | validation_error | 1 | REQ-W00669 |
| POST | /files | / | Unrecognized key: "price" | 400 | validation_error | 1 | REQ-W00670 |
| POST | /files | / | Unrecognized key: "balance" | 400 | validation_error | 1 | REQ-W00671 |
| POST | /files | / | Unrecognized key: "internalScore" | 400 | validation_error | 1 | REQ-W00672 |
| POST | /files | / | Unrecognized key: "id" | 400 | validation_error | 1 | REQ-W00673 |
| POST | /files | / | Unrecognized key: "_id" | 400 | validation_error | 1 | REQ-W00674 |
| POST | /files | / | Unrecognized key: "createdByActorId" | 400 | validation_error | 1 | REQ-W00675 |
| POST | /files | / | Unrecognized key: "archivedAt" | 400 | validation_error | 1 | REQ-W00676 |
| POST | /files | / | Unrecognized key: "createdAt" | 400 | validation_error | 1 | REQ-W00677 |
| POST | /files | / | Unrecognized key: "projectId" | 400 | validation_error | 1 | REQ-W00678 |
| POST | /files | / | Unrecognized key: "environment" | 400 | validation_error | 1 | REQ-W00679 |
| POST | /deals/{id}/won | (request) | Deal is already closed | 409 | conflict | 38 | REQ-W00686 |
| POST | /deals/{id}/lost | (request) | Deal is already closed | 409 | conflict | 1 | REQ-W00707 |
| POST | /deals/{id}/move | (request) | A closed deal cannot change stage; reopen it first | 409 | conflict | 1 | REQ-W00708 |
| POST | /deals/{id}/reopen | (request) | Deal is not closed | 409 | conflict | 1 | REQ-W00710 |
| PATCH | /deals/{id} | / | Unrecognized key: "status" | 400 | validation_error | 2 | REQ-W00712 |
| POST | /deals | / | Unrecognized key: "closeReason" | 400 | validation_error | 1 | REQ-W00715 |
| POST | /deals/{id}/lost | (request) | The reason must be one of this Organization's lost reasons: price, competitor, no_budget, no_response | 400 | validation_error | 1 | REQ-W00716 |
| POST | /pipelines/{id}/archive | (request) | Pipeline is already archived | 409 | conflict | 37 | REQ-W00720 |
| POST | /pipelines/{id}/unarchive | (request) | Pipeline is not archived | 409 | conflict | 1 | REQ-W00740 |
| POST | /deals | (request) | Pipeline is archived; unarchive it before creating deals in it | 409 | conflict | 2 | REQ-W00742 |
| POST | /contacts/{id}/restore | (request) | No route for POST /v1/contacts/<id>/restore | 404 | not_found | 1 | REQ-W00752 |
| POST | /contacts/{id}/qualify | (request) | No route for POST /v1/contacts/<id>/qualify | 404 | not_found | 1 | REQ-W00753 |
| POST | /contacts/{id}/disqualify | (request) | No route for POST /v1/contacts/<id>/disqualify | 404 | not_found | 1 | REQ-W00754 |
| POST | /contacts/{id}/convert | (request) | No route for POST /v1/contacts/<id>/convert | 404 | not_found | 1 | REQ-W00755 |
| DELETE | /companies/{id} | (request) | Company not found | 404 | not_found | 20 | REQ-W00803 |
| DELETE | /catalog-products/{id} | (request) | Catalog product not found | 404 | not_found | 2 | REQ-W00816 |
| DELETE | /activities/{id} | (request) | Activity not found | 404 | not_found | 2 | REQ-W00829 |
| POST | /contacts/custom-properties | (request) | Custom property "race_unique_key" already exists in this Organization | 409 | conflict | 18 | REQ-W00918 |
| PATCH | /contacts/custom-properties/{id} | (request) | Custom property "exp_data_loss" cannot change type from "text" to "number": stored values are never migrated, so delete this definition and create it again with the type you want | 400 | validation_error | 1 | REQ-Y00004 |
| GET | /contacts | (request) | querystring: Unrecognized key: "include_archived" | 400 | validation_error | 1 | REQ-Z00005 |
| GET | /contacts | (request) | querystring: Unrecognized key: "archived" | 400 | validation_error | 1 | REQ-Z00006 |
| GET | /contacts | (request) | querystring: Unrecognized key: "state" | 400 | validation_error | 1 | REQ-Z00007 |
| GET | /contacts | (request) | querystring: Unrecognized key: "filter[status]" | 400 | validation_error | 1 | REQ-Z00008 |
| GET | /contacts | (request) | querystring: Unrecognized key: "include" | 400 | validation_error | 1 | REQ-Z00009 |
| GET | /companies | (request) | querystring: Unrecognized key: "status" | 400 | validation_error | 1 | REQ-Z00013 |
| GET | /companies | (request) | querystring: Unrecognized key: "include_archived" | 400 | validation_error | 1 | REQ-Z00014 |
| GET | /companies | (request) | querystring: Unrecognized key: "archived" | 400 | validation_error | 1 | REQ-Z00015 |
| GET | /companies | (request) | querystring: Unrecognized key: "state" | 400 | validation_error | 1 | REQ-Z00016 |
| GET | /companies | (request) | querystring: Unrecognized key: "filter[status]" | 400 | validation_error | 1 | REQ-Z00017 |
| GET | /companies | (request) | querystring: Unrecognized key: "include" | 400 | validation_error | 1 | REQ-Z00018 |
