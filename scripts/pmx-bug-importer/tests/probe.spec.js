const { test } = require('@playwright/test');
const XLSX = require('xlsx');
test('probe', async ({ page }) => {
  test.setTimeout(540000);
  page.setDefaultTimeout(20000);
  await page.goto(process.env.PMX_BOARD_PATH.replace('/board', '/list'));
  await page.getByText('To Do', { exact: true }).first().waitFor();
  await page.waitForTimeout(3000);
  for (let i = 0; i < 14; i++) {
    const more = page.getByText(/^Loading \d+ more/);
    for (const el of (await more.all()).slice(0, 3)) { try { await el.scrollIntoViewIfNeeded({ timeout: 800 }); await el.click({ timeout: 800 }); } catch {} }
    await page.mouse.move(700, 450); await page.mouse.wheel(0, 2500); await page.waitForTimeout(700);
  }
  const text = await page.locator('body').innerText();
  require('fs').writeFileSync('test-results/list.txt', text);
  const wb = XLSX.readFile(process.env.PMX_BUGS_FILE);
  const titles = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(r => r.Title.trim());
  const lines = text.split('\n').map(s => s.trim());
  const group = []; let cur = '';
  for (const l of lines) { if (/^(To Do|In Progress|Done)$/.test(l)) cur = l; group.push([cur, l]); }
  let missing = 0;
  for (const t of titles) {
    const hits = group.filter(([, l]) => l === t || (t.length > 60 && l.startsWith(t.slice(0, 55))));
    if (hits.length !== 1 || hits[0][0] !== 'Done') { missing++; console.log('CHECK', JSON.stringify(hits.map(h => h[0])), t.slice(0, 60)); }
  }
  console.log('CHECKED', titles.length, 'NOT-exactly-once-in-Done', missing);
});
