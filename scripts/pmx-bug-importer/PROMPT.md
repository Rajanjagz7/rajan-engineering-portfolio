# Reusable prompts for Claude Code

Open Claude Code in the `pmx-bug-importer` folder, then paste one of these and fill in the `<...>` parts.

## 1. Import a bug sheet into PMX
```
Use the PMX bug importer in this folder (read README.md first) to add the bugs from
<full path to my .xlsx/.csv> to this PMX board: <board URL, e.g. https://pmx.company.com/dashboard/projects/<id>/board?taskTab=development>

- Assignee for every bug: <First Last, exactly as in PMX>
- Attach the screenshots/videos listed in the "Screenshot" and "Video Link" columns.

Steps:
1. Create .env from .env.example with PMX_URL, PMX_BOARD_PATH and PMX_BUGS_FILE (and PMX_ASSIGNEE). Do not put any password in any file.
2. If test-data/auth.json is missing or expired, run `npm run login` and tell me to sign in myself in the window. Never ask for or type my password.
3. Run `npm run list` and show me the rows. Then run `npm run import:first` and wait for my OK.
4. Run `npm run import`. If a row fails, fix the cause and re-run; do not create duplicates.
5. Verify on the board that every bug exists exactly once with the right assignee, priority, description and attachment count, and report any mismatch.
Only touch the board I gave you.
```

## 2. Build the sheet and match evidence files first
```
Here is my bug sheet: <path>. My screenshots and screen recordings are in <folder(s)>.
Look at each screenshot and at frames of each video (open them in Chrome; do not guess from file names or
times alone) and match each file to the bug it shows. Write a copy of the sheet (do not overwrite the original) with
two extra columns, "Video Link" and "Screenshot", holding the full local paths (separate several with "; "), plus an
"Evidence Map" sheet listing each file, the bug, and what you saw. Tell me which bugs have no evidence and which files
matched nothing. Do not invent matches.
```

## 3. Adapt the importer to a different project or tool
```
The importer in this folder (tests/add-bugs.spec.js) automates PMX's UI. Adapt it to <describe the other tool/UI,
e.g. our PMX instance has a different Add menu / a different task panel / it is Jira>. Keep the same sheet columns and
the same safety behaviour (re-runnable, no duplicates, first-row trial). Inspect the real UI with Playwright
screenshots before changing selectors, and test only on <dev/test project URL>.
```
