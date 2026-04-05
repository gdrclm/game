const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: '/tmp/game-playwright-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    command: 'yarn test:serve',
    url: 'http://127.0.0.1:4173/tests/crafting-tests.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
