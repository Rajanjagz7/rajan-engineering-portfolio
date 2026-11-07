import { test, expect } from './utils/base';
import { CheckoutPage } from './pages/CheckoutPage';
import { UNIT_PRICE_CENTS, clearCart, money, seedCart } from './utils/cart';

// Checkout & payment: positive, negative and boundary validation.
//
// SAFETY: this suite NEVER completes a purchase. Contact and address fields
// are left empty in every test that touches a card field, so "Pay now" is
// blocked client-side and no order or charge can be created. The card numbers
// used are well-known public test numbers and are only ever typed, never
// submitted with a complete form.
test.describe('Checkout & payment', () => {
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedCart(page, 1);
    checkout = new CheckoutPage(page);
    await checkout.goto();
  });

  test.describe('page content (positive)', () => {
    test('shows contact, delivery and payment sections with Pay now', async ({ page }) => {
      await expect(checkout.email).toBeVisible();
      await expect(checkout.firstName).toBeVisible();
      await expect(checkout.address).toBeVisible();
      await expect(page.locator('iframe[title="Card number"]')).toBeVisible();
      await expect(page.locator('iframe[title="Expiration date (MM / YY)"]')).toBeVisible();
      await expect(page.locator('iframe[title="Security code"]')).toBeVisible();
      await expect(page.locator('iframe[title="Name on card"]')).toBeVisible();
      await expect(checkout.payNow).toBeEnabled();
    });

    test('offers express payment methods (PayPal, Google Pay)', async ({ page }) => {
      await expect(page.locator('iframe[title="Pay with PayPal"]')).toBeAttached();
      await expect(page.locator('iframe[title="Pay with Google Pay"]')).toBeAttached();
    });

    test('order summary shows the item subtotal', async ({ page }) => {
      await expect(page.locator('body')).toContainText(money(UNIT_PRICE_CENTS));
    });
  });

  test.describe('required fields (negative)', () => {
    test('submitting an empty form lists every required-field error and stays on checkout', async ({ page }) => {
      await checkout.submitIncomplete();
      for (const msg of [
        'Enter an email',
        'Enter a first name',
        'Enter a last name',
        'Enter an address',
        'Enter a city',
        'Enter a ZIP / postal code',
        'Enter a card number',
        'Enter a valid expiration date',
        'Enter the CVV or security code on your card',
        /Enter your name exactly as it.s written on your card/,
      ]) {
        await expect(checkout.error(msg)).toBeVisible();
      }
      await expect(page).toHaveURL(/\/checkouts\//);
      await expect(page).not.toHaveURL(/thank-you|orders/);
    });
  });

  test.describe('email', () => {
    for (const bad of ['plainaddress', 'missing-at.example.com', 'a@', '@example.com', 'two words@example.com']) {
      test(`negative: invalid email "${bad}" is rejected`, async () => {
        // KNOWN ISSUE ZG-015: the checkout accepts a space inside the address.
        test.fail(bad === 'two words@example.com', 'ZG-015: email with a space is not rejected');
        await checkout.email.fill(bad);
        await checkout.submitIncomplete();
        await expect(checkout.error('Enter a valid email')).toBeVisible();
      });
    }

    test('boundary: shortest valid email (a@b.co) is accepted', async () => {
      await checkout.email.fill('a@b.co');
      await checkout.submitIncomplete();
      await expect(checkout.error('Enter a valid email')).toHaveCount(0);
      await expect(checkout.error('Enter an email')).toHaveCount(0);
    });
  });

  test.describe('card number', () => {
    // Luhn-invalid and wrong-length numbers: the card field must flag them.
    for (const [label, value] of [
      ['fails the Luhn check', '1234 1234 1234 1234'],
      ['too short (12 digits)', '4242 4242 4242'],
      ['letters only', 'abcd efgh ijkl mnop'],
    ] as const) {
      test(`negative: card number ${label}`, async () => {
        await checkout.fillCardNumber(value);
        await checkout.submitIncomplete();
        const invalid = checkout.error(/Enter a (valid )?card number/);
        await expect(invalid).toBeVisible();
      });
    }

    test('positive: a valid-format test card number clears the card number error', async () => {
      await checkout.fillCardNumber('4242 4242 4242 4242'); // public Stripe/Visa test PAN
      await checkout.submitIncomplete();
      await expect(checkout.error(/Enter a (valid )?card number/)).toHaveCount(0);
    });

    test('boundary: input beyond the maximum card length is truncated', async ({ page }) => {
      await checkout.fillCardNumber('42424242424242424242424242');
      const typed = await checkout.cardNumberFrame.locator('input#number').inputValue();
      expect(typed.replace(/\s/g, '').length).toBeLessThanOrEqual(19);
      await expect(page).toHaveURL(/\/checkouts\//);
    });
  });

  test.describe('expiry date', () => {
    for (const [label, value] of [
      ['month 13', '13/40'],
      ['month 00', '00/40'],
      ['a past date', '01/20'],
    ] as const) {
      test(`negative: expiry ${label} (${value}) is rejected`, async () => {
        await checkout.fillExpiry(value);
        await checkout.submitIncomplete();
        await expect(checkout.error('Enter a valid expiration date')).toBeVisible();
      });
    }

    test('positive: a future expiry (12/40) clears the expiry error', async () => {
      await checkout.fillExpiry('12/40');
      await checkout.submitIncomplete();
      await expect(checkout.error('Enter a valid expiration date')).toHaveCount(0);
    });
  });

  test.describe('security code (CVV)', () => {
    for (const value of ['1', '12']) {
      test(`boundary: ${value.length}-digit CVV is rejected`, async () => {
        await checkout.fillCvv(value);
        await checkout.submitIncomplete();
        await expect(checkout.error('Enter the CVV or security code on your card')).toBeVisible();
      });
    }

    test('boundary: 3-digit CVV is accepted', async () => {
      await checkout.fillCvv('123');
      await checkout.submitIncomplete();
      await expect(checkout.error('Enter the CVV or security code on your card')).toHaveCount(0);
    });
  });

  test.describe('name on card', () => {
    test('negative: empty name is rejected', async () => {
      await checkout.submitIncomplete();
      await expect(checkout.error(/Enter your name exactly as it.s written on your card/)).toBeVisible();
    });

    test('positive: a name clears the name error', async () => {
      await checkout.fillCardName('Test Tester');
      await checkout.submitIncomplete();
      await expect(checkout.error(/Enter your name exactly as it.s written on your card/)).toHaveCount(0);
    });
  });

  test.describe('discount code', () => {
    test('negative: an unknown discount code is rejected', async ({ page }) => {
      // The toggle animates, so a normal click never reports "stable"; dispatch it directly.
      await page.getByRole('button', { name: 'Add discount' }).dispatchEvent('click').catch(() => undefined);
      await page.locator('input[name="reductions"]').first().fill('NOTACODE-123');
      await page.getByRole('button', { name: 'Apply' }).first().click();
      await expect(checkout.error('Enter a valid discount code')).toBeVisible();
    });
  });

  test('negative: visiting checkout with an empty cart does not open a payment form', async ({ page }) => {
    await clearCart(page);
    await page.goto('/checkout');
    await expect(page).not.toHaveURL(/\/checkouts\/.*\/(thank|order)/);
    await expect(page.locator('iframe[title="Card number"]')).toHaveCount(0);
  });
});
