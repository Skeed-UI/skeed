import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: './playwright-report' }]]
    : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4176',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4176 browser-fixture',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:4176',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { height: 900, width: 1280 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'chromium-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 900, width: 1280 },
      },
    },
  ],
});
