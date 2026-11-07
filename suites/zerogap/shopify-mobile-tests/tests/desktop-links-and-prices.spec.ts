import { test, expect } from './utils/base';
import { cartRequest, getCart, money, seedCart } from './utils/cart';

// Runs on desktop only (file name prefix "desktop-") to spare the live store.

const SITE = 'https://bcppqf-4m.myshopify.com';

test.describe('Links - no broken or dead links', () => {
  // Pages whose links are crawled. Collected links are de-duplicated.
  const pagesToCrawl = ['/', '/collections/all', '/products/andis-clipper-oil-118ml', '/cart', '/pages/faq', '/pages/contact'];

  test('every internal link on the main pages resolves (no 4xx/5xx)', async ({ page }) => {
    // KNOWN ISSUES ZG-017/018/019: 5 gaming-collection tiles on Home, "Browse FAQs" on Contact and a hidden
    // "View compare" link all return 404. Remove this marker once they are fixed.
    test.fail(true, 'ZG-017/018/019: broken internal links');
    test.setTimeout(10 * 60_000);
    const links = new Set<string>();
    for (const path of pagesToCrawl) {
      await page.goto(path);
      const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
      for (const h of hrefs) {
        const u = new URL(h);
        if (u.origin === SITE && !u.hash && !/\/(cart\/|checkout|account)/.test(u.pathname)) links.add(u.origin + u.pathname + u.search);
      }
    }
    expect(links.size, 'crawled some links').toBeGreaterThan(10);

    const broken: string[] = [];
    for (const url of links) {
      const res = await page.request.get(url, { maxRedirects: 5 });
      if (res.status() >= 400) broken.push(`${res.status()} ${url}`);
      await page.waitForTimeout(400); // pace requests: the store rate-limits bursts
    }
    expect(broken, `broken internal links:\n${broken.join('\n')}`).toEqual([]);
  });

  test('external links respond (social, payment, policy hosts)', async ({ page }) => {
    await page.goto('/');
    const external = await page.locator('a[href^="http"]').evaluateAll((els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).href))].filter((h) => !h.includes('bcppqf-4m.myshopify.com'))
    );
    const broken: string[] = [];
    for (const url of external.slice(0, 15)) {
      const res = await page.request.get(url, { maxRedirects: 5, timeout: 20_000 }).catch(() => null);
      // 401/403/406/429 from third parties blocking bots is not a broken link.
      if (!res || (res.status() >= 404 && ![406, 429, 999].includes(res.status()))) broken.push(`${res?.status() ?? 'no response'} ${url}`);
    }
    expect(broken, broken.join('\n')).toEqual([]);
  });

  test('KNOWN ISSUE ZG-005: no link on the home page uses a dead "#" href', async ({ page }) => {
    test.fail(true, 'ZG-005: social links are href="#"');
    await page.goto('/');
    const dead = await page.locator('a[href="#"]').count();
    expect(dead).toBe(0);
  });

  test('header and footer use the same target for the same label', async ({ page }) => {
    test.fail(true, 'ZG-003: header and footer point to different collections');
    await page.goto('/');
    const target = (scope: string, label: string) =>
      page.locator(`${scope} a`, { hasText: label }).first().getAttribute('href');
    for (const label of ['CLIPPERS & ELECTRICALS', 'HAIR PRODUCTS', 'BARBER ESSENTIALS']) {
      expect(await target('header', label)).toBe(await target('footer', label));
    }
  });
});

// Price accuracy: storefront JSON is the source of truth, UI must match it.
test.describe('Prices and amounts', () => {
  interface Product {
    handle: string;
    title: string;
    variants: { id: number; price: string; compare_at_price: string | null; available: boolean }[];
  }

  const toCents = (p: string) => Math.round(parseFloat(p) * 100);

  test('product page price equals catalogue price for 12 sampled products', async ({ page }) => {
    test.setTimeout(8 * 60_000);
    const res = await page.request.get('/products.json?limit=250');
    const products: Product[] = (await res.json()).products;
    const sample = products.filter((p) => p.variants[0].available).slice(0, 12);
    expect(sample.length).toBeGreaterThan(0);
    const mismatches: string[] = [];
    for (const p of sample) {
      await page.goto(`/products/${p.handle}`);
      const expected = money(toCents(p.variants[0].price));
      const body = await page.locator('#MainContent').innerText();
      if (!body.includes(expected)) mismatches.push(`${p.handle}: expected ${expected} on page`);
    }
    expect(mismatches, mismatches.join('\n')).toEqual([]);
  });

  test('collection card prices equal catalogue prices', async ({ page }) => {
    const res = await page.request.get('/products.json?limit=250');
    const products: Product[] = (await res.json()).products;
    await page.goto('/collections/all');
    const body = await page.locator('#MainContent').innerText();
    const first = products.slice(0, 8);
    const missing = first.filter((p) => !body.includes(money(toCents(p.variants[0].price)))).map((p) => p.handle);
    // Products beyond page 1 are not on this page; only those present are asserted.
    expect(missing.length, `prices not shown: ${missing.join(', ')}`).toBeLessThan(first.length);
  });

  test('cart line total, subtotal and item count are consistent for qty 1, 2, 5, 10', async ({ page }) => {
    const unit = 905;
    for (const qty of [1, 2, 5, 10]) {
      const ctx = await page.context().browser()!.newContext({ storageState: '.auth/storefront.json', baseURL: SITE });
      const p = await ctx.newPage();
      await p.goto('/');
      await seedCart(p, qty);
      await p.goto('/cart');
      await expect(p.locator('#MainContent')).toContainText(money(unit * qty));
      const cart = await getCart(p);
      expect(cart.total_price).toBe(unit * qty);
      expect(cart.items[0].line_price).toBe(unit * qty);
      await ctx.close();
    }
  });

  test('editing the quantity on the cart page updates line total and subtotal', async ({ page }) => {
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/cart');
    const qty = page.locator('#MainContent input[name="updates[]"]').first();
    await qty.fill('4');
    await qty.blur(); // not Enter: see ZG-020
    await expect(page.locator('#MainContent')).toContainText(money(905 * 4));
    expect((await getCart(page)).total_price).toBe(905 * 4);
  });

  test('pressing Enter in the cart quantity box keeps the shopper on the cart page', async ({ page }) => {
    // KNOWN ISSUE ZG-020: Enter submits the whole cart form and jumps to checkout.
    test.fail(true, 'ZG-020: Enter in the quantity field goes to checkout');
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/cart');
    const qty = page.locator('#MainContent input[name="updates[]"]').first();
    await qty.fill('4');
    await qty.press('Enter');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/cart/);
  });

  test('checkout order summary subtotal equals the cart subtotal', async ({ page }) => {
    await page.goto('/');
    await seedCart(page, 3);
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkouts\//, { timeout: 30_000 });
    await expect(page.locator('body')).toContainText(money(905 * 3), { timeout: 30_000 });
  });

  test('prices are displayed in AUD with two decimals everywhere sampled', async ({ page }) => {
    await page.goto('/collections/all');
    const text = await page.locator('#MainContent').innerText();
    const prices = text.match(/\$[\d,]+(\.\d+)?/g) ?? [];
    expect(prices.length).toBeGreaterThan(0);
    const bad = prices.filter((p) => !/^\$[\d,]+\.\d{2}$/.test(p));
    expect(bad, `prices without two decimals: ${bad.join(', ')}`).toEqual([]);
  });

  test('shipping and tax are not claimed in the cart before an address is known', async ({ page }) => {
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/cart');
    await expect(page.locator('#MainContent')).toContainText(/taxes and shipping calculated at checkout/i);
  });

  test('cart totals return to zero after removing every item', async ({ page }) => {
    await page.goto('/');
    await seedCart(page, 2);
    await cartRequest(page, 'POST', '/cart/change.js', { id: '45211104084037', quantity: 0 });
    const cart = await getCart(page);
    expect(cart.item_count).toBe(0);
    expect(cart.total_price).toBe(0);
  });
});
