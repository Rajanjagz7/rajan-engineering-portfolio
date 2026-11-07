// Adds one PMX bug per row of a bug sheet (.xlsx or .csv).
// Sheet columns (header names must match): Title, Assignee, Priority, Section, Sprint, Description,
// plus optional "Video Link" and "Screenshot" holding local file paths separated by "; " to attach.
//
// Settings (in .env, see .env.example):
//   PMX_URL         site, e.g. https://pmx.yourcompany.com
//   PMX_BOARD_PATH  board to add to, e.g. /dashboard/projects/<id>/board?taskTab=development
//   PMX_BUGS_FILE   path to the sheet
//   PMX_SHEET       worksheet name (default: first sheet; a .csv has one sheet called "Sheet1")
//   PMX_ASSIGNEE    assign every bug to this person (full name) instead of the sheet's Assignee column
//   PMX_SECTION     put every bug in this section/status (e.g. Done) instead of the sheet's Section column
//   PMX_LIMIT       only process the first N rows
//   PMX_ONLY        only process rows whose title contains this text (several: "text one||text two")
//   PMX_TIMEOUT     per-bug timeout in ms (default 420000; video uploads can be slow)
//
// Re-runnable: a bug whose title already exists on the board is updated, not duplicated.
const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

for (const name of ['PMX_URL', 'PMX_BOARD_PATH', 'PMX_BUGS_FILE']) {
  if (!process.env[name]) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
}
const BOARD = process.env.PMX_BOARD_PATH;
const LIMIT = Number(process.env.PMX_LIMIT) || Infinity;
const ONLY = process.env.PMX_ONLY;

function readBugs() {
  const wb = XLSX.readFile(path.resolve(process.env.PMX_BUGS_FILE));
  const sheet = process.env.PMX_SHEET || wb.SheetNames[0];
  if (!wb.Sheets[sheet]) throw new Error(`Sheet "${sheet}" not found. Available: ${wb.SheetNames.join(', ')}`);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '', raw: false });
  return rows
    .map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).trim()])))
    .filter(r => r.Title && (!ONLY || ONLY.split('||').some(t => r.Title.includes(t))))
    .slice(0, LIMIT);
}

const bugs = readBugs();

async function openBoard(page) {
  await page.goto(BOARD);
  await expect(page.getByRole('button', { name: /^Add$/ })).toBeVisible();
  await page.locator('[class*=statusSelector_sectionTrigger]').first().waitFor();
}

// Returns once the panel for `title` is open, creating the bug through Add > Bug when it is not on the board yet.
async function openOrCreateBug(page, title) {
  // Columns load lazily (To Do, Done...), so an existing bug may be below the fold or off to the side: scroll the
  // board sideways and each column down before deciding it is missing, otherwise a rerun would create a duplicate.
  for (let i = 0; i < 9 && !(await page.getByText(title, { exact: true }).count()); i++) {
    if (i === 3) await page.mouse.wheel(2000, 0);
    await page.mouse.move([400, 700, 1000][i % 3], 500);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(300);
  }
  if (!(await page.getByText(title, { exact: true }).count())) {
    await page.getByRole('button', { name: /^Add$/ }).click();
    await page.locator('.ant-dropdown').getByText('Bug', { exact: true }).click();
    const input = page.getByPlaceholder('Add Bug');
    await input.fill(title);
    await input.press('Enter');
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }
  // The board re-renders right after creation, so the first click can be lost; retry until the panel opens.
  await expect(async () => {
    await page.getByText(title, { exact: true }).first().click();
    await expect(page.getByPlaceholder('Write a Task Title')).toHaveValue(title, { timeout: 4000 });
  }).toPass({ timeout: 30000 });
}

async function setAssignee(page, name) {
  await page.locator('[class*=TaskDetailView_assigneeContent] > div').first().click();
  await page.getByPlaceholder('Name or email').fill(name);
  // Result rows show name + email. Wait for the row of this exact person (the list filters as it loads).
  const row = page.locator('div').filter({ hasText: new RegExp(`^${name}\\s*\\S+@\\S+$`) }).last();
  await expect(row, `no PMX user named "${name}" in this project (check the spelling)`).toBeVisible({ timeout: 15000 });
  await row.click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expect(page.locator('[class*=noAssigneeText]')).toHaveCount(0);
}

async function setPriority(page, priority) {
  // The Priority field itself (not a dropdown option, which is also a tag).
  const field = page.locator('.ant-row').filter({ has: page.getByText('Priority', { exact: true }) }).first().locator('.ant-col-16 > .ant-tag').first();
  const wanted = new RegExp(`^${priority}$`, 'i');
  if (wanted.test((await field.innerText()).trim())) return; // already right (also avoids reopening the dropdown for nothing)
  await page.locator('.ant-tag', { hasText: /^(Low|Medium|High|Critical)$/ }).first().click();
  const option = page.locator('.ant-tag', { hasText: wanted }).last();
  if (!(await option.count())) throw new Error(`Priority "${priority}" is not offered by PMX`);
  await option.click();
  // A missed click fails the row.
  await expect(field).toHaveText(wanted);
}

async function setDescription(page, text) {
  const editor = page.locator('.ql-editor').first();
  await editor.click();
  await page.keyboard.press('Control+A'); // replace any existing text so reruns do not duplicate it
  await page.keyboard.press('Delete');
  const lines = text.split('\n');
  for (const [i, line] of lines.entries()) {
    if (line) await page.keyboard.insertText(line);
    if (i < lines.length - 1) await page.keyboard.press('Enter');
  }
  // Blur so the editor saves.
  await page.getByText('Description', { exact: true }).click();
  await expect(editor).toContainText(lines.find(Boolean).slice(0, 30));
  await page.waitForTimeout(2000); // give the autosave time to finish before the page is left
}

// Uploads the local files through the Attachments "+" file chooser. PMX truncates file names, so progress is
// tracked with the attachment count badge: a rerun only uploads the files beyond what is already attached.
async function attachFiles(page, paths) {
  const icon = page.locator('[class*=ProjectAttachmentSection_attachmentAddIcon]');
  const badge = page.locator('[class*=attachmentCountBadge]');
  const attached = async () => ((await badge.count()) ? Number(await badge.first().innerText()) : 0);
  await icon.scrollIntoViewIfNeeded();
  for (let i = await attached(); i < paths.length; i++) {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), icon.click()]);
    await chooser.setFiles(paths[i]);
    await expect.poll(attached, { timeout: 180000, message: `uploading ${path.basename(paths[i])}` }).toBe(i + 1);
  }
}

// Pick an option in a Section/Sprint style dropdown; skip (with a note) if the value is not offered.
// `trigger` is a button name (string/RegExp) or a locator.
async function pickFromDropdown(page, trigger, value) {
  const button = typeof trigger === 'string' || trigger instanceof RegExp ? page.getByRole('button', { name: trigger }) : trigger;
  await button.click();
  const option = page.getByRole('option', { name: value, exact: true });
  if (await option.count()) {
    await option.click();
  } else {
    console.log(`  ! "${value}" not available in ${trigger} - left unchanged`);
    await page.keyboard.press('Escape');
  }
}

// Moves the open bug to `section`. Checks the dropdown's own text, because the page also shows the column names.
async function setSection(page, section) {
  const row = page.locator('.ant-row').filter({ has: page.getByText('Section', { exact: true }) }).last();
  const trigger = row.locator('[class*=statusSelector_sectionTrigger], button').first();
  const wanted = new RegExp(`^\\s*${section}\\s*$`, 'i');
  if (wanted.test(await trigger.innerText())) return;
  await expect(async () => {
    await page.getByText('Section', { exact: true }).click(); // close anything left open
    await pickFromDropdown(page, trigger, section);
    await expect(trigger).toHaveText(wanted, { timeout: 4000 });
  }).toPass({ timeout: 30000 });
}

test.describe('Add bugs to PMX board', () => {
  // Rows run one after another in a single worker; a failed row does not skip the rest.
  test.setTimeout(Number(process.env.PMX_TIMEOUT) || 420000);

  for (const [i, bug] of bugs.entries()) {
    test(`${i + 1}. ${bug.Title.slice(0, 70)}`, async ({ page }) => {
      await openBoard(page);
      await openOrCreateBug(page, bug.Title);

      const assignee = process.env.PMX_ASSIGNEE || bug.Assignee;
      if (assignee) await setAssignee(page, assignee);
      if (bug.Priority) await setPriority(page, bug.Priority);
      if (bug.Sprint) {
        // Some projects default new bugs to a sprint, in which case there is no "Select sprint" button.
        if (await page.getByRole('button', { name: /Select sprint/ }).isVisible()) await pickFromDropdown(page, /Select sprint/, bug.Sprint);
        else console.log(`  sprint already set on this bug (sheet wants "${bug.Sprint}")`);
      }
      if (bug.Description) await setDescription(page, bug.Description);
      const listed = [bug['Video Link'], bug.Screenshot].filter(Boolean).flatMap(s => s.split(';')).map(s => s.trim()).filter(Boolean);
      // Only files that exist on this PC can be uploaded (e.g. a "sandbox:/..." link or a bare label is skipped).
      const evidence = listed.filter(p => fs.existsSync(p));
      for (const p of listed.filter(p => !fs.existsSync(p))) console.log(`  ! not a local file, skipped: ${p}`);
      if (evidence.length) await attachFiles(page, evidence);
      // Last, so a bug that failed earlier is still in To Do (where a rerun looks for it) instead of another column.
      const section = process.env.PMX_SECTION || bug.Section;
      if (section && section !== 'To Do') await setSection(page, section);
      for (const f of ['Start date', 'Due date', 'Estimation', 'Epic']) {
        if (bug[f] && !/^no epic$/i.test(bug[f])) console.log(`  ! ${f} "${bug[f]}" is not applied by this script yet`);
      }
    });
  }
});
