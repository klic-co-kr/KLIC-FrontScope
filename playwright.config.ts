import { defineConfig } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * E2E 테스트를 위한 Playwright 설정
 */

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: false,
  retries: 1,

  use: {
    // DevTools-like viewport for debugging
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        channel: 'chrome',
      },
    },
  ],

  // Test timeout settings
  timeout: 10000,
  expect: {
    timeout: 5000,
  },
});
