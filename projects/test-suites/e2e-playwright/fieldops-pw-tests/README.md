# FieldOps POM Tests

Release-note-driven Playwright POM suite with axe-core accessibility checks.

## What this project does

- Maps FieldOps release-note bullets to traceable Playwright tests
- Uses Page Object Model for maintainability
- Includes accessibility checks via `@axe-core/playwright`
- Organized by area: quotes, jobs, portal, schedule, roles, customers, pickers, billing, security, invites, PDFs, and regression

## Tech Stack

- TypeScript
- Playwright
- Page Object Model
- @axe-core/playwright

## How to Run

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run typecheck && npm run list
npx playwright test
npx playwright show-report
```

## Status

Compiles under strict TypeScript. Some tests are marked `test.fixme` where prerequisites or expected values are still missing.
