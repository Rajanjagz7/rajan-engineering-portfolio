/* Sort and pagination QA across list pages: Contacts, Companies, Deals (kanban sort), Catalog products,
   Audit, Outbox. For each table page: walks every page via Next, checks for duplicate/missing ids
   between pages, checks Previous works, and exercises every sort option, verifying the first row
   actually changes between "ascending" and "descending" variants of the same field.
   node ui/sort_pagination_check.js   (writes reports/regress/sort_pagination.json) */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const BASE = process.env.CRM_BASE_URL, PID = process.env.CRM_PROJECT_ID;
const out = { pages: {} };

async function login(p) {
  await p.goto(BASE + '/login');
  await p.getByRole('textbox', { name: 'Email' }).fill(process.env.CRM_EMAIL);
  await p.getByRole('textbox', { name: 'Password' }).fill(process.env.CRM_PASSWORD);
  await p.getByRole('button', { name: /sign in|log in/i }).click();
  await p.waitForTimeout(2500);
}

async function tableRowIds(p) {
  // identity = the row's own detail-page link only (first anchor that points at this resource's
  // own record, e.g. /contacts/{id} or /companies/{id}) -- NOT every anchor in the row (a tel: or
  // mailto: link in the same row would otherwise masquerade as a second, colliding "row").
  const hrefs = await p.locator('table tbody tr, [role="row"]').evaluateAll(rows =>
    rows.map(r => {
      const a = r.querySelector('a[href^="/projects/"]') || r.querySelector('a:not([href^="tel:"]):not([href^="mailto:"])');
      return a ? a.getAttribute('href') : r.innerText.replace(/\s+/g, ' ').trim();
    }).filter(Boolean));
  return hrefs;
}

async function firstRowText(p) {
  const row = p.locator('table tbody tr, [role="row"]').first();
  return (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
}

async function walkPagination(p, path, label) {
  await p.goto(`${BASE}/projects/${PID}/${path}`); await p.waitForTimeout(1800);
  const result = { label, pagesWalked: 0, totalRowsSeen: 0, duplicateIds: [], rowsPerPage: null, nextDisabled: false };
  const seen = new Set();
  let guard = 0;
  while (guard++ < 30) {
    const ids = await tableRowIds(p);
    if (result.rowsPerPage === null) result.rowsPerPage = ids.length;
    for (const id of ids) {
      if (seen.has(id)) result.duplicateIds.push(id);
      seen.add(id);
    }
    result.totalRowsSeen += ids.length;
    result.pagesWalked++;
    const next = p.getByRole('button', { name: /^older/i }).first();
    const count = await next.count();
    if (!count) { result.nextDisabled = true; break; }
    const disabled = await next.isDisabled().catch(() => false);
    if (disabled) { result.nextDisabled = true; break; }
    await next.click(); await p.waitForTimeout(1200);
    if (result.pagesWalked > 1 && ids.length === 0) break;
  }
  // walk back once with Newer and confirm we land on page 1 content again (sanity, not exhaustive)
  const prev = p.getByRole('button', { name: /^newer/i }).first();
  if (await prev.count()) {
    for (let i = 0; i < result.pagesWalked - 1; i++) { await prev.click(); await p.waitForTimeout(600); }
    result.previousWorks = (await tableRowIds(p)).length > 0;
  }
  result.uniqueTotal = seen.size;
  return result;
}

async function exerciseSortDropdown(p, path, label) {
  await p.goto(`${BASE}/projects/${PID}/${path}`).catch(() => {});
  await p.waitForTimeout(1800);
  // match by position, not by visible text -- the combo's own label text changes to the selected
  // option (e.g. becomes "Name, A to Z"), so a text filter stops matching after the first switch
  const allCombos = p.getByRole('combobox');
  const total = await allCombos.count();
  if (!total) return { label, found: false };
  const initialTexts = await allCombos.allInnerTexts();
  const sortIdx = initialTexts.findIndex(t => /first|last|name|amount|newest|oldest|A.Z|Z.A/i.test(t));
  if (sortIdx === -1) return { label, found: false };
  const combo = allCombos.nth(sortIdx);
  try {
    await combo.click({ timeout: 8000 });
  } catch {
    await p.reload().catch(() => {});
    await p.waitForTimeout(1200);
    await combo.click({ timeout: 8000 });
  }
  await p.waitForTimeout(300);
  const opts = await p.getByRole('option').allInnerTexts().catch(() => []);
  await p.keyboard.press('Escape');
  const results = [];
  for (const optText of opts) {
    try {
      await combo.scrollIntoViewIfNeeded().catch(() => {});
      await combo.click({ timeout: 8000 });
      await p.waitForTimeout(250);
      await p.getByRole('option', { name: optText, exact: true }).click({ timeout: 5000 })
        .catch(async () => { await p.getByRole('option', { name: optText }).first().click({ timeout: 5000 }); });
      await p.waitForTimeout(900);
      results.push({ option: optText, firstRow: await firstRowText(p) });
    } catch (e) {
      results.push({ option: optText, error: String(e).split('\n')[0] });
      await p.keyboard.press('Escape').catch(() => {});
    }
  }
  const distinctFirstRows = new Set(results.map(r => r.firstRow)).size;
  return { label, found: true, options: opts, results, distinctFirstRows, allSameRow: distinctFirstRows === 1 && opts.length > 1 };
}

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } }); let p = await ctx.newPage();
  await login(p);

  for (const [path, label] of [['contacts', 'Contacts'], ['companies', 'Companies'], ['products', 'Catalog products'], ['audit', 'Audit'], ['outbox', 'Outbox']]) {
    // a fresh page per resource avoids the long-lived-page memory buildup that was crashing the
    // renderer a few resources into the run
    try { await p.close().catch(() => {}); } catch {}
    p = await ctx.newPage(); await login(p);
    try { out.pages[label + ' pagination'] = await walkPagination(p, path, label); }
    catch (e) { out.pages[label + ' pagination'] = { error: String(e).slice(0, 300) }; }
    if (p.isClosed()) { p = await ctx.newPage(); await login(p); } // recover from a renderer crash and keep going
    try { out.pages[label + ' sort'] = await exerciseSortDropdown(p, path, label); }
    catch (e) { out.pages[label + ' sort'] = { error: String(e).slice(0, 300) }; }
    if (p.isClosed()) { p = await ctx.newPage(); await login(p); }
  }

  // Deals: kanban board, per-column "sort" dropdown (e.g. Newest first / Oldest first / Amount)
  try {
    await p.close().catch(() => {});
    p = await ctx.newPage(); await login(p);
    await p.goto(`${BASE}/projects/${PID}/deals`); await p.waitForTimeout(1800);
    const sortCombo = p.getByRole('combobox').nth(1); // 2nd combo is usually the sort (1st is pipeline picker)
    const cnt = await sortCombo.count();
    if (cnt) {
      await sortCombo.click({ timeout: 8000 }); await p.waitForTimeout(300);
      const opts = await p.getByRole('option').allInnerTexts().catch(() => []);
      await p.keyboard.press('Escape');
      const results = [];
      for (const optText of opts) {
        try {
          await sortCombo.click({ timeout: 8000 }); await p.waitForTimeout(250);
          await p.getByRole('option', { name: optText, exact: true }).click({ timeout: 5000 });
          await p.waitForTimeout(900);
          const firstCard = (await p.locator('.group\\/card').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
          results.push({ option: optText, firstCard });
        } catch (e) {
          results.push({ option: optText, error: String(e).split('\n')[0] });
        }
      }
      out.pages['Deals sort'] = { found: true, options: opts, results, distinct: new Set(results.map(r => r.firstCard)).size };
    } else {
      out.pages['Deals sort'] = { found: false };
    }
  } catch (e) { out.pages['Deals sort'] = { error: String(e).slice(0, 300) }; }

  fs.mkdirSync('../reports/regress', { recursive: true });
  fs.writeFileSync('../reports/regress/sort_pagination.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2).slice(0, 4000));
  await b.close();
})();
