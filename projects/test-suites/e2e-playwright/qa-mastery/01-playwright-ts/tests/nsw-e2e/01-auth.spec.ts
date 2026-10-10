import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('NSW-AUTH: RebatePortal NSW Authentication & Authorization E2E', () => {
  test('NSW-AUTH-001: Successful login with valid admin credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', (process.env.APP_PASSWORD ?? ''));
    await loginPage.expectLoggedIn();
    await expect(page.locator('text=Master Admin')).toBeVisible();
  });

  test('NSW-AUTH-002: Negative login attempt with invalid password shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'WrongPassword!999');
    await loginPage.expectErrorMessage(/invalid email or password/i);
    await expect(page).toHaveURL(/.*\/log-in.*/);
  });

  test('NSW-AUTH-003: Session persistence maintains access upon page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', (process.env.APP_PASSWORD ?? ''));
    await loginPage.expectLoggedIn();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/jobs/);
    await expect(page.locator('button').filter({ hasText: 'Add Job' })).toBeVisible();
  });
});
