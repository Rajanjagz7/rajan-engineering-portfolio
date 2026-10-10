# Rajan — QA Automation Engineer & Builder

**Live portfolio:** [rajanjagwani.vercel.app](https://rajanjagwani.vercel.app) · [GitHub](https://github.com/Rajanjagz7) · [LinkedIn](https://linkedin.com/in/rajanj71) · [Email](mailto:rajanjagz7@gmail.com)

QA automation engineer who writes test frameworks the way developers write products: layered, typed, data-driven and CI-ready. I also build my own tools — most notably a live NSE options scanner deployed on Vercel.

**Core stack:** Playwright (TypeScript / Python) · pytest · Puppeteer · Postman · JMeter · GitHub Actions · Docker · FastAPI

> Client and employer projects in this repo are **sanitised**: names, hosts, accounts and findings are replaced with neutral placeholders (`example.com`, `FieldOps`, `ClinicApp`, `RebatePortal`). Only framework code and approach are shown.

---

## Start here

| Project | What it shows | Stack |
|---|---|---|
| [**SauceDemo Advanced E2E**](projects/test-suites/e2e-playwright/saucedemo-advanced-e2e) | 8-layer framework: config, fixtures, page objects, API helpers, data generators, custom reporters, Docker. Runs against public demo apps. | Playwright, TypeScript, Docker |
| [**AI API Testing**](projects/test-suites/api-testing/ai-api-testing) | Functional, prompt-injection/security, regression-eval and load tests against the Claude Messages API. Skips cleanly without a key. | pytest, Anthropic SDK |
| [**CRM QA Suite**](projects/test-suites/e2e-playwright/crm-qa-suite) | API + UI suite with typed test cases (positive / negative / boundary / edge / security), strict expected-failures for known bugs, CI quality gates, and a no-code runner UI. | pytest, Playwright, GitHub Actions |
| [**Algo Trading — NSE Option Scanner**](projects/trading-finance/algo-trading-rajan) | Live F&O option-chain scanner with bhavcopy history, filter engine and a web dashboard, deployed on Vercel. Includes its own pytest + E2E tests. | Python, FastAPI, Node, Vercel |
| [**Stock Scanner Algo**](projects/trading-finance/stock-scanner-algo) | Indicator engine (Donchian, Heikin Ashi, UT Bot, trend filters) with live NSE data and a single-page UI. | Python, FastAPI, pandas |

---

## Everything else

### QA automation — `projects/test-suites/`

| Area | Folder | Notes |
|---|---|---|
| Same app, four ports | [`energy-rebate-tests`](projects/test-suites/e2e-playwright/energy-rebate-tests), `-python`, `-pure-playwright`, `-pure-puppeteer` | One workflow suite implemented in TypeScript Playwright, pytest + Playwright, a custom raw-Playwright runner, and Puppeteer — useful for comparing tool trade-offs. |
| Release-notes traceability | [`fieldops-release-suite`](projects/test-suites/e2e-playwright/fieldops-release-suite), [`fieldops-pw-tests`](projects/test-suites/e2e-playwright/fieldops-pw-tests), [`fieldops-playwright`](projects/test-suites/e2e-playwright/fieldops-playwright) | Every release-note bullet maps to a test; a script generates the traceability matrix. Page Object Model throughout. |
| Healthcare / membership | [`clinic1`](projects/test-suites/e2e-playwright/clinic1), [`clinicapp-automation`](projects/test-suites/mobile-testing/clinicapp-automation), [`clinicapp-tests`](projects/test-suites/mobile-testing/clinicapp-tests) | Timezone/DST audits, appointment and billing flows, bulk data seeding. |
| Fintech admin | [`gus-money`](projects/test-suites/e2e-playwright/gus-money) | Playwright TypeScript + pytest API tests, POMs, QA plan, CI workflow. |
| Security-minded API tests | [`stc-security-tests`](projects/test-suites/e2e-playwright/stc-security-tests), [`rebateportal-playwright-qa`](projects/test-suites/e2e-playwright/rebateportal-playwright-qa) | Auth boundary, session, input validation and API contract probing. |
| Cross-browser / mobile | [`playwright-tests`](projects/test-suites/e2e-playwright/playwright-tests), [`shopify-mobile-tests`](projects/test-suites/e2e-playwright/shopify-mobile-tests) | Chromium/Firefox/WebKit and Android (Capacitor) runs. |
| Web-app QA + API collections | [`support-x`](projects/test-suites/e2e-playwright/support-x), [`storefront-postman`](projects/test-suites/api-testing/storefront-postman) | Auth-setup Playwright project and a 37-group Postman collection for an e-commerce API. |
| Public-demo practice | [`saucedemo-e2e-tests`](projects/test-suites/e2e-playwright/saucedemo-e2e-tests), [`cart-automation`](projects/test-suites/api-testing/cart-automation) | Clean examples anyone can run. |
| Learning | [`qa-mastery`](projects/test-suites/e2e-playwright/qa-mastery), [`jmeter`](projects/test-suites/learning/jmeter), [`learn-playwright`](projects/test-suites/learning/learn-playwright) | Course exercises and JMeter load plans. |

### Applications — `projects/web-apps/`, `projects/apps/`

| Project | Notes |
|---|---|
| [`weight-plate-web`](projects/web-apps/weight-plate-web) | Macro / weight-plate tracker with Playwright E2E tests. |
| [`portfolio-site`](projects/web-apps/portfolio-site) | Source of my personal site: React + Vite with a serverless contact form, deployed on Vercel. |
| [`fieldops`](projects/web-apps/fieldops) | Field-operations web prototype and data-generation scripts. |
| [`stc`](projects/apps/stc) | Python application with tests. |
| [`rajanstocks`](projects/trading-finance/rajanstocks) | Earlier variant of the stock scanner. |

---

## How I approach testing

- **Layered frameworks** — config, fixtures, page objects, API helpers and test data are separate so tests read like specs.
- **Typed test cases** — every case is tagged positive / negative / boundary / edge / security so suites can be sliced by risk.
- **Known bugs stay visible** — documented defects are kept as strict expected failures, so a fix flips the build instead of going unnoticed.
- **Traceability** — requirements or release notes map to tests via generated matrices.
- **No secrets in code** — credentials come from environment variables; every suite ships a `.env.example`.

## Running a project

Each folder has its own README. In general:

```bash
cd projects/test-suites/e2e-playwright/saucedemo-advanced-e2e
npm install && npx playwright install
npm run test:ui
```

```bash
cd projects/test-suites/api-testing/ai-api-testing
pip install -r requirements.txt && cp .env.example .env
pytest
```

## Portfolio site

My main portfolio is at **[rajanjagwani.vercel.app](https://rajanjagwani.vercel.app)** (source: [`projects/web-apps/portfolio-site`](projects/web-apps/portfolio-site)). A lightweight static index of every project in this repo lives in [`docs/`](docs).

## License

[MIT](LICENSE)
