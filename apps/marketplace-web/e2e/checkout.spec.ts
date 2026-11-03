import { expect, test } from '@playwright/test';

test('customer checks out with the mock payment form', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('ibrahim@mitdrone.test');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3000/account');

  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  const addToCart = page.getByRole('button', { name: 'Add to cart' }).first();
  await expect(addToCart).toBeVisible();
  await addToCart.click();
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Proceed to checkout' }).click();

  await expect(page.getByRole('heading', { name: 'Shipping address' })).toBeVisible();
  await page.getByRole('radio', { name: /Ibrahim Musa/ }).check();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
  await page.getByRole('button', { name: 'Use test card (succeeds)' }).click();
  await page.getByRole('button', { name: /^Pay/ }).click();

  await expect(page).toHaveURL(/\/account\/orders\/.+\?placed=1/);

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
        message: `page should fit a ${width}px viewport`,
      })
      .toBeLessThanOrEqual(width);
  }
});
