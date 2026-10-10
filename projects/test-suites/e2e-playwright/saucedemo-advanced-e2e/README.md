# SauceDemo Advanced E2E

8-layer enterprise-grade Playwright framework covering Sauce Demo UI and FakeStoreAPI.

## What this project does

- Provides a structured end-to-end test framework with clear separation of concerns
- Covers UI flows on Sauce Demo and API flows on FakeStoreAPI
- Includes API helper layer, page modules, fixtures, config, test data generators, and custom reporters
- Supports Docker-based execution

## Tech Stack

- TypeScript
- Playwright
- dotenv
- Docker

## How to Run

```bash
npm install
npx playwright install
npm run test:ui
npm run test:api
npm run report
```

## Status

Active.
