import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';

/**
 * Shopify's checkout. Card number, expiry, CVV and name on card live in
 * cross-origin iframes, so they are reached through frameLocator.
 *
 * Safety: specs using this page never complete a payment. Every card-field
 * test leaves the contact/address fields empty, so "Pay now" is blocked by
 * client-side validation and no order or charge can be created.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly email: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly postalCode: Locator;
  readonly payNow: Locator;
  readonly cardNumberFrame: FrameLocator;
  readonly expiryFrame: FrameLocator;
  readonly cvvFrame: FrameLocator;
  readonly cardNameFrame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.locator('input[name="email"]');
    this.firstName = page.locator('input[name="firstName"]').first();
    this.lastName = page.locator('input[name="lastName"]').first();
    this.address = page.locator('input[name="address1"]').first();
    this.city = page.locator('input[name="city"]').first();
    this.postalCode = page.locator('input[name="postalCode"]').first();
    this.payNow = page.getByRole('button', { name: 'Pay now' });
    this.cardNumberFrame = page.frameLocator('iframe[title="Card number"]');
    this.expiryFrame = page.frameLocator('iframe[title="Expiration date (MM / YY)"]');
    this.cvvFrame = page.frameLocator('iframe[title="Security code"]');
    this.cardNameFrame = page.frameLocator('iframe[title="Name on card"]');
  }

  async goto() {
    await this.page.goto('/checkout');
    await expect(this.page).toHaveURL(/\/checkouts\//, { timeout: 30_000 });
    await expect(this.email).toBeVisible({ timeout: 30_000 });
    await expect(this.payNow).toBeVisible();
  }

  async fillCardNumber(value: string) {
    await this.cardNumberFrame.locator('input#number').fill(value);
  }
  async fillExpiry(value: string) {
    await this.expiryFrame.locator('input#expiry').fill(value);
  }
  async fillCvv(value: string) {
    await this.cvvFrame.locator('input#verification_value').fill(value);
  }
  async fillCardName(value: string) {
    await this.cardNameFrame.locator('input#name').fill(value);
  }

  /** Submits the (intentionally incomplete) form to trigger validation. */
  async submitIncomplete() {
    await this.payNow.click();
  }

  error(text: string | RegExp): Locator {
    return this.page.getByText(text).first();
  }
}
