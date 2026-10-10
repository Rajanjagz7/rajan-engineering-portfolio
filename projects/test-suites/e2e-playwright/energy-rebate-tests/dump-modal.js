const { chromium } = require('playwright');
const fs = require('fs');

async function dumpModal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://portal.example.com/log-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill((process.env.APP_PASSWORD ?? ''));
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/jobs');

  await page.getByRole('button', { name: 'Add Job' }).click();
  await page.waitForTimeout(2000);

  // Find dialog
  const formHtml = await page.locator('form').innerHTML();
  fs.writeFileSync('modal-form.html', formHtml);
  console.log('Saved modal-form.html');
  await browser.close();
}

dumpModal().catch(console.error);
