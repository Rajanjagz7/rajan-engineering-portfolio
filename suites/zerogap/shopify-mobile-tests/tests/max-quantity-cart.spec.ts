import { test, expect } from './utils/base';
import { PRODUCT_HANDLE, clearCart, getCart } from './utils/cart';

// Search -> view product -> ask for far more than is in stock -> the storefront
// caps the add to available stock (422 "Only N items were added") -> check the
// cart -> try one more. Recorded on video.
test.use({ video: { mode: 'on', size: { width: 1366, height: 800 } } });

test('add the maximum quantity of a product and check the cart', async ({ page }) => {
  test.setTimeout(240_000);
  const main = page.locator('#MainContent');

  await page.goto('/');
  await clearCart(page);

  // 1. Search
  await page.goto('/search?q=clipper oil');
  await page.waitForTimeout(2000);
  await main.locator(`a[href*="/products/${PRODUCT_HANDLE}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(PRODUCT_HANDLE));
  const addBtn = page.getByRole('button', { name: /^add to cart$/i }).first();
  await expect(addBtn).toBeVisible();
  await page.waitForTimeout(2000);

  // 2. Ask for far more than the stock; the store should cap to what is available
  const qty = page.locator('input[name="quantity"]').first();
  await qty.fill('10000');
  await page.waitForTimeout(1500);
  const added = page.waitForResponse((r) => r.url().includes('/cart/add'));
  await addBtn.click();
  const addRes = await added;
  const body = await addRes.json().catch(() => ({}));
  console.log('ADD 10000 STATUS:', addRes.status(), '|', body.description ?? '');
  const max = Number(/Only (\d+) items/.exec(body.description ?? '')?.[1] ?? 0);
  await page.waitForTimeout(2000);

  // 3. Check the cart holds exactly the available maximum
  await page.goto('/cart');
  await page.waitForTimeout(2500);
  const afterMax = await getCart(page);
  console.log('MAX AVAILABLE:', max, '| CART item_count:', afterMax.item_count, 'total', afterMax.total_price);
  await page.screenshot({ path: 'evidence/max-quantity-cart.png' });
  expect(max).toBeGreaterThan(0);
  expect(afterMax.item_count).toBe(max);

  // 4. One more than the maximum must be refused and leave the cart unchanged
  await page.goto(`/products/${PRODUCT_HANDLE}`);
  await page.waitForTimeout(1500);
  const over = page.waitForResponse((r) => r.url().includes('/cart/add'));
  await addBtn.click();
  const overRes = await over;
  console.log('ADD +1 OVER MAX STATUS:', overRes.status());
  await page.waitForTimeout(2000);
  await page.goto('/cart');
  await page.waitForTimeout(2500);
  const afterOver = await getCart(page);
  console.log('CART AFTER +1: item_count', afterOver.item_count);
  await page.screenshot({ path: 'evidence/max-quantity-cart-over.png' });
  expect(afterOver.item_count).toBe(max);
  await page.waitForTimeout(2500);
});
