import { expect, type Page } from '@playwright/test';

export class SearchPage {
  constructor(private readonly page: Page) {}

  async search(term: string) {
    await this.page.goto(`/search?q=${encodeURIComponent(term)}`);
  }

  async expectResults(term: string) {
    await expect(this.page).toHaveTitle(new RegExp(`Search:.*${term}`, 'i'));
    await expect(this.page.locator('#MainContent a[href*="/products/"]').first()).toBeVisible();
  }
}
