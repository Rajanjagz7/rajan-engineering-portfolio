# End-to-end workflow results and UX suggestions

Run on staging, project "Vercel 2", with realistic data (Harper & Sons Plumbing, Daniel Harper, deal "Harper & Sons - Pro licences and onboarding", A$18,500). Script: `ui/e2e_journey.js`.

## Workflow results
| Step | Result | Toast |
|---|---|---|
| Create company / contact / deal in the UI | Pass | Yes |
| Add task on the contact | Pass | None |
| Move deal Qualified -> Proposal | Pass | Yes, with Undo |
| Mark as won (reason picked from the dropdown) | Pass, reason stored (`closeReason: referral`) | Yes |
| Automation after won | Task created after ~129 s | No notice |
| Complete task from My work | Pass | Yes, with Undo |
| Convert contact to customer | Pass | Yes, with Undo |
| Send email from contact page | Message created, then `failed` (`no_credential`) | None |
| Outbox, Audit, Reports | Reflect the events | n/a |
| Export contacts | Completed, 70 rows, 27 KB | None |

The won reason is a preset dropdown, not a free-text box. An earlier suspicion that the reason was dropped was my script's mistake, not a product bug.

## UX suggestions
1. Toast after Add activity ("Task added", with Undo).
2. Send message: toast "Queued", then a failure notice with the reason; warn on the composer when no email provider credential exists.
3. Toast when an export starts, and a ready notice when it finishes.
4. Show that an automation is scheduled (it runs about 2 minutes after the event).
5. Undo after Convert returns 412 and fails silently: refresh the record first or show an error toast. Add Undo to Disqualify.
6. Warn on the Rules page when a rule is auto-suspended (over 500 runs per hour).
7. Malformed attachment id returns 404 where other malformed ids return 400; make it consistent.
8. Toasts also wanted for: import finished, settings saved, project id copied.

## Retracted findings
- "No way to link activities": linking works with `attachments: [{kind, id}]`.
- "No lead qualify/disqualify/convert routes": they exist at `/leads/{id}/qualify|disqualify|convert`.
