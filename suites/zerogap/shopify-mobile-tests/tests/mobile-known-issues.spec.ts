import { test, expect } from './utils/base';

// ZG-044 (mobile only, file prefix "mobile-"). Marked test.fail() while the
// bug exists; set SHOW_BUGS=1 to see the real failure.
test.describe('Mobile known issues', () => {
  test('ZG-044: breadcrumb links are at least 24x24 CSS px', async ({ page }) => {
    if (!process.env.SHOW_BUGS) test.fail(true, 'ZG-044: breadcrumb links are under 24px tall');
    await page.goto('/collections/prorapid');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('#MainContent nav a, #MainContent [class*="breadcrumb"] a')]
        .filter((e) => (e as HTMLElement).offsetWidth)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { t: (e.textContent ?? '').trim(), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((b) => b.w < 24 || b.h < 24)
    );
    expect(small, JSON.stringify(small)).toEqual([]);
  });
});
