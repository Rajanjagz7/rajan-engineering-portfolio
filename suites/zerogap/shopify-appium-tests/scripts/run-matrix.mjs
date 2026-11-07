// Runs the Appium suite on every emulator in the device matrix, one at a time
// (this machine has ~16 GB RAM, so a single emulator at a time keeps runs stable).
//
//   node scripts/run-matrix.mjs                 # all devices
//   node scripts/run-matrix.mjs pixel_4a_api30  # just one, by AVD name
//   SPEC=test/smoke.spec.mjs node scripts/run-matrix.mjs   # limit the specs
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk) throw new Error('ANDROID_HOME is not set');
const adb = path.join(sdk, 'platform-tools', 'adb.exe');
const emulatorBin = path.join(sdk, 'emulator', 'emulator.exe');
const PORT = 5554;
const serial = `emulator-${PORT}`;

export const MATRIX = [
  { avd: 'stc_test', label: 'Pixel 6 / Android 14 (phone, mainstream)', android: '14', cls: 'phone' },
  { avd: 'pixel_4a_api30', label: 'Pixel 4a / Android 11 (small phone, older OS)', android: '11', cls: 'phone' },
  { avd: 'pixel_7_api35', label: 'Pixel 7 / Android 15 (newest OS)', android: '15', cls: 'phone' },
  { avd: 'pixel_7_api36', label: 'Pixel 7 / Android 16 (latest OS)', android: '16', cls: 'phone' },
  { avd: 'pixel_tablet_api34', label: 'Pixel Tablet / Android 14 (tablet)', android: '14', cls: 'tablet' },
];

const SUITE = process.env.SUITE || 'all';
const only = process.argv.slice(2);
const targets = MATRIX.filter((d) => !only.length || only.includes(d.avd));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });

async function appiumUp() {
  try {
    return (await fetch('http://127.0.0.1:4723/status')).ok;
  } catch {
    return false;
  }
}

async function ensureAppium() {
  if (await appiumUp()) return null;
  console.log('Starting Appium server...');
  const child = spawn('appium', ['--port', '4723', '--allow-insecure', 'uiautomator2:chromedriver_autodownload'], {
    shell: true, stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 30; i++) {
    if (await appiumUp()) return child;
    await sleep(1000);
  }
  throw new Error('Appium did not start');
}

async function bootEmulator(avd) {
  run(adb, ['start-server']);
  const child = spawn(emulatorBin, ['-avd', avd, '-port', String(PORT), '-no-window', '-no-audio', '-no-boot-anim', '-no-snapshot', '-gpu', 'swiftshader_indirect', '-memory', String(process.env.EMU_MEMORY || 3072)], {
    stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 90; i++) {
    await sleep(5000);
    const r = run(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']);
    if (r.stdout && r.stdout.trim() === '1') {
      // boot_completed can flip before system services are usable; wait until
      // the settings service and package manager answer.
      for (let j = 0; j < 40; j++) {
        const st = run(adb, ['-s', serial, 'shell', 'settings', 'get', 'global', 'device_provisioned']);
        const pm = run(adb, ['-s', serial, 'shell', 'pm', 'path', 'android']);
        if (st.stdout && /^\d/.test(st.stdout.trim()) && pm.stdout && pm.stdout.includes('package:')) {
          await sleep(5000);
          return child;
        }
        await sleep(3000);
      }
    }
  }
  child.kill();
  throw new Error(`${avd} did not finish booting in 7.5 minutes`);
}

async function stopEmulator(child) {
  run(adb, ['-s', serial, 'emu', 'kill']);
  await sleep(6000);
  try { child.kill(); } catch { /* already gone */ }
}

function mocha(device, kind = 'web') {
  const out = path.join(root, 'reports', `${device.avd}${kind === 'apk' ? '-apk' : ''}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const config = kind === 'apk' ? '.mocharc.apk.json' : '.mocharc.json';
  const args = ['mocha', '--config', config, '--reporter', 'json', '--reporter-option', `output=${out}`];
  if (kind === 'web' && process.env.SPEC) args.push(process.env.SPEC);
  const r = spawnSync('npx', args, {
    cwd: root, shell: true, stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, DEVICE_NAME: serial, ANDROID_VERSION: device.android, DEVICE_CLASS: device.cls },
  });
  let stats = null;
  try { stats = JSON.parse(fs.readFileSync(out, 'utf8')).stats; } catch { /* no report written */ }
  return { code: r.status, stats, out };
}

const appium = await ensureAppium();
const results = [];
for (const d of targets) {
  console.log(`\n=== ${d.label} [${d.avd}]`);
  let emu = null;
  try {
    emu = await bootEmulator(d.avd);
    const row = { ...d, web: null, apk: null, note: '' };
    if (SUITE === 'all' || SUITE === 'web') {
      const s = mocha(d, 'web').stats;
      row.web = s ? { p: s.passes, f: s.failures, t: Math.round(s.duration / 1000) } : { p: 0, f: -1, t: 0 };
      console.log(`  web: ${row.web.f < 0 ? 'no report' : `${row.web.p} passed, ${row.web.f} failed (${row.web.t}s)`}`);
    }
    if (SUITE === 'all' || SUITE === 'apk') {
      const s = mocha(d, 'apk').stats;
      row.apk = s ? { p: s.passes, f: s.failures, t: Math.round(s.duration / 1000) } : { p: 0, f: -1, t: 0 };
      console.log(`  apk: ${row.apk.f < 0 ? 'no report' : `${row.apk.p} passed, ${row.apk.f} failed (${row.apk.t}s)`}`);
    }
    results.push(row);
  } catch (e) {
    console.log('  ERROR: ' + e.message);
    results.push({ ...d, web: null, apk: null, note: e.message });
  } finally {
    if (emu) await stopEmulator(emu);
  }
}

const cell = (x) => (x ? (x.f < 0 ? 'no report' : `${x.p} pass / ${x.f} fail`) : '-');
const lines = [
  '| Device | AVD | Android | Web suite | APK suite |',
  '|---|---|---|---|---|',
  ...results.map((r) => `| ${r.label} | ${r.avd} | ${r.android} | ${r.note ? 'ERROR: ' + r.note : cell(r.web)} | ${r.note ? '' : cell(r.apk)} |`),
];
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'matrix-summary.md'), lines.join('\n') + '\n');
console.log('\n' + lines.join('\n'));
if (appium) appium.kill();
const bad = (x) => x && x.f !== 0;
process.exit(results.some((r) => r.note || bad(r.web) || bad(r.apk)) ? 1 : 0);
