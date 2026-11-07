import { expect, type Locator, type Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly addToCartButton: Locator;
  readonly increaseQty: Locator;
  readonly decreaseQty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.getByRole('button', { name: /^add to cart$/i }).first();
    this.increaseQty = page.getByRole('button', { name: /increase quantity/i }).first();
    this.decreaseQty = page.getByRole('button', { name: /decrease quantity/i }).first();
  }

  async goto(handle: string) {
    await this.page.goto(`/products/${handle}`);
    await expect(this.addToCartButton).toBeVisible();
  }

  async addToCart() {
    // Shopify's cart add is an XHR to /cart/add; wait for it so the next
    // assertion does not race the cart state.
    const added = this.page.waitForResponse((r) => r.url().includes('/cart/add') && r.ok());
    await this.addToCartButton.click();
    await added;
  }
}
