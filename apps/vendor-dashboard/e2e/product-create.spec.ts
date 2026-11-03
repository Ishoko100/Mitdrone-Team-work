import { expect, test } from '@playwright/test';

test('approved vendor submits a product for review', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('vendor@mitdrone.test');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

  await page.goto('/products/new', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Title').fill('Playwright Survey Drone');
  await page
    .getByLabel('Short description')
    .fill('A test listing for a survey drone with long battery life.');
  await page
    .getByRole('textbox', { name: 'Product description' })
    .fill('A dependable survey drone for mapping farms and construction sites.');
  await page.getByLabel('Price', { exact: true }).fill('850000');
  await page.getByLabel('SKU').fill('PW-SURVEY-001');
  await page.getByLabel('Brand').fill('Mitdrone Demo');
  await page.getByRole('combobox', { name: 'Categories' }).click();
  await page.getByRole('option', { name: 'Consumer Drones' }).click();
  await page.getByRole('button', { name: 'Submit for review' }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByText('Playwright Survey Drone')).toBeVisible();

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
        message: `page should fit a ${width}px viewport`,
      })
      .toBeLessThanOrEqual(width);
  }
});
