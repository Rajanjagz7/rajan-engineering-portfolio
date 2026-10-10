// End-to-end journey through the UI: lead -> company -> contact -> task -> deal -> stages -> won -> automation -> task done
// -> convert -> email -> outbox -> audit -> reports -> export.   node e2e_journey.js   (env: CRM_BASE_URL CRM_PROJECT_ID CRM_EMAIL CRM_PASSWORD)
// Records the result of every step, whether a confirmation toast appeared (and its text), and any failing network call.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const BASE = process.env.CRM_BASE_URL, PID = process.env.CRM_PROJECT_ID;
const H = { accept: 'application/json', 'content-type': 'application/json', 'crm-org-id': 'default', 'crm-project-id': PID, 'crm-env-mode': 'live', origin: BASE, referer: BASE + '/' };
const U = String(Date.now()).slice(-5);
const P = { company: 'Harper & Sons Plumbing', domain: 'harperandsons.com.au', first: 'Daniel', last: 'Harper', email: `daniel.harper.${U}@example.com`, phone: '+61491574' + U.slice(-3).padStart(3, '0'), deal: 'Harper & Sons - Pro licences and onboarding' };
const results = []; let net = [];

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }); const p = await ctx.newPage();
  p.on('response', async (r) => { if (r.url().includes('/api/crm/') && r.status() >= 400) net.push(`${r.request().method()} ${new URL(r.url()).pathname.replace('/api/crm/v1', '')} -> ${r.status()}`); });
  const consoleErr = []; p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErr.push(m.text().slice(0, 120)); });
  await p.goto(BASE + '/login'); await p.getByRole('textbox', { name: 'Email' }).fill(process.env.CRM_EMAIL); await p.getByRole('textbox', { name: 'Password' }).fill(process.env.CRM_PASSWORD);
  await p.getByRole('button', { name: 'Sign in' }).click(); await p.waitForURL((u) => !u.pathname.startsWith('/login'));
  const api = async (m, path, data) => { const r = await ctx.request.fetch(BASE + '/api/crm/v1' + path, { method: m, headers: H, data }); const t = await r.text(); try { return JSON.parse(t); } catch { return { _raw: t, _status: r.status() }; } };
  const toast = async () => (await p.locator('[aria-label="Notifications"]').allInnerTexts()).join(' / ').replace(/\s+/g, ' ').trim();
  const at = (path) => `${BASE}/projects/${PID}${path}`;
  const ready = async () => { await p.locator('h1').first().waitFor({ timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1800); };
  let state = {};

  async function step(name, fn, opts = {}) {
    net = []; const t0 = Date.now(); let ok = true, note = '';
    try { note = (await fn()) || ''; } catch (e) { ok = false; note = e.message.split('\n')[0].slice(0, 160); }
    await p.waitForTimeout(opts.wait ?? 700); const t = await toast();
    const r = { step: name, ok, ms: Date.now() - t0, toast: t || null, networkErrors: net.slice(), note };
    results.push(r); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(58)} toast: ${t ? JSON.stringify(t.slice(0, 70)) : '(none)'}${net.length ? '  NET: ' + net.join('; ') : ''}${note ? '  | ' + note : ''}`);
    if (!ok) await p.screenshot({ path: `../reports/regress/e2e-fail-${results.length}.png` }).catch(() => {});
    return ok;
  }
  const closeDialogs = async () => { await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(300); const d = p.getByRole('alertdialog').getByRole('button', { name: /discard/i }); if (await d.count()) await d.click(); };

  // 1 company
  await step('1. Create the company in the UI', async () => {
    await p.goto(at('/companies')); await ready(); await p.getByRole('button', { name: 'New company' }).first().click();
    await p.getByRole('textbox', { name: /^name/i }).fill(P.company); await p.getByRole('textbox', { name: /domain/i }).fill(P.domain); await p.getByRole('textbox', { name: /phone/i }).fill('+61291574000');
    await p.getByRole('button', { name: 'Create company' }).click(); await p.waitForTimeout(1800);
    const l = await api('GET', '/companies?limit=100'); state.company = (l.data || []).find((c) => c.name === P.company); if (!state.company) throw new Error('company not found after create'); return `domain stored: ${state.company.domain}`;
  });
  // 2 contact
  await step('2. Create the contact (lead) with company', async () => {
    await p.goto(at('/contacts')); await ready(); await p.getByRole('button', { name: 'New contact' }).first().click();
    await p.getByRole('textbox', { name: /first name/i }).fill(P.first); await p.getByRole('textbox', { name: /last name/i }).fill(P.last); await p.getByRole('textbox', { name: /email/i }).fill(P.email); await p.getByRole('textbox', { name: /phone/i }).fill(P.phone);
    await p.getByRole('textbox', { name: /company/i }).fill('Harper').catch(() => {}); await p.waitForTimeout(1200);
    const opt = p.getByRole('option', { name: /Harper & Sons/ }).first(); if (await opt.count()) await opt.click();
    await p.getByRole('button', { name: 'Create contact' }).click(); await p.waitForTimeout(1800);
    const l = await api('GET', '/contacts?limit=100'); state.contact = (l.data || []).find((c) => c.email === P.email); if (!state.contact) throw new Error('contact not found after create'); return `company linked: ${state.contact.companyName || 'NO'}`;
  });
  if (state.contact && !state.contact.companyId && state.company) { await api('PATCH', `/contacts/${state.contact.id}`, { companyId: state.company.id }); }
  // 3 task on the contact
  await step('3. Add a task on the contact page (Add activity)', async () => {
    await p.goto(at(`/contacts/${state.contact.id}`)); await ready(); await p.getByRole('button', { name: 'Add activity' }).click(); await p.waitForTimeout(500);
    await p.getByRole('textbox', { name: /title|what|subject/i }).first().fill('Send Daniel the revised pricing and the onboarding plan');
    await p.getByRole('button', { name: /^(add|save|create)( activity| task)?$/i }).last().click(); await p.waitForTimeout(1800);
    const feed = (await p.locator('main').innerText()); if (!feed.includes('revised pricing')) throw new Error('task is not visible in the activity feed'); return 'task visible in feed';
  });
  // 4 deal
  await step('4. Create the deal in the UI (contact picker)', async () => {
    await p.goto(at('/deals')); await ready(); await p.getByRole('button', { name: 'New deal' }).first().click();
    await p.getByRole('textbox', { name: /title/i }).fill(P.deal); await p.locator('#deal-amount').fill('18500').catch(() => {});
    await p.locator('#deal-contact').fill('Daniel'); await p.waitForTimeout(1500); const o = p.getByRole('option', { name: /Daniel Harper/ }).first(); if (await o.count()) await o.click();
    await p.getByRole('button', { name: 'Create deal' }).click(); await p.waitForTimeout(2000);
    const l = await api('GET', '/deals?limit=100'); state.deal = (l.data || []).find((d) => d.title === P.deal); if (!state.deal) throw new Error('deal not found after create'); return `contact linked: ${state.deal.contactId ? 'yes' : 'NO'}; amount ${JSON.stringify(state.deal.amount)}`;
  });
  // 5 stages
  await step('5. Move the deal through Qualified then Proposal', async () => {
    await p.goto(at(`/deals/${state.deal.id}`)); await ready();
    for (const s of ['Qualified', 'Proposal']) { await p.getByRole('button', { name: s, exact: true }).first().click(); await p.waitForTimeout(1500); }
    const d = await api('GET', `/deals/${state.deal.id}`); const pl = await api('GET', `/pipelines/${d.pipelineId}`); return `stage now: ${(pl.stages.find((s) => s.id === d.stageId) || {}).name}`;
  });
  // 6 won
  await step('6. Mark the deal won with a reason', async () => {
    await p.goto(at(`/deals/${state.deal.id}`)); await ready(); const names = await p.getByRole('button').allInnerTexts();
    const won = p.getByRole('button', { name: /^(mark )?won$/i }).first(); if (!(await won.count())) { await p.getByRole('button', { name: new RegExp(`More actions for`) }).first().click(); await p.waitForTimeout(500); }
    await p.getByRole('menuitem', { name: /won/i }).or(p.getByRole('button', { name: /^(mark )?won$/i })).first().click(); await p.waitForTimeout(800);
    const dlg = p.getByRole('dialog').last(); if (await dlg.count()) { const sel = dlg.getByRole('combobox').first(); if (await sel.count()) { await sel.click(); await p.getByRole('option').first().click(); } await dlg.getByRole('button', { name: /won|confirm|save/i }).last().click(); }
    await p.waitForTimeout(1800); const d = await api('GET', `/deals/${state.deal.id}`); if (d.status !== 'won') throw new Error('deal is ' + d.status + ' (buttons seen: ' + names.filter(Boolean).slice(0, 14).join(', ') + ')'); return `closeReason: ${d.closeReason}`;
  });
  // 7 automation
  let autoSecs = null;
  await step('7. Automation: the deal.won rule creates an onboarding task (polling up to 4 min)', async () => {
    const t = Date.now(); const before = ((await api('GET', '/activities?limit=100')).data || []).filter((a) => a.title === 'Schedule onboarding kickoff').length;
    for (let i = 0; i < 16; i++) { await p.waitForTimeout(15000); const n = ((await api('GET', '/activities?limit=100')).data || []).filter((a) => a.title === 'Schedule onboarding kickoff').length; if (n > before) { autoSecs = Math.round((Date.now() - t) / 1000); return `task appeared after ~${autoSecs}s`; } }
    throw new Error('no onboarding task within 240 s');
  }, { wait: 0 });
  // 8 my work
  await step('8. My work shows the open tasks; complete one', async () => {
    await p.goto(at('/my-work')); await ready(); const txt = await p.locator('main').innerText(); const btn = p.getByRole('button', { name: 'Complete' }).first(); if (!(await btn.count())) throw new Error('no Complete button on My work'); await btn.click(); await p.waitForTimeout(1500); return `overdue block present: ${/Overdue/.test(txt)}`;
  });
  // 9 convert
  await step('9. Convert the contact to a customer', async () => {
    await p.goto(at(`/contacts/${state.contact.id}`)); await ready(); await p.getByRole('button', { name: 'Convert to customer' }).click(); await p.waitForTimeout(1500); const c = await api('GET', `/contacts/${state.contact.id}`); if (c.status !== 'customer') throw new Error('status ' + c.status); return 'status customer';
  });
  // 10 email
  await step('10. Send an email from the contact page', async () => {
    await p.goto(at(`/contacts/${state.contact.id}`)); await ready(); await p.getByRole('tab', { name: 'Email', exact: true }).first().click().catch(() => {});
    const subj = p.getByRole('textbox', { name: /subject/i }).first(); if (await subj.count()) await subj.fill('Welcome aboard, Daniel');
    const body = p.getByRole('textbox', { name: /message|body/i }).first(); if (await body.count()) await body.fill('Hi Daniel, thanks for choosing us. Your onboarding kickoff is being scheduled and we will be in touch shortly.');
    await p.getByRole('button', { name: 'Send message' }).click(); await p.waitForTimeout(2200); const m = await api('GET', `/messages?limit=10&contact=${state.contact.id}`); if (!(m.data || []).length) throw new Error('no message recorded'); return `message status: ${m.data[0].status}`;
  });
  // 11 outbox
  await step('11. Outbox lists the message', async () => { await p.goto(at('/outbox')); await ready(); const t = await p.locator('main').innerText(); if (!/Welcome aboard, Daniel/.test(t)) throw new Error('message not listed in the Outbox'); return 'listed'; });
  // 12 audit
  await step('12. Audit log shows the contact, deal and message events', async () => { await p.goto(at('/audit')); await ready(); const t = await p.locator('main').innerText(); const want = ['Deal won', 'Contact created', 'Deal created']; const miss = want.filter((w) => !t.includes(w)); if (miss.length) throw new Error('missing: ' + miss.join(', ')); return 'events present'; });
  // 13 reports
  await step('13. Reports reflect the won deal', async () => { const r = await api('GET', '/reports/deals.won_lost?closed_at[gte]=2026-01-01T00:00:00Z&closed_at[lte]=2026-12-31T23:59:59Z'); const won = (r.data || []).find((x) => /won/.test(x.id)); if (!won || !won.count) throw new Error('won count is zero'); return `won deals this year: ${won.count}, amount ${won.amount}`; });
  // 14 export
  await step('14. Export the contacts view and find the new contact in the CSV', async () => {
    await p.goto(at('/contacts')); await ready(); const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }).catch(() => null), p.getByRole('button', { name: 'Export this view' }).click()]);
    if (!dl) { await p.goto(at('/exports')); await p.waitForTimeout(4000); const row = p.getByRole('row').nth(1); const act = row.getByRole('button').last(); await act.click(); const [d2] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('menuitem', { name: /download/i }).click()]); const f = await d2.path(); const csv = fs.readFileSync(f, 'utf8'); if (!csv.includes(P.email)) throw new Error('email not in the exported CSV'); return 'found in export (via Exports page)'; }
    const csv = fs.readFileSync(await dl.path(), 'utf8'); if (!csv.includes(P.email)) throw new Error('email not in downloaded CSV'); return `downloaded ${csv.split('\n').length - 1} rows; contains the new contact`;
  }, { wait: 1500 });

  console.log('\nconsole errors during the journey:', consoleErr.length ? consoleErr.slice(0, 3) : 'none');
  fs.writeFileSync('../reports/regress/e2e_journey.json', JSON.stringify({ person: P, automationSeconds: autoSecs, results, consoleErrors: consoleErr }, null, 1));
  await b.close();
})();
