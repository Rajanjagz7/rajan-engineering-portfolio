import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { remote } from 'webdriverio';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/** Reads KEY=VALUE pairs from a .env file without logging values. */
function readEnv(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, 'utf8').split(/\r?\n/)
        .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')])
    );
  } catch {
    return {};
  }
}

const local = readEnv(path.join(root, '.env'));
const sibling = readEnv(path.join(root, '..', 'shopify-mobile-tests', '.env'));
const get = (k, d) => process.env[k] || local[k] || sibling[k] || d;

export const config = {
  baseUrl: get('BASE_URL', 'https://bcppqf-4m.myshopify.com'),
  password: get('STORE_PASSWORD', ''),
  host: get('APPIUM_HOST', '127.0.0.1'),
  port: Number(get('APPIUM_PORT', '4723')),
  deviceName: get('DEVICE_NAME', 'emulator-5554'),
  androidVersion: get('ANDROID_VERSION', ''),
  deviceClass: get('DEVICE_CLASS', 'phone'),
  showBugs: !!process.env.SHOW_BUGS,
};

const SHOTS = path.join(root, 'screenshots');

/** One Chrome session for the whole run; the password gate is unlocked once. */
export const mochaHooks = {
  async beforeAll() {
    this.timeout(240000);
    if (!config.password) throw new Error('STORE_PASSWORD is not set (see .env.example).');
    globalThis.browser = await remote({
      hostname: config.host,
      port: config.port,
      path: '/',
      logLevel: 'warn',
      connectionRetryTimeout: 400000, // slow emulators can take minutes to create a session
      connectionRetryCount: 1,
      capabilities: {
        platformName: 'Android',
        browserName: 'Chrome',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': config.deviceName,
        ...(config.androidVersion ? { 'appium:platformVersion': config.androidVersion } : {}),
        'wdio:enforceWebDriverClassic': true,
        'appium:newCommandTimeout': 600,
        // Large-screen emulators with software graphics are slow to install/launch the helper app.
        'appium:uiautomator2ServerInstallTimeout': 180000,
        'appium:uiautomator2ServerLaunchTimeout': 180000,
        'appium:adbExecTimeout': 180000,
        'appium:androidInstallTimeout': 180000,
        'appium:autoGrantPermissions': true,
        'goog:chromeOptions': { args: ['--no-first-run', '--disable-fre', '--no-default-browser-check'] },
      },
    });
    await globalThis.browser.setTimeout({ pageLoad: 60000, script: 30000, implicit: 0 });
    const b = globalThis.browser;
    await b.url(config.baseUrl + '/');
    if ((await b.getUrl()).includes('/password')) {
      await b.execute(() => {
        const btn = [...document.querySelectorAll('button,summary')].find((e) => /enter using password/i.test(e.textContent));
        if (btn) btn.click();
      });
      const input = await b.$('input[type="password"]');
      await input.waitForDisplayed({ timeout: 10000 });
      await input.setValue(config.password);
      await b.keys('Enter');
      await b.waitUntil(async () => !(await b.getUrl()).includes('/password'), { timeout: 20000, timeoutMsg: 'password gate did not unlock' });
    }
  },

  async afterEach() {
    if (this.currentTest?.state === 'failed' && globalThis.browser) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const name = this.currentTest.fullTitle().replace(/[^a-z0-9]+/gi, '_').slice(0, 90);
      await globalThis.browser.saveScreenshot(path.join(SHOTS, name + '.png')).catch(() => {});
    }
  },

  async afterAll() {
    if (globalThis.browser) await globalThis.browser.deleteSession().catch(() => {});
  },
};
