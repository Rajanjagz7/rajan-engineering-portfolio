const { chromium } = require('playwright');

async function debugFormValidation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://portal.example.com/log-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill((process.env.APP_PASSWORD ?? ''));
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/jobs');

  await page.getByRole('button', { name: 'Add Job' }).click();
  await page.waitForTimeout(1500);

  // Click submit immediately to see what validation errors appear
  console.log('Clicking submit on empty form to see error messages:');
  await page.locator('#submitButton').click();
  await page.waitForTimeout(1000);

  const errors = await page.locator('.text-red-500, .error, [class*="errorMessage"]').allInnerTexts();
  console.log('Errors on empty form:', errors);

  await browser.close();
}

debugFormValidation().catch(console.error);
