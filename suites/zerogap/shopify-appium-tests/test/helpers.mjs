import assert from 'node:assert/strict';
import { config } from './setup.mjs';

export const b = () => globalThis.browser;

/** Navigates to a path on the store and waits for the document to finish loading. */
export async function open(p) {
  await b().url(config.baseUrl + p);
  await b().waitUntil(async () => (await b().execute(() => document.readyState)) === 'complete', {
    timeout: 45000,
    timeoutMsg: `page ${p} did not finish loading`,
  });
  await b().pause(500);
}

/** Visible text of the whole page (lower-cased text matching is case-insensitive via regex). */
export const bodyText = () => b().execute(() => document.body.innerText);

export const mainText = () =>
  b().execute(() => (document.querySelector('#MainContent') || document.body).innerText);

/** Clicks the first element whose text matches `re`; uses JS click so animated controls never block it. */
export async function clickByText(selector, re) {
  const ok = await b().execute(
    (sel, src, flags) => {
      const rx = new RegExp(src, flags);
      const el = [...document.querySelectorAll(sel)].find((e) => rx.test((e.innerText || e.getAttribute('aria-label') || '').trim()));
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    },
    selector,
    re.source,
    re.flags
  );
  assert.ok(ok, `no element matching ${selector} with text ${re}`);
}

/** Same-origin Shopify AJAX call from inside the page, so it shares the session cookies. */
export function ajax(method, url, body) {
  return b().executeAsync(
    (m, u, data, done) => {
      fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined })
        .then((r) => r.text().then((t) => done({ status: r.status, text: t })))
        .catch((e) => done({ status: 0, text: String(e) }));
    },
    method,
    url,
    body
  ).then((r) => ({ status: r.status, json: safeJson(r.text) }));
}

const safeJson = (t) => {
  try { return JSON.parse(t); } catch { return null; }
};

export async function clearCart() {
  await ajax('POST', '/cart/clear.js', {});
}

/** Adds the first available product variant to the cart through the AJAX API. */
export async function seedCart(handle = 'andis-clipper-oil-118ml', quantity = 1) {
  const p = await ajax('GET', `/products/${handle}.js`);
  assert.equal(p.status, 200, `product ${handle} should exist`);
  const variant = p.json.variants.find((v) => v.available) || p.json.variants[0];
  const r = await ajax('POST', '/cart/add.js', { id: variant.id, quantity });
  assert.equal(r.status, 200, 'cart add should succeed');
  return { title: p.json.title, price: variant.price };
}

/**
 * Known-issue marker (same idea as test.fail() in the Playwright suite):
 * the body asserts the CORRECT behaviour. While the bug exists the body
 * throws and the test passes; once it is fixed the body passes and this
 * fails, prompting removal of the marker. Set SHOW_BUGS=1 to run unmarked.
 */
export async function knownIssue(id, reason, body) {
  if (config.showBugs) return body();
  let failed = false;
  try {
    await body();
  } catch {
    failed = true;
  }
  assert.ok(failed, `${id} no longer reproduces (${reason}). The bug looks fixed: remove the known-issue marker.`);
}
