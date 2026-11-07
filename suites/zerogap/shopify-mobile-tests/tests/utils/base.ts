import { test as base, expect } from '@playwright/test';

/**
 * Shared test with a small automatic pause before every test. The live store
 * answers bursts of cart/checkout/search calls with HTTP 429, so pacing the
 * suite keeps results about the app instead of about rate limiting.
 */
export const test = base.extend<{ _throttle: void }>({
  _throttle: [
    async ({}, use) => {
      await new Promise((r) => setTimeout(r, 1500));
      await use();
    },
    { auto: true },
  ],
});

export { expect };
