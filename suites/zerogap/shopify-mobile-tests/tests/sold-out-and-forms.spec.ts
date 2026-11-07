import { test, expect } from './utils/base';
import { cartRequest, getCart } from './utils/cart';

// Both products below were verified against /products.json: the first has every
// variant unavailable, the second is purchasable.
// Was 'uppercut-deluxe-clay-spray', removed from the store in the Oct 2026 catalogue clean-up (now 404).
const SOLD_OUT_HANDLE = 'uppercut-matte-pomade';
const IN_STOCK_HANDLE = 'barbercon-neck-strips-white';

test.describe('Sold-out product (negative)', () => {
  test('product page shows a sold-out state and no active Add to Cart', async ({ page }) => {
    await page.goto(`/products/${SOLD_OUT_HANDLE}`);
    const add = page.getByRole('button', { name: /^add to cart$/i });
    const soldOut = page.getByRole('button', { name: /sold out/i });
    const addVisible = await add.first().isVisible().catch(() => false);
    if (addVisible) await expect(add.first()).toBeDisabled();
    else await expect(soldOut.first()).toBeVisible();
  });

  test('API: adding a sold-out variant is rejected with 422 and the cart stays empty', async ({ page }) => {
    // KNOWN ISSUE ZG-016: the cart accepts a variant the catalogue marks unavailable (HTTP 200).
    test.fail(true, 'ZG-016: sold-out variant can be added to the cart');
    await page.goto('/');
    const prod = await (await cartRequest(page, 'GET', `/products/${SOLD_OUT_HANDLE}.js`)).json();
    const res = await cartRequest(page, 'POST', '/cart/add.js', { id: prod.variants[0].id, quantity: 1 });
    expect(res.status()).toBe(422);
    expect((await getCart(page)).item_count).toBe(0);
  });

  test('collection card marks a sold-out item', async ({ page }) => {
    await page.goto('/collections/all');
    await expect(page.getByText(/sold out/i).first()).toBeAttached();
  });
});

test.describe('In-stock product (positive)', () => {
  test('API: an in-stock variant can be added', async ({ page }) => {
    await page.goto('/');
    const prod = await (await cartRequest(page, 'GET', `/products/${IN_STOCK_HANDLE}.js`)).json();
    const res = await cartRequest(page, 'POST', '/cart/add.js', { id: prod.variants[0].id, quantity: 1 });
    expect(res.status()).toBe(200);
  });

  test('collection quick-add button for an in-stock item is not labelled "Sold out"', async ({ page }) => {
    // KNOWN ISSUE ZG-012: the quick-add button's accessible name starts with "Sold out" although the item is in stock.
    test.fail(true, 'ZG-012: in-stock item has a "Sold out" accessible name');
    await page.goto('/collections/barbercon');
    await expect(page.getByRole('button', { name: /sold out/i })).toHaveCount(0);
  });
});

// Forms are validated only - a valid submission would create real customers or
// send real email, so no test here submits a fully valid form.
test.describe('Footer newsletter form', () => {
  const email = (page: import('@playwright/test').Page) => page.locator('footer input[type="email"]').first();
  const subscribe = (page: import('@playwright/test').Page) => page.locator('footer').getByRole('button', { name: /subscribe/i });

  test('negative: empty email is blocked', async ({ page }) => {
    await page.goto('/');
    await subscribe(page).click();
    expect(await email(page).evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(false);
  });

  for (const bad of ['plainaddress', 'a@', '@b.com', 'a b@c.com']) {
    test(`negative: "${bad}" is not a valid email`, async ({ page }) => {
      await page.goto('/');
      await email(page).fill(bad);
      await subscribe(page).click();
      expect(await email(page).evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(false);
      await expect(page.getByText(/thanks for subscribing/i)).toHaveCount(0);
    });
  }

  test('edge: a 300-character address is not accepted as valid', async ({ page }) => {
    await page.goto('/');
    await email(page).fill(`${'a'.repeat(300)}@example.com`);
    const valid = await email(page).evaluate((e: HTMLInputElement) => e.validity.valid);
    const len = (await email(page).inputValue()).length;
    expect(valid === false || len <= 320).toBe(true);
  });

  test('positive: a well-formed address passes browser validation (not submitted)', async ({ page }) => {
    await page.goto('/');
    await email(page).fill('qa.automation@example.com');
    expect(await email(page).evaluate((e: HTMLInputElement) => e.validity.valid)).toBe(true);
  });
});

test.describe('Browser navigation (positive + edge)', () => {
  test('back and forward keep the cart contents', async ({ page }) => {
    await page.goto('/products/andis-clipper-oil-118ml');
    await cartRequest(page, 'POST', '/cart/add.js', { id: 45211104084037, quantity: 1 });
    await page.goto('/collections/all');
    await page.goBack();
    await page.goForward();
    expect((await getCart(page)).item_count).toBe(1);
  });

  test('reloading a product page keeps it usable', async ({ page }) => {
    await page.goto('/products/andis-clipper-oil-118ml');
    await page.reload();
    await expect(page.getByRole('button', { name: /^add to cart$/i }).first()).toBeVisible();
  });
});
