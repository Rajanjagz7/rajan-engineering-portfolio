// Settings come from a local .env file (copy .env.example to .env). Real environment variables win over .env.
const { defineConfig } = require('@playwright/test');
try { process.loadEnvFile('.env'); } catch { /* no .env file: rely on real environment variables */ }

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  outputDir: 'test-results',
  reporter: [['list']],
  use: {
    baseURL: process.env.PMX_URL,
    headless: false,
    channel: 'chrome',
    storageState: process.env.PMX_AUTH || 'test-data/auth.json',
    screenshot: 'only-on-failure',
  },
});
