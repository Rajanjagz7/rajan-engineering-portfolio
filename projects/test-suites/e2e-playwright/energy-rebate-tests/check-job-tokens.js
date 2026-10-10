const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://portal.example.com/log-in');
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill((process.env.APP_PASSWORD ?? ''));
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/jobs');

  const res = await page.evaluate(async () => {
    const r = await fetch('/api/v1/jobs/6ab2438c7c29b5bf7379e390');
    const j = await r.json();
    return {
      status: j.data.job.status,
      siteAssessorDeclaration: j.data.job.siteAssessorDeclaration,
      nomination: j.data.job.nomination,
      engagement: j.data.job.engagement
    };
  });
  console.log(JSON.stringify(res, null, 2));

  // Also let's check example for rajanj@example.com to see if an email arrived
  const yopPage = await browser.newPage();
  await yopPage.goto('https://example.com?login=rajanj');
  await yopPage.waitForTimeout(2000);
  console.log('example page loaded for rajanj');
  
  await browser.close();
})();
