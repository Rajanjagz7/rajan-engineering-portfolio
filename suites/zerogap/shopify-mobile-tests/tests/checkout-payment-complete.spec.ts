import { test, expect } from './utils/base';
import { CheckoutPage } from './pages/CheckoutPage';
import { clearCart, seedCart } from './utils/cart';

// Completes a full purchase with a test card. Only meaningful (and only safe)
// while the store's payment gateway is in test mode; on a live gateway the
// card is simply declined and no order is created.
// Record the whole purchase flow, pass or fail.
test.use({ video: { mode: 'on', size: { width: 1366, height: 800 } } });

test.describe('Checkout - complete payment (test mode)', () => {
  test('pays with a test card and reaches the thank-you page', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await clearCart(page);
    await seedCart(page, 1);
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    await checkout.email.fill('qa.test@example.com');
    await checkout.firstName.fill('Test');
    await checkout.lastName.fill('Tester');
    await checkout.address.fill('1 Test Street');
    await checkout.city.fill('Melbourne');
    await page.locator('select[name="zone"]').first().selectOption({ label: 'Victoria' });
    await checkout.postalCode.fill('3000');

    // Shipping methods only appear once the address is complete.
    await expect(page.getByText('Enter your shipping address to view available shipping methods.')).toBeHidden({ timeout: 30_000 });

    // The shipping rate load re-renders the payment section and wipes anything
    // typed into the card iframes, so wait for it to settle before typing.
    await expect(page.getByRole('radio', { name: /Standard/ })).toBeChecked({ timeout: 30_000 });
    await expect(page.getByText('Estimated taxes')).toBeVisible();
    await page.waitForTimeout(2000);

    // Card iframes can still be re-rendered after typing, so fill, verify every
    // value, and click Pay now immediately; retry the fill if anything was wiped.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await checkout.fillCardNumber('4242 4242 4242 4242');
      await checkout.fillExpiry('12/40');
      await checkout.fillCvv('123');
      await checkout.fillCardName('Test Tester');
      const values = [
        await checkout.cardNumberFrame.locator('input#number').inputValue(),
        await checkout.expiryFrame.locator('input#expiry').inputValue(),
        await checkout.cvvFrame.locator('input#verification_value').inputValue(),
        await checkout.cardNameFrame.locator('input#name').inputValue(),
      ];
      if (values.every((v) => v !== '')) break;
      await page.waitForTimeout(2000);
    }
    await expect(checkout.payNow).toBeEnabled();
    await page.screenshot({ path: 'evidence/payment-before-submit.png', fullPage: true });

    await checkout.payNow.click();
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'evidence/payment-after-submit.png', fullPage: true });
    console.log('URL:', page.url());
    console.log((await page.locator('body').innerText()).slice(0, 1500));

    await expect(page).toHaveURL(/thank-you|orders/, { timeout: 60_000 });
    await expect(page.locator('body')).toContainText(/thank you|order .*confirmed|confirmation/i);
  });
});
