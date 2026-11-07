import assert from 'node:assert/strict';
import { b, open, bodyText, mainText, clickByText } from './helpers.mjs';
import { config } from './setup.mjs';

describe('Mobile storefront smoke (Chrome on Android via Appium)', () => {
  it('runs at the expected viewport size for the device class', async () => {
    await open('/');
    const w = await b().execute(() => window.innerWidth);
    if (config.deviceClass === 'tablet') assert.ok(w > 700, `expected a tablet viewport, got ${w}px`);
    else assert.ok(w <= 500, `expected a phone viewport, got ${w}px`);
  });

  it('home page loads with the store title and products', async () => {
    await open('/');
    assert.match(await b().getTitle(), /zerogap/i);
    const links = await b().execute(() => document.querySelectorAll('a[href*="/products/"]').length);
    assert.ok(links > 0, 'expected product links on the home page');
  });

  it('home page has no horizontal scroll', async () => {
    await open('/');
    const overflow = await b().execute(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `page overflows horizontally by ${overflow}px`);
  });

  it('burger menu opens and lists the categories', async function () {
    await open('/');
    const hasBurger = await b().execute(() => { const e = document.querySelector('summary[aria-label="Menu"]'); return !!(e && e.offsetWidth); });
    if (!hasBurger && config.deviceClass === 'tablet') return this.skip(); // tablet shows the full header menu
    // A real tap (not a scripted click) so the drawer's slide-in animation runs.
    const burger = await b().$('summary[aria-label="Menu"]');
    await burger.waitForDisplayed({ timeout: 10000 });
    await burger.click();
    await b().waitUntil(
      async () =>
        b().execute(() => {
          const m = document.querySelector('#menu-drawer');
          if (!m) return false;
          const r = m.getBoundingClientRect();
          return r.x > -5 && [...m.querySelectorAll('a')].some((a) => a.offsetWidth && a.innerText.trim());
        }),
      { timeout: 15000, timeoutMsg: 'menu drawer did not slide into view' }
    );
    const text = (await b().execute(() => document.querySelector('#menu-drawer').innerText)).toLowerCase();
    for (const label of ['hair products', 'barber essentials']) assert.ok(text.includes(label), `menu should list "${label}"`);
  });

  it('collection page lists products and opens the filter drawer', async () => {
    await open('/collections/prorapid');
    const cards = await b().execute(() => new Set([...document.querySelectorAll('#MainContent a[href*="/products/"]')].map((a) => a.pathname.split('/').pop())).size);
    assert.ok(cards >= 5, `expected products in the collection, got ${cards}`);
    await clickByText('button,summary', /filter and sort/i);
    await b().waitUntil(async () => /product type/i.test(await bodyText()), { timeout: 10000, timeoutMsg: 'filter drawer did not show Product type' });
  });

  it('search returns results for "wax"', async () => {
    await open('/search?q=wax');
    assert.match(await mainText(), /\d+ results? found for "wax"/i);
  });

  it('search with no match shows 0 results', async () => {
    await open('/search?q=xyzzy123');
    assert.match(await mainText(), /0 results found/i);
  });

  it('policy pages load', async () => {
    for (const p of ['/pages/faq', '/pages/shipping-policy', '/pages/returns-policy', '/pages/warranty']) {
      await open(p);
      const t = await mainText();
      assert.ok(t.length > 80, `${p} should have content`);
      assert.doesNotMatch(t, /page not found/i, `${p} should not 404`);
    }
  });
});
