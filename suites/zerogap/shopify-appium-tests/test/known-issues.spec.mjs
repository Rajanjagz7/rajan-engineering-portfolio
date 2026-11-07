import assert from 'node:assert/strict';
import { b, open, mainText, knownIssue } from './helpers.mjs';

// Bugs from BUGS.csv that reproduce on mobile Chrome. Each body asserts the
// CORRECT behaviour; see knownIssue() in helpers.mjs. SHOW_BUGS=1 runs them
// unmarked so the real failures are visible.
describe('Known issues on mobile (IDs refer to BUGS.csv)', () => {
  it('ZG-045: trade portal hero text is not broken', async () => {
    await knownIssue('ZG-045', 'hero reads YOURGROOMING / PROFESSIONAL GROOMIN', async () => {
      await open('/pages/trade-portal');
      const t = await b().execute(() => document.body.innerText);
      assert.doesNotMatch(t, /YOURGROOMING/i);
      assert.doesNotMatch(t, /PROFESSIONAL GROOMIN(?!G)/i);
    });
  });

  it('ZG-046: application heading has a space ("FOR A TRADE ACCOUNT")', async () => {
    await knownIssue('ZG-046', 'heading reads FORA', async () => {
      await open('/pages/trade-portal-account-form');
      assert.match(await mainText(), /APPLY FOR A TRADE ACCOUNT/i);
    });
  });

  it('ZG-050: footer links use one letter case', async () => {
    await knownIssue('ZG-050', 'Useful links are all caps, others title case', async () => {
      await open('/');
      const cases = await b().execute(() =>
        [...document.querySelectorAll('footer a')]
          .map((a) => a.textContent.trim())
          .filter((t) => t.length > 3 && /[A-Za-z]{4}/.test(t) && !/^(TW|FB|IN)$/.test(t))
          .map((t) => (t === t.toUpperCase() ? 'upper' : 'mixed'))
      );
      assert.equal(new Set(cases).size, 1, `footer links mix cases: ${[...new Set(cases)]}`);
    });
  });

  it('ZG-049: the B2B catalogue is reachable from the Trade portal page', async () => {
    await knownIssue('ZG-049', 'no page links to /pages/b2b-catalog-product-list', async () => {
      await open('/pages/trade-portal');
      const linked = await b().execute(() => !![...document.querySelectorAll('a[href]')].find((a) => a.href.includes('b2b-catalog')));
      assert.ok(linked, 'expected a link to the B2B catalogue');
    });
  });

  it('ZG-008 (not reproducing since 2026-10-12): empty checkout submit shows no generic problem banner', async () => {
    // Seen on 2026-10-10 with Request IDs; absent in 3 consecutive runs on 2026-10-12.
    // Kept as a regression test: if the banner returns, this fails.
    const { seedCart, clearCart } = await import('./helpers.mjs');
    await open('/');
    await clearCart();
    await seedCart('andis-clipper-oil-118ml', 1);
    await open('/checkout');
    const email = await b().$('input[name="email"]');
    await email.waitForDisplayed({ timeout: 45000 });
    await b().execute(() => {
      const btn = [...document.querySelectorAll('button')].find((x) => /pay now/i.test(x.innerText || x.getAttribute('aria-label') || ''));
      btn && btn.click();
    });
    await b().waitUntil(async () => /enter an email/i.test(await b().execute(() => document.body.innerText)), { timeout: 20000 });
    await b().pause(8000); // the banner, when present, arrives a few seconds after the field errors
    const t = await b().execute(() => document.body.innerText);
    assert.doesNotMatch(t, /there was a problem with our checkout/i);
  });

  it('ZG-029: Brand filter count matches the collection size', async () => {
    await knownIssue('ZG-029', 'Brand shows ProRapid (2) on a 22-product collection', async () => {
      await open('/collections/prorapid');
      const t = await b().execute(() => document.body.innerText);
      const total = Number(t.match(/(\d+)\s+products/i)?.[1]);
      const brand = Number(t.match(/ProRapid\s*\((\d+)\)/i)?.[1]);
      assert.ok(total > 0);
      assert.equal(brand, total);
    });
  });
});
