import { test, expect } from './utils/base';
import { ProductPage } from './pages/ProductPage';
import {
  PRODUCT_HANDLE,
  PRODUCT_TITLE,
  UNIT_PRICE_CENTS,
  VARIANT_ID,
  cartRequest,
  clearCart,
  getCart,
  money,
  seedCart,
} from './utils/cart';

// Cart scenarios: positive, negative and boundary. Each test starts from an
// empty cart (the cart lives in the browser context's cookies, so tests are
// isolated from each other and from real customers).
test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const qtyInput = (page: import('@playwright/test').Page) => page.locator('#MainContent input[name="updates[]"]').first();

  test.describe('product page quantity (positive + boundary)', () => {
    test('default quantity is 1 and the minimum is 1', async ({ page }) => {
      const product = new ProductPage(page);
      await product.goto(PRODUCT_HANDLE);
      const input = page.locator('input[name="quantity"]').first();
      await expect(input).toHaveValue('1');
      await expect(input).toHaveAttribute('min', '1');
    });

    test('boundary: decrease at quantity 1 does not go below 1', async ({ page }) => {
      const product = new ProductPage(page);
      await product.goto(PRODUCT_HANDLE);
      await product.decreaseQty.click();
      await expect(page.locator('input[name="quantity"]').first()).toHaveValue('1');
    });

    test('increase to 3 and add puts exactly 3 in the cart', async ({ page }) => {
      const product = new ProductPage(page);
      await product.goto(PRODUCT_HANDLE);
      await product.increaseQty.click();
      await product.increaseQty.click();
      await expect(page.locator('input[name="quantity"]').first()).toHaveValue('3');
      await product.addToCart();
      const cart = await getCart(page);
      expect(cart.item_count).toBe(3);
      expect(cart.total_price).toBe(3 * UNIT_PRICE_CENTS);
    });

    test('adding the same product twice accumulates the quantity', async ({ page }) => {
      const product = new ProductPage(page);
      await product.goto(PRODUCT_HANDLE);
      await product.addToCart();
      // The first add opens/animates the cart UI; reload so the button is interactable again.
      await product.goto(PRODUCT_HANDLE);
      await product.addToCart();
      expect((await getCart(page)).item_count).toBe(2);
    });
  });

  test.describe('product page quantity (negative)', () => {
    for (const [label, value] of [
      ['zero', '0'],
      ['negative', '-1'],
      ['invalid number ("e")', 'e'],
      ['empty', ''],
    ] as const) {
      test(`quantity "${label}" is rejected and nothing is added`, async ({ page }) => {
        // KNOWN ISSUE ZG-011: only "0" is blocked; -1, "e" and empty silently add 1.
        test.fail(value !== '0', 'ZG-011: invalid quantity silently adds 1 item');
        const product = new ProductPage(page);
        await product.goto(PRODUCT_HANDLE);
        const input = page.locator('input[name="quantity"]').first();
        // number inputs refuse letters via fill(); type instead so "e" (the one
        // letter Chrome allows) produces an invalid, empty value.
        if (value === 'e') await input.pressSequentially(value);
        else await input.fill(value);
        // Click directly: no /cart/add request is expected, so addToCart() would wait forever.
        await product.addToCartButton.click();
        await page.waitForTimeout(1500);
        expect((await getCart(page)).item_count).toBe(0);
      });
    }
  });

  test.describe('cart page (positive + boundary)', () => {
    test('shows the item, unit price, line total and subtotal', async ({ page }) => {
      await seedCart(page, 2);
      await page.goto('/cart');
      const main = page.locator('#MainContent');
      await expect(main.getByRole('link', { name: PRODUCT_TITLE }).first()).toBeVisible();
      await expect(qtyInput(page)).toHaveValue('2');
      await expect(main).toContainText(money(UNIT_PRICE_CENTS));
      await expect(main).toContainText(money(2 * UNIT_PRICE_CENTS));
    });

    test('plus button increases quantity and recalculates the subtotal', async ({ page }) => {
      await seedCart(page, 1);
      await page.goto('/cart');
      await page.getByRole('button', { name: /increase quantity/i }).first().click();
      await expect(qtyInput(page)).toHaveValue('2');
      await expect(page.locator('#MainContent')).toContainText(money(2 * UNIT_PRICE_CENTS));
      expect((await getCart(page)).item_count).toBe(2);
    });

    test('minus button decreases quantity and recalculates the subtotal', async ({ page }) => {
      await seedCart(page, 3);
      await page.goto('/cart');
      await page.getByRole('button', { name: /decrease quantity/i }).first().click();
      await expect(qtyInput(page)).toHaveValue('2');
      await expect.poll(async () => (await getCart(page)).item_count).toBe(2);
    });

    test('boundary: minus at quantity 1 removes the item (empty cart)', async ({ page }) => {
      await seedCart(page, 1);
      await page.goto('/cart');
      await page.getByRole('button', { name: /decrease quantity/i }).first().click();
      await expect.poll(async () => (await getCart(page)).item_count).toBe(0);
    });

    test('boundary: typing quantity 0 removes the item', async ({ page }) => {
      await seedCart(page, 2);
      await page.goto('/cart');
      await qtyInput(page).fill('0');
      await qtyInput(page).press('Enter');
      await expect.poll(async () => (await getCart(page)).item_count).toBe(0);
    });

    test('Remove link empties the cart', async ({ page }) => {
      await seedCart(page, 2);
      await page.goto('/cart');
      await page.getByRole('link', { name: /^remove /i }).first().click();
      await expect.poll(async () => (await getCart(page)).item_count).toBe(0);
    });

    test('boundary: a large quantity (99) totals correctly', async ({ page }) => {
      await seedCart(page, 99);
      await page.goto('/cart');
      await expect(qtyInput(page)).toHaveValue('99');
      await expect(page.locator('#MainContent')).toContainText(money(99 * UNIT_PRICE_CENTS));
    });

    test('cart contents survive a reload', async ({ page }) => {
      await seedCart(page, 2);
      await page.goto('/cart');
      await page.reload();
      await expect(qtyInput(page)).toHaveValue('2');
    });

    test('Check out button leads to the checkout page', async ({ page }) => {
      await seedCart(page, 1);
      await page.goto('/cart');
      await page.getByRole('button', { name: /check out/i }).click();
      await page.waitForURL(/\/checkouts?\//, { timeout: 30_000 });
    });
  });

  test.describe('cart AJAX API (negative + boundary)', () => {
    const add = (page: import('@playwright/test').Page, data: Record<string, unknown>) =>
      cartRequest(page, 'POST', '/cart/add.js', data);

    test('adding an unknown variant id is rejected with 422', async ({ page }) => {
      const res = await add(page, { id: 1, quantity: 1 });
      expect(res.status()).toBe(422);
      expect((await res.json()).description).toMatch(/cannot find variant/i);
      expect((await getCart(page)).item_count).toBe(0);
    });

    test('adding without an id is rejected', async ({ page }) => {
      const res = await add(page, { quantity: 1 });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    // Shopify's add.js treats an invalid quantity as the default of 1 rather
    // than rejecting it. The important invariant: it never reduces the cart or
    // adds a different amount than 1.
    for (const [label, qty, expected] of [
      ['zero', 0, 0],
      ['negative', -1, 1],
      ['fractional', 1.5, 1],
    ] as const) {
      test(`boundary: quantity ${label} (${qty}) adds ${expected} and never a negative amount`, async ({ page }) => {
        const res = await add(page, { id: VARIANT_ID, quantity: qty });
        expect(res.status()).toBeLessThan(500);
        expect((await getCart(page)).item_count).toBe(expected);
      });
    }

    test('change.js with a negative quantity cannot create a negative cart', async ({ page }) => {
      await seedCart(page, 2);
      await cartRequest(page, 'POST', '/cart/change.js', { id: String(VARIANT_ID), quantity: -5 });
      expect((await getCart(page)).item_count).toBeGreaterThanOrEqual(0);
    });

    test('change.js quantity 0 removes the line', async ({ page }) => {
      await seedCart(page, 2);
      await cartRequest(page, 'POST', '/cart/change.js', { id: String(VARIANT_ID), quantity: 0 });
      expect((await getCart(page)).item_count).toBe(0);
    });

    // KNOWN ISSUE: the store accepts absurd quantities (10,000+) for a
    // stocked item - there is no purchase cap or inventory check. The
    // expectation below is the desired behaviour; test.fail() keeps the suite
    // green today and flips to a failure (prompting removal of the marker)
    // once the store enforces a limit.
    test('upper boundary: quantity 10,000 should be capped or rejected', async ({ page }) => {
      test.fail(true, 'Known issue: no maximum quantity / inventory cap is enforced');
      await add(page, { id: VARIANT_ID, quantity: 10_000 });
      expect((await getCart(page)).item_count).toBeLessThan(10_000);
    });
  });

  test('empty cart state: heading, continue shopping, no checkout button', async ({ page }) => {
    await page.goto('/cart');
    const main = page.locator('#MainContent');
    await expect(main.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
    await expect(main.getByRole('button', { name: /check out/i })).toHaveCount(0);
  });
});
