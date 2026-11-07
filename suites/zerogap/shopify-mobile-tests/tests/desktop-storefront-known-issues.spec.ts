import { test, expect } from './utils/base';
import { seedCart } from './utils/cart';

// Known-issue tests for bugs found by the storefront crawl (ZG-021 .. ZG-040).
// Same convention as desktop-known-issues.spec.ts: each test asserts the
// CORRECT behaviour and is marked test.fail(), so the suite stays green while
// the bug exists and turns red (prompting removal of the marker) once fixed.
// Set SHOW_BUGS=1 to run them unmarked and see the real failures.
// IDs refer to BUGS.csv. Desktop only (file prefix "desktop-").

const knownIssue = (reason: string) => {
  if (!process.env.SHOW_BUGS) test.fail(true, reason);
};

interface CatalogProduct {
  handle: string;
  title: string;
  body_html: string | null;
  images: unknown[];
  variants: { price: string; available: boolean; sku: string | null }[];
}

async function catalog(page: import('@playwright/test').Page): Promise<CatalogProduct[]> {
  const res = await page.request.get('/products.json?limit=250');
  expect(res.ok(), 'products.json should be reachable').toBeTruthy();
  return (await res.json()).products;
}

const resultCount = async (page: import('@playwright/test').Page) => {
  const text = await page.locator('#MainContent').innerText();
  const m = text.match(/(\d+)\s+results? found/i);
  return m ? Number(m[1]) : -1;
};

test.describe('Storefront known issues', () => {
  test('ZG-021: checkout loads without Meta Pixel invalid-value warnings', async ({ page }) => {
    knownIssue('ZG-021: pixel_id is passed with literal quotes');
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (/Meta Pixel/i.test(m.text()) && /invalid value/i.test(m.text())) warnings.push(m.text());
    });
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/checkout');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3000);
    expect(warnings, warnings.join('\n')).toEqual([]);
  });

  test('ZG-023: a non-numeric phone number is rejected at checkout', async ({ page }) => {
    knownIssue('ZG-023: phone "abc" is accepted');
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/checkout');
    const phone = page.locator('input[name="phone"]').first();
    await expect(phone).toBeVisible({ timeout: 30_000 });
    await phone.fill('abc');
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByText(/valid phone/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('ZG-027: no purchasable product is priced at $0.00', async ({ page }) => {
    // ZG-027 FIXED (verified 2026-10-10: catalogue cleaned). Kept as a regression test.
    const free = (await catalog(page))
      .filter((p) => p.variants.some((v) => v.available && Number(v.price) === 0))
      .map((p) => p.handle);
    expect(free, free.join('\n')).toEqual([]);
  });

  test('ZG-028: sold-out products do not display a $0.00 price in listings', async ({ page }) => {
    // ZG-028 FIXED (verified 2026-10-10: catalogue cleaned). Kept as a regression test.
    await page.goto('/collections/all?sort_by=price-ascending');
    const text = await page.locator('#MainContent').innerText();
    expect(text).not.toMatch(/\$0\.00/);
  });

  test('ZG-029: the Brand filter count matches the collection size', async ({ page }) => {
    knownIssue('ZG-029: Brand shows ProRapid (2) on a 22-product collection');
    await page.goto('/collections/prorapid');
    const text = await page.locator('#MainContent').innerText();
    const total = Number(text.match(/(\d+)\s+products/i)?.[1]);
    const brand = Number(text.match(/ProRapid\s*\((\d+)\)/i)?.[1]);
    expect(total).toBeGreaterThan(0);
    expect(brand).toBe(total);
  });

  test('ZG-030: collection page stylesheets load as text/css', async ({ page }) => {
    // ZG-030 FIXED (verified 2026-10-10: stylesheets are no longer requested). Kept as a regression test.
    const bad: string[] = [];
    page.on('response', (r) => {
      if (/component-(show-more|pagination)\.css/.test(r.url())) {
        const type = r.headers()['content-type'] ?? '';
        if (!r.ok() || !/text\/css/.test(type)) bad.push(`${r.status()} ${type} ${r.url().split('/').pop()}`);
      }
    });
    await page.goto('/collections/prorapid');
    await page.waitForLoadState('networkidle');
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('ZG-031: an out-of-range page gives a sensible message, not "Showing 1-0 Of N"', async ({ page }) => {
    knownIssue('ZG-031: page=99 says "Showing 1-0 Of 52 Results" and "use fewer filters"');
    await page.goto('/collections/all?page=99');
    const cards = await page.locator('#MainContent a[href*="/products/"]').count();
    const text = await page.locator('#MainContent').innerText();
    expect(cards > 0 || !/showing 1-0|use fewer filters/i.test(text)).toBeTruthy();
  });

  for (const handle of ['clippers-trimmers-shavers', 'bundles-kits', 'muk-hair-care']) {
    test(`ZG-032: menu collection "${handle}" has products`, async ({ page }) => {
      knownIssue('ZG-032: collection is empty (NO PRODUCTS FOUND)');
      await page.goto(`/collections/${handle}`);
      await expect(page.locator('#MainContent a[href*="/products/"]').first()).toBeVisible({ timeout: 5000 });
    });
  }

  test('ZG-033: search results do not depend on letter case', async ({ page }) => {
    knownIssue('ZG-033: "wax" returns 34, "WAX" returns 36');
    await page.goto('/search?q=wax');
    const lower = await resultCount(page);
    await page.goto('/search?q=WAX');
    const upper = await resultCount(page);
    expect(lower).toBeGreaterThan(0);
    expect(upper).toBe(lower);
  });

  test('ZG-034: an empty search shows guidance, not a blank page', async ({ page }) => {
    knownIssue('ZG-034: /search?q= renders only the word SEARCH');
    await page.goto('/search?q=');
    const text = (await page.locator('#MainContent').innerText()).trim().toLowerCase();
    expect(text).not.toBe('search');
  });

  test('ZG-034b: the result count matches the number of products listed', async ({ page }) => {
    knownIssue('ZG-034: "<script>" query reports 1 Result with no product cards');
    await page.goto('/search?q=' + encodeURIComponent('<script>alert(1)</script>'));
    const text = await page.locator('#MainContent').innerText();
    const claimed = Number(text.match(/(\d+)\s+results?/i)?.[1] ?? 0);
    const cards = await page.locator('#MainContent a[href*="/products/"]').count();
    expect(claimed === 0 ? cards === 0 : cards > 0).toBeTruthy();
  });

  test('ZG-035: product descriptions contain no placeholder text', async ({ page }) => {
    knownIssue('ZG-035: "to be confirmed" placeholders and copy-pasted descriptions');
    const bad = (await catalog(page))
      .filter((p) => /to be confirmed|defining paste/i.test((p.body_html ?? '').replace(/<[^>]+>/g, ' ')))
      .map((p) => p.handle);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('ZG-036: every product has an image and a description', async ({ page }) => {
    // ZG-036 FIXED (verified 2026-10-10: catalogue cleaned). Kept as a regression test.
    const bad = (await catalog(page))
      .filter((p) => p.images.length === 0 || !(p.body_html ?? '').replace(/<[^>]+>/g, '').trim())
      .map((p) => p.handle);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('ZG-037: a consumable product page has no machine warranty block', async ({ page }) => {
    knownIssue('ZG-037: 12 MONTH WARRANTY shown on a styling wax');
    await page.goto('/products/prorapid-inca-06-styling-hair-wax-150ml');
    await expect(page.locator('#MainContent')).not.toContainText(/12 month warranty/i);
  });

  test('ZG-038: the returns policy subtitle is about returns', async ({ page }) => {
    knownIssue('ZG-038: subtitle repeats the shipping copy');
    await page.goto('/pages/returns-policy');
    await expect(page.locator('#MainContent')).not.toContainText(/fast, tracked delivery/i);
  });

  test('ZG-040: each blog article is listed once', async ({ page }) => {
    knownIssue('ZG-040: "How to pick your perfect pomade" appears twice');
    await page.goto('/blogs/news');
    const titles = (
      await page.locator('#MainContent a[href*="/blogs/news/"]').allInnerTexts()
    )
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !/read more/.test(t));
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes, dupes.join('\n')).toEqual([]);
  });
});
