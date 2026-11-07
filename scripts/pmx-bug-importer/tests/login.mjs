// Saves your PMX session so the importer can run without logging in again.
// YOU sign in, in the window that opens; this script never reads, types or stores a password,
// it only saves the resulting session to test-data/auth.json (git-ignored).
//   npm run login
import { chromium } from '@playwright/test';
try { process.loadEnvFile('.env'); } catch { /* optional */ }

const base = process.env.PMX_URL;
if (!base) throw new Error('Set PMX_URL in .env (e.g. https://pmx.yourcompany.com)');
const authFile = process.env.PMX_AUTH || 'test-data/auth.json';

const browser = await chromium.launch({ headless: false, channel: 'chrome' });
const page = await (await browser.newContext()).newPage();
await page.goto(base + '/login');
console.log(`Sign in to ${base} in the browser window (waiting up to 10 minutes)...`);
await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 10 * 60 * 1000 });
await page.waitForLoadState('networkidle');
await page.context().storageState({ path: authFile });
console.log(`Saved session to ${authFile} (landed on ${page.url()})`);
await browser.close();
