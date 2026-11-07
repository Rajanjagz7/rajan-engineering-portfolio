import { test, expect } from '@playwright/test';
import { CartPage } from './pages/CartPage';
import { CollectionPage } from './pages/CollectionPage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';

// Viewport-independent storefront journeys. Runs on both the mobile and the
// desktop project (see playwright.config.ts).
const PRODUCT = 'andis-clipper-oil-118ml';

test.describe('Storefront end-to-end', () => {
  test('home page loads behind the unlocked password gate', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/password/);
    await expect(page).toHaveTitle(/ZeroGap Supply Co/);
  });

  test('all-products collection lists products', async ({ page }) => {
    await page.goto('/collections/all');
    await expect(page).toHaveTitle(/Products/);
    const links = page.locator('#MainContent a[href*="/products/"]');
    await expect(links.first()).toBeVisible();
    expect(await links.count()).toBeGreaterThan(5);
  });

  test('collection page loads from its URL', async ({ page }) => {
    await page.goto('/collections/barbercon');
    await new CollectionPage(page).expectLoaded(/BarberCon/i);
  });

  test('product page shows title, quantity controls and add to cart', async ({ page }) => {
    const product = new ProductPage(page);
    await product.goto(PRODUCT);
    await expect(page).toHaveTitle(/Andis Clipper Oil 118ml/);
    await expect(product.increaseQty).toBeVisible();
    await expect(product.decreaseQty).toBeVisible();
  });

  test('add a product to the cart and see it on the cart page', async ({ page }) => {
    const product = new ProductPage(page);
    await product.goto(PRODUCT);
    await product.addToCart();

    await page.goto('/cart');
    const main = page.locator('#MainContent');
    await expect(main.getByRole('link', { name: /Andis Clipper Oil 118ml/i }).first()).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Your cart is empty' })).toBeHidden();
  });

  test('empty cart offers a continue shopping link', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();
    await expect(cart.continueShoppingLink).toBeVisible();
  });

  test('search returns matching products', async ({ page }) => {
    const search = new SearchPage(page);
    await search.search('clipper');
    await search.expectResults('clipper');
  });

  test('search with no match shows no products', async ({ page }) => {
    await page.goto('/search?q=zzqxnomatch12345');
    await expect(page).toHaveTitle(/Search/i);
    await expect(page.locator('#MainContent a[href*="/products/"]')).toHaveCount(0);
  });

  for (const [name, path] of [
    ['About Us', '/pages/about-us'],
    ['Contact', '/pages/contact'],
    ['FAQ', '/pages/faq'],
    ['Shipping', '/pages/shipping-policy'],
    ['Returns', '/pages/returns-policy'],
    ['Privacy', '/pages/privacy-policy'],
    ['Terms & Conditions', '/pages/terms-conditions'],
    ['Warranty', '/pages/warranty'],
    ['Trade portal', '/pages/trade-portal'],
    ['Wishlist', '/pages/wishlist'],
  ] as const) {
    test(`info page "${name}" loads`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page).not.toHaveURL(/\/password/);
      await expect(page.locator('#MainContent')).toBeVisible();
    });
  }

  test('unknown URL returns the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyz');
    expect(res?.status()).toBe(404);
  });
});
