const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://portal.example.com/log-in');
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill((process.env.APP_PASSWORD ?? ''));
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/jobs');

  const jobId = '6ab2438c7c29b5bf7379e390'; // M8N000380
  console.log(`Navigating directly to /jobs/${jobId}...`);
  await page.goto(`https://portal.example.com/jobs/${jobId}`);
  await page.waitForTimeout(4000);

  await page.screenshot({ path: 'job-detail-direct-page.png' });
  console.log('Saved job-detail-direct-page.png. URL:', page.url());

  // Check headings, tabs, buttons, sections
  const headings = await page.locator('h1, h2, h3, h4, h5, [role="heading"]').allInnerTexts();
  console.log('Headings:', headings);

  const tabs = await page.locator('[role="tab"], .tab, button[class*="tab"], nav a').allInnerTexts();
  console.log('Tabs:', tabs.filter(t => t.trim().length > 0));

  const allButtons = await page.locator('button').allInnerTexts();
  console.log('Buttons:', allButtons.filter(b => b.trim().length > 0));

  // Check file inputs
  const fileInputs = await page.locator('input[type="file"]').all();
  console.log(`Direct page has ${fileInputs.length} file inputs`);

  await browser.close();
})();
