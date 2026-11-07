import assert from 'node:assert/strict';
import { b, open, mainText } from './helpers.mjs';

// Trade application: the licence upload rules, exercised on mobile Chrome.
// Nothing is submitted. Files are created in-memory and attached by script,
// because a native file picker cannot be driven in a web session.
const FORM = '/pages/trade-portal-account-form';

async function attach(name, type, bytes) {
  await b().execute(
    (n, t, size) => {
      const input = document.querySelector('input[name="licence_file"]');
      const file = new File([new Uint8Array(size).fill(65)], n, { type: t });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    name, type, bytes
  );
  await b().pause(600);
  return b().execute(() => {
    const f = document.querySelector('[data-field="licence_file"]');
    return (f ? f.innerText : '').replace(/\s+/g, ' ');
  });
}

describe('Trade application form: licence upload (mobile)', () => {
  beforeEach(async () => {
    await open(FORM);
    await b().$('input[name="licence_file"]').then((e) => e.waitForExist({ timeout: 20000 }));
  });

  it('licence file is required and accepts PDF, JPG and PNG only', async () => {
    const attrs = await b().execute(() => {
      const i = document.querySelector('input[name="licence_file"]');
      return { required: i.required, accept: i.accept, multiple: i.multiple };
    });
    assert.equal(attrs.required, true);
    assert.equal(attrs.multiple, false);
    for (const ext of ['.pdf', '.jpg', '.jpeg', '.png']) assert.ok(attrs.accept.includes(ext), `accept should include ${ext}`);
  });

  it('shows the 10 MB / PDF, JPG or PNG hint', async () => {
    assert.match(await mainText(), /PDF, JPG or PNG, up to 10 MB/i);
  });

  it('accepts a 4 MB PDF', async () => {
    const t = await attach('licence.pdf', 'application/pdf', 4 * 1024 * 1024);
    assert.match(t, /licence\.pdf/);
    assert.doesNotMatch(t, /too large|isn.t supported/i);
  });

  it('rejects a file over 10 MB', async () => {
    const t = await attach('big.pdf', 'application/pdf', 11 * 1024 * 1024);
    assert.match(t, /too large\. The maximum size is 10 MB/i);
  });

  it('rejects an unsupported type (HEIC, the iPhone photo format)', async () => {
    const t = await attach('photo.heic', 'image/heic', 50 * 1024);
    assert.match(t, /isn.t supported\. Please upload a PDF, JPG or PNG/i);
  });

  it('rejects an empty file', async () => {
    const t = await attach('empty.pdf', 'application/pdf', 0);
    assert.match(t, /appears to be empty/i);
  });

  it('submitting an empty application shows errors and does not leave the page', async () => {
    await b().execute(() => {
      const btn = document.querySelector('[data-submit]');
      btn && btn.click();
    });
    await b().pause(1500);
    assert.match(await b().getUrl(), /trade-portal-account-form/);
    const errors = await b().execute(() => document.body.innerText);
    assert.match(errors, /enter|select|attach|required/i);
  });
});
