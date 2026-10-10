const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://portal.example.com/log-in');
  
  const text = await page.evaluate(async () => {
    const res = await fetch('/assets/StorageService-CesXrG-J.js');
    return await res.text();
  });

  console.log('StorageService length:', text.length);
  console.log('StorageService code:');
  console.log(text);

  await browser.close();
})();
