# ZeroGap storefront: Appium mobile tests

Mobile web tests for https://bcppqf-4m.myshopify.com, driven by **Appium 3 + UiAutomator2**
against **Chrome on an Android emulator or real device**, written with WebdriverIO and Mocha.

They complement the Playwright suite in `../shopify-mobile-tests` (which emulates a phone in a
desktop browser). These run in the real mobile Chrome on Android.

## Prerequisites (already present on this machine)
- Node 20+, Java 17+, Android SDK (`ANDROID_HOME`), Appium 3 with the `uiautomator2` driver
- An AVD (`stc_test`, Android 14, Google APIs) or a USB device with USB debugging on
- `STORE_PASSWORD` in `.env` (see `.env.example`). It falls back to `../shopify-mobile-tests/.env`

## Run
```bash
# 1. emulator (headless)
"$ANDROID_HOME/emulator/emulator.exe" -avd stc_test -no-window -no-audio -no-snapshot -gpu swiftshader_indirect

# 2. Appium server (Appium 3 needs the driver-scoped insecure feature for chromedriver download)
npm run appium

# 3. tests
npm install
npm test                 # everything
npm run test:smoke       # smoke only
npm run test:known       # known-issue tests with real failures shown (SHOW_BUGS=1)
```
Failure screenshots are saved to `screenshots/`.

## What is covered
| File | Covers |
|---|---|
| `test/smoke.spec.mjs` | phone viewport, home, no horizontal scroll, burger menu, collection + filter drawer, search (hit and miss), policy pages |
| `test/cart-wishlist-checkout.spec.mjs` | add to cart, cart totals, wishlist save, checkout opens, empty-form validation |
| `test/trade-form.spec.mjs` | trade application licence upload: required, types, 10 MB limit, HEIC, empty file |
| `test/known-issues.spec.mjs` | bugs from `BUGS.csv` that reproduce on mobile (ZG-029, 045, 046, 049, 050) plus a ZG-008 regression test |

## Conventions
- **Safety:** nothing completes an order or submits a trade application. Checkout tests only reach
  validation errors; licence tests attach in-memory files by script and never press submit.
- **Known issues:** `knownIssue()` in `test/helpers.mjs` expects the correct behaviour to fail while the
  bug exists, and fails when the bug is fixed (so the marker gets removed). `SHOW_BUGS=1` runs unmarked.
- **One session:** a single Chrome session is shared by the run and the password gate is unlocked once.
- **Classic WebDriver:** `wdio:enforceWebDriverClassic` is set because UiAutomator2 does not implement BiDi.
- **Rate limits:** the live store returns 429 on bursts, so keep one worker (Mocha runs serially).
- **Burger menu:** use a real tap; the drawer's slide-in animation does not run on a scripted click.
