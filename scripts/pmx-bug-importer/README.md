# PMX Bug Importer

Adds bugs from a spreadsheet to a PMX board automatically (Playwright). For every row it creates the bug, sets the
**assignee, priority, description** and **uploads screenshots/videos** from your computer. Safe to re-run: a bug
whose title already exists on the board is updated, not duplicated.

## What you need
- Node.js 20.12 or newer (`node -v`)
- Google Chrome installed (the script drives your Chrome; no browser download needed)
- A PMX account that can create bugs in the target project

## One-time setup (any PC, any project)
```bash
cd pmx-bug-importer
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```
Edit `.env`:

| Setting | What to put |
|---|---|
| `PMX_URL` | Your PMX site, e.g. `https://pmx.yourcompany.com` |
| `PMX_BOARD_PATH` | Open the project in PMX > **Development** tab, copy everything after the domain, e.g. `/dashboard/projects/6a22.../board?taskTab=development` |
| `PMX_BUGS_FILE` | Path to your sheet (`.xlsx` or `.csv`), forward slashes, e.g. `C:/Users/me/Downloads/bugs.csv` |
| `PMX_ASSIGNEE` | (optional) Full name exactly as in PMX; overrides the sheet's Assignee column |

Then save your login **once** (you sign in yourself in the window that opens; no password is typed or stored):
```bash
npm run login
```
The session is saved in `test-data/auth.json` (git-ignored). Run it again when the session expires.

## Sheet format
Use `templates/bugs-template.csv` as the starting point. Header names must match exactly:

| Column | Notes |
|---|---|
| **Title** | Required. Used as the bug title and as the key for re-runs, so keep titles unique. |
| Assignee | Full name as in PMX (ignored if `PMX_ASSIGNEE` is set) |
| Priority | `Low`, `Medium`, `High` or `Critical` |
| Section | `To Do` (default) or another column name |
| Sprint | Only applied when the project does not already default the bug to a sprint |
| Description | Plain text; line breaks are kept |
| Video Link | Local path(s) to video files, separated by `; ` (mp4, mov, webm...) |
| Screenshot | Local path(s) to image files, separated by `; ` (png, jpg...) |

Epic, start/due date and estimation are not applied yet (a note is printed if the sheet has them).

## Run
```bash
npm run list           # shows the rows it will import (nothing is created)
npm run import:first   # creates ONLY the first row; check it in PMX before continuing
npm run import         # all rows (videos make this slow: ~30-60 s per bug)
```
Chrome opens and you can watch it work. Do not click inside that window while it runs.

Useful options (put in `.env`): `PMX_SECTION=Done` (move every bug to that status), `PMX_LIMIT=5`, `PMX_ONLY=Login||Checkout`, `PMX_SHEET=Bugs`.

## Troubleshooting
- **`no PMX user named "X"`** - the name must match PMX exactly (e.g. `Ankit Limbad`, not `Limad`).
- **Redirected to login / nothing happens** - session expired: run `npm run login` again.
- **`Priority "X" is not offered`** - use Low, Medium, High or Critical.
- **Some rows fail but others pass** - fix the cause and run `npm run import` again; finished bugs are skipped/updated, not duplicated.
- **Broke after a PMX update** - the script finds buttons by their CSS class names (see `tests/add-bugs.spec.js`); update the selectors there.

## Safety
- Always try `npm run import:first` on a **dev/test project** before pointing it at a live board.
- `.env` and `test-data/auth.json` hold your private settings/session. Never share or commit them (already in `.gitignore`).
- It only touches the board in `PMX_BOARD_PATH`.
