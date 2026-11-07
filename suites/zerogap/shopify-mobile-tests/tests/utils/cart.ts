import type { APIResponse, Page } from '@playwright/test';

export const PRODUCT_HANDLE = 'andis-clipper-oil-118ml';
export const PRODUCT_TITLE = 'Andis Clipper Oil 118ml';
export const VARIANT_ID = 45211104084037;
/** Unit price in cents (AUD $9.05). */
export const UNIT_PRICE_CENTS = 905;

export interface CartState {
  item_count: number;
  total_price: number;
  items: { variant_id: number; quantity: number; line_price: number }[];
}

/** Formats cents as the storefront does for AUD, e.g. 1810 -> "$18.10". */
export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The live store rate-limits bursts of cart/checkout calls with HTTP 429, so
 * every AJAX call goes through this wrapper, which backs off and retries.
 */
export async function cartRequest(
  page: Page,
  method: 'GET' | 'POST',
  path: string,
  data?: Record<string, unknown>
): Promise<APIResponse> {
  let res: APIResponse | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    res = method === 'GET' ? await page.request.get(path) : await page.request.post(path, { data });
    if (res.status() !== 429) return res;
    await page.waitForTimeout(2000 * (attempt + 1));
  }
  return res!;
}

/** Reads the live cart via the storefront AJAX API (shares the page's cookies). */
export async function getCart(page: Page): Promise<CartState> {
  const res = await cartRequest(page, 'GET', '/cart.js');
  if (!res.ok()) throw new Error(`getCart failed: ${res.status()}`);
  return res.json();
}

export async function clearCart(page: Page) {
  await cartRequest(page, 'POST', '/cart/clear.js', {});
}

/** Seeds the cart through the AJAX API so tests do not depend on the UI add flow. */
export async function seedCart(page: Page, quantity = 1) {
  const res = await cartRequest(page, 'POST', '/cart/add.js', { id: VARIANT_ID, quantity });
  if (!res.ok()) throw new Error(`seedCart failed: ${res.status()}`);
}
