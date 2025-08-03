import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-logged-in',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e-tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'https://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});