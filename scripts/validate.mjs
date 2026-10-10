// Repo hygiene checks used by CI. Run locally: node scripts/validate.mjs
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

let failures = 0;
const fail = (msg) => { console.error(`FAIL  ${msg}`); failures++; };
const ok = (msg) => console.log(`ok    ${msg}`);

// 1. every catalogue entry points at a real path and has the fields the site needs
const src = readFileSync('docs/js/data.js', 'utf8') + ';module.exports={projects,categoryLabels};';
const mod = { exports: {} };
new Function('module', src)(mod);
const { projects, categoryLabels } = mod.exports;
for (const p of projects) {
  if (!existsSync(p.path)) fail(`catalogue path missing: ${p.path}`);
  if (!categoryLabels[p.category]) fail(`unknown category "${p.category}" for ${p.title}`);
  if (!p.description || !p.tech?.length) fail(`incomplete catalogue entry: ${p.title}`);
}
ok(`${projects.length} catalogue entries checked`);

// 2. relative links in the root README resolve
const readme = readFileSync('README.md', 'utf8');
const links = [...readme.matchAll(/\]\((projects\/[^)#\s]+|docs[^)#\s]*|LICENSE)\)/g)].map((m) => m[1]);
for (const l of links) if (!existsSync(l)) fail(`README link broken: ${l}`);
ok(`${links.length} README links checked`);

// 3. nothing that should never be committed is tracked
const tracked = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
const banned = /(^|\/)(node_modules|\.venv|__pycache__|\.vercel|\.git-backup|\.env)(\/|$)|(^|\/)(auth|storageState)\.json$|\.(exe|har|zip)$/;
for (const f of tracked) if (banned.test(f)) fail(`should not be tracked: ${f}`);
ok(`${tracked.length} tracked files scanned for banned paths`);

// 4. no credentials in tracked text files
const secret = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|sk-ant-[A-Za-z0-9_-]{20,}|xox[bp]-[A-Za-z0-9-]{20,}/;
for (const f of tracked) {
  if (/\.(png|jpe?g|gif|ico|pdf|woff2?|lock)$|package-lock\.json$/.test(f)) continue;
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  if (text.length < 5_000_000 && secret.test(text)) fail(`possible credential in ${f}`);
}
ok('credential scan complete');

if (failures) { console.error(`\n${failures} problem(s) found`); process.exit(1); }
console.log('\nAll checks passed');
