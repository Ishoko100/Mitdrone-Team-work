import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: process.env.MITDRONE_E2E_EXTERNAL_SERVER === 'true' || !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'ignore',
    env: { NEXT_PUBLIC_ENABLE_MOCKS: 'true' },
  },
});
