// Follow-up evidence: broken links (ZG-017), sold-out add (ZG-016), invalid quantity (ZG-011), cart qty edit (ZG-018).
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const base = 'https://bcppqf-4m.myshopify.com';
const out = path.resolve('evidence');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const ctxOpts = { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 }, storageState: '.auth/storefront.json' };

// POST with retry on 429
async function post(p, url, data) {
  for (let i = 0; i < 8; i++) {
    const r = await p.request.post(base + url, { data });
    if (r.status() !== 429) return r;
    await pause(5000 * (i + 1));
  }
  throw new Error('still rate limited');
}
const cartJson = async (p) => {
  for (let i = 0; i < 8; i++) {
    const r = await p.request.get(base + '/cart.js');
    if (r.status() !== 429) return r.json();
    await pause(5000 * (i + 1));
  }
  throw new Error('cart.js rate limited');
};

// ZG-017: where do the broken links live?
{
  const c = await browser.newContext(ctxOpts); const p = await c.newPage();
  const broken = ['/collections/gaming-controllers', '/collections/gaming-chair', '/collections/gaming-desk', '/collections/keyboards', '/collections/mousepads', '/pages/compare', '/pages/faqs'];
  const found = [];
  for (const page of ['/', '/collections/all', '/products/andis-clipper-oil-118ml', '/cart', '/pages/faq', '/pages/contact']) {
    await p.goto(base + page);
    const hits = await p.evaluate((broken) => [...document.querySelectorAll('a[href]')].filter((a) => broken.some((b) => a.getAttribute('href').split('?')[0] === b)).map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 50), inside: a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : a.closest('#MainContent') ? 'main' : 'other', visible: !!(a.offsetWidth || a.offsetHeight) })), broken);
    for (const h of hits) found.push({ page, ...h });
    if (hits.length && page === '/') await p.screenshot({ path: path.join(out, 'ZG-017_home-page-with-broken-links.png'), fullPage: true });
    await pause(1000);
  }
  fs.writeFileSync(path.join(out, 'ZG-017_broken-links.json'), JSON.stringify(found, null, 2));
  console.log('ZG-017', JSON.stringify(found));
  // 404 screenshot of one broken target
  const r = await p.goto(base + '/collections/gaming-chair');
  await p.screenshot({ path: path.join(out, 'ZG-017_404-gaming-chair.png') });
  console.log('gaming-chair status', r.status());
  await c.close();
}

// ZG-016: sold-out variant added to cart
{
  const c = await browser.newContext(ctxOpts); const p = await c.newPage();
  const handle = 'uppercut-deluxe-clay-spray';
  await p.goto(base + '/products/' + handle);
  const prod = await (await p.request.get(`${base}/products/${handle}.js`)).json();
  const v = prod.variants[0];
  const r = await post(p, '/cart/add.js', { id: v.id, quantity: 1 });
  const cart = await cartJson(p);
  fs.writeFileSync(path.join(out, 'ZG-016_sold-out-add.json'), JSON.stringify({ handle, variant_available: v.available, addStatus: r.status(), item_count: cart.item_count }, null, 2));
  await p.screenshot({ path: path.join(out, 'ZG-016_sold-out-product-page.png'), fullPage: true });
  await p.goto(base + '/cart');
  await p.screenshot({ path: path.join(out, 'ZG-016_cart-with-sold-out-item.png'), fullPage: true });
  console.log('ZG-016', JSON.stringify({ available: v.available, status: r.status(), count: cart.item_count }));
  await post(p, '/cart/clear.js', {});
  await c.close();
}

// ZG-011: invalid quantity via UI
for (const value of ['-1', '', 'e']) {
  const c = await browser.newContext(ctxOpts); const p = await c.newPage();
  await p.goto(base + '/products/andis-clipper-oil-118ml');
  const q = p.locator('input[name="quantity"]').first();
  if (value === 'e') await q.pressSequentially('e'); else await q.fill(value);
  const respP = p.waitForResponse((r) => r.url().includes('/cart/add'), { timeout: 8000 }).catch(() => null);
  await p.getByRole('button', { name: /^add to cart$/i }).first().click();
  const resp = await respP;
  await p.waitForTimeout(2000);
  const cart = await cartJson(p);
  console.log('ZG-011', JSON.stringify({ typed: value, addRequestStatus: resp ? resp.status() : 'no request', count: cart.item_count }));
  if (value === '-1') {
    fs.writeFileSync(path.join(out, 'ZG-011_cart-after-add.json'), JSON.stringify({ typedQuantity: value, addRequestStatus: resp ? resp.status() : null, item_count: cart.item_count }, null, 2));
    await p.goto(base + '/cart');
    await p.screenshot({ path: path.join(out, 'ZG-011_cart-after-minus-1.png'), fullPage: true });
  }
  await post(p, '/cart/clear.js', {});
  await c.close();
  await pause(3000);
}

// ZG-018: cart quantity edit via typing + Enter
{
  const c = await browser.newContext(ctxOpts); const p = await c.newPage();
  await p.goto(base + '/');
  await post(p, '/cart/add.js', { id: 45211104084037, quantity: 1 });
  await p.goto(base + '/cart');
  const q = p.locator('#MainContent input[name="updates[]"]').first();
  await q.fill('4');
  await q.press('Enter');
  await p.waitForTimeout(3500);
  const cart = await cartJson(p);
  const text = (await p.locator('#MainContent').innerText()).replace(/\s+/g, ' ');
  await p.screenshot({ path: path.join(out, 'ZG-018_cart-after-typing-4.png'), fullPage: true });
  fs.writeFileSync(path.join(out, 'ZG-018_cart-state.json'), JSON.stringify({ typed: 4, server_item_count: cart.item_count, server_total_cents: cart.total_price, inputValue: await q.inputValue(), pageShows36_20: text.includes('$36.20'), pageShows9_05: text.includes('$9.05') }, null, 2));
  console.log('ZG-018', JSON.stringify({ server_count: cart.item_count, total: cart.total_price, inputValue: await q.inputValue(), shows36_20: text.includes('$36.20') }));
  await post(p, '/cart/clear.js', {});
  await c.close();
}
await browser.close();
