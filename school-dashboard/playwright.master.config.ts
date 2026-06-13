import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './master-test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-master' }],
    ['json', { outputFile: 'test-results-master/results.json' }],
    ['junit', { outputFile: 'test-results-master/results.xml' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || `http://localhost:${process.env.PW_TEST_PORT || 5173}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${process.env.PW_TEST_PORT || 5173}`,
    url: `http://localhost:${process.env.PW_TEST_PORT || 5173}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
