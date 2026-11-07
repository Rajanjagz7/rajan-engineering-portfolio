// Captures screenshots / DOM facts proving each bug in BUGS.csv into ./evidence.
// Run: node scripts/capture-evidence.mjs   (needs .env STORE_PASSWORD and .auth/storefront.json)
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const base = 'https://bcppqf-4m.myshopify.com';
const out = path.resolve('evidence');
fs.mkdirSync(out, { recursive: true });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const note = (id, file, what) => {
  results.push({ id, file, what });
  console.log(id, file, '-', what);
};

const browser = await chromium.launch();
const desktop = () => browser.newContext({ ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 }, storageState: '.auth/storefront.json' });
const mobile = () => browser.newContext({ ...devices['Pixel 9'], colorScheme: 'dark', storageState: '.auth/storefront.json' });
const add = (p, id, quantity) => p.request.post(`${base}/cart/add.js`, { data: { id, quantity } });

async function step(id, fn) {
  try {
    await fn();
  } catch (e) {
    console.log(id, 'FAILED to capture:', e.message.split('\n')[0]);
    results.push({ id, file: '', what: 'capture failed: ' + e.message.split('\n')[0] });
  }
  await pause(2500);
}

// ZG-001: no maximum quantity
await step('ZG-001', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/');
  const r = await add(p, 45211104084037, 10000);
  const cart = await (await p.request.get(base + '/cart.js')).json();
  fs.writeFileSync(path.join(out, 'ZG-001_cart-api.json'), JSON.stringify({ addStatus: r.status(), item_count: cart.item_count, total_price_cents: cart.total_price }, null, 2));
  await p.goto(base + '/cart');
  await p.screenshot({ path: path.join(out, 'ZG-001_cart-10000-units.png'), fullPage: true });
  note('ZG-001', 'ZG-001_cart-10000-units.png', `cart holds ${cart.item_count} units`);
  await p.request.post(base + '/cart/clear.js');
  await c.close();
});

// ZG-003 / ZG-005 / ZG-006 / ZG-007 / ZG-012 / ZG-014: DOM + page evidence
await step('ZG-003', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/');
  const nav = await p.evaluate(() => {
    const get = (scope) => [...document.querySelectorAll(`${scope} a`)].filter((a) => /CLIPPERS|HAIR PRODUCTS|BARBER ESSENTIALS/.test(a.textContent)).map((a) => `${a.textContent.trim()} -> ${a.getAttribute('href')}`);
    return { header: get('header'), footer: get('footer') };
  });
  fs.writeFileSync(path.join(out, 'ZG-003_header-vs-footer-links.json'), JSON.stringify(nav, null, 2));
  await p.screenshot({ path: path.join(out, 'ZG-003_home-header.png'), clip: { x: 0, y: 0, width: 1366, height: 120 } });
  await p.locator('footer').scrollIntoViewIfNeeded();
  await p.locator('footer').screenshot({ path: path.join(out, 'ZG-003_home-footer.png') });
  note('ZG-003', 'ZG-003_header-vs-footer-links.json', JSON.stringify(nav));
  const socials = await p.evaluate(() => [...document.querySelectorAll('a[href="#"]')].map((a) => a.textContent.trim()));
  fs.writeFileSync(path.join(out, 'ZG-005_dead-links.json'), JSON.stringify(socials, null, 2));
  await p.locator('footer').screenshot({ path: path.join(out, 'ZG-005_footer-social-links.png') });
  note('ZG-005', 'ZG-005_dead-links.json', `${socials.length} links with href="#"`);
  const dark = await p.evaluate(() => [...document.querySelectorAll('img:not([alt])')].map((i) => i.outerHTML.slice(0, 200)));
  fs.writeFileSync(path.join(out, 'ZG-014_img-without-alt.json'), JSON.stringify(dark, null, 2));
  note('ZG-014', 'ZG-014_img-without-alt.json', `${dark.length} img without alt`);
  await c.close();
});

await step('ZG-004/007/012', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/collections/barbercon');
  await p.screenshot({ path: path.join(out, 'ZG-004_ZG-007_barbercon-collection.png'), fullPage: true });
  const names = await p.getByRole('button', { name: /quick add|sold out/i }).evaluateAll((e) => e.map((x) => x.getAttribute('aria-label') || x.textContent.trim().replace(/\s+/g, ' ')));
  fs.writeFileSync(path.join(out, 'ZG-012_quick-add-accessible-name.json'), JSON.stringify({ stockText: await p.getByText('IN STOCK').count(), buttonNames: names }, null, 2));
  note('ZG-012', 'ZG-012_quick-add-accessible-name.json', JSON.stringify(names));
  await c.close();
});

await step('ZG-006', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/products/andis-clipper-oil-118ml');
  const h1 = await p.locator('h1').allInnerTexts();
  fs.writeFileSync(path.join(out, 'ZG-006_h1-elements.json'), JSON.stringify(h1.map((t) => t.replace(/\s+/g, ' ').trim()), null, 2));
  await p.screenshot({ path: path.join(out, 'ZG-006_product-page.png') });
  note('ZG-006', 'ZG-006_h1-elements.json', JSON.stringify(h1));
  await c.close();
});

// ZG-008 / ZG-015: checkout
await step('ZG-008/015', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/');
  await add(p, 45211104084037, 1);
  await p.goto(base + '/checkout');
  await p.locator('input[name="email"]').waitFor({ timeout: 40000 });
  await p.getByRole('button', { name: 'Pay now' }).click();
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(out, 'ZG-008_checkout-empty-submit.png'), fullPage: true });
  note('ZG-008', 'ZG-008_checkout-empty-submit.png', 'field errors plus generic banner');
  await p.locator('input[name="email"]').fill('two words@example.com');
  await p.getByRole('button', { name: 'Pay now' }).click();
  await p.waitForTimeout(2000);
  await p.locator('input[name="email"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(out, 'ZG-015_checkout-email-with-space.png') });
  note('ZG-015', 'ZG-015_checkout-email-with-space.png', 'no email error for value with a space');
  await p.request.post(base + '/cart/clear.js');
  await c.close();
});

// ZG-010: desktop drawer vs mobile page
await step('ZG-010', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/');
  await p.locator('header a[href="/cart"]:visible').first().click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, 'ZG-010_desktop-cart-drawer.png') });
  await c.close();
  const m = await mobile(); const mp = await m.newPage();
  await mp.goto(base + '/');
  await mp.locator('header a[href="/cart"]:visible, nav a[href="/cart"]:visible').first().click().catch(() => {});
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: path.join(out, 'ZG-010_mobile-cart-navigates.png') });
  note('ZG-010', 'ZG-010_desktop-cart-drawer.png', 'desktop opens drawer; mobile url ' + mp.url());
  await m.close();
});

// ZG-011: invalid quantity adds 1
await step('ZG-011', async () => {
  const c = await desktop(); const p = await c.newPage();
  await p.goto(base + '/products/andis-clipper-oil-118ml');
  const q = p.locator('input[name="quantity"]').first();
  await q.fill('-1');
  await p.screenshot({ path: path.join(out, 'ZG-011_quantity-minus-1.png') });
  await p.getByRole('button', { name: /^add to cart$/i }).first().click();
  await p.waitForTimeout(2500);
  const cart = await (await p.request.get(base + '/cart.js')).json();
  fs.writeFileSync(path.join(out, 'ZG-011_cart-after-add.json'), JSON.stringify({ typedQuantity: -1, item_count: cart.item_count }, null, 2));
  await p.goto(base + '/cart');
  await p.screenshot({ path: path.join(out, 'ZG-011_cart-after-minus-1.png'), fullPage: true });
  note('ZG-011', 'ZG-011_cart-after-minus-1.png', `typed -1, cart count ${cart.item_count}`);
  await p.request.post(base + '/cart/clear.js');
  await c.close();
});

// ZG-016: a sold-out (unavailable) variant can be added to the cart
await step('ZG-016', async () => {
  const c = await desktop(); const p = await c.newPage();
  const handle = 'uppercut-deluxe-clay-spray';
  await p.goto(base + '/products/' + handle);
  const prod = await (await p.request.get(`${base}/products/${handle}.js`)).json();
  const v = prod.variants[0];
  const r = await add(p, v.id, 1);
  const cart = await (await p.request.get(base + '/cart.js')).json();
  fs.writeFileSync(path.join(out, 'ZG-016_sold-out-add.json'), JSON.stringify({ handle, variant_available: v.available, addStatus: r.status(), item_count: cart.item_count }, null, 2));
  await p.screenshot({ path: path.join(out, 'ZG-016_sold-out-product-page.png'), fullPage: true });
  await p.goto(base + '/cart');
  await p.screenshot({ path: path.join(out, 'ZG-016_cart-with-sold-out-item.png'), fullPage: true });
  note('ZG-016', 'ZG-016_sold-out-add.json', `available=${v.available}, add status ${r.status()}, cart count ${cart.item_count}`);
  await p.request.post(base + '/cart/clear.js');
  await c.close();
});

// ZG-013: wrong-case password
await step('ZG-013', async () => {
  const pw = process.env.STORE_PASSWORD;
  if (!pw) throw new Error('STORE_PASSWORD not set');
  const flipped = pw === pw.toUpperCase() ? pw.toLowerCase() : pw.toUpperCase();
  const c = await browser.newContext({ ...devices['Desktop Chrome'] }); const p = await c.newPage();
  await p.goto(base + '/');
  await p.getByRole('button', { name: /enter using password/i }).click();
  await p.getByLabel('Your password').fill(flipped);
  await p.getByRole('button', { name: 'Enter', exact: true }).click();
  await p.waitForTimeout(3000);
  await p.screenshot({ path: path.join(out, 'ZG-013_wrong-case-password-result.png') });
  note('ZG-013', 'ZG-013_wrong-case-password-result.png', 'url after wrong-case password: ' + new URL(p.url()).pathname);
  await c.close();
});

fs.writeFileSync(path.join(out, 'evidence-index.json'), JSON.stringify(results, null, 2));
await browser.close();
