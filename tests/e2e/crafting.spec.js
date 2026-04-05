const { test, expect } = require('@playwright/test');

test('crafting browser autotests pass without failures', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error);
  });

  await page.goto('/tests/crafting-tests.html');

  const summary = page.locator('#summary');
  await expect(summary).toContainText('Провалено: 0', { timeout: 15000 });
  await expect(page.locator('.test.fail')).toHaveCount(0);
  expect(pageErrors).toHaveLength(0);
});
