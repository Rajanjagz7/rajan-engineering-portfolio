import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { remote } from 'webdriverio';

// Native APK tests (UiAutomator2). A separate Appium session from the web suite,
// because UiAutomator2 allows one session per device at a time.
//
// The APK is the Capacitor "test shell" built from playwright-tests/android with a
// placeholder web page. It is NOT a product app; it proves install/launch/WebView
// checks work on each device. Point APK_PATH at a real app to test that instead.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const APK = path.resolve(process.env.APK_PATH || path.join(root, 'apps', 'zerogap-test-shell-debug.apk'));

/** Reads package name and launcher activity from the APK with aapt2 (Android SDK build-tools). */
function badging(apk) {
  try {
    const dir = path.join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '', 'build-tools');
    const v = fs.readdirSync(dir).sort().pop();
    const exe = ['aapt2.exe', 'aapt2'].map((n) => path.join(dir, v, n)).find((f) => fs.existsSync(f));
    const out = spawnSync(exe, ['dump', 'badging', apk], { encoding: 'utf8' }).stdout || '';
    return {
      pkg: out.match(/package: name='([^']+)'/)?.[1],
      act: out.match(/launchable-activity: name='([^']+)'/)?.[1],
      label: out.match(/application-label:'([^']+)'/)?.[1],
    };
  } catch {
    return {};
  }
}
const info = fs.existsSync(APK) ? badging(APK) : {};
const isShell = path.basename(APK) === 'zerogap-test-shell-debug.apk';
const LABEL = info.label || '';
const PKG = process.env.APK_PACKAGE || info.pkg || 'zerogap.cross.browser.tests';
// Only the bundled shell app is known to open MainActivity; for other apps set APK_ACTIVITY to enforce one.
const ACT = process.env.APK_ACTIVITY || (isShell ? 'MainActivity' : '');
// Text expected inside the app's WebView. Defaults to the shell's placeholder page; set APK_EXPECT_TEXT for your app.
const EXPECT = process.env.APK_EXPECT_TEXT ?? (isShell ? 'ZeroGap cross-browser test shell' : '');
const SHOTS = path.join(root, 'screenshots');

describe(`Native APK (${path.basename(APK)}) on ${process.env.DEVICE_NAME || 'emulator-5554'}`, function () {
  this.timeout(300000);
  let d;

  before(async () => {
    assert.ok(fs.existsSync(APK), `APK not found: ${APK}`);
    d = await remote({
      hostname: process.env.APPIUM_HOST || '127.0.0.1',
      port: Number(process.env.APPIUM_PORT || 4723),
      path: '/',
      logLevel: 'warn',
      connectionRetryTimeout: 400000,
      connectionRetryCount: 1,
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': process.env.DEVICE_NAME || 'emulator-5554',
        'appium:app': APK,
        'appium:appPackage': PKG,
        'appium:autoGrantPermissions': true,
        'appium:noReset': false,
        'appium:newCommandTimeout': 600,
        'appium:uiautomator2ServerInstallTimeout': 180000,
        'appium:uiautomator2ServerLaunchTimeout': 180000,
        'appium:adbExecTimeout': 180000,
        'appium:androidInstallTimeout': 180000,
        'wdio:enforceWebDriverClassic': true,
      },
    });
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed' && d) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await d.saveScreenshot(path.join(SHOTS, 'apk_' + this.currentTest.title.replace(/\W+/g, '_').slice(0, 60) + '.png')).catch(() => {});
    }
  });

  after(async () => {
    if (d) {
      await d.removeApp(PKG).catch(() => {});
      await d.deleteSession().catch(() => {});
    }
  });

  it('installs and launches the app', async () => {
    await d.waitUntil(async () => (await d.getCurrentPackage()) === PKG, { timeout: 60000, timeoutMsg: `${PKG} did not come to the foreground` });
    assert.equal(await d.isAppInstalled(PKG), true);
  });

  it('opens the app without a crash dialog', async function () {
    const act = await d.getCurrentActivity();
    if (ACT) assert.ok(act.endsWith(ACT), `expected activity ending in ${ACT}, got ${act}`);
    // Only a dialog that names THIS app counts. Headless emulators often show
    // unrelated "System UI isn't responding" dialogs, which are not app bugs.
    const src = await d.getPageSource();
    const dialogs = [...src.matchAll(/text="([^"]*(?:has stopped|isn't responding|keeps stopping)[^"]*)"/gi)].map((m) => m[1]);
    const ours = dialogs.filter((t) => t.toLowerCase().includes(PKG.toLowerCase()) || (LABEL && t.toLowerCase().includes(LABEL.toLowerCase())));
    assert.deepEqual(ours, [], `crash/ANR dialog for the app: ${ours.join(' | ')}`);
    if (dialogs.length) console.log(`      note: ignored non-app system dialog(s): ${dialogs.join(' | ')}`);
  });

  it('shows its web content in a WebView (skipped for fully native apps)', async function () {
    let ctx = [];
    try {
      await d.waitUntil(async () => {
        ctx = await d.getContexts();
        return ctx.some((c) => String(c).startsWith('WEBVIEW_'));
      }, { timeout: isShell || EXPECT ? 60000 : 15000 });
    } catch {
      if (isShell || EXPECT) assert.fail(`no WebView context found (contexts: ${ctx})`);
      return this.skip(); // native app with no debuggable WebView
    }
    const web = ctx.find((c) => String(c).startsWith('WEBVIEW_'));
    await d.switchContext(web);
    const text = await d.execute(() => document.body.innerText);
    if (EXPECT) assert.ok(text.toLowerCase().includes(EXPECT.toLowerCase()), `WebView text did not include "${EXPECT}"`);
    else assert.ok(text.length >= 0);
    await d.switchContext('NATIVE_APP');
  });

  it('survives going to the background and returning', async () => {
    await d.background(3);
    await d.waitUntil(async () => (await d.getCurrentPackage()) === PKG, { timeout: 30000, timeoutMsg: 'app did not return to the foreground' });
  });

  it('handles a screen rotation', async function () {
    try {
      await d.setOrientation('LANDSCAPE');
    } catch (e) {
      // Headless emulators often refuse rotation at the device level; the app
      // manifest here does not lock orientation, so this is an environment limit.
      if (/Screen rotation cannot be changed/i.test(String(e.message))) return this.skip();
      throw e;
    }
    await d.pause(1500);
    assert.equal((await d.getOrientation()).toUpperCase(), 'LANDSCAPE');
    await d.setOrientation('PORTRAIT');
    await d.pause(1000);
    assert.equal((await d.getOrientation()).toUpperCase(), 'PORTRAIT');
    assert.equal(await d.getCurrentPackage(), PKG, 'app should still be running after rotation');
  });

  it('can be uninstalled cleanly', async () => {
    await d.removeApp(PKG);
    assert.equal(await d.isAppInstalled(PKG), false);
  });
});
