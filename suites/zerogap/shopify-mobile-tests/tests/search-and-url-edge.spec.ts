import { test, expect } from './utils/base';

// Search and URL handling: positive, negative and edge inputs.
const productLinks = '#MainContent a[href*="/products/"]';

test.describe('Search', () => {
  test.describe('positive', () => {
    test('is case-insensitive (CLIPPER == clipper)', async ({ page }) => {
      await page.goto('/search?q=CLIPPER');
      await expect(page.locator(productLinks).first()).toBeVisible();
    });

    test('ignores leading and trailing spaces', async ({ page }) => {
      await page.goto('/search?q=%20%20clipper%20%20');
      await expect(page.locator(productLinks).first()).toBeVisible();
    });

    test('partial word matches (clip)', async ({ page }) => {
      await page.goto('/search?q=clip');
      await expect(page.locator(productLinks).first()).toBeVisible();
    });
  });

  test.describe('negative and edge inputs never break the page', () => {
    const inputs: [string, string][] = [
      ['empty query', ''],
      ['spaces only', '%20%20%20'],
      ['single character', 'a'],
      ['special characters', '!@#$%^&*()_+{}|:"<>?'],
      ['SQL-injection style', "' OR 1=1 --"],
      ['unicode / emoji', '%F0%9F%92%88%20%E5%89%83%E3%82%8A'],
      ['500-character query', 'a'.repeat(500)],
      ['percent-encoding edge', '%00'],
    ];
    for (const [label, q] of inputs) {
      test(`${label}: responds without a server error and keeps the layout`, async ({ page }) => {
        const res = await page.goto(`/search?q=${q}`);
        expect(res?.status(), 'no 5xx').toBeLessThan(500);
        await expect(page.locator('header').first()).toBeVisible();
        await expect(page.locator('#MainContent')).toBeVisible();
      });
    }

    test('script in the query is escaped, not executed', async ({ page }) => {
      let dialog = false;
      page.on('dialog', async (d) => {
        dialog = true;
        await d.dismiss();
      });
      await page.goto('/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
      await page.waitForTimeout(1500);
      expect(dialog, 'no alert() fired').toBe(false);
      await expect(page.locator('#MainContent script:not([src])')).toHaveCount(0);
    });

    test('image-onerror payload is not executed', async ({ page }) => {
      let dialog = false;
      page.on('dialog', async (d) => {
        dialog = true;
        await d.dismiss();
      });
      await page.goto('/search?q=%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
      await page.waitForTimeout(1500);
      expect(dialog).toBe(false);
    });

    test('a query with no matches shows zero products', async ({ page }) => {
      await page.goto('/search?q=zzqxnomatch12345');
      await expect(page.locator(productLinks)).toHaveCount(0);
    });
  });
});

test.describe('URL handling', () => {
  test('unknown product returns 404', async ({ page }) => {
    const res = await page.goto('/products/this-product-does-not-exist');
    expect(res?.status()).toBe(404);
  });

  test('unknown collection returns 404', async ({ page }) => {
    const res = await page.goto('/collections/this-collection-does-not-exist');
    expect(res?.status()).toBe(404);
  });

  test('unknown info page returns 404', async ({ page }) => {
    const res = await page.goto('/pages/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
  });

  test('product URL with a trailing slash still loads', async ({ page }) => {
    const res = await page.goto('/products/andis-clipper-oil-118ml/');
    expect(res?.status()).toBeLessThan(400);
  });

  test('product URL in upper case still resolves or 404s cleanly', async ({ page }) => {
    const res = await page.goto('/products/ANDIS-CLIPPER-OIL-118ML');
    expect([200, 301, 302, 404]).toContain(res?.status());
  });

  test('unknown variant id in the query string falls back to a valid product page', async ({ page }) => {
    const res = await page.goto('/products/andis-clipper-oil-118ml?variant=1');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('button', { name: /^add to cart$/i }).first()).toBeVisible();
  });

  test.describe('collection pagination and sorting (boundary)', () => {
    for (const [label, qs] of [
      ['page 1', '?page=1'],
      ['page 0', '?page=0'],
      ['negative page', '?page=-1'],
      ['non-numeric page', '?page=abc'],
      ['page beyond the last (9999)', '?page=9999'],
      ['invalid sort_by value', '?sort_by=not-a-sort'],
    ] as const) {
      test(`/collections/all ${label} does not error`, async ({ page }) => {
        const res = await page.goto(`/collections/all${qs}`);
        expect(res?.status()).toBeLessThan(500);
        await expect(page.locator('#MainContent')).toBeVisible();
      });
    }
  });

  test('http:// redirects to https://', async ({ request }) => {
    const res = await request.get('http://bcppqf-4m.myshopify.com/', { maxRedirects: 0 });
    expect([301, 302, 308]).toContain(res.status());
    expect(res.headers()['location']).toMatch(/^https:/);
  });
});
