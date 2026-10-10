# Portfolio Guide

How to navigate, run, and extend projects in this repository.

## Structure

- `projects/trading-finance/` — Trading systems and market scanners
- `projects/web-apps/` — Full-stack and static web applications
- `projects/test-suites/` — QA automation across E2E, API, mobile, and learning
- `projects/apps/` — Standalone apps and utilities
- `scripts/` — Reusable scripts and Pine Script indicators
- `docs/` — Portfolio documentation, skills, and learnings
- `assets/` — Images, reports, and test results

## Running a Project

Each project folder is self-contained. Look for its local README, `package.json`, `requirements.txt`, or run scripts.

### Python projects
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Node/TypeScript projects
```bash
npm install
npm test
```

### Playwright projects
```bash
npx playwright install
npx playwright test
```
