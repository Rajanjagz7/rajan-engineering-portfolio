const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://portal.example.com/log-in');
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill((process.env.APP_PASSWORD ?? ''));
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/jobs');

  await page.goto('https://portal.example.com/installeruser');
  await page.waitForTimeout(2000);

  const searchInput = page.getByPlaceholder('Search Users...');
  if (await searchInput.isVisible()) {
    await searchInput.fill('Rajan');
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'installer-users-list.png' });
  console.log('Saved installer-users-list.png');

  // Check rows
  const rows = await page.locator('tr').allInnerTexts();
  console.log(`Found ${rows.length} rows`);
  for (const r of rows.slice(0, 10)) {
    console.log('Row:', r.replace(/\n+/g, ' | ').trim());
  }

  await browser.close();
})();
