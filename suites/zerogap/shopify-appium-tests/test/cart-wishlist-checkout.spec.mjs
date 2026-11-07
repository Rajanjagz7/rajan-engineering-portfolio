import assert from 'node:assert/strict';
import { b, open, mainText, bodyText, ajax, clearCart, seedCart, clickByText } from './helpers.mjs';

const PRODUCT = 'andis-clipper-oil-118ml';

describe('Add to cart, wishlist and checkout (mobile)', () => {
  beforeEach(async () => {
    await open('/');
    await clearCart();
  });

  it('adds a product to the cart from the product page', async () => {
    await open(`/products/${PRODUCT}`);
    await clickByText('button', /^add to cart$/i);
    await b().waitUntil(async () => (await ajax('GET', '/cart.js')).json.item_count === 1, {
      timeout: 20000, timeoutMsg: 'cart did not contain the item after Add to cart',
    });
    await open('/cart');
    assert.match((await mainText()).toLowerCase(), /andis clipper oil/);
  });

  it('cart page shows the line price and subtotal', async () => {
    await seedCart(PRODUCT, 2);
    await open('/cart');
    const text = await mainText();
    assert.match(text, /\$\d+\.\d{2}/, 'expected a price on the cart page');
    assert.match(text.toLowerCase(), /subtotal/);
  });

  it('wishlist heart saves a product and it appears on the wishlist page', async () => {
    await b().execute(() => localStorage.removeItem('shopify-wishlist'));
    await open('/collections/prorapid');
    const saved = await b().execute(() => {
      const heart = document.querySelector('[aria-label="Add to wishlist"]');
      if (!heart) return null;
      const card = heart.closest('li, .card-wrapper, .grid__item') || document;
      const link = card.querySelector('a[href*="/products/"]');
      heart.click();
      return link ? link.pathname.split('/').pop() : '';
    });
    assert.notEqual(saved, null, 'a wishlist heart should exist on collection cards');
    await b().waitUntil(async () => !!(await b().execute(() => localStorage.getItem('shopify-wishlist'))), {
      timeout: 10000, timeoutMsg: 'wishlist was not stored',
    });
    await open('/pages/wishlist');
    const text = (await mainText()).toLowerCase();
    assert.doesNotMatch(text, /wishlist looks empty/, 'saved item should appear on the wishlist page');
  });

  it('checkout opens with contact, delivery and Pay now (no payment is made)', async () => {
    await seedCart(PRODUCT, 1);
    await open('/checkout');
    await b().waitUntil(async () => /\/checkouts\//.test(await b().getUrl()), { timeout: 45000, timeoutMsg: 'did not reach /checkouts/' });
    const email = await b().$('input[name="email"]');
    await email.waitForDisplayed({ timeout: 45000 });
    const pay = await b().execute(() => !![...document.querySelectorAll('button')].find((x) => /pay now/i.test(x.innerText || x.getAttribute('aria-label') || '')));
    assert.ok(pay, 'Pay now button should be present');
    const text = await bodyText();
    assert.match(text, /order summary|subtotal/i);
  });

  it('empty checkout form shows required-field errors and stays on checkout', async () => {
    await seedCart(PRODUCT, 1);
    await open('/checkout');
    const email = await b().$('input[name="email"]');
    await email.waitForDisplayed({ timeout: 45000 });
    await b().execute(() => {
      const btn = [...document.querySelectorAll('button')].find((x) => /pay now/i.test(x.innerText || x.getAttribute('aria-label') || ''));
      btn && btn.click();
    });
    await b().waitUntil(async () => /enter an email/i.test(await bodyText()), { timeout: 15000, timeoutMsg: 'expected "Enter an email" error' });
    assert.match(await b().getUrl(), /\/checkouts\//);
    assert.doesNotMatch(await b().getUrl(), /thank|orders/);
  });
});
