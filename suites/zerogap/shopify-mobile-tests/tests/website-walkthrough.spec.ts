import { test, expect } from './utils/base';
import type { Page } from '@playwright/test';
import { CheckoutPage } from './pages/CheckoutPage';
import { PRODUCT_HANDLE, clearCart, seedCart } from './utils/cart';

// One continuous, narrated walkthrough of the storefront for screen recording:
// positive, negative and boundary scenarios across search, product, wishlist,
// cart, sold-out, 404 and a complete test-mode payment. Each scenario shows an
// on-screen caption with its result. A failing scenario is recorded as FAIL and
// the tour carries on, so the video always covers everything.
test.use({ video: { mode: 'on', size: { width: 1366, height: 800 } } });

const results: string[] = [];

async function caption(page: Page, text: string, color = '#1d4ed8') {
  await page
    .evaluate(
      ([t, c]) => {
        let el = document.getElementById('qa-caption');
        if (!el) {
          el = document.createElement('div');
          el.id = 'qa-caption';
          el.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:10px 16px;font:600 16px/1.3 Arial,sans-serif;color:#fff;text-align:center;pointer-events:none;';
          document.documentElement.appendChild(el);
        }
        el.style.background = c;
        el.textContent = t;
      },
      [text, color]
    )
    .catch(() => undefined);
}

async function scenario(page: Page, kind: 'POSITIVE' | 'NEGATIVE' | 'BOUNDARY', name: string, fn: () => Promise<void>) {
  const label = `${kind}: ${name}`;
  await caption(page, label, '#1d4ed8');
  await page.waitForTimeout(1200);
  try {
    await fn();
    results.push(`PASS  ${label}`);
    await caption(page, `PASS - ${label}`, '#15803d');
  } catch (e) {
    results.push(`FAIL  ${label} :: ${String((e as Error).message).split('\n')[0]}`);
    await caption(page, `FAIL (bug) - ${label}`, '#b91c1c');
  }
  await page.waitForTimeout(1500);
}

test('full website walkthrough: positive, negative and boundary scenarios', async ({ page }) => {
  test.setTimeout(900_000);
  const main = page.locator('#MainContent');
  const qty = page.locator('input[name="quantity"]').first();
  const cartQty = main.locator('input[name="updates[]"]').first();
  const addBtn = page.getByRole('button', { name: /^add to cart$/i }).first();
  const emptyHeading = main.getByRole('heading', { name: 'Your cart is empty' });

  await page.goto('/');
  await clearCart(page);

  // ---- Home & navigation
  await scenario(page, 'POSITIVE', 'home page loads behind the unlocked gate', async () => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page).not.toHaveURL(/password/);
  });
  await scenario(page, 'POSITIVE', 'navigate to a collection from the header', async () => {
    await page.locator('header a[href*="/collections/"]:visible').first().click();
    await expect(page).toHaveURL(/\/collections\//);
    await expect(main.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  // ---- Search
  await scenario(page, 'POSITIVE', 'search "clipper" returns products', async () => {
    await page.goto('/search?q=clipper');
    await expect(main.locator('a[href*="/products/"]').first()).toBeVisible();
  });
  await scenario(page, 'NEGATIVE', 'search with no match shows no products', async () => {
    await page.goto('/search?q=zzqxxnotaproduct');
    await expect(main.locator('a[href*="/products/"]')).toHaveCount(0);
  });
  await scenario(page, 'NEGATIVE', 'script in the search query is escaped, not run', async () => {
    let dialog = false;
    page.once('dialog', (d) => {
      dialog = true;
      d.dismiss().catch(() => undefined);
    });
    await page.goto('/search?q=' + encodeURIComponent('<script>alert(1)</script>'));
    await page.waitForTimeout(1500);
    expect(dialog).toBe(false);
  });

  // ---- Product page quantity
  await scenario(page, 'POSITIVE', 'product page shows title and Add to cart', async () => {
    await page.goto(`/products/${PRODUCT_HANDLE}`);
    await expect(addBtn).toBeVisible();
    await expect(qty).toHaveValue('1');
  });
  await scenario(page, 'BOUNDARY', 'minus at quantity 1 stays at 1', async () => {
    await page.getByRole('button', { name: /decrease quantity/i }).first().click();
    await expect(qty).toHaveValue('1');
  });
  await scenario(page, 'POSITIVE', 'plus twice sets quantity to 3', async () => {
    const plus = page.getByRole('button', { name: /increase quantity/i }).first();
    await plus.click();
    await plus.click();
    await expect(qty).toHaveValue('3');
  });
  await scenario(page, 'NEGATIVE', 'quantity -1 is not added to the cart', async () => {
    await qty.fill('-1');
    await addBtn.click().catch(() => undefined);
    await page.waitForTimeout(1500);
    const cart = await (await page.request.get('/cart.js')).json();
    expect(cart.item_count).toBe(0);
  });

  // ---- Wishlist (favourite)
  await scenario(page, 'POSITIVE', 'add the product to the wishlist (favourite)', async () => {
    await page.goto(`/products/${PRODUCT_HANDLE}`);
    await page.locator('a.add-wishlist').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('dtx-wish-count').first()).not.toHaveText('0');
  });
  await scenario(page, 'POSITIVE', 'wishlist page opens from the header', async () => {
    await page.locator('header a[href="/pages/wishlist"]:visible').first().click();
    await expect(page).toHaveURL(/\/pages\/wishlist/);
    await page.waitForTimeout(2000);
  });
  await scenario(page, 'NEGATIVE', 'wishlist control switches to "Remove" once saved', async () => {
    await page.goto(`/products/${PRODUCT_HANDLE}`);
    const heart = page.locator('a.add-wishlist, a.remove-wishlist').first();
    await expect(heart).toHaveAttribute('aria-label', /remove/i);
  });
  await scenario(page, 'POSITIVE', 'remove the product from the wishlist', async () => {
    await page.locator('a.add-wishlist, a.remove-wishlist').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('dtx-wish-count').first()).toHaveText('0');
  });

  // ---- Cart
  await scenario(page, 'POSITIVE', 'add to cart and see it on the cart page', async () => {
    await clearCart(page);
    await page.goto(`/products/${PRODUCT_HANDLE}`);
    const added = page.waitForResponse((r) => r.url().includes('/cart/add') && r.ok());
    await addBtn.click();
    await added;
    await page.goto('/cart');
    await expect(main.getByRole('link', { name: /clipper oil/i }).first()).toBeVisible();
  });
  await scenario(page, 'POSITIVE', 'plus increases quantity to 2', async () => {
    await page.getByRole('button', { name: /increase quantity/i }).first().click();
    await expect(cartQty).toHaveValue('2');
  });
  await scenario(page, 'POSITIVE', 'minus decreases quantity back to 1', async () => {
    await page.getByRole('button', { name: /decrease quantity/i }).first().click();
    await expect(cartQty).toHaveValue('1');
  });
  await scenario(page, 'BOUNDARY', 'quantity 0 removes the item', async () => {
    await cartQty.fill('0');
    await cartQty.press('Enter');
    await expect(emptyHeading).toBeVisible({ timeout: 15_000 });
  });
  await scenario(page, 'POSITIVE', 'Remove link empties the cart', async () => {
    await seedCart(page, 1);
    await page.goto('/cart');
    await page.getByRole('link', { name: /^remove /i }).first().click();
    await expect(emptyHeading).toBeVisible({ timeout: 15_000 });
  });
  await scenario(page, 'BOUNDARY', 'quantity 99 totals correctly', async () => {
    await seedCart(page, 99);
    await page.goto('/cart');
    await expect(main).toContainText('$895.95');
  });
  await scenario(page, 'NEGATIVE', 'empty cart has no checkout button', async () => {
    await clearCart(page);
    await page.goto('/cart');
    await expect(page.getByRole('button', { name: /check out/i })).toHaveCount(0);
  });

  // ---- Sold out / 404
  await scenario(page, 'NEGATIVE', 'sold-out product shows Sold out, not Add to cart', async () => {
    await page.goto('/products/uppercut-matte-pomade');
    await expect(page.getByRole('button', { name: /sold out/i }).first()).toBeVisible();
  });
  await scenario(page, 'NEGATIVE', 'unknown URL shows the 404 page', async () => {
    const res = await page.goto('/products/this-product-does-not-exist');
    expect(res?.status()).toBe(404);
  });

  // ---- Checkout & payment
  const checkout = new CheckoutPage(page);
  await seedCart(page, 1);
  await checkout.goto();

  await scenario(page, 'NEGATIVE', 'empty checkout submit lists required-field errors', async () => {
    await checkout.payNow.click();
    await expect(checkout.error('Enter an email')).toBeVisible();
    await expect(checkout.error('Enter a card number')).toBeVisible();
  });
  await scenario(page, 'NEGATIVE', 'invalid email "plainaddress" is rejected', async () => {
    await checkout.email.fill('plainaddress');
    await checkout.payNow.click();
    await expect(checkout.error('Enter a valid email')).toBeVisible();
  });
  await scenario(page, 'NEGATIVE', 'invalid card number (fails Luhn) is rejected', async () => {
    await checkout.fillCardNumber('1234 1234 1234 1234');
    await checkout.payNow.click();
    await expect(checkout.error(/Enter a (valid )?card number/)).toBeVisible();
  });

  await scenario(page, 'POSITIVE', 'complete payment with a test card reaches confirmation', async () => {
    await checkout.email.fill('qa.test@example.com');
    await checkout.firstName.fill('Test');
    await checkout.lastName.fill('Tester');
    await checkout.address.fill('1 Test Street');
    await checkout.city.fill('Melbourne');
    await page.locator('select[name="zone"]').first().selectOption({ label: 'Victoria' });
    await checkout.postalCode.fill('3000');
    await expect(page.getByRole('radio', { name: /Standard/ })).toBeChecked({ timeout: 30_000 });
    await expect(page.getByText('Estimated taxes')).toBeVisible();
    await page.waitForTimeout(2000);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await checkout.fillCardNumber('4242 4242 4242 4242');
      await checkout.fillExpiry('12/40');
      await checkout.fillCvv('123');
      await checkout.fillCardName('Test Tester');
      const vals = [
        await checkout.cardNumberFrame.locator('input#number').inputValue(),
        await checkout.expiryFrame.locator('input#expiry').inputValue(),
        await checkout.cvvFrame.locator('input#verification_value').inputValue(),
        await checkout.cardNameFrame.locator('input#name').inputValue(),
      ];
      if (vals.every((v) => v !== '')) break;
      await page.waitForTimeout(2000);
    }
    await checkout.payNow.click();
    await expect(page).toHaveURL(/thank-you|orders/, { timeout: 60_000 });
    await expect(page.locator('body')).toContainText(/confirmed|thank you/i);
    await page.waitForTimeout(4000);
  });

  const pass = results.filter((r) => r.startsWith('PASS')).length;
  const fail = results.filter((r) => r.startsWith('FAIL')).length;
  await caption(page, `Walkthrough finished: ${pass} PASS, ${fail} FAIL`, '#334155');
  await page.waitForTimeout(3000);
  console.log('\n=== WALKTHROUGH RESULTS ===\n' + results.join('\n'));
});
