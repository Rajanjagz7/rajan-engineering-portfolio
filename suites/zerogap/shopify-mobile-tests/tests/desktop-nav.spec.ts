import { test, expect } from '@playwright/test';

// Desktop header: nav links are inline (no burger menu).
test.describe('Desktop header & navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header shows the four store nav links', async ({ page }) => {
    const header = page.locator('header');
    for (const name of ['CLIPPERS & ELECTRICALS', 'HAIR PRODUCTS', 'BARBER ESSENTIALS', 'BUNDLES & KITS']) {
      await expect(header.getByRole('link', { name }).first()).toBeVisible();
    }
  });

  test('burger menu button is not shown on desktop', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
  });

  test('clicking a nav link opens its collection', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'CLIPPERS & ELECTRICALS' }).first().click();
    await page.waitForURL(/\/collections\/barbercon/);
    await expect(page).toHaveTitle(/BarberCon/i);
  });

  test('header cart opens the cart drawer (no page navigation)', async ({ page }) => {
    await page.locator('header a[href="/cart"]:visible').first().click();
    await expect(page.getByRole('heading', { name: 'Your cart is empty' }).first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/cart/);
  });

  test('header wishlist link goes to the wishlist page', async ({ page }) => {
    await page.locator('header a[href="/pages/wishlist"]:visible').first().click();
    await page.waitForURL(/\/pages\/wishlist/);
  });

  test('log in link leaves the site for Shopify customer accounts', async ({ page }) => {
    await page.locator('header a[href="/account"]:visible').first().click();
    await page.waitForURL(/shopify\.com|\/account/);
  });
});
