// Single source of truth for the portfolio site. Paths are relative to the repo root.
const REPO = 'Rajanjagz7/rajan-engineering-portfolio';
const BRANCH = 'main';

const categoryLabels = {
  featured: 'Featured',
  e2e: 'E2E Automation',
  api: 'API & Load',
  mobile: 'Mobile',
  trading: 'Trading',
  web: 'Apps',
  learning: 'Learning'
};

const projects = [
  // ---- Featured ----
  {
    title: 'SauceDemo Advanced E2E',
    category: 'e2e', featured: true,
    description: '8-layer Playwright framework: config, fixtures, page objects, API helpers, data generators, custom reporters and Docker. Runs against public demo apps.',
    tech: ['TypeScript', 'Playwright', 'Docker'],
    path: 'projects/test-suites/e2e-playwright/saucedemo-advanced-e2e'
  },
  {
    title: 'AI API Testing',
    category: 'api', featured: true,
    description: 'Functional, prompt-injection, regression-eval and load tests against the Claude Messages API. Skips cleanly when no key is set.',
    tech: ['Python', 'pytest', 'Anthropic SDK'],
    path: 'projects/test-suites/api-testing/ai-api-testing'
  },
  {
    title: 'CRM QA Suite',
    category: 'e2e', featured: true,
    description: 'API + UI suite with typed cases (positive, negative, boundary, edge, security), strict expected-failures for known bugs, CI quality gates and a no-code runner.',
    tech: ['Python', 'pytest', 'Playwright', 'GitHub Actions'],
    path: 'projects/test-suites/e2e-playwright/crm-qa-suite'
  },
  {
    title: 'NSE Option Scanner',
    category: 'trading', featured: true,
    description: 'Live F&O option-chain scanner with bhavcopy history, a rule-based filter engine and a web dashboard, deployed on Vercel with its own tests.',
    tech: ['Python', 'FastAPI', 'Node.js', 'Vercel'],
    path: 'projects/trading-finance/rajan'
  },
  {
    title: 'Stock Scanner',
    category: 'trading', featured: true,
    description: 'Indicator engine (Donchian, Heikin Ashi, UT Bot, trend filters) over live NSE data, with a single-page UI.',
    tech: ['Python', 'FastAPI', 'pandas'],
    path: 'projects/trading-finance/rajan1'
  },

  // ---- E2E automation ----
  {
    title: 'Support X',
    category: 'e2e',
    description: 'Web-app QA project: Playwright specs with auth setup, shared test data and release-notes verification.',
    tech: ['JavaScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/support-x'
  },
  {
    title: 'Energy Rebate Tests',
    category: 'e2e',
    description: 'Main workflow suite for a rebate portal: job creation, field boundaries, soft delete, nomination flow.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/energy-rebate-tests'
  },
  {
    title: 'Energy Rebate — Python Port',
    category: 'e2e',
    description: 'The same workflows re-implemented with pytest and Playwright for Python.',
    tech: ['Python', 'pytest', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/energy-rebate-tests-python'
  },
  {
    title: 'Energy Rebate — Pure Playwright',
    category: 'e2e',
    description: 'Dependency-light port with a custom test runner on raw Playwright.',
    tech: ['JavaScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/energy-rebate-tests-pure-playwright'
  },
  {
    title: 'Energy Rebate — Puppeteer',
    category: 'e2e',
    description: 'Job-creation scripts written in raw Puppeteer for tool comparison.',
    tech: ['JavaScript', 'Puppeteer'],
    path: 'projects/test-suites/e2e-playwright/energy-rebate-tests-pure-puppeteer'
  },
  {
    title: 'RebatePortal Tests',
    category: 'e2e',
    description: 'Project-creation E2E tests for a state rebate portal.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/rebateportal-tests'
  },
  {
    title: 'RebatePortal Playwright QA',
    category: 'e2e',
    description: 'API, auth, module and session test suite with coverage-gap analysis.',
    tech: ['TypeScript', 'Playwright', 'Bun'],
    path: 'projects/test-suites/e2e-playwright/rebateportal-playwright-qa'
  },
  {
    title: 'FieldOps Release Suite',
    category: 'e2e',
    description: 'Every release-note bullet mapped to a test, with a generated traceability matrix. Page Object Model.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/fieldops-release-suite'
  },
  {
    title: 'FieldOps POM Tests',
    category: 'e2e',
    description: 'Release-notes suite built on page objects with env-driven configuration.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/fieldops-pw-tests'
  },
  {
    title: 'FieldOps Playwright',
    category: 'e2e',
    description: 'E2E suite for a field-operations web app: customers, jobs, invoices, timesheets.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/fieldops-playwright'
  },
  {
    title: 'Clinic Membership & Timezone Tests',
    category: 'e2e',
    description: 'Membership flows and timezone/DST audits for a clinic platform.',
    tech: ['JavaScript', 'Playwright', 'pytest'],
    path: 'projects/test-suites/e2e-playwright/clinic1'
  },
  {
    title: 'Gus Money',
    category: 'e2e',
    description: 'Fintech admin suite: UI and API tests, page objects, QA plan and CI workflow.',
    tech: ['TypeScript', 'Playwright', 'pytest'],
    path: 'projects/test-suites/e2e-playwright/gus-money'
  },
  {
    title: 'Security Tests',
    category: 'e2e',
    description: 'Sprint-based auth and user-management security tests.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/stc-security-tests'
  },
  {
    title: 'Cross-Browser & Mobile Tests',
    category: 'e2e',
    description: 'Chromium, Firefox, WebKit and Android (Capacitor) runs for an e-commerce app.',
    tech: ['TypeScript', 'Playwright', 'Capacitor'],
    path: 'projects/test-suites/e2e-playwright/playwright-tests'
  },
  {
    title: 'Shopify Mobile Tests',
    category: 'e2e',
    description: 'Mobile navigation and cart tests for a Shopify storefront.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/shopify-mobile-tests'
  },
  {
    title: 'SauceDemo E2E Tests',
    category: 'e2e',
    description: 'Clean e-commerce suite on the public Sauce Demo app using page objects.',
    tech: ['TypeScript', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/saucedemo-e2e-tests'
  },

  // ---- API ----
  {
    title: 'Storefront API Collection',
    category: 'api',
    description: 'Postman collection of 37 request groups covering auth, store, orders, reviews and dashboard endpoints of an e-commerce platform.',
    tech: ['Postman', 'REST'],
    path: 'projects/test-suites/api-testing/storefront-postman'
  },
  {
    title: 'Cart Automation',
    category: 'api',
    description: 'Scripted sign-up and add-to-cart flow for an e-commerce site.',
    tech: ['Python', 'Playwright'],
    path: 'projects/test-suites/api-testing/cart-automation'
  },
  {
    title: 'ClinicApp Automation',
    category: 'mobile',
    description: 'Appointment, patient and telehealth automation scripts with bulk data seeding.',
    tech: ['Python', 'Selenium', 'Playwright'],
    path: 'projects/test-suites/mobile-testing/clinicapp-automation'
  },
  {
    title: 'ClinicApp Tests',
    category: 'mobile',
    description: 'Billing, appointments and telehealth tests for a clinic platform.',
    tech: ['Python', 'Playwright'],
    path: 'projects/test-suites/mobile-testing/clinicapp-tests'
  },

  // ---- Apps ----
  {
    title: 'Weight Plate Web',
    category: 'web',
    description: 'Macro and weight-plate tracker with Playwright E2E tests.',
    tech: ['TypeScript', 'HTML', 'Playwright'],
    path: 'projects/web-apps/weight-plate-web'
  },
  {
    title: 'FieldOps Web',
    category: 'web',
    description: 'Field-operations web prototype with data-generation scripts.',
    tech: ['Node.js', 'HTML', 'JavaScript'],
    path: 'projects/web-apps/fieldops'
  },
  {
    title: 'STC',
    category: 'web',
    description: 'Python application with a test scaffold.',
    tech: ['Python', 'pytest'],
    path: 'projects/apps/stc'
  },
  {
    title: 'Stock Scanner (variant)',
    category: 'trading',
    description: 'Earlier branch of the scanner with a market API layer and bar-source abstraction.',
    tech: ['Python', 'FastAPI'],
    path: 'projects/trading-finance/rajanstocks'
  },
  {
    title: 'Block Deal Scanner',
    category: 'trading',
    description: 'TradingView Pine Script scanner for large block deals.',
    tech: ['Pine Script'],
    path: 'scripts/top50-block-deal-scanner.pine'
  },

  // ---- Learning ----
  {
    title: 'QA Mastery',
    category: 'learning',
    description: 'Playwright TypeScript and AI-eval course exercises.',
    tech: ['TypeScript', 'Python', 'Playwright'],
    path: 'projects/test-suites/e2e-playwright/qa-mastery'
  },
  {
    title: 'JMeter Load Plans',
    category: 'learning',
    description: 'Load-testing plans for a public store API and a stress-test plan.',
    tech: ['JMeter'],
    path: 'projects/test-suites/learning/jmeter'
  },
  {
    title: 'Learn Playwright',
    category: 'learning',
    description: 'Four tutorial scripts covering the Playwright basics.',
    tech: ['Python', 'Playwright'],
    path: 'projects/test-suites/learning/learn-playwright'
  }
];
