import { expect, test } from '@playwright/test';

test('admin approves a pending vendor', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@mitdrone.test');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible();

  await page.goto('/vendors?status=pending_review', { waitUntil: 'domcontentloaded' });
  const vendorRow = page.getByRole('row').filter({ hasText: 'NewWave Aviation' });
  await expect(vendorRow).toBeVisible();
  await vendorRow.getByRole('button', { name: 'Actions for NewWave Aviation' }).click();
  await page.getByRole('menuitem', { name: 'Approve' }).click();
  await expect(page.getByRole('heading', { name: 'Approve NewWave Aviation?' })).toBeVisible();
  await page.getByRole('button', { name: 'Approve vendor' }).click();

  await expect(page.getByText('NewWave Aviation approved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No vendors match these filters' })).toBeVisible();

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
        message: `page should fit a ${width}px viewport`,
      })
      .toBeLessThanOrEqual(width);
  }
});
