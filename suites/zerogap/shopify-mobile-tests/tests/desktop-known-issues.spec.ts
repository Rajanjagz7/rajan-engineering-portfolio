import { test, expect } from './utils/base';
import { seedCart } from './utils/cart';

// One test per bug that has no dedicated test elsewhere. Each is marked
// test.fail(): the suite stays green while the bug exists and turns red
// (prompting removal of the marker) as soon as the bug is fixed.
// IDs refer to BUGS.csv. Desktop only (file prefix "desktop-").

test.describe('Known issues', () => {
  test('ZG-004: the CLIPPERS & ELECTRICALS collection lists more than one product', async ({ page }) => {
    test.fail(true, 'ZG-004: header link opens a collection with a single, unrelated product');
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'CLIPPERS & ELECTRICALS' }).first().click();
    await page.waitForURL(/\/collections\//);
    const hrefs = await page.locator('#MainContent a[href*="/products/"]').evaluateAll((els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!.split('?')[0].split('/products/')[1]))]
    );
    expect(hrefs.length).toBeGreaterThan(1);
  });

  test('ZG-007: a collection with one product does not say "1 PRODUCTS"', async ({ page }) => {
    test.fail(true, 'ZG-007: pluralisation bug in the collection banner');
    await page.goto('/collections/barbercon');
    const text = await page.locator('#MainContent').innerText();
    expect(text).not.toMatch(/\b1 products\b/i);
  });

  test('ZG-008: an empty checkout submit shows field errors only, no generic problem banner', async ({ page }) => {
    test.fail(true, 'ZG-008: generic "There was a problem with our checkout" banner appears');
    await page.goto('/');
    await seedCart(page, 1);
    await page.goto('/checkout');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByText('Enter an email').first()).toBeVisible();
    await expect(page.getByText(/there was a problem with our checkout/i)).toHaveCount(0);
  });

  test('ZG-017: Home page tiles link to collections that exist', async ({ page }) => {
    test.fail(true, 'ZG-017: five gaming-collection tiles return 404');
    await page.goto('/');
    const hrefs = await page.locator('#MainContent a[href^="/collections/"]').evaluateAll((els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!.split('?')[0]))]
    );
    const bad: string[] = [];
    for (const h of hrefs) {
      const res = await page.request.get(h);
      if (res.status() >= 400) bad.push(`${res.status()} ${h}`);
      await page.waitForTimeout(400);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('ZG-018: the "Browse FAQs" button on the Contact page opens a real page', async ({ page }) => {
    test.fail(true, 'ZG-018: links to /pages/faqs which returns 404');
    await page.goto('/pages/contact');
    const href = await page.getByRole('link', { name: /browse faqs/i }).first().getAttribute('href');
    expect(href).toBeTruthy();
    const res = await page.request.get(href!);
    expect(res.status()).toBeLessThan(400);
  });

  test('ZG-019: the hidden "View compare" link points to an existing page', async ({ page }) => {
    test.fail(true, 'ZG-019: /pages/compare returns 404');
    await page.goto('/');
    const href = await page.locator('a', { hasText: 'View compare' }).first().getAttribute('href');
    expect(href).toBeTruthy();
    const res = await page.request.get(href!);
    expect(res.status()).toBeLessThan(400);
  });
});
