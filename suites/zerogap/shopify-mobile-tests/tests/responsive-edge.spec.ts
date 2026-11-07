import { test, expect } from './utils/base';

// Viewport edge cases: no horizontal overflow and key controls still present
// from a very small phone up to a large desktop. Overrides the project's
// viewport per test.
const viewports = [
  { name: 'small phone 320x568', width: 320, height: 568 },
  { name: 'large phone 430x932', width: 430, height: 932 },
  { name: 'tablet portrait 768x1024', width: 768, height: 1024 },
  { name: 'laptop 1280x720', width: 1280, height: 720 },
  { name: 'full HD 1920x1080', width: 1920, height: 1080 },
];
const pages = ['/', '/collections/all', '/products/andis-clipper-oil-118ml', '/cart', '/pages/faq'];

test.describe('Responsive layout', () => {
  for (const vp of viewports) {
    for (const path of pages) {
      test(`${vp.name}: ${path} has no horizontal scroll`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `page is ${overflow}px wider than the viewport`).toBeLessThanOrEqual(1);
      });
    }
  }

  test('small phone 320px: header and menu button remain usable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  test('product page: Add to Cart is reachable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/products/andis-clipper-oil-118ml');
    const add = page.getByRole('button', { name: /^add to cart$/i }).first();
    await add.scrollIntoViewIfNeeded();
    await expect(add).toBeVisible();
  });

  test('landscape phone (844x390): home renders', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await expect(page.locator('header').first()).toBeVisible();
  });
});

test.describe('Basic accessibility and metadata', () => {
  for (const path of ['/', '/collections/all', '/products/andis-clipper-oil-118ml', '/cart']) {
    test(`${path}: has a <title>, lang attribute and viewport meta`, async ({ page }) => {
      await page.goto(path);
      expect((await page.title()).length).toBeGreaterThan(0);
      await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    });

    test(`${path}: all images have an alt attribute`, async ({ page }) => {
      // KNOWN ISSUE ZG-014: the hidden dark-mode header logo has no alt attribute on every page.
      test.fail(true, 'ZG-014: header dark-logo <img> has no alt');
      await page.goto(path);
      const missing = await page.locator('img:not([alt])').count();
      expect(missing, 'images without alt').toBe(0);
    });
  }

  test('product page has exactly one H1 that names the product', async ({ page }) => {
    // KNOWN ISSUE ZG-006: the only H1 is the hidden "Sign In" heading.
    test.fail(true, 'ZG-006: product title is not an H1');
    await page.goto('/products/andis-clipper-oil-118ml');
    await expect(page.getByRole('heading', { level: 1, name: /andis clipper oil/i })).toBeVisible();
  });
});
